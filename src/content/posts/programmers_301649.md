---
title: "[Programmers] 대장균의 크기에 따라 분류하기 2 - 301649"
author: "kwon_gi_beom"
pubDatetime: 2025-05-07T22:54:21+09:00
description: "PERCENT_RANK() 윈도 함수로 크기 백분위를 매기고, CASE 로 25%·50%·75% 구간을 잘라 등급 이름을 붙인다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[대장균의 크기에 따라 분류하기 2](https://school.programmers.co.kr/learn/courses/30/lessons/301649)

# 풀이

## 코드
```sql
WITH per AS (
    SELECT id, PERCENT_RANK() OVER (ORDER BY size_of_colony DESC) as per_rank
    FROM ECOLI_DATA
)
SELECT id,
CASE
    WHEN per_rank < 0.25 THEN 'CRITICAL'
    WHEN per_rank < 0.5 THEN 'HIGH'
    WHEN per_rank < 0.75 THEN 'MEDIUM'
    ELSE 'LOW'
END AS colony_name
FROM per
ORDER BY id;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
- CASE WHEN 으로 조건에 따라 값을 분기
