---
title: "[Programmers] 있었는데요 없었습니다 - 59043"
author: "kwon_gi_beom"
pubDatetime: 2025-04-08T23:40:33+09:00
description: "프로그래머스 '있었는데요 없었습니다' (59043번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[있었는데요 없었습니다](https://school.programmers.co.kr/learn/courses/30/lessons/59043)

# 풀이

## 코드
```sql
SELECT a_in.animal_id, a_in.name
FROM animal_ins AS a_in
JOIN 
animal_outs AS a_out
ON a_in.animal_id = a_out.animal_id
where a_in.datetime > a_out.datetime
ORDER BY a_in.datetime
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
