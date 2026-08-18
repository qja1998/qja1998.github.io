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

## 홈 카드 커버 — 그 글이 실제로 갖고 있는 것

커버 사진이 없다. 그래서 **글 안에 이미 있는 것**을 커버로 쓴다.
주제를 열거하지 않고 문서에 무엇이 들어 있는지만 보므로, 어떤 주제의 글이
들어와도 같은 절차가 돈다 (`src/utils/coverSource.ts`).

| 순위 | 무엇이 있으면 | 커버 | 편수 |
|---|---|---|---|
| ① | 본문 이미지 | 그림을 그대로 (어둡게 눌러 라벨이 읽히게) | 34 (21%) |
| ② | 수식 | KaTeX 로 렌더 — 빌드 시점, 런타임 JS 없음 | 11 (7%) |
| ③ | 코드블록 | 가장 긴 블록의 들여쓰기 구조 | 114 (69%) |
| ④ | 그 외 | 본문에서 뽑은 낱말 조판 | 6 (4%) |

수식은 한글이 섞였거나 기호가 없으면 산문으로 보고 거른다 — `$P$가 있을 때` 같은
문장이 수식으로 잡히던 문제가 있었다.

바탕색은 임베딩 공간에서 그 글이 있는 방향이다. 밝기를 고정한 채 색상환 360° 를
쓰면 따뜻한 구간이 탁해져 청록~보라 180° 만 쓰고, 0°/360° 경계에 걸친 무리가
찢기지 않도록 각도 분포에서 가장 빈 구간에서 자르고, 백준(47%)이 색상환을
독차지하지 않도록 순위와 각도를 반씩 섞는다. 홈의 분류 칩과 스펙트럼 밴드도
같은 색을 쓰므로 칩 줄이 곧 범례다.

낱말은 본문 산문에서 후보를 뽑아 같은 임베딩 모델로 글 전체 벡터와의 코사인 ×
IDF 로 정렬해 고른다 (`tools/embed.mjs`). 태그를 쓰지 않으므로 새 주제로 글을 써도
그 글의 말이 나온다.

## Jekyll 에서 이관

`tools/migrate_to_astro.py` 가 `_posts/` 를 변환했다. URL 165개를 그대로 유지하는 것이
그 스크립트의 첫 계약이다 — 파일명 뒷부분이 겹치는 15개 글은 `permalink` 로 구분돼 있었고
그 값을 파일명으로 삼았다.
