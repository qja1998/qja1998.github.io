---
title: "[Programmers] 오랜 기간 보호한 동물(1) - 59044"
author: "kwon_gi_beom"
pubDatetime: 2025-04-14T17:02:10+09:00
description: "NOT IN 서브쿼리로 아직 나가지 않은 동물만 남기고, 입소 순으로 정렬해 LIMIT 3."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[오랜 기간 보호한 동물(1)](https://school.programmers.co.kr/learn/courses/30/lessons/59044)

# 풀이

## 코드
```sql
SELECT ins.name, ins.datetime
FROM animal_ins AS ins
WHERE ins.animal_id NOT IN (
    SELECT animal_id
    FROM animal_outs
)
ORDER BY ins.datetime
LIMIT 3
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
- LIMIT 3 으로 상위 3건만 조회
- 서브쿼리를 사용
