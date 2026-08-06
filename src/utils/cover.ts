/**
 * 카드 커버를 글 자체에서 만든다.
 *
 * 이 블로그에는 커버 사진이 한 장도 없다. 그래서 사진 자리를 두 가지로 채운다.
 *  - 식별자: 문제 번호(1430), 챕터(CH8), 에러 이름(IndexError) 같은 그 글의 고유 표식
 *  - 미니맵: 코드가 있으면 코드의 들여쓰기 구조, 없으면 본문의 제목·문단·목록 구조
 *
 * Jekyll 시절에는 Liquid 에 정규식이 없어 이 계산을 frontmatter 에 미리 써넣어야 했다.
 * Astro 는 빌드 시점에 본문을 그대로 주므로 여기서 바로 계산한다.
 */

export type Cover = {
  kind: string; // BOJ, PROGRAMMERS, PYTORCH …
  tier: string; // GOLD 4, SQL, LAB 11-5 … (없으면 "")
  ident: string; // 커버에 크게 찍히는 표식
  short: string; // 커버가 식별자를 보여주므로 제목에서 중복을 걷어낸 것
  token: string; // 도메인 색 CSS 변수명
  minimap: Row[];
};

type Row = { indent: number; len: number };

const TIER: Record<string, string> = {
  B: "BRONZE",
  S: "SILVER",
  G: "GOLD",
  P: "PLATINUM",
};

const TOKEN: Record<string, string> = {
  GOLD: "--d-gold",
  SILVER: "--d-silver",
  BRONZE: "--d-bronze",
  PROGRAMMERS: "--d-sql",
  PYTORCH: "--d-torch",
  TROUBLESHOOTING: "--d-trouble",
  DOCKER: "--d-docker",
  SWEA: "--d-swea",
  BACKGROUND: "--d-base",
};

export function identify(
  title: string,
  categories: string[],
  body: string
): Omit<Cover, "minimap"> {
  const wrap = (kind: string, tier: string, ident: string, short: string) => ({
    kind,
    tier,
    ident,
    short,
    token: TOKEN[tier.split(" ")[0]] ?? TOKEN[kind] ?? "--d-base",
  });

  // "좌표 정렬 1, 2 - 11650, 11651 (S5)" 처럼 번호가 둘인 글이 하나 있다 → 첫 번호
  let m = title.match(/^\[BOJ\]\s*(.+?)\s*-\s*(\d+)(?:\s*,\s*\d+)*\s*\(([BSGP])(\d)\)\s*$/);
  if (m) return wrap("BOJ", `${TIER[m[3]]} ${m[4]}`, m[2], m[1]);

  m = title.match(/^\[SWEA\]\s*(.+?)\s*-\s*(\d+)\s*\((.+?)\)\s*$/);
  if (m) return wrap("SWEA", m[3].replace("모의 역량 테스트", "모의역량"), m[2], m[1]);

  m = title.match(/^\[Programmers\]\s*(.+?)\s*-\s*(\d+)\s*$/);
  if (m)
    return wrap("PROGRAMMERS", categories.includes("sql") ? "SQL" : "", m[2], m[1]);

  m = title.match(/^CH(\d+)\.\s*(.+?)(?:\s*\[.*\])?\s*$/);
  if (m) return wrap("DOCKER", "", `CH${m[1]}`, m[2]);

  m = title.match(/Lab\s*([\d.-]+\d)\s*:?\s*(.*)$/);
  if (m) {
    const topic = (m[2] ?? "").split(/\s*,\s*/)[0].trim() || `Lab ${m[1]}`;
    return wrap("PYTORCH", `LAB ${m[1]}`, topic, title.replace(/\s*-\s*Lab.*$/, ""));
  }

  if (categories[0] === "troubleshooting") {
    const short = title.replace(/^\[Troubleshooting\]\s*/, "");
    // 에러 이름이 이 글의 진짜 식별자다
    const e = (title + " " + body.slice(0, 1500)).match(
      /\b([A-Z]\w*(?:Error|Exception|Warning))\b/
    );
    if (e) return wrap("TROUBLESHOOTING", "", e[1], short);
    // 에러 이름이 없으면 무엇을 고치다 막혔는지가 식별자다
    const t = title.match(
      /(gitlab-runner|gitlab ci|gitlab|jenkins|docker|conda|nginx|ssh|pem|SSL|npm|pip|react)/i
    );
    return wrap("TROUBLESHOOTING", "", t ? t[1] : short.slice(0, 12), short);
  }

  const kind = (categories[0] ?? "post").toUpperCase();
  // 개념 글: 괄호 안 영문 용어 > 영문 제목 첫 단어
  m = title.match(/\(([A-Za-z][A-Za-z0-9 -]+)\)/);
  if (m) return wrap(kind, "", m[1].split(" ")[0], title.replace(/\s*\(.*\)\s*$/, ""));
  m = title.match(/^([A-Za-z][A-Za-z0-9]*)\b/);
  if (m) return wrap(kind, "", m[1], title);
  return wrap(kind, "", title.slice(0, 12), title);
}

