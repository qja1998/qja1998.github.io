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
// 낱말 벡터는 결과가 아니라 계산 캐시다. 저장소에 넣지 않는다(6MB 가 된다).
const TERM_CACHE = "src/data/.term-vectors.json";
const termCache = existsSync(TERM_CACHE) ? JSON.parse(readFileSync(TERM_CACHE, "utf8")) : {};

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

/* ---------------------------------------------------------------------------
 * 의미 색 — 커버를 채우는 색.
 *
 * 차트는 해석을 요구한다. 사람이 해석 없이 바로 느끼는 채널은 색이다.
 * 그래서 의미 공간의 방향을 색상환에 그대로 얹는다.
 *   색상(hue)  = 코퍼스 중심에서 본 방향 (PC1·PC2 평면의 각도)
 *   채도(chroma) = 중심에서 얼마나 멀리 나갔나 = 얼마나 뚜렷한 글인가
 *   밝기(L)    = 고정. 그래야 그리드 전체가 한 톤으로 어우러진다
 *
 * 분류를 넣지 않았는데도 분류별로 뭉친다(뭉침 0.97~1.00). 헷갈리는 쌍도
 * 의미상 맞다 — pytorch↔background 4°, troubleshooting↔docker 13°, boj↔swea 19°.
 * ------------------------------------------------------------------------- */
{
  const cen = Array(dim).fill(0);
  order.forEach(s => cache[s].vec.forEach((v, i) => (cen[i] += v / order.length)));
  let Rz = order.map(s => cache[s].vec.map((v, i) => v - cen[i]));
  const axis2 = [];
  for (let k = 0; k < 2; k++) {
    let v = Array.from({ length: dim }, (_, i) => Math.sin(i * (k + 1) * 0.7) + 0.001);
    let n = Math.hypot(...v);
    v = v.map(x => x / n);
    for (let it = 0; it < 80; it++) {
      const proj = Rz.map(r => r.reduce((t, x, i) => t + x * v[i], 0));
      const w = Array(dim).fill(0);
      Rz.forEach((r, j) => { for (let i = 0; i < dim; i++) w[i] += r[i] * proj[j]; });
      n = Math.hypot(...w);
      if (!n) break;
      v = w.map(x => x / n);
    }
    const proj = Rz.map(r => r.reduce((t, x, i) => t + x * v[i], 0));
    Rz = Rz.map((r, j) => r.map((x, i) => x - proj[j] * v[i]));
    axis2.push(v);
  }
  const xy = order.map(s => {
    const d = cache[s].vec.map((v, i) => v - cen[i]);
    return axis2.map(a => d.reduce((t, x, i) => t + x * a[i], 0));
  });
  // 채도는 95퍼센타일로 정규화한다. 한 글이 유독 멀리 있어도 나머지가 죽지 않게.
  const rads = xy.map(([a, b]) => Math.hypot(a, b));
  const rMax = [...rads].sort((a, b) => a - b)[Math.floor(rads.length * 0.95)] || 1;
  // 각도를 그대로 쓰면 백준 77편이 한 색으로 뭉쳐 그리드가 단조롭다.
  // 각도 순서를 유지한 채 색상환 전체로 펴면(순위 균등화) 무리는 여전히 붙어
  // 있으면서 무리 안쪽 차이도 보인다.
  let ang = order.map((_, i) => ((Math.atan2(xy[i][1], xy[i][0]) * 180) / Math.PI + 360) % 360);
  // 0°/360° 경계에 걸친 무리는 순위를 매길 때 양 끝으로 찢긴다(트러블슈팅·도커가 그랬다).
  // 각도 분포에서 가장 빈 구간을 찾아 거기서 자른다.
  {
    const srt = [...ang].sort((a, b) => a - b);
    let gap = 360 - srt[srt.length - 1] + srt[0], cut = (srt[srt.length - 1] + 360 + srt[0]) / 2 % 360;
    for (let i = 1; i < srt.length; i++)
      if (srt[i] - srt[i - 1] > gap) { gap = srt[i] - srt[i - 1]; cut = (srt[i] + srt[i - 1]) / 2; }
    ang = ang.map(a => (a - cut + 360) % 360);
  }
  const rank = order.map((_, i) => i).sort((a, b) => ang[a] - ang[b]);
  // 색상환을 다 쓰면 따뜻한 구간이 탁한 올리브·고동색으로 나온다(밝기를 고정한 대가).
  // 순서만 유지한 채 청록→파랑→보라 180° 구간에 얹는다. 사이트의 딥틸·앰버와도 맞는다.
  // 순위로만 펴면 백준(47%)이 색상환 절반을 먹어 작은 분류들이 6° 안에 붙는다.
  // 원래 각도만 쓰면 분류는 잘 갈리지만 백준 77편이 한 색이 된다.
  // 둘을 반씩 섞어 무리는 갈리면서 무리 안쪽도 조금씩 달라지게 한다.
  const HUE_FROM = 160, HUE_SPAN = 180, MIX = 0.5;
  const pos = new Array(order.length);
  rank.forEach((idx, r) => (pos[idx] = r / order.length));
  order.forEach((s, i) => {
    const t = MIX * pos[i] + (1 - MIX) * (ang[i] / 360);
    cache[s].hue = +(HUE_FROM + t * HUE_SPAN).toFixed(1);
    cache[s].chr = +Math.min(rads[i] / rMax, 1).toFixed(3);
  });
}

