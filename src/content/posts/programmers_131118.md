---
title: "[Programmers] 서울에 위치한 식당 목록 출력하기 - 131118"
author: "kwon_gi_beom"
pubDatetime: 2025-06-26T18:39:14+09:00
description: "프로그래머스 '서울에 위치한 식당 목록 출력하기' (131118번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[서울에 위치한 식당 목록 출력하기](https://school.programmers.co.kr/learn/courses/30/lessons/131118)

# 풀이

## 코드
```sql
-- 코드를 입력하세요
WITH rm AS (SELECT ri.rest_id,
            ri.rest_name,
            ri.food_type,
            ri.favorites,
            ri.address,
            ROUND(AVG(review_score), 2) AS score
    FROM rest_info AS ri
        JOIN
        rest_review AS rr
        ON ri.rest_id = rr.rest_id
    WHERE ri.address LIKE "서울%"
    GROUP BY ri.rest_id, RI.REST_NAME, RI.FOOD_TYPE, RI.FAVORITES, RI.ADDRESS)

SELECT *
FROM rm
ORDER BY score DESC, favorites DESC;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
- 사용한 함수: AVG(), ROUND()
