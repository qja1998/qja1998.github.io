# qja1998.github.io

CatBus — 알고리즘 풀이와 공부 기록.

[Astro](https://astro.build) + [AstroPaper](https://github.com/satnaing/astro-paper) 기반.
`main`/`master` 에 push 하면 GitHub Actions 가 빌드해 GitHub Pages 로 배포한다.

## 개발

```bash
npm ci
npm run dev          # http://localhost:4321
npx astro build      # dist/ 생성
npx pagefind --site dist   # 검색 인덱스 (배포 시 Actions 가 수행)
```

## 글 쓰기

`src/content/posts/<slug>.md` 를 만든다. **파일명이 곧 URL** 이다 (`/posts/<slug>/`).

```yaml
---
title: "[BOJ] 공격 - 1430 (G4)"
author: "kwon_gi_beom"
pubDatetime: 2025-10-26T17:31:56+09:00
description: "한 줄 요약. 목록 카드와 검색 결과에 그대로 나온다."
tags: ["math", "bfs"]
categories: ["boj", "gold"]
---
```

- `pubDatetime` 은 `+09:00` 형식이어야 한다. `+0900` 은 YAML 이 날짜로 읽지 못한다.
- 이미지는 `public/posting_imgs/` 에 두고 `/posting_imgs/이름.webp` 로 참조한다.
- 수식은 `$…$` / `$$…$$` (remark-math + KaTeX).

## 임베딩 — 비슷한 글

글을 쓰거나 고친 뒤 한 번 돌리고 결과를 함께 커밋한다.

```bash
npm run embed        # src/data/embeddings.json 갱신
```

- 본문 해시가 바뀐 글만 다시 계산한다. 결과를 저장소에 두므로 빌드(CI)는 이 파일만 읽는다.
- 모델은 `Xenova/multilingual-e5-small` (384차원). 한국어와 영어가 섞여 있어 다국어 모델을 쓴다.
- 임베딩 입력에서 코드블록은 제외한다. 포함하면 문제 풀이끼리 코드가 비슷해 한곳에 뭉친다.
- 브라우저로 나가는 것은 고른 이웃의 제목과 링크뿐이다. 벡터는 나가지 않는다.
- 쓰는 곳: 포스트 하단 `비슷한 글` (`src/components/RelatedPosts.astro`).

## 홈 카드 커버

커버 이미지가 없다. 글에서 조각 하나를 골라 마크다운 그대로 그린다.
고르는 쪽과 그리는 쪽 모두 그 조각의 종류를 판정하지 않는다.

### 고르기 (`tools/embed.mjs`)

1. 본문을 빈 줄과 코드 펜스로 자른다.
2. 각 조각을 본문과 같은 모델로 임베딩하고, 글 전체 벡터와의 코사인을 잰다.
3. 세 가지 계수를 곱한다.

| 계수 | 이유 | 식 |
|---|---|---|
| 구조 밀도 | 그대로 두면 산문이 뽑힌다. 본문 대부분이 산문이다 | 기호·숫자 비율, 줄 수, 줄 길이 분산 |
| 제목과의 비중복 | 제목이 이미 말한 내용은 표지에서 뺀다 | `0.35 + 0.65 × (1 − 제목과의 낱말 겹침)` |
| 코퍼스 희소성 | 백준 77편에 공통으로 있는 「시간 제한」 표는 개별 글을 설명하지 못한다 | `÷ √(같은 골격을 쓰는 글 수)` |

4. 앞머리에서 여러 글이 공유하는 줄(`import sys`, `input = sys.stdin.readline` 등)을
   제거한다. 글자도 숫자도 없는 줄(`$$`, ` ``` `, `|---|`)은 내용이 아니라 구조이므로 남긴다.
5. 뒤따르는 조각을 480자까지 이어 붙인다. 문서 순서를 그대로 따른다.

### 그리기 (`src/utils/hero.ts` → `src/components/PostCard.astro`)

본문과 같은 마크다운 처리기(remark-math + rehype-katex + shiki)에 넘긴다.
코드는 하이라이트되고, 표는 표로, `$$` 는 KaTeX 로 나온다.
커버 배경이 항상 어두우므로 shiki 의 다크 색만 쓴다. 아래로 갈수록 흐려지며 잘린다.

### 결과

165편 기준 코드 118 · 목록 14 · 문단 11 · 표 9 · 수식 8 · 제목 4 · 인용 1.
이 분류는 코드에 없다. 결과를 세어 얻은 값이다. 같은 골격을 쓰는 표지는 0편이다.

이미지는 텍스트가 거의 없어 유사도 경쟁에서 밀린다. 본문에 그림이 있는 글 36편 중
표지로 뽑힌 것은 0편이다.

### 바탕색

임베딩 공간에서 그 글이 있는 방향을 색상으로 쓴다. 밝기는 고정한다.
색상환 360° 를 다 쓰면 따뜻한 구간이 탁해져 청록~보라 180° 만 쓴다.
0°/360° 경계에서 한 무리가 갈리지 않도록 각도 분포가 가장 빈 곳에서 자른다.
백준(47%)이 색상환을 독차지하지 않도록 순위와 각도를 반씩 섞는다.
홈의 분류 칩과 스펙트럼 밴드가 같은 색을 쓴다.

## 목록과 아카이브

목록·분류·태그는 홈과 같은 카드 격자를 쓴다(`src/components/PostGrid.astro`).
`Main` 에 `layout="grid"` 를 주면 본문 폭이 78rem 이 된다.

`/archives/` 만 연표다. 세로줄이 시간축이고 연·월이 눈금이다.
점 색은 카드 커버와 같은 값을 쓴다.

## Jekyll 에서 이관

`tools/migrate_to_astro.py` 가 `_posts/` 를 변환했다. URL 165개 유지가 이 스크립트의
전제 조건이었다. 파일명 뒷부분이 겹치는 15개 글은 `permalink` 로 구분돼 있었고,
그 값을 파일명으로 삼았다.
