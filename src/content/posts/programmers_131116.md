---
title: "[Programmers] 식품분류별 가장 비싼 식품의 정보 조회하기 - 131116"
author: "kwon_gi_beom"
pubDatetime: 2025-04-02T23:10:42+09:00
description: "카테고리별 MAX(price) 를 구한 서브쿼리를 원본 테이블과 다시 조인해, 최고가만이 아니라 그 상품의 이름까지 함께 뽑는다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[식품분류별 가장 비싼 식품의 정보 조회하기](https://school.programmers.co.kr/learn/courses/30/lessons/131116)

# 풀이

## 코드
```sql
SELECT food_product.category, food_product.price AS max_price, food_product.product_name
FROM food_product, (
    SELECT category, MAX(price) AS max_price
    FROM food_product
    WHERE category IN ('과자', '국', '김치', '식용유')
    GROUP BY category
) AS max_price_product
WHERE food_product.category = max_price_product.category AND food_product.price = max_price_product.max_price
ORDER BY price DESC


# SELECT category, MAX(price)
#     FROM food_product
#     WHERE category IN ('과자', '국', '김치', '식용유')
#     GROUP BY category
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
- 사용한 함수: MAX()
