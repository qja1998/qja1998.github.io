/**
 * 커버 그림 — 의미 지문(PCA 32축)을 SVG 로 그린다.
 *
 * 값은 전부 `src/data/embeddings.json` 에서 오고, 그리기만 여기서 한다.
 * viewBox 는 항상 0 0 100 100 이고 카드 쪽에서 preserveAspectRatio 로 늘린다.
 */
export type Shape = "bars" | "wave" | "radial" | "cube";

const CLIP = 2.2;
const cl = (z: number) => Math.max(-CLIP, Math.min(CLIP, z));
const n2 = (v: number) => v.toFixed(2);

/** 부호대로 위아래 막대. 가로로 긴 자리에 맞는다. */
function bars(fp: number[]) {
  const w = 100 / fp.length;
  const r = fp
    .map((z, i) => {
      const v = cl(z);
      const h = Math.max((Math.abs(v) / CLIP) * 42, 2);
      return `<rect x="${n2(i * w + w / 2 - 1.1)}" y="${n2(v >= 0 ? 50 - h : 50)}" width="2.2" height="${n2(h)}" rx="0.9" fill="currentColor" opacity="${n2(0.3 + (Math.abs(v) / CLIP) * 0.55)}"/>`;
    })
    .join("");
  return `<line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" stroke-width="0.4" opacity="0.22"/>${r}`;
}

/** 같은 값을 선 하나로 이은 것. 막대보다 형태가 한눈에 잡힌다. */
function wave(fp: number[]) {
  const w = 100 / (fp.length - 1);
  const pts = fp.map((z, i) => `${n2(i * w)},${n2(50 - cl(z) * 18)}`).join(" ");
  return (
    `<line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" stroke-width="0.4" opacity="0.22"/>` +
    `<polygon points="0,50 ${pts} 100,50" fill="currentColor" opacity="0.16"/>` +
    `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.85" stroke-linejoin="round" stroke-linecap="round"/>`
  );
}

/** 32축을 원둘레에 두고 반지름으로. 인장 같은 실루엣이라 닮음이 가장 잘 보인다. */
function radial(fp: number[]) {
  const n = fp.length;
  const pts = fp.map((z, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = 17 + ((cl(z) + CLIP) / (CLIP * 2)) * 31;
    return `${n2(50 + Math.cos(a) * r)},${n2(50 + Math.sin(a) * r)}`;
  });
  const d = pts.join(" ");
  return (
    `<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.2"/>` +
    `<circle cx="50" cy="50" r="17" fill="none" stroke="currentColor" stroke-width="0.4" opacity="0.2"/>` +
    `<polygon points="${d}" fill="currentColor" opacity="0.22"/>` +
    `<polygon points="${d}" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.85" stroke-linejoin="round"/>`
  );
}

/** PC1~9 를 3×3 행렬로 써서 정육면체를 변형하고 아이소메트릭으로 투영. */
function cube(fp: number[]) {
  const M = [
    [fp[0], fp[1], fp[2]],
    [fp[3], fp[4], fp[5]],
    [fp[6], fp[7], fp[8]],
  ].map(r => r.map(v => (cl(v) / CLIP) * 0.55));
  for (let i = 0; i < 3; i++) M[i][i] += 1;   // 납작해지지 않게 단위행렬을 더한다

  const V: number[][] = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
  const P = V.map(v => {
    const [x, y, z] = M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
    return [50 + (x - z) * 17, 50 + (y * 1.15 + (x + z) * 0.5) * 15];
  });
  const EDGES = [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  return (
    EDGES.map(([a, b]) =>
      `<line x1="${n2(P[a][0])}" y1="${n2(P[a][1])}" x2="${n2(P[b][0])}" y2="${n2(P[b][1])}" stroke="currentColor" stroke-width="1.3" opacity="0.8"/>`
    ).join("") +
    P.map(p => `<circle cx="${n2(p[0])}" cy="${n2(p[1])}" r="1.5" fill="currentColor" opacity="0.9"/>`).join("")
  );
}

const SHAPES: Record<Shape, (fp: number[]) => string> = { bars, wave, radial, cube };

export function coverShape(fp: number[], shape: Shape): string {
  if (!fp.length) return "";
  return SHAPES[shape](fp);
}
