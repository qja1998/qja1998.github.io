/**
 * 커버 도식 — 그 글이 다루는 알고리즘이 어떻게 도는지를 그린다.
 *
 * 임베딩을 차트로 그리는 방식(막대·파형·방사형·색)은 '이 둘이 비슷하다' 까지만
 * 전했다. 여기서는 다른 것을 그린다: BFS 는 퍼지는 파동, 이분탐색은 반씩 접히는
 * 구간, DP 는 대각선으로 채워지는 표. 개발자는 해석 없이 안다.
 *
 * 종류는 태그로 고르고, 세부 모양은 slug 에서 만든 시드로 흔들어 글마다 다르게 한다.
 * viewBox 는 항상 0 0 160 100.
 */
const seedOf = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const rngOf = (s: string) => {
  let x = seedOf(s) || 1;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const grid = (cols: number, rows: number, fn: (x: number, y: number) => number) => {
  const o: string[] = [];
  const w = 160 / cols, h = 100 / rows;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const v = fn(x, y);
      if (v > 0.02)
        o.push(`<rect fill="currentColor" x="${(x * w + 0.7).toFixed(1)}" y="${(y * h + 0.7).toFixed(1)}" width="${(w - 1.4).toFixed(1)}" height="${(h - 1.4).toFixed(1)}" rx="1.2" opacity="${v.toFixed(2)}"/>`);
    }
  return o.join("");
};

/** 한 점에서 퍼지는 파동 — BFS·최단경로 */
function bfs(s: string) {
  const r = rngOf(s), C = 16, R = 10;
  const sx = 1 + Math.floor(r() * 3), sy = 1 + Math.floor(r() * (R - 2));
  const wall = new Set<string>();
  for (let i = 0; i < 14; i++) wall.add(`${2 + Math.floor(r() * (C - 3))},${Math.floor(r() * R)}`);
  const d = new Map([[`${sx},${sy}`, 0]]);
  let q = [[sx, sy]], cur = 0;
  while (q.length) {
    const nx: number[][] = [];
    for (const [x, y] of q)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const a = x + dx, b = y + dy, k = `${a},${b}`;
        if (a < 0 || b < 0 || a >= C || b >= R || wall.has(k) || d.has(k)) continue;
        d.set(k, cur + 1);
        nx.push([a, b]);
      }
    q = nx;
    cur++;
  }
  const mx = Math.max(...d.values(), 1);
  return grid(C, R, (x, y) =>
    wall.has(`${x},${y}`) ? 0.1 : d.has(`${x},${y}`) ? 0.95 - (d.get(`${x},${y}`)! / mx) * 0.72 : 0.05
  );
}

