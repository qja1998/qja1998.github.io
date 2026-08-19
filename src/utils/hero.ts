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

/**
 * 표지 안의 제목은 제목이 아니다.
 *
 * 마크다운 처리기가 `# 해결책` 을 `<h1 id="해결책">` 으로 내놓는데, 카드가 165장이면
 * 한 페이지에 h1 이 여러 개 생기고 id 도 겹친다(문서 개요가 망가지고 앵커가 충돌한다).
 * 표지는 본문의 한 조각을 보여 주는 그림이므로 제목 의미를 벗기고 모양만 남긴다.
 */
function demoteHeadings(html: string) {
  return html
    .replace(/<h([1-6])\b[^>]*>/g, '<div class="hh">')
    .replace(/<\/h[1-6]>/g, "</div>");
}

const cache = new Map<string, string>();

export async function renderHero(slug: string): Promise<string> {
  const md = heroBlock(slug);
  if (!md) return "";
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;
  const { code } = await (await get()).render(md);
  const html = demoteHeadings(code);
  cache.set(slug, html);
  return html;
}
