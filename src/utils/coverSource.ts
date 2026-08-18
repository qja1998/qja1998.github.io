/**
 * 커버에 쓸 '그 글의 실제 데이터' 를 고른다.
 *
 * 주제를 열거하지 않는다. 문서에 무엇이 들어 있는지만 본다.
 * 그래서 어떤 주제의 글이 들어와도 같은 절차가 돈다.
 *
 *   ① 본문 이미지 → 그림을 그대로 (34편)
 *   ② 수식        → KaTeX 로 렌더 (11편)
 *   ③ 코드        → 들여쓰기 구조 (114편)
 *   ④ 그 외       → 본문에서 뽑은 낱말 (6편)
 */
export type CoverSource =
  | { kind: "image"; src: string }
  | { kind: "formula"; tex: string }
  | { kind: "code"; rects: { x: number; y: number; w: number; h: number; o: number }[] }
  | { kind: "terms" };

/** 한글이 섞였거나 기호가 없으면 수식이 아니라 산문이다. */
function formulas(body: string): string[] {
  const out: string[] = [];
  for (const m of body.matchAll(/\$\$([\s\S]{3,200}?)\$\$/g)) out.push(m[1].trim());
  for (const m of body.matchAll(/(?<![$\w])\$([^$\n]{3,80})\$(?![\w])/g)) {
    const t = m[1];
    if (/[가-힣]/.test(t)) continue;
    if (!/[\\^_=+\-*/(){}]|\\frac|\\sum|log|exp/.test(t)) continue;
    out.push(t.trim());
  }
  return out;
}

/** 가장 긴 코드블록의 들여쓰기 구조. x=들여쓰기, w=줄 길이. */
function codeRects(code: string, limit = 26) {
  const lines = code.split("\n").slice(0, limit);
  const rows = lines.map(l => [l.length - l.trimStart().length, l.trim().length]);
  const ends = rows.map(([a, b]) => a + b).sort((a, b) => a - b);
  // 최장 줄로 정규화하면 한 줄만 길어도 나머지가 왼쪽에 몰린다. 85퍼센타일을 쓴다.
  const mx = Math.max(ends[Math.floor(ends.length * 0.85)] ?? 36, 24);
  const gap = 100 / Math.max(rows.length, 1);
  const h = Math.min(gap * 0.55, 3.4);
  return rows.flatMap(([ind, len], i) => {
    if (!len) return [];
    const x = Math.min((ind / mx) * 100, 96);
    return [{
      x,
      y: i * gap + (gap - h) / 2,
      w: Math.min(Math.max((len / mx) * 100, 1.5), 100 - x),
      h,
      o: 0.16 + (Math.min(ind, 20) / 20) * 0.34,
    }];
  });
}

export function coverSource(body: string): CoverSource {
  const img = body.match(/!\[.*?\]\((\/posting_imgs\/[^)\s]+)/);
  if (img) return { kind: "image", src: img[1] };

  const f = formulas(body);
  if (f.length) return { kind: "formula", tex: f.reduce((a, b) => (b.length > a.length ? b : a)) };

  const blocks = [...body.matchAll(/```\w*\n([\s\S]*?)```/g)]
    .map(m => m[1])
    .filter(c => (c.match(/\n/g)?.length ?? 0) >= 3);
  if (blocks.length) {
    const longest = blocks.reduce((a, b) => (b.length > a.length ? b : a));
    return { kind: "code", rects: codeRects(longest) };
  }
  return { kind: "terms" };
}
