---
title: "[Programmers] 부모의 형질을 모두 가지는 대장균 찾기 - 301647"
author: "kwon_gi_beom"
pubDatetime: 2025-03-02T22:51:12+09:00
description: "자기 조인으로 부모 행을 붙이고 `A.GENOTYPE & B.GENOTYPE = B.GENOTYPE` 비트 연산으로 부모 형질을 모두 포함하는지 판정한다."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[부모의 형질을 모두 가지는 대장균 찾기](https://school.programmers.co.kr/learn/courses/30/lessons/301647)

# 풀이

## 코드
```sql
SELECT A.ID, A.GENOTYPE, B.GENOTYPE AS PARENT_GENOTYPE
FROM ECOLI_DATA A, ECOLI_DATA B
WHERE A.PARENT_ID = B.ID AND A.GENOTYPE & B.GENOTYPE = B.GENOTYPE
ORDER BY ID
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬
