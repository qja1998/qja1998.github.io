---
title: "[Programmers] 조회수가 가장 많은 중고거래 게시판의 첨부파일 조회하기 - 164671"
author: "kwon_gi_beom"
pubDatetime: 2025-07-17T18:20:36+09:00
description: "프로그래머스 '조회수가 가장 많은 중고거래 게시판의 첨부파일 조회하기' (164671번) SQL 문제 풀이와 쿼리 설명."
tags: ["sql"]
categories: ["programmers", "sql"]
---
# 문제
[조회수가 가장 많은 중고거래 게시판의 첨부파일 조회하기](https://school.programmers.co.kr/learn/courses/30/lessons/164671)

# 풀이

## 코드
```sql
SELECT CONCAT('/home/grep/src/', b.board_id, '/', f.file_id, f.file_name, f.file_ext) as file_path
FROM used_goods_board AS b
    JOIN
    used_goods_file AS f
    ON b.board_id = f.board_id
WHERE b.views = (SELECT MAX(views) FROM used_goods_board)
ORDER BY f.file_id DESC;
```

## 설명

문제에서 요구한 결과를 만들기 위해 쿼리에서 실제로 쓴 것들이다.

- 테이블 1회 JOIN 으로 두 테이블을 연결
- WHERE 로 조건에 맞는 행만 남김
- ORDER BY 로 정렬 (내림차순 포함)
- 서브쿼리를 사용
- 사용한 함수: CONCAT(), MAX()
