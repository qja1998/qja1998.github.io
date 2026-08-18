/**
 * 글 165편을 임베딩해 `src/data/embeddings.json` 을 만든다.
 *
 * 왜 빌드마다 안 돌리나: 모델이 100MB 대라 CI 에서 매번 받으면 배포가 느려진다.
 * 그래서 결과를 저장소에 커밋하고, 본문 해시가 바뀐 글만 다시 계산한다.
 * 글을 쓴 뒤 `npm run embed` 를 한 번 돌리고 함께 커밋하면 된다.
 *
 * 산출물은 빌드 입력이지 클라이언트로 나가지 않는다.
 * 브라우저가 받는 건 고른 이웃의 제목과 링크뿐이다.
 */
import { pipeline, env } from "@xenova/transformers";
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

const order = docs.map(d => d.slug);
const dim = cache[order[0]].vec.length;

mkdirSync("src/data", { recursive: true });
writeFileSync(OUT, JSON.stringify({ model: MODEL, dim, posts: cache }, null, 0));

const kb = Math.round(readFileSync(OUT).length / 1024);
console.log(`${OUT} 기록 · ${order.length}편 · ${dim}차원 · ${kb}KB`);

/* ---------------------------------------------------------------------------
 * 의미 지문 — 커버에 그릴 값.
 *
 * 384차원을 그대로 그리면 글마다 비슷한 노이즈로 보인다(상위 32차원이 전체
 * 분산의 12.5% 뿐). PCA 로 축을 다시 잡으면 같은 32개가 63.8% 를 담아
 * 글끼리의 차이가 눈에 보이고, 비슷한 글은 지문도 닮게 된다.
 * ------------------------------------------------------------------------- */
const K = 32;
const slugs = Object.keys(cache);
const M = slugs.map(s => cache[s].vec);
const D = M[0].length;
const N = M.length;

const mean = Array(D).fill(0);
M.forEach(v => v.forEach((x, i) => (mean[i] += x / N)));
let R = M.map(v => v.map((x, i) => x - mean[i]));

const comps = [];
for (let c = 0; c < K; c++) {
  // 거듭제곱 반복. 시작 벡터는 고정된 식으로 만들어 매번 같은 결과가 나오게 한다.
  let v = Array.from({ length: D }, (_, i) => Math.sin(i * (c + 1) * 0.7) + 0.001);
  let n = Math.hypot(...v);
  v = v.map(x => x / n);
  for (let it = 0; it < 60; it++) {
    const proj = R.map(r => r.reduce((s, x, i) => s + x * v[i], 0));
    const w = Array(D).fill(0);
    R.forEach((r, j) => {
      for (let i = 0; i < D; i++) w[i] += r[i] * proj[j];
    });
    n = Math.hypot(...w);
    if (!n) break;
    v = w.map(x => x / n);
  }
  const proj = R.map(r => r.reduce((s, x, i) => s + x * v[i], 0));
  R = R.map((r, j) => r.map((x, i) => x - proj[j] * v[i]));   // deflation
  comps.push(v);
}

const raw = slugs.map(s => {
  const x = cache[s].vec.map((v, i) => v - mean[i]);
  return comps.map(c => x.reduce((a, y, i) => a + y * c[i], 0));
});
// 주성분마다 크기가 달라 그대로 그리면 앞쪽 몇 개만 보인다. 축별로 표준화한다.
const sd = Array.from({ length: K }, (_, j) =>
  Math.sqrt(raw.reduce((a, r) => a + r[j] ** 2, 0) / N) || 1
);
slugs.forEach((s, i) => {
  cache[s].fp = raw[i].map((x, j) => +(x / sd[j]).toFixed(3));
});

writeFileSync(OUT, JSON.stringify({ model: MODEL, dim, fpDim: K, posts: cache }, null, 0));
console.log(`의미 지문 ${K}차원 기록 · ${Math.round(readFileSync(OUT).length / 1024)}KB`);

