/**
 * 글 165편을 임베딩해 `src/data/embeddings.json` 을 만든다.
 *
 * 왜 빌드마다 안 돌리나: 모델이 100MB 대라 CI 에서 매번 받으면 배포가 느려진다.
 * 그래서 결과를 저장소에 커밋하고, 본문 해시가 바뀐 글만 다시 계산한다.
 * 글을 쓴 뒤 `npm run embed` 를 한 번 돌리고 함께 커밋하면 된다.
 *
 * 산출물은 빌드 입력이지 클라이언트로 나가지 않는다.
 * 브라우저가 받는 건 2D 좌표와 이웃 목록뿐이다(수 KB).
 */
import { pipeline, env } from "@xenova/transformers";
import { UMAP } from "umap-js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const POSTS = "src/content/posts";
const OUT = "src/data/embeddings.json";
// 한국어를 다루는 다국어 문장 임베딩 모델. 384차원이라 결과 파일이 가볍다.
const MODEL = "Xenova/multilingual-e5-small";

env.allowLocalModels = false;

/** frontmatter 를 걷어내고 임베딩에 쓸 텍스트를 만든다. */
function toText(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { title: "", cats: [], text: "" };
  const [, fm, body] = m;
  const get = k => (fm.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1] ?? "").trim();
  const list = s => s.replace(/^\[|\]$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, "")).filter(Boolean);
  const title = get("title").replace(/^"|"$/g, "");
  const cats = list(get("categories"));
  const tags = list(get("tags"));
  const prose = body
    .replace(/```[\s\S]*?```/g, " ")   // 코드는 뺀다. 문제 풀이끼리 코드가 비슷해 전부 붙어 버린다
    .replace(/!\[.*?\]\(.*?\)|<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // e5 계열은 접두사를 요구한다. 문서끼리 비교하므로 양쪽 다 passage 를 쓴다.
  const text = `passage: ${title}. ${cats.join(" ")} ${tags.join(" ")}. ${prose}`.slice(0, 2000);
  return { title, cats, tags, text };
}

const files = readdirSync(POSTS).filter(f => f.endsWith(".md")).sort();

const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { model: MODEL, posts: {} };
const cache = prev.model === MODEL ? prev.posts : {};

const docs = files.map(f => {
  const slug = f.replace(/\.md$/, "");
  const raw = readFileSync(join(POSTS, f), "utf8");
  const d = toText(raw);
  return { slug, ...d, hash: createHash("sha1").update(d.text).digest("hex").slice(0, 12) };
});

const stale = docs.filter(d => cache[d.slug]?.hash !== d.hash);
console.log(`글 ${docs.length}편 · 다시 계산할 것 ${stale.length}편`);

if (stale.length) {
  const embed = await pipeline("feature-extraction", MODEL, { quantized: true });
  for (let i = 0; i < stale.length; i++) {
    const d = stale[i];
    const out = await embed(d.text, { pooling: "mean", normalize: true });
    cache[d.slug] = { hash: d.hash, vec: Array.from(out.data).map(v => +v.toFixed(5)) };
    if ((i + 1) % 20 === 0 || i === stale.length - 1) {
      console.log(`  ${i + 1}/${stale.length}`);
    }
  }
}

// 삭제된 글은 캐시에서 지운다
for (const slug of Object.keys(cache)) {
  if (!docs.some(d => d.slug === slug)) delete cache[slug];
}

// 2D 배치. UMAP 은 난수를 쓰므로 시드를 고정해 빌드마다 지도가 흔들리지 않게 한다.
const order = docs.map(d => d.slug);
const vectors = order.map(s => cache[s].vec);
let seed = 42;
const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const umap = new UMAP({ nComponents: 2, nNeighbors: 12, minDist: 0.25, random: rng });
const xy = umap.fit(vectors);

// 좌표를 0~1 로 정규화해 두면 페이지에서 그대로 % 로 쓸 수 있다
const xs = xy.map(p => p[0]), ys = xy.map(p => p[1]);
const norm = (v, arr) => (v - Math.min(...arr)) / (Math.max(...arr) - Math.min(...arr) || 1);

const layout = {};
order.forEach((slug, i) => {
  layout[slug] = { x: +norm(xy[i][0], xs).toFixed(4), y: +norm(xy[i][1], ys).toFixed(4) };
});

mkdirSync("src/data", { recursive: true });
writeFileSync(OUT, JSON.stringify({ model: MODEL, dim: vectors[0].length, posts: cache, layout }, null, 0));

const kb = Math.round(readFileSync(OUT).length / 1024);
console.log(`${OUT} 기록 · ${order.length}편 · ${vectors[0].length}차원 · ${kb}KB`);
