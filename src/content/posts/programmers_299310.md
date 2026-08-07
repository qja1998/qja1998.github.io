---
title: "[Programmers] 연도별 대장균 크기의 편차 구하기  - 299310"
author: "kwon_gi_beom"
pubDatetime: 2025-03-19T23:07:06+09:00
description: "상관 서브쿼리로 같은 연도의 MAX(size_of_colony) 를 가져와 각 개체 크기와의 차를 구한다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[연도별 대장균 크기의 편차 구하기 ](https://school.programmers.co.kr/learn/courses/30/lessons/299310)

# 풀이

## 코드
```sql
SELECT year(differentiation_date) AS YEAR,
(
    SELECT MAX(size_of_colony) FROM ecoli_data
    WHERE year(differentiation_date) = year
) - size_of_colony AS YEAR_DEV,
ID
FROM ECOLI_DATA
ORDER BY YEAR, YEAR_DEV
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
- 서브쿼리를 사용
- 사용한 함수: MAX(), YEAR()
