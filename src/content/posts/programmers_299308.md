---
title: "[Programmers] 분기별 분화된 대장균의 개체 수 구하기 - 299308"
author: "kwon_gi_beom"
pubDatetime: 2025-07-03T17:33:32+09:00
description: "QUARTER() 로 분화일을 분기 문자열로 바꾸는 CTE 를 만들고, 바깥에서 그 값으로 GROUP BY 해 분기별 개체 수를 센다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[분기별 분화된 대장균의 개체 수 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/299308)

# 풀이

## 코드
```sql
WITH quarter AS (
    SELECT 
        CASE
            WHEN(QUARTER(differentiation_date)) = 1 THEN '1Q'
            WHEN(QUARTER(differentiation_date)) = 2 THEN '2Q'
            WHEN(QUARTER(differentiation_date)) = 3 THEN '3Q'
            WHEN(QUARTER(differentiation_date)) = 4 THEN '4Q'
            ELSE NULL
    END AS quarter
    FROM ecoli_data
)

SELECT quarter, COUNT(*) AS ecoli_count
FROM quarter
GROUP BY quarter
ORDER BY quarter
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬
- 서브쿼리를 사용
- CASE WHEN 으로 조건에 따라 값을 분기
- 사용한 함수: COUNT()
