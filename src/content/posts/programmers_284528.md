---
title: "[Programmers] 연간 평가점수에 해당하는 평가 등급 및 성과금 조회하기 - 284528"
author: "kwon_gi_beom"
pubDatetime: 2025-07-03T17:33:50+09:00
description: "CTE 에서 사원별 평균 점수를 CASE 로 S·A·B·C 등급으로 바꾸고, 바깥에서 등급별 지급률을 다시 CASE 로 적용해 성과금을 구한다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[연간 평가점수에 해당하는 평가 등급 및 성과금 조회하기](https://school.programmers.co.kr/learn/courses/30/lessons/284528)

# 풀이

## 코드
```sql
-- 사번, 성명, 평가 등급, 성과금
-- 부서 정보
-- 사원 정보
-- 사원 평가 정보
WITH avg_emp AS (
    SELECT he.emp_no, he.emp_name, he.sal,
        CASE
            WHEN AVG(hg.score) >= 96 THEN 'S'
            WHEN AVG(hg.score) >= 90 THEN 'A'
            WHEN AVG(hg.score) >= 80 THEN 'B'
            ELSE 'C'
    END AS grade
    FROM hr_employees AS he
        LEFT JOIN
        hr_grade AS hg
        ON he.emp_no = hg.emp_no
    GROUP BY he.emp_no
)

SELECT emp_no, emp_name, grade,
    CASE
        WHEN grade = 'S' THEN sal * 0.2
        WHEN grade = 'A' THEN sal * 0.15
        WHEN grade = 'B' THEN sal * 0.1
        WHEN grade = 'C' THEN 0
        ELSE NULL
    END AS bonus
FROM avg_emp
ORDER BY emp_no
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 LEFT JOIN 으로 두 테이블을 연결
- GROUP BY 로 묶어서 집계
- ORDER BY 로 정렬
- 서브쿼리를 사용
- CASE WHEN 으로 조건에 따라 값을 분기
- 사용한 함수: AVG()
