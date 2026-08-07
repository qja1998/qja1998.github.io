---
title: "[Programmers] 업그레이드 된 아이템 구하기 - 273711"
author: "kwon_gi_beom"
pubDatetime: 2025-06-26T18:38:56+09:00
description: "item_tree 에서 부모로 등장하는 아이템 중 rarity 가 RARE 인 것을 CTE 로 모은 뒤, 아이템 정보와 조인한다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[업그레이드 된 아이템 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/273711)

# 풀이

## 코드
```sql
WITH rare_item AS (
    SELECT it.item_id
    FROM item_info AS ii
        JOIN
        item_tree AS it
        ON ii.item_id = it.parent_item_id
    WHERE rarity = "RARE"
)

# SELECT *
# FROM rare_item

SELECT ii.item_id, ii.item_name, ii.rarity
FROM rare_item AS ri
    JOIN
    item_info AS ii
    ON ri.item_id = ii.item_id
ORDER BY ii.item_id DESC
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 2회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
