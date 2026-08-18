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

## 홈 카드 커버 — 의미 색

이 블로그에는 커버 사진이 없다. 그래서 커버를 글 자체에서 만든다.
차트도 만들어 봤지만(막대·파형·방사형·3차원, `coverShape.ts` 에 남아 있다) 전부
해석을 요구했다. 사람이 해석 없이 바로 느끼는 채널은 색이다.

- **바탕색** = 의미 공간에서 이 글이 있는 방향.
  같은 주제 글끼리 같은 색이 되고, 이웃한 주제는 이웃한 색이 된다.
  분류를 넣지 않았는데도 분류별로 뭉친다(원형 뭉침 0.94~1.00).
- **채도** = 코퍼스 중심에서 얼마나 멀리 나갔나 = 얼마나 뚜렷한 글인가.
- **밝기는 고정.** 그래야 그리드 전체가 한 톤으로 어우러진다.
- 홈의 분류 칩과 스펙트럼 밴드도 같은 색을 쓴다. 칩 줄이 곧 색의 범례다.

색상 배치에서 조정한 것 세 가지 (`tools/embed.mjs`):

1. **색상환을 다 쓰지 않는다.** 밝기를 고정한 채 360° 를 쓰면 따뜻한 구간이
   탁한 올리브·고동색이 된다. 청록→파랑→보라 180° 구간만 쓴다.
2. **가장 빈 각도에서 자른다.** 0°/360° 경계에 걸친 무리는 순위를 매길 때
   양 끝으로 찢긴다(트러블슈팅 뭉침이 0.39 까지 떨어졌었다).
3. **순위와 각도를 반씩 섞는다.** 순위로만 펴면 백준(47%)이 색상환 절반을 먹어
   작은 분류들이 6° 안에 붙고, 각도만 쓰면 백준 77편이 한 색이 된다.

대표 카드에는 이름 붙은 여덟 축 레이더를 함께 둔다 — 색이 무엇을 뜻하는지
이름으로 알려 주는 자리다. 축 목록은 손으로 적지 않고 코퍼스에서 자동으로 뽑는다.

그림 형태는 `coverShape.ts` 에 여러 개가 있다 — `bars` · `wave` · `radial` ·
`cube`(3차원) · `axes`(이름 붙은 레이더) · `axisBars`.

## Jekyll 에서 이관

`tools/migrate_to_astro.py` 가 `_posts/` 를 변환했다. URL 165개를 그대로 유지하는 것이
그 스크립트의 첫 계약이다 — 파일명 뒷부분이 겹치는 15개 글은 `permalink` 로 구분돼 있었고
그 값을 파일명으로 삼았다.
