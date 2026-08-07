---
title: "[Programmers] 자동차 종류 별 특정 옵션이 포함된 자동차 수 구하기 - 151137"
author: "kwon_gi_beom"
pubDatetime: 2025-05-05T20:05:06+09:00
description: "LIKE 를 OR 로 세 번 잇는 대신 REGEXP 로 세 옵션을 한 번에 매칭하고 차종별로 COUNT 한다. 원래 쓰던 LIKE 버전도 주석으로 남겨 두었다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[자동차 종류 별 특정 옵션이 포함된 자동차 수 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/151137)

# 풀이

## 코드
```sql
SELECT car_type, COUNT(car_id) as cars
FROM car_rental_company_car
WHERE options REGEXP '통풍시트|열선시트|가죽시트'
GROUP BY car_type
ORDER BY car_type

-- WHERE car.options like '%통풍시트%'
--     OR car.options like '%열선시트%'
--     OR car.options like '%가죽시트%'
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬
- 사용한 함수: COUNT()