/** 코드가 없는 글은 글 자체의 구조를 그린다. 코드 미니맵과 같은 시각 언어를 쓴다. */
function docRows(body: string, limit: number): Row[] {
  const rows: Row[] = [];
  for (const raw of body.replace(/```[\s\S]*?```/g, "").split("\n")) {
    const l = raw.trimEnd();
    if (!l.trim()) {
      rows.push({ indent: 0, len: 0 });
    } else if (l.startsWith("#")) {
      rows.push({ indent: 0, len: 14 }); // 제목
    } else if (/^\s*([-*+]\s|\d+\.\s)/.test(l)) {
      rows.push({ indent: 3, len: Math.min(l.trim().length, 40) }); // 목록
    } else if (l.trimStart().startsWith("|")) {
      rows.push({ indent: 1, len: 34 }); // 표
    } else if (l.trimStart().startsWith(">")) {
      rows.push({ indent: 4, len: Math.min(l.trim().length, 34) });
    } else {
      // 문단은 화면 폭에서 접히니 여러 줄로 펼친다
      const t = l.trim().length;
      for (let i = 0; i < Math.max(1, Math.floor(t / 42)); i++)
        rows.push({ indent: 0, len: 42 });
      rows.push({ indent: 0, len: t % 42 });
    }
    if (rows.length >= limit) break;
  }
  return rows.slice(0, limit);
}

export function minimap(body: string, limit = 26): Row[] {
  const blocks = [...body.matchAll(/```\w*\n([\s\S]*?)```/g)]
    .map(m => m[1])
    .filter(b => (b.match(/\n/g)?.length ?? 0) >= 3);
  if (!blocks.length) return docRows(body, limit);
  const longest = blocks.reduce((a, b) => (b.length > a.length ? b : a));
  return longest
    .split("\n")
    .slice(0, limit)
    .map(l => ({ indent: l.length - l.trimStart().length, len: l.trim().length }));
}

/** 미니맵 행들을 100×100 viewBox 안의 막대로 바꾼다. */
export function minimapRects(rows: Row[]) {
  if (!rows.length) rows = [{ indent: 0, len: 20 }];
  // 최장 줄로 정규화하면 한 줄만 길어도 나머지가 왼쪽에 몰린다. 85퍼센타일을 폭으로 잡고
  // 그보다 긴 줄은 잘리게 둔다 — 코드도 화면 밖으로 나가니 오히려 사실에 가깝다.
  const ends = rows.map(r => r.indent + r.len).sort((a, b) => a - b);
  const mx = Math.max(ends[Math.floor(ends.length * 0.85)] ?? 36, 24);
  const gap = 100 / rows.length;
  const h = Math.min(gap * 0.55, 3.4);
  return rows.flatMap((r, i) => {
    if (!r.len) return [];
    const x = Math.min((r.indent / mx) * 100, 96);
    return [
      {
        x,
        y: i * gap + (gap - h) / 2,
        w: Math.min(Math.max((r.len / mx) * 100, 1.5), 100 - x),
        h,
        o: 0.16 + (Math.min(r.indent, 20) / 20) * 0.34,
      },
    ];
  });
}

/** 풀이 글은 코드를 읽는 게 읽는 것이다. 산문만 세면 BOJ 글 대부분이 1분으로 뭉친다. */
export function readMinutes(body: string): number {
  const prose = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)|<[^>]+>/g, "");
  const code = [...body.matchAll(/```\w*\n([\s\S]*?)```/g)]
    .map(m => m[1].split("\n").filter(l => l.trim()).length)
    .reduce((a, b) => a + b, 0);
  return Math.max(1, Math.round(prose.length / 500 + code / 18));
}

export function cover(title: string, categories: string[], body: string): Cover {
  return { ...identify(title, categories, body), minimap: minimap(body) };
}
