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

## 홈 카드 커버 — 알고리즘 도식 + 낱말 + 의미 색

커버가 세 겹이다. 각자 다른 일을 한다.

| 겹 | 무엇 | 하는 일 |
|---|---|---|
| 도식 (`algoShape.ts`) | 그 글이 다루는 알고리즘이 도는 모양 | **어떻게** 푸는 글인지 |
| 낱말 (`keyTerms()`) | 본문에서 뽑은 두 낱말 | **무엇에 관한** 글인지 |
| 바탕색 (`semanticColor()`) | 의미 공간에서의 방향 | 어느 **무리**에 속하는지 |

도식은 12종이다 — 탐색(퍼지는 파동) · DFS(파고드는 한 줄기) · DP(대각선으로
채워지는 표) · 이분탐색(반씩 접히는 구간) · 자료구조(절반만 정렬된 막대) ·
SQL(걸러진 행과 집계) · 신경망(층층이 이어진 노드) · 컨테이너(쌓인 상자) ·
디버깅(한 줄이 터진 스택 트레이스) · 분포(두 곡선과 겹친 넓이) ·
문자열(훑고 지나가는 창) · 정수론(배수를 지운 체).

종류는 태그로 고르고 세부 모양은 slug 시드로 흔들어 글마다 다르게 만든다.
전부 빌드 시점 SVG 라 이미지 파일도 런타임 비용도 없다.

낱말 뽑는 법 (`tools/embed.mjs`) — 태그를 쓰지 않는다. 본문 산문에서 후보를 뽑아
같은 모델로 임베딩하고, 글 전체 벡터와의 코사인 × IDF 로 정렬해 위에서 둘을 쓴다.
그래야 새 주제로 글을 써도 그 글의 말이 나온다. 코드까지 후보로 넣으면 `cur_w`
같은 식별자가 희귀해서 IDF 를 먹고 1등이 되므로 산문에서만 뽑는다.

색상 배치에서 조정한 것: 밝기를 고정한 채 색상환 360° 를 쓰면 따뜻한 구간이
탁해져 청록~보라 180° 만 쓰고, 0°/360° 경계에 걸친 무리가 찢기지 않도록 각도
분포에서 가장 빈 구간에서 자르고, 백준(47%)이 색상환을 독차지하지 않도록 순위와
각도를 반씩 섞는다.

## Jekyll 에서 이관

`tools/migrate_to_astro.py` 가 `_posts/` 를 변환했다. URL 165개를 그대로 유지하는 것이
그 스크립트의 첫 계약이다 — 파일명 뒷부분이 겹치는 15개 글은 `permalink` 로 구분돼 있었고
그 값을 파일명으로 삼았다.
