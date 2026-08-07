---
title: "[Programmers] 물고기 종류 별 대어 찾기 - 293261"
author: "kwon_gi_beom"
pubDatetime: 2025-06-12T17:46:21+09:00
description: "어종별 MAX(length) 를 CTE 로 만든 뒤 어종과 길이를 둘 다 조건에 걸어 조인해, 종마다 가장 큰 개체만 남긴다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[물고기 종류 별 대어 찾기](https://school.programmers.co.kr/learn/courses/30/lessons/293261)

# 풀이

## 코드
```sql
WITH max_fish AS (
    SELECT fish_type, MAX(length) AS max_length
    FROM fish_info
    GROUP BY fish_type
)

SELECT fi.id, fni.fish_name, fi.length
FROM fish_info fi
JOIN 
    max_fish mf
    ON fi.fish_type = mf.fish_type AND fi.length = mf.max_length
JOIN 
    fish_name_info fni
    ON fi.fish_type = fni.fish_type
ORDER BY 
    fi.id;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 2회 JOIN 으로 두 테이블을 연결
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬
- 서브쿼리를 사용
- 사용한 함수: MAX()
