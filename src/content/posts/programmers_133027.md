---
title: "[Programmers] 주문량이 많은 아이스크림들 조회하기 - 133027"
author: "kwon_gi_beom"
pubDatetime: 2025-03-02T22:51:31+09:00
description: "프로그래머스 '주문량이 많은 아이스크림들 조회하기' (133027번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[주문량이 많은 아이스크림들 조회하기](https://school.programmers.co.kr/learn/courses/30/lessons/133027)

# 풀이

## 코드
```sql
SELECT J.FLAVOR
FROM FIRST_HALF F
    INNER JOIN (SELECT FLAVOR, SUM(TOTAL_ORDER) AS JULY_TOTAL_ORDER
                FROM JULY
                GROUP BY FLAVOR) J
        ON F.FLAVOR = J.FLAVOR
ORDER BY TOTAL_ORDER + JULY_TOTAL_ORDER DESC
LIMIT 3;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬 (내림차순 포함)
- LIMIT 3 으로 상위 3건만 조회
- 서브쿼리를 사용
- 사용한 함수: SUM()
