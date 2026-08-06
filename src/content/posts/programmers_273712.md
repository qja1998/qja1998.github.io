---
title: "[Programmers] 업그레이드 할 수 없는 아이템 구하기 - 273712"
author: "kwon_gi_beom"
pubDatetime: 2025-05-05T20:05:52+09:00
description: "프로그래머스 '업그레이드 할 수 없는 아이템 구하기' (273712번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[업그레이드 할 수 없는 아이템 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/273712)

# 풀이

## 코드
```sql
WITH null_item as (SELECT t1.item_id
    FROM item_tree as t1
        LEFT JOIN
        item_tree as t2
        ON t1.item_id = t2.parent_item_id
    WHERE t2.item_id IS NULL
)

SELECT ii.item_id, ii.item_name, ii.rarity
FROM null_item as ni
    JOIN
    item_info as ii
    ON ni.item_id = ii.item_id
ORDER BY ii.item_id DESC
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 2회 LEFT JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