/** 깊이로 파고드는 한 줄기 — DFS·백트래킹 */
function dfs(s: string) {
  const r = rngOf(s), C = 16, R = 10;
  let x = 0, y = Math.floor(R / 2);
  const path = [[x, y]];
  for (let i = 0; i < 26; i++) {
    const d = [[1, 0], [0, 1], [0, -1]][Math.floor(r() * 3)];
    x = Math.min(C - 1, Math.max(0, x + d[0]));
    y = Math.min(R - 1, Math.max(0, y + d[1]));
    path.push([x, y]);
  }
  const w = 160 / C, h = 100 / R;
  const pts = path.map(([a, b]) => `${(a * w + w / 2).toFixed(1)},${(b * h + h / 2).toFixed(1)}`).join(" ");
  return grid(C, R, () => 0.06) +
    `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3.2" opacity="0.9" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/** 대각선으로 채워지는 표 — DP */
function dp() {
  const C = 14, R = 9;
  return grid(C, R, (x, y) => {
    const t = (x + y) / (C + R - 2);
    return t < 0.72 ? 0.95 - t * 0.55 : 0.07;
  });
}

/** 반씩 접히는 구간 — 이분탐색 */
function bsearch(s: string) {
  const r = rngOf(s);
  let lo = 4, hi = 156;
  const o: string[] = [];
  for (let i = 0; i < 6; i++) {
    const y = 8 + i * 15, mid = (lo + hi) / 2;
    o.push(`<rect fill="currentColor" x="${lo.toFixed(1)}" y="${y}" width="${(hi - lo).toFixed(1)}" height="7" rx="3.5" opacity="${(0.85 - i * 0.1).toFixed(2)}"/>`);
    o.push(`<rect fill="currentColor" x="${(mid - 1.4).toFixed(1)}" y="${y - 2.5}" width="2.8" height="12" rx="1.4" opacity="0.95"/>`);
    if (r() > 0.5) lo = mid; else hi = mid;
  }
  return o.join("");
}

/** 절반만 정렬된 막대 — 정렬·자료구조 */
function sortv(s: string) {
  const r = rngOf(s), n = 22, k = Math.floor(n * 0.55);
  const a = Array.from({ length: n }, () => 0.15 + r() * 0.85);
  const v = [...a.slice(0, k).sort((p, q) => p - q), ...a.slice(k)];
  const w = 160 / n;
  return v.map((h, i) =>
    `<rect fill="currentColor" x="${(i * w + 0.9).toFixed(1)}" y="${(96 - h * 88).toFixed(1)}" width="${(w - 1.8).toFixed(1)}" height="${(h * 88).toFixed(1)}" rx="1.3" opacity="${i < k ? 0.9 : 0.4}"/>`
  ).join("");
}

/** 행이 걸러지고 아래에서 합쳐지는 표 — SQL */
function sql(s: string) {
  const r = rngOf(s), rows = 7, o: string[] = [], keep: boolean[] = [];
  for (let i = 0; i < rows; i++) {
    const on = r() > 0.42;
    keep.push(on);
    o.push(`<rect fill="currentColor" x="6" y="${(6 + i * 9).toFixed(1)}" width="${(96 + r() * 44).toFixed(1)}" height="5.4" rx="2.7" opacity="${on ? 0.9 : 0.18}"/>`);
  }
  const n = keep.filter(Boolean).length;
  o.push(`<rect fill="currentColor" x="6" y="76" width="148" height="1" opacity="0.3"/>`);
  o.push(`<rect fill="currentColor" x="6" y="82" width="${((n / rows) * 148).toFixed(1)}" height="10" rx="5" opacity="0.95"/>`);
  return o.join("");
}

/** 층층이 이어진 노드 — 신경망 */
function nn(s: string) {
  const r = rngOf(s), L = [4, 6, 5, 3], o: string[] = [], pos: number[][][] = [];
  L.forEach((n, li) => {
    const col: number[][] = [];
    for (let i = 0; i < n; i++) col.push([18 + li * 42, 50 + (i - (n - 1) / 2) * 17]);
    pos.push(col);
  });
  for (let li = 0; li < pos.length - 1; li++)
    for (const a of pos[li])
      for (const b of pos[li + 1])
        o.push(`<line x1="${a[0]}" y1="${a[1].toFixed(1)}" x2="${b[0]}" y2="${b[1].toFixed(1)}" stroke="currentColor" stroke-width="${(0.3 + r() * 1.1).toFixed(2)}" opacity="${(0.12 + r() * 0.4).toFixed(2)}"/>`);
  pos.flat().forEach(([x, y]) => o.push(`<circle fill="currentColor" cx="${x}" cy="${y.toFixed(1)}" r="3.6" opacity="0.95"/>`));
  return o.join("");
}

/** 쌓인 상자 — 컨테이너·인프라 */
function box(s: string) {
  const r = rngOf(s), o: string[] = [];
  const draw = (cx: number, cy: number, w: number, h: number, op: number) => {
    const p = (a: number, b: number) => `${(cx + a).toFixed(1)},${(cy + b).toFixed(1)}`;
    return `<polygon fill="currentColor" points="${p(0, -h)} ${p(w, -h + w * 0.5)} ${p(w, w * 0.5)} ${p(0, 0)} ${p(-w, w * 0.5)} ${p(-w, -h + w * 0.5)}" opacity="${op}"/>` +
      `<polygon fill="currentColor" points="${p(0, -h)} ${p(w, -h + w * 0.5)} ${p(0, -h + w)} ${p(-w, -h + w * 0.5)}" opacity="${(op + 0.25).toFixed(2)}"/>`;
  };
  for (let i = 0; i < 3; i++) o.push(draw(52 + i * 30, 78 - i * 6, 22, 20 + r() * 14, 0.32 + i * 0.14));
  return o.join("");
}

/** 한 줄이 터진 스택 트레이스 — 디버깅 */
function trace(s: string) {
  const r = rngOf(s), o: string[] = [], bad = 2 + Math.floor(r() * 4);
  for (let i = 0; i < 8; i++) {
    const ind = i === bad ? 10 : 4 + (i % 3) * 7;
    o.push(`<rect fill="currentColor" x="${(8 + ind).toFixed(1)}" y="${(7 + i * 11).toFixed(1)}" width="${(60 + r() * 80).toFixed(1)}" height="5" rx="2.5" opacity="${i === bad ? 0.98 : 0.28}"/>`);
    if (i === bad) o.push(`<rect fill="currentColor" x="4" y="${(5.5 + i * 11).toFixed(1)}" width="2.6" height="8" rx="1.3" opacity="1"/>`);
  }
  return o.join("");
}

/** 두 분포와 그 차이 — 확률·정보이론 */
function dist(s: string) {
  const r = rngOf(s), o: string[] = [];
  const curve = (mu: number, sd: number, amp: number, op: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 160; x += 4) pts.push(`${x},${(92 - amp * Math.exp(-((x - mu) ** 2) / (2 * sd * sd))).toFixed(1)}`);
    return `<polyline points="${pts.join(" ")}" fill="none" stroke="currentColor" stroke-width="2.2" opacity="${op}"/>`;
  };
  const m1 = 45 + r() * 20, m2 = 95 + r() * 25, s1 = 16 + r() * 8, s2 = 18 + r() * 8;
  const fill: string[] = [];
  for (let x = 0; x <= 160; x += 4)
    fill.push(`${x},${(92 - Math.min(Math.exp(-((x - m1) ** 2) / (2 * s1 * s1)), Math.exp(-((x - m2) ** 2) / (2 * s2 * s2))) * 62).toFixed(1)}`);
  o.push(`<polygon fill="currentColor" points="0,92 ${fill.join(" ")} 160,92" opacity="0.28"/>`);
  o.push(curve(m1, s1, 62, 0.9), curve(m2, s2, 62, 0.55));
  o.push(`<line x1="0" y1="92" x2="160" y2="92" stroke="currentColor" stroke-width="0.8" opacity="0.3"/>`);
  return o.join("");
}

/** 훑고 지나가는 창 — 문자열 */
function str(s: string) {
  const r = rngOf(s), C = 18, R = 5;
  const win = 3 + Math.floor(r() * 3), at = Math.floor(r() * (C - win));
  const w = 160 / C, h = 100 / R, o: string[] = [];
  for (let y = 0; y < R; y++)
    for (let x = 0; x < C; x++)
      o.push(`<rect fill="currentColor" x="${(x * w + w * 0.24).toFixed(1)}" y="${(y * h + h * 0.3).toFixed(1)}" width="${(w * 0.52).toFixed(1)}" height="${(h * 0.4).toFixed(1)}" rx="1" opacity="${r() > 0.35 ? 0.5 : 0.16}"/>`);
  o.push(`<rect x="${(at * w + 1).toFixed(1)}" y="2" width="${(win * w - 2).toFixed(1)}" height="96" rx="3" fill="none" stroke="currentColor" stroke-width="2.4" opacity="0.95"/>`);
  return o.join("");
}

/** 배수를 지워 나가는 체 — 수학·정수론 */
function sieve() {
  const C = 10, R = 6, n = C * R, out = new Set<number>();
  for (const p of [2, 3, 5]) for (let k = p * 2; k <= n; k += p) out.add(k);
  return grid(C, R, (x, y) => {
    const v = y * C + x + 1;
    return v < 2 ? 0.14 : out.has(v) ? 0.14 : 0.95;
  });
}

export function algoShape(slug: string, tags: string[], cats: string[]): { name: string; svg: string } {
  const t = tags.join(" "), c = cats[0] ?? "";
  const pick = (): [string, (s: string) => string] => {
    if (c === "troubleshooting") return ["디버깅", trace];
    if (c === "docker") return ["컨테이너", box];
    if (c === "pytorch" || c === "generative-model") return ["신경망", nn];
    if (t.includes("sql")) return ["SQL", sql];
    if (/entropy|divergence|probab|autoencoder|bayes/.test(t)) return ["분포", dist];
    if (/binary search|parametric/.test(t)) return ["이분탐색", bsearch];
    if (/dynamic programming/.test(t)) return ["DP", () => dp()];
    if (/\bdfs\b|backtracking|recursion/.test(t)) return ["DFS", dfs];
    if (/bfs|graph|shortest path|tree/.test(t)) return ["탐색", bfs];
    if (/sort|data structures|queue|stack|heap/.test(t)) return ["자료구조", sortv];
    if (/string|palindrome|parsing/.test(t)) return ["문자열", str];
    if (/number theory|prime|geometry|combinat|math/.test(t)) return ["정수론", () => sieve()];
    return ["구현", sortv];
  };
  const [name, fn] = pick();
  return { name, svg: fn(slug) };
}
