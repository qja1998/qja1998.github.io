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
  posts: Record<string, { hash: string; vec: number[] }>;
  layout: Record<string, { x: number; y: number }>;
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

/** 주제 지도용 2D 좌표 (0~1 로 정규화돼 있다). */
export function layout() {
  return store.layout;
}

export function embeddingMeta() {
  return { model: store.model, dim: store.dim, count: Object.keys(store.posts).length };
}
