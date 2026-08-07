---
title: "[Programmers] 상품 별 오프라인 매출 구하기 - 131533"
author: "kwon_gi_beom"
pubDatetime: 2025-07-10T19:43:57+09:00
description: "상품과 오프라인 판매를 조인해 SUM(수량) × 단가로 매출을 만든다. GROUP BY 는 product_id 로 하고 정렬만 product_code 를 쓴다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[상품 별 오프라인 매출 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/131533)

# 풀이

## 코드
```sql
SELECT pd.product_code, SUM(os.sales_amount) * pd.price as sales
FROM product as pd
    JOIN
    offline_sale as os
    ON pd.product_id = os.product_id
GROUP BY pd.product_id
ORDER BY sales DESC, pd.product_code ASC
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬 (내림차순 포함)
- 사용한 함수: SUM()
