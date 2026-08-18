# qja1998.github.io

CatBus — 알고리즘 문제 풀이와 삽질 기록.

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

- 본문 해시가 바뀐 글만 다시 계산한다. 모델을 매번 내려받지 않으려고
  결과를 저장소에 둔다 — 빌드(CI)는 이 파일만 읽는다.
- 모델은 `Xenova/multilingual-e5-small` (384차원). 한국어·영어가 섞여 있어
  다국어 모델을 쓴다. 임베딩 입력에서 **코드블록은 뺀다** — 넣으면 문제 풀이끼리
  코드가 비슷해 전부 한 곳에 뭉친다.
- 산출물은 빌드 입력이다. 브라우저로 가는 건 고른 이웃의 제목과 링크뿐,
  벡터는 나가지 않는다.
- 쓰는 곳: 포스트 하단 `비슷한 글` (`src/components/RelatedPosts.astro`).

## 홈 카드 커버 — 의미 축

이 블로그에는 커버 사진이 없다. 그래서 커버를 글 자체에서 만든다.

- **식별자** (`src/utils/cover.ts`) — 제목에서 문제 번호·챕터·에러 이름을 뽑는다.
  제목 형식이 새로 생기면 `identify()` 에 규칙을 추가한다.
- **의미 축** (`tools/embed.mjs` → `axisScores()`) — 그래프·구현·수학·SQL·신경망·
  확률·인프라·디버깅 여덟 방향에 글을 투영한 값(코퍼스 전체로 표준화).
  대표 카드는 이름 붙은 레이더로, 얇은 띠는 가장 기운 축의 낱말 하나로 보여 준다.
- **지문** (`fingerprint()`) — 임베딩을 PCA 로 32축에 누른 값. 띠의 파형과
  `비슷한 글` 목록의 막대에 쓴다. 이쪽은 읽는 게 아니라 견주는 용도다.

축은 문구로 적어 넣지 않고 **코퍼스에서 뽑는다.** 그 주제에 해당하는 글들의 평균
벡터를 방향으로 쓰고 이름만 사람이 붙인다. 손으로 쓴 개념 문구로도 해 봤지만
SQL 글이 SQL 축에 안 걸렸다 — 문구의 말투가 이 블로그의 말투와 달라서다.
축의 소속 규칙은 `tools/embed.mjs` 의 `AXES` 에 있다.

낱말은 가장 기운 축의 값이 0.35 를 넘을 때만 찍는다. 165편 중 4편은 어느 쪽으로도
충분히 기울지 않아 낱말이 비는데, 틀린 낱말을 찍는 것보다 낫다.

그림 형태는 `coverShape.ts` 에 여러 개가 있다 — `bars` · `wave` · `radial` ·
`cube`(3차원) · `axes`(이름 붙은 레이더) · `axisBars`.

## Jekyll 에서 이관

`tools/migrate_to_astro.py` 가 `_posts/` 를 변환했다. URL 165개를 그대로 유지하는 것이
그 스크립트의 첫 계약이다 — 파일명 뒷부분이 겹치는 15개 글은 `permalink` 로 구분돼 있었고
그 값을 파일명으로 삼았다.
