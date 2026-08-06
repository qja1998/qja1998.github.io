---
title: "[Programmers] 자동차 대여 기록 별 대여 금액 구하기 - 151141"
author: "kwon_gi_beom"
pubDatetime: 2025-03-19T23:07:06+09:00
description: "프로그래머스 '자동차 대여 기록 별 대여 금액 구하기' (151141번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[자동차 대여 기록 별 대여 금액 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/151141)

# 풀이

## 코드
```sql
-- # -- 코드를 입력하세요
-- # SELECT *
-- # FROM (SELECT car_id, daily_fee
-- #      FROM car_rental_company_car
-- #      WHERE car_type = '트럭') AS truck
-- #      JOIN
-- #      (SELECT history_id, car_id, (end_date - start_date) AS duration
-- #      FROM car_rental_company_rental_history) AS history
-- #      ON truck.car_id = history.car_id
-- #      JOIN
-- #      (SELECT duration_type, discount_rate
-- #      FROM car_rental_company_discount_plan
-- #      WHERE car_type = '트럭') AS truck_discount
-- #      ON
-- #         CASE
-- #             WHEN history.duration >= 7 THEN (SELECT discount_rate
-- #                                              FROM truck_discount
-- #                                              WHERE duration_type = '7일 이상')
-- #             WHEN history.duration >= 30 THEN (SELECT discount_rate
-- #                                              FROM truck_discount
-- #                                              WHERE duration_type = '30일 이상')
-- #             WHEN history.duration >= 90 THEN (SELECT discount_rate
-- #                                              FROM truck_discount
-- #                                              WHERE duration_type = '90일 이상')
-- #             ELSE 0

WITH value AS (
    SELECT car.daily_fee, car.car_type, his.history_id,
           DATEDIFF(end_date, start_date) + 1 AS period,
    CASE 
      WHEN DATEDIFF(end_date, start_date) + 1 >= 90 THEN '90일 이상'
      WHEN DATEDIFF(end_date, start_date) + 1 >= 30 THEN '30일 이상'
      WHEN DATEDIFF(end_date, start_date) + 1 >= 7 THEN '7일 이상'
      ELSE 'NONE' END AS duration_type
FROM car_rental_company_rental_history AS his
INNER JOIN car_rental_company_car AS car ON car.car_id = his.car_id
WHERE car.car_type = '트럭')   



SELECT value.history_id, 
    ROUND(value.daily_fee * value.period * 
          (100 - IFNULL(plan.discount_rate,0)) / 100) AS FEE
FROM value
LEFT JOIN car_rental_company_discount_plan AS plan 
    ON plan.duration_type = value.duration_type 
    AND plan.car_type = value.car_type
ORDER BY 2 DESC, 1 DESC
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 2회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
- CASE WHEN 으로 조건에 따라 값을 분기
- 사용한 함수: IFNULL(), ROUND()
