/**
 * 커버 그림 형태. 얇은 띠와 대표 카드는 자리 모양이 달라 따로 고른다.
 *
 * 띠(가로 100×66)는 가로로 긴 형태가 맞아 파형을 쓰고,
 * 대표 카드는 넓은 사각이라 방사형이 인장처럼 자리를 채운다.
 * 후보는 `coverShape.ts` 에 bars · wave · radial · cube 로 다 있다.
 */
export const COVER_BAND = "wave";
export const COVER_FEATURED = "radial";
