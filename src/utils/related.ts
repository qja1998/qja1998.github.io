/**
 * 임베딩으로 '비슷한 글' 을 고른다.
 *
 * 계산은 전부 빌드 시점이다. 브라우저로 나가는 건 고른 결과(제목·링크)뿐이고
 * 벡터는 나가지 않는다.
 */
import data from "@/data/embeddings.json";

type Store = {
  model: string;
  dim: number;
  fpDim: number;
  axes: string[];
  posts: Record<string, { hash: string; vec: number[]; fp: number[]; ax: number[] }>;
};

const store = data as Store;

/** 벡터는 임베딩 단계에서 정규화해 두었으므로 내적이 곧 코사인 유사도다. */
function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export type Neighbor = { slug: string; score: number };

/**
 * 같은 분류로만 채우면 백준 글은 백준 글만 물고 온다. 그래서 분류를 보지 않고
 * 유사도만으로 고르되, 한 분류가 목록을 독차지하지 않도록 상한을 둔다.
 */
export function relatedSlugs(
  slug: string,
  catOf: (slug: string) => string,
  limit = 5,
  maxPerCat = 3,
  // 이 아래는 주제가 다른데 형식만 닮아 걸려 온 것들이라 채우지 않고 버린다
  floor = 0.86
): Neighbor[] {
  const self = store.posts[slug];
  if (!self) return [];

  const scored: Neighbor[] = [];
  for (const [other, entry] of Object.entries(store.posts)) {
    if (other === slug) continue;
    scored.push({ slug: other, score: dot(self.vec, entry.vec) });
  }
  scored.sort((a, b) => b.score - a.score);

  const picked: Neighbor[] = [];
  const seen = new Map<string, number>();
  for (const n of scored) {
    if (n.score < floor) break;
    const cat = catOf(n.slug);
    const used = seen.get(cat) ?? 0;
    if (used >= maxPerCat) continue;
    seen.set(cat, used + 1);
    picked.push(n);
    if (picked.length >= limit) break;
  }
  return picked;
}


export function embeddingMeta() {
  return { model: store.model, dim: store.dim, count: Object.keys(store.posts).length };
}

/**
 * 의미 지문 — 임베딩을 PCA 로 32축에 눌러 축별로 표준화한 값.
 * 커버는 이 값을 막대로 그린다. 비슷한 글은 지문도 닮는다.
 */
export function fingerprint(slug: string): number[] {
  return store.posts[slug]?.fp ?? [];
}

export function fingerprintDim() {
  return store.fpDim ?? 0;
}

/**
 * 의미 축 점수 — 코퍼스에서 뽑은 8개 방향에 이 글을 투영한 값(표준화).
 * 값이 클수록 그 주제 쪽으로 기울었다는 뜻이라, 사람이 읽을 수 있다.
 */
export function axisScores(slug: string): number[] {
  return store.posts[slug]?.ax ?? [];
}

export function axisNames(): string[] {
  return store.axes ?? [];
}

/** 가장 기울어진 축의 이름. 카드에 한 단어로 찍는다. */
export function topAxis(slug: string): string {
  const a = axisScores(slug);
  if (!a.length) return "";
  let best = 0;
  for (let i = 1; i < a.length; i++) if (a[i] > a[best]) best = i;
  return a[best] > 0.35 ? axisNames()[best] : "";
}
