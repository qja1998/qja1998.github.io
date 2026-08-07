---
title: "[Programmers] 대장균들의 자식의 수 구하기 - 299305"
author: "kwon_gi_beom"
pubDatetime: 2025-03-26T22:06:18+09:00
description: "ecoli_data 를 자기 자신과 LEFT JOIN 해 부모-자식을 이어 붙이고, 자식 쪽을 COUNT 해 개체마다 자식 수를 센다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[대장균들의 자식의 수 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/299305)

# 풀이

## 코드
```sql
SELECT ecoli1.id AS ID, COUNT(ecoli2.id) as CHILD_COUNT
FROM ecoli_data AS ecoli1
LEFT JOIN
ecoli_data AS ecoli2
ON ecoli1.id = ecoli2.parent_id
GROUP BY ecoli1.id;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 LEFT JOIN 으로 두 테이블을 연결
- GROUP BY 로 묶어서 집계
- 사용한 함수: COUNT()