writeFileSync(
  OUT,
  JSON.stringify(
    { model: MODEL, dim, fpDim: K, axes: centroids.map(c => c.name), posts: cache },
    null,
    0
  )
);
console.log(`의미 색 기록 · ${Math.round(readFileSync(OUT).length / 1024)}KB`);


/* ---------------------------------------------------------------------------
 * 핵심 낱말 — 커버에 크게 찍는 말.
 *
 * 색은 '이 둘이 비슷하다' 는 알려 줘도 '이게 무슨 글이다' 는 못 알려 준다.
 * 범례를 봐야 하고, 이웃한 주제는 색이 붙어 구별도 안 된다.
 * 사람에게 의미를 즉각 전하는 건 낱말이다.
 *
 * 태그를 쓰지 않는다. 본문에서 후보를 뽑고, 같은 모델로 후보를 임베딩해
 * 글 전체 벡터와 가까운 순으로 고른다(KeyBERT 와 같은 방식).
 * 그래서 새 주제로 글을 써도 그 글의 말이 그대로 나온다.
 *
 * 걸렸던 것:
 *  - 코드까지 후보로 넣으면 cur_w · bridge.append 같은 식별자가 희귀해서
 *    IDF 를 먹고 1등이 된다 → 후보는 산문에서만 뽑는다.
 *  - 3~4위부터 잡음이 섞인다 → 두 개만 쓴다.
 * ------------------------------------------------------------------------- */
const PARTICLE = /(을|를|이|가|은|는|에|의|로|으로|와|과|에서|까지|부터|도|만|보다|처럼|에게|한테|라는|이라는|하는|되는|하고|해서|하여|한|된|들)$/;
const STOP = new Set(
  ("문제 풀이 코드 시간 메모리 제한 사용 경우 다음 아래 위해 통해 대해 이때 다시 정도 부분 방법 결과 " +
   "확인 진행 발생 구하 만들 이런 그런 저런 무엇 어떤 여기 저기 이것 그것 입력 출력 표현 내부 영향 구성 " +
   "상태 형태 생각 이유 의미 필요 가능 이상 이하 자체 기준 조건 시작 종료 처음 마지막 전체 각각 서로 모두 " +
   "하나 실제 관련 참고 예시 설명 정리 곳에서 것들 명시 자신 우리 저희 당신 자기 서로 만약 때문 " +
   "이제 아직 아무 어디 언제 얼마 조금 매우 정말 그냥 바로 다른 같이 여러 각종 등등 " +
   "app start local main test run name value data code file path size index count print input output " +
   "true false null none self return function class import export const let var").split(" ")
);

// 서술어로 끝나는 말은 이름이 아니라 문장 조각이다
const VERBY = /(려고|려면|하려|었다|았다|한다|된다|입니다|합니다|이다|하며|하고|해야|되어|보자|보면|한다면|같다|있다|없다|어진|워진|아진|같은|다른|이런|저런|되는|하는|된|할|될|즉|또한)$/;
const ok = w => {
  if (STOP.has(w) || w.length < 2) return false;
  if (/^[a-z0-9_.\-]+$/.test(w)) return w.length >= 4 && !/[.\-_]$/.test(w);   // al. · tab 같은 조각 제거
  return !VERBY.test(w);
};

function candidates(text) {
  const out = new Map();
  const add = w => { if (ok(w)) out.set(w, (out.get(w) ?? 0) + 1); };
  for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9_.\-]{2,}/g)) add(m[0].toLowerCase().replace(/[.\-_]+$/, ""));
  const kor = [...text.matchAll(/[가-힣]{2,}/g)].map(m => m[0].replace(PARTICLE, "")).filter(w => w.length >= 2);
  kor.forEach(add);
  // 두 낱말 붙이기는 양쪽이 다 이름일 때만
  for (let i = 0; i < kor.length - 1; i++) if (ok(kor[i]) && ok(kor[i + 1])) add(`${kor[i]} ${kor[i + 1]}`);
  return [...out.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 40).map(([w]) => w);
}

