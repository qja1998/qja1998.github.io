---
title: "[Programmers] 특정 세대의 대장균 찾기 - 301650"
author: "kwon_gi_beom"
pubDatetime: 2025-05-07T22:54:50+09:00
description: "ecoli_data 를 세 번 조인해 부모의 부모까지 거슬러 올라가고, 그 위가 NULL 인 경우만 남겨 3세대를 찾는다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[특정 세대의 대장균 찾기](https://school.programmers.co.kr/learn/courses/30/lessons/301650)

# 풀이

## 코드
```sql
SELECT e1.id
FROM ecoli_data AS e1
    JOIN ecoli_data AS e2 ON e1.parent_id = e2.id
    JOIN ecoli_data AS e3 ON e2.parent_id = e3.id
WHERE e3.parent_id IS NULL
ORDER BY e1.id ASC
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 2회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
