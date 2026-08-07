---
title: "[Programmers] 특정 기간동안 대여 가능한 자동차들의 대여비용 구하기 - 157339"
author: "kwon_gi_beom"
pubDatetime: 2025-07-10T19:44:30+09:00
description: "CTE 에서 30일 요금제 할인율을 FLOOR 로 적용해 두고, 해당 기간에 대여 기록이 겹치는 차를 NOT IN 으로 걸러 낸다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[특정 기간동안 대여 가능한 자동차들의 대여비용 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/157339)

# 풀이

## 코드
```sql
WITH cars_with_fee AS (
    SELECT
        c.car_id,
        c.car_type,
        FLOOR(c.daily_fee * 30 * (100 - p.discount_rate) / 100) AS fee
    FROM
        car_rental_company_car AS c
    JOIN
        car_rental_company_discount_plan AS p ON c.car_type = p.car_type
    WHERE
        c.car_type IN ('세단', 'SUV')
        AND p.duration_type = '30일 이상'
)
SELECT
    car_id,
    car_type,
    fee
FROM
    cars_with_fee
WHERE
    car_id NOT IN (
        SELECT
            car_id
        FROM
            car_rental_company_rental_history
        WHERE
            end_date >= '2022-11-01' AND start_date <= '2022-11-30'
    )
    AND fee >= 500000 AND fee < 2000000
ORDER BY
    fee DESC,
    car_type ASC,
    car_id DESC;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
