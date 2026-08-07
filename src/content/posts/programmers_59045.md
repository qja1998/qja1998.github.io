---
title: "[Programmers] 보호소에서 중성화한 동물 - 59045"
author: "kwon_gi_beom"
pubDatetime: 2025-04-14T17:01:44+09:00
description: "입소 때 Intact 였다가 퇴소 때 Spayed/Neutered 로 바뀐 행을 REGEXP 로 매칭해 보호소에서 중성화된 동물을 찾는다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[보호소에서 중성화한 동물](https://school.programmers.co.kr/learn/courses/30/lessons/59045)

# 풀이

## 코드
```sql
SELECT ins.animal_id, ins.animal_type, ins.name
FROM animal_ins AS ins
JOIN
animal_outs AS outs
ON ins.animal_id = outs.animal_id
WHERE ins.sex_upon_intake REGEXP 'Intact' 
    AND outs.sex_upon_outcome REGEXP 'Spayed|Neutered'
ORDER BY ins.animal_id
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
