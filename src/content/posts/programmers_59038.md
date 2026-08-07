---
title: "[Programmers] 최솟값 구하기 - 59038"
author: "kwon_gi_beom"
pubDatetime: 2025-04-02T23:10:42+09:00
description: "animal_ins 에서 MIN(datetime) 하나만 뽑는다. 가장 먼저 들어온 동물의 보호 시작 시각."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[최솟값 구하기](https://school.programmers.co.kr/learn/courses/30/lessons/59038)

# 풀이

## 코드
```sql
SELECT MIN(datetime) AS 시간
FROM animal_ins
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 사용한 함수: MIN()