{
  const proseOf = {};
  docs.forEach(d => {
    const raw = readFileSync(join(POSTS, files.find(f => f.startsWith(d.slug) || f === `${d.slug}.md`) ?? `${d.slug}.md`), "utf8");
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
    proseOf[d.slug] = `${d.title} ${body.replace(/```[\s\S]*?```/g, " ").replace(/!\[.*?\]\(.*?\)|<[^>]+>/g, " ")}`;
  });

  const df = new Map(), candOf = {};
  order.forEach(s => {
    const c = candidates(proseOf[s]);
    candOf[s] = c;
    new Set(c).forEach(w => df.set(w, (df.get(w) ?? 0) + 1));
  });
  const N = order.length;
  const idf = w => Math.log(N / (df.get(w) ?? 1));

  // 후보 벡터는 글 사이에 겹치므로 한 번만 계산해 돌려 쓴다
  const need = [...new Set(order.flatMap(s => candOf[s].filter(w => (df.get(w) ?? 0) <= 0.15 * N).slice(0, 26)))];
  const stale = need.filter(w => !(termCache[w]));
  console.log(`핵심 낱말 후보 ${need.length}개 · 새로 계산 ${stale.length}개`);
  if (stale.length) {
    const embed = await pipeline("feature-extraction", MODEL, { quantized: true });
    for (let i = 0; i < stale.length; i++) {
      const o = await embed(`query: ${stale[i]}`, { pooling: "mean", normalize: true });
      termCache[stale[i]] = Array.from(o.data).map(v => +v.toFixed(5));
      if ((i + 1) % 300 === 0) console.log(`  ${i + 1}/${stale.length}`);
    }
  }

  writeFileSync(TERM_CACHE, JSON.stringify(termCache));

  order.forEach(s => {
    const dv = cache[s].vec;
    const scored = candOf[s]
      .filter(w => (df.get(w) ?? 0) <= 0.15 * N && termCache[w])
      .slice(0, 26)
      .map(w => [w, dotv(dv, termCache[w]) * (1 + 0.28 * idf(w))])
      .sort((a, b) => b[1] - a[1]);
    // '엔트로피 차이' 와 '경우 엔트로피' 처럼 낱말이 겹치면 하나만 쓴다
    const picked = [];
    const used = new Set();
    for (const [w, sc] of scored) {
      const parts = w.split(" ");
      // 낱말이 겹치거나(엔트로피 차이 / 경우 엔트로피) 한쪽이 다른 쪽에 들어가면
      // (병사 / 병사들) 하나만 쓴다
      if (parts.some(x => used.has(x))) continue;
      if (picked.some(([q]) => q.includes(w) || w.includes(q))) continue;
      parts.forEach(x => used.add(x));
      picked.push([w, sc]);
      if (picked.length === 6) break;
    }
    if (!picked.length && scored.length) picked.push(scored[0]);

    // 낱말들을 저희끼리의 의미 관계로 2차원에 놓는다. 그 글의 말이 만드는 배치라
    // 미리 정해 둔 도식이 없다 — 어떤 주제가 들어와도 그대로 돈다.
    const TV = picked.map(([w]) => termCache[w]);
    let xy;
    if (TV.length >= 3) {
      const mu = Array(dim).fill(0);
      TV.forEach(v => v.forEach((x, i) => (mu[i] += x / TV.length)));
      let Rt = TV.map(v => v.map((x, i) => x - mu[i]));
      const comp = [];
      for (let k = 0; k < 2; k++) {
        let a = Array.from({ length: dim }, (_, i) => Math.sin(i * (k + 1) * 1.7) + 0.001);
        let n = Math.hypot(...a);
        a = a.map(x => x / n);
        for (let it = 0; it < 40; it++) {
          const pr = Rt.map(r => r.reduce((t, x, i) => t + x * a[i], 0));
          const w2 = Array(dim).fill(0);
          Rt.forEach((r, j) => { for (let i = 0; i < dim; i++) w2[i] += r[i] * pr[j]; });
          n = Math.hypot(...w2);
          if (!n) break;
          a = w2.map(x => x / n);
        }
        const pr = Rt.map(r => r.reduce((t, x, i) => t + x * a[i], 0));
        Rt = Rt.map((r, j) => r.map((x, i) => x - pr[j] * a[i]));
        comp.push(a);
      }
      xy = TV.map(v => {
        const d = v.map((x, i) => x - mu[i]);
        return comp.map(a => d.reduce((t, x, i) => t + x * a[i], 0));
      });
      for (const j of [0, 1]) {
        const vals = xy.map(q => q[j]);
        const lo = Math.min(...vals), sp = (Math.max(...vals) - lo) || 1;
        xy.forEach(q => (q[j] = (q[j] - lo) / sp));
      }
    } else {
      xy = picked.map((_, i) => [0.5, picked.length === 1 ? 0.5 : i / (picked.length - 1)]);
    }

    const top = picked[0] ? picked[0][1] : 1;
    cache[s].terms = picked.map(([w, sc], i) => ({
      w,
      s: +(sc / top).toFixed(3),
      x: +xy[i][0].toFixed(3),
      y: +xy[i][1].toFixed(3),
    }));
  });
}

writeFileSync(
  OUT,
  JSON.stringify(
    { model: MODEL, dim, fpDim: K, axes: centroids.map(c => c.name), posts: cache },
    null,
    0
  )
);
console.log(`핵심 낱말 기록 · ${Math.round(readFileSync(OUT).length / 1024)}KB`);
