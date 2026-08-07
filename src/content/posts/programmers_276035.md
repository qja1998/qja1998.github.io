---
title: "[Programmers] FrontEnd 개발자 찾기 - 276035"
author: "kwon_gi_beom"
pubDatetime: 2025-03-11T22:45:37+09:00
description: "스킬코드를 비트마스크로 다룬다. `SKILL_CODE | CODE = SKILL_CODE` 로 프론트엔드 비트가 켜져 있는 개발자만 고른다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[FrontEnd 개발자 찾기](https://school.programmers.co.kr/learn/courses/30/lessons/276035)

# 풀이

## 코드
```sql
SELECT DISTINCT DEVELOPERS.ID, DEVELOPERS.EMAIL, DEVELOPERS.FIRST_NAME, DEVELOPERS.LAST_NAME
FROM DEVELOPERS, (SELECT CODE
                 FROM SKILLCODES
                 WHERE CATEGORY = 'Front End') as FRONTEND
WHERE DEVELOPERS.SKILL_CODE | FRONTEND.CODE = DEVELOPERS.SKILL_CODE
ORDER BY DEVELOPERS.ID

# SELECT DEVELOPERS.SKILL_CODE, FRONTEND.CODE, DEVELOPERS.SKILL_CODE | FRONTEND.CODE
# FROM DEVELOPERS, (SELECT CODE
#                  FROM SKILLCODES
#                  WHERE CATEGORY = 'Front End') as FRONTEND
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
- DISTINCT 로 중복 제거
- 서브쿼리를 사용
