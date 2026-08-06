---
title: "[Programmers] 노선별 평균 역 사이 거리 조회하기 - 284531"
author: "kwon_gi_beom"
pubDatetime: 2025-07-17T18:20:14+09:00
description: "프로그래머스 '노선별 평균 역 사이 거리 조회하기' (284531번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[노선별 평균 역 사이 거리 조회하기](https://school.programmers.co.kr/learn/courses/30/lessons/284531)

# 풀이

## 코드
```sql
SELECT route,
    CONCAT(ROUND(SUM(d_between_dist), 1), 'km') AS total_distance,
    CONCAT(ROUND(AVG(d_between_dist), 2), 'km') AS average_distance
FROM subway_distance
GROUP BY route
ORDER BY ROUND(SUM(d_between_dist), 1) DESC;

-- SELECT route,
--     CONCAT(ROUND(SUM(d_between_dist), 1), 'km') AS total_distance,
--     CONCAT(ROUND(AVG(d_between_dist), 2), 'km') AS average_distance
-- FROM subway_distance
-- GROUP BY route
-- ORDER BY total_distance DESC;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬 (내림차순 포함)
- 사용한 함수: AVG(), CONCAT(), ROUND(), SUM()
