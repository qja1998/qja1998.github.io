---
title: "[Programmers] 오프라인/온라인 판매 데이터 통합하기 - 131537"
author: "kwon_gi_beom"
pubDatetime: 2025-04-08T23:40:24+09:00
description: "3월치만 걸러 온라인·오프라인을 UNION 한다. 오프라인에는 user_id 가 없어 NULL 을 채워 컬럼 수를 맞춘다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[오프라인/온라인 판매 데이터 통합하기](https://school.programmers.co.kr/learn/courses/30/lessons/131537)

# 풀이

## 코드
```sql
    SELECT DATE_FORMAT(sales_date,"%Y-%m-%d") AS sales_date, product_id, user_id, sales_amount
    FROM online_sale
    WHERE MONTH(sales_date) = 3
UNION
    SELECT DATE_FORMAT(sales_date,"%Y-%m-%d") AS sales_date, product_id, NULL AS user_id, sales_amount
    FROM offline_sale
    WHERE MONTH(sales_date) = 3
ORDER BY sales_date, product_id, user_id
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
- 서브쿼리를 사용
- 사용한 함수: DATE_FORMAT(), MONTH()
