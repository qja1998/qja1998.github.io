/**
 * 카드 커버를 글 자체에서 만든다.
 *
 * 이 블로그에는 커버 사진이 한 장도 없다. 그래서 커버는 식별자와 그림으로 나뉜다.
 * 여기서는 식별자만 만든다 — 문제 번호(1430), 챕터(CH8), 에러 이름(IndexError) 같은
 * 그 글의 고유 표식이다.
 *
 * 커버의 그림은 임베딩에서 뽑은 의미 지문을 쓴다(`src/utils/related.ts`).
 */

export type Cover = {
  kind: string; // BOJ, PROGRAMMERS, PYTORCH …
  tier: string; // GOLD 4, SQL, LAB 11-5 … (없으면 "")
  ident: string; // 커버에 크게 찍히는 표식
  short: string; // 커버가 식별자를 보여주므로 제목에서 중복을 걷어낸 것
  token: string; // 도메인 색 CSS 변수명
};

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
): Cover {
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
    // 제목의 앞부분("모두를 위한 딥러닝 2")은 26편이 공유한다. 글을 가르는 건 Lab 주제다.
    const topic = (m[2] ?? "").split(/\s*,\s*/)[0].trim() || `Lab ${m[1]}`;
    return wrap("PYTORCH", "", `LAB ${m[1]}`, topic);
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
  return identify(title, categories, body);
}
