import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

/** 홈 카드의 커버 색과 같은 순서로 보여 주려고 글 수 내림차순으로 준다. */
export function getUniqueCategories(posts: CollectionEntry<"posts">[]) {
  const counts = new Map<string, { category: string; name: string; count: number }>();
  for (const post of posts.filter(postFilter)) {
    // 첫 번째 값이 대분류다: [boj, gold] → boj
    const name = post.data.categories?.[0];
    if (!name) continue;
    const category = slugifyStr(name);
    const hit = counts.get(category);
    if (hit) hit.count += 1;
    else counts.set(category, { category, name, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

export function primaryCategory(post: CollectionEntry<"posts">) {
  const name = post.data.categories?.[0];
  return name ? slugifyStr(name) : "";
}
