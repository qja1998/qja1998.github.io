---
title: "[Programmers] 없어진 기록 찾기 - 59042"
author: "kwon_gi_beom"
pubDatetime: 2025-03-26T22:06:18+09:00
description: "animal_outs 기준 RIGHT JOIN 후 입양 기록 쪽 키가 NULL 인 행만 남긴다 — 들어온 기록 없이 나간 동물."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[없어진 기록 찾기](https://school.programmers.co.kr/learn/courses/30/lessons/59042)

# 풀이

## 코드
```sql
SELECT outs.animal_id, outs.name
FROM animal_ins AS ins
RIGHT JOIN
animal_outs AS outs
ON ins.animal_id = outs.animal_id
WHERE ins.animal_id IS NULL
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
