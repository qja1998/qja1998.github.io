/**
 * 카드 표지 = 그 글에서 고른 조각 하나를 마크다운 그대로 그린 것.
 *
 * 고르는 쪽(tools/embed.mjs)은 조각의 종류를 묻지 않는다. 빈 줄과 코드펜스로만
 * 자르고, 임베딩으로 글 전체와 가장 가까운 조각을 뽑되 표면 구조가 촘촘한 쪽에
 * 가중치를 준다. 그리는 쪽도 종류를 묻지 않는다 — 본문과 같은 처리기에 넘긴다.
 * 그래서 표든 수식이든 diff든 벤치마크든, 새 형식이 들어와도 절차가 그대로 돈다.
 */
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import data from "@/data/embeddings.json";

type Store = { posts: Record<string, { hero?: string }> };

export function heroBlock(slug: string): string {
  return (data as unknown as Store).posts[slug]?.hero ?? "";
}

let processor: Awaited<ReturnType<typeof createMarkdownProcessor>> | null = null;

/** 본문과 같은 설정. 표지에서 본 것과 글을 열고 본 것이 같아야 한다. */
async function get() {
  processor ??= await createMarkdownProcessor({
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
    },
  });
  return processor;
}

const cache = new Map<string, string>();

export async function renderHero(slug: string): Promise<string> {
  const md = heroBlock(slug);
  if (!md) return "";
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;
  const { code } = await (await get()).render(md);
  cache.set(slug, code);
  return code;
}