/* ---------------------------------------------------------------------------
 * 의미 축 — 사람이 읽을 수 있는 방향. 목록을 손으로 적지 않는다.
 *
 * PCA 축은 분산이 큰 방향일 뿐 이름이 없어, 하나만 보고는 무슨 글인지 알 수 없었다.
 * 그렇다고 축을 손으로 정해 두면 새 주제를 쓸 때마다 사람이 고쳐야 한다.
 *
 * 그래서 축을 코퍼스에서 자동으로 뽑는다.
 *   1. 글 MIN_POSTS 편 이상인 태그·분류를 전부 후보로 삼는다
 *   2. 후보의 중심점 방향이 거의 같으면 자동으로 합친다
 *      (graph theory · graph traversal · bfs 가 이렇게 한 축이 된다)
 *   3. 코퍼스의 MAX_SHARE 를 넘게 덮는 것은 주제가 아니라 분류라 뺀다 (boj 처럼)
 *   4. 남은 것 중 큰 순으로 AXIS_COUNT 개, 이름은 그 묶음에서 가장 흔한 태그
 *
 * 손으로 쓴 개념 문구로도 해 봤지만 SQL 글이 SQL 축에 안 걸렸다. 문구의 말투가
 * 이 블로그의 말투와 달라서다. 코퍼스에서 뽑은 중심점 쪽이 훨씬 정확했다.
 *
 * 한계: 이 코퍼스에서는 굵은 단위까지만 갈린다. 백준 안에서 bfs 와 dp 는
 * 중심점 코사인이 0.98 이라 나뉘지 않는다 — 설명문이 템플릿이라 텍스트에 차이가
 * 없기 때문이고, 코드를 임베딩에 넣어도 0.985 로 오히려 나빠진다.
 * ------------------------------------------------------------------------- */
const MIN_POSTS = 6;      // 이만큼은 쌓여야 주제로 본다
const MERGE_SIM = 0.995;  // 이보다 가까운 후보는 한 축으로 합친다
const MAX_SHARE = 0.4;    // 코퍼스의 이 비율을 넘으면 주제가 아니라 분류다
const AXIS_COUNT = 8;

const dotv = (a, b) => a.reduce((t, x, i) => t + x * b[i], 0);
const unit = (mem) => {
  const c = Array(dim).fill(0);
  mem.forEach(s => cache[s].vec.forEach((v, i) => (c[i] += v / mem.length)));
  const n = Math.hypot(...c) || 1;
  return c.map(v => v / n);
};

const labelOf = {};
docs.forEach(d => (labelOf[d.slug] = [...d.tags, ...d.cats]));
const freq = {};
order.forEach(s => (labelOf[s] ?? []).forEach(t => (freq[t] = (freq[t] ?? 0) + 1)));

let cand = Object.entries(freq)
  .filter(([, c]) => c >= MIN_POSTS)
  .map(([t]) => {
    const mem = order.filter(s => (labelOf[s] ?? []).includes(t));
    return { names: [t], mem, vec: unit(mem) };
  });

for (let merged = true; merged; ) {
  merged = false;
  outer: for (let i = 0; i < cand.length; i++)
    for (let j = i + 1; j < cand.length; j++)
      if (dotv(cand[i].vec, cand[j].vec) > MERGE_SIM) {
        const mem = [...new Set([...cand[i].mem, ...cand[j].mem])];
        cand[i] = { names: [...cand[i].names, ...cand[j].names], mem, vec: unit(mem) };
        cand.splice(j, 1);
        merged = true;
        break outer;
      }
}

cand.forEach(g => g.names.sort((a, b) => freq[b] - freq[a]));
const centroids = cand
  .filter(g => g.mem.length <= MAX_SHARE * order.length)
  .sort((a, b) => b.mem.length - a.mem.length)
  .slice(0, AXIS_COUNT)
  .map(g => ({ name: g.names[0], n: g.mem.length, vec: g.vec }));

const rawAx = order.map(s => centroids.map(c => dotv(cache[s].vec, c.vec)));
// 개념과의 유사도는 절대값이 다 비슷하다. 축마다 코퍼스 전체로 표준화해야
// '이 글이 어느 쪽으로 기울었나' 가 드러난다.
const axMean = centroids.map((_, j) => rawAx.reduce((t, r) => t + r[j], 0) / order.length);
const axSd = centroids.map((_, j) =>
  Math.sqrt(rawAx.reduce((t, r) => t + (r[j] - axMean[j]) ** 2, 0) / order.length) || 1
);
order.forEach((s, i) => {
  cache[s].ax = rawAx[i].map((v, j) => +((v - axMean[j]) / axSd[j]).toFixed(3));
});

writeFileSync(
  OUT,
  JSON.stringify(
    { model: MODEL, dim, fpDim: K, axes: centroids.map(c => c.name), posts: cache },
    null,
    0
  )
);
console.log(
  `의미 축 ${centroids.length}개(자동) · ` +
    centroids.map(c => `${c.name}(${c.n})`).join(" ") +
    ` · ${Math.round(readFileSync(OUT).length / 1024)}KB`
);
