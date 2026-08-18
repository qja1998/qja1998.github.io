---
title: About
description: 권기범(qja1998) — AI 엔지니어. 만든 것, 푼 문제, 그리고 이 블로그에 쌓아 온 기록.
---

권기범입니다. GitHub에서는 [qja1998](https://github.com/qja1998)을 씁니다.

[Cutback](https://github.com/CutbackVideo)에서 AI 엔지니어로 일합니다.
영상 편집 도구에 들어가는 에이전트와 파이프라인을 다룹니다.

읽고 이해한 것은 시간이 지나면 흐려지는데, 직접 정리해 본 것은 오래 남았습니다.
그래서 배운 내용을 다시 설명해 보는 자리로 이 블로그를 씁니다.

## 관심 있는 것

- LLM 에이전트 구조 — 도구 연결(MCP), 컨텍스트 관리, 여러 에이전트의 협업
- 비용을 의식한 설계 — 값싼 모델이 초안을 만들고 비싼 모델이 검증하는 식의 라우팅
- 오픈소스와 셀프호스팅 — 상용 API를 대체할 수 있는 지점 찾기
- 컴퓨터 비전, 특히 영상에 적용되는 쪽

## 일하면서 배운 것

구체적인 업무 내용은 적을 수 없지만, 거기서 얻은 판단 기준은 남겨 둡니다.
대부분 제가 틀렸던 자리에서 나온 것들입니다.

**규칙은 더하는 것보다 빼는 편이 나을 때가 많다.**
잘못된 출력을 후처리 규칙으로 덮다 보면 규칙 자체가 새로운 실패 모드가 됩니다.
보정 로직을 걷어냈더니 오히려 성능이 올라가는 경우를 여러 번 봤습니다.
"이 예외 케이스만 처리하면 된다"는 생각이 들면 한 번 의심해 봅니다.

**버그는 고치기 전에 먼저 재현 테스트로 바꾼다.**
실패하는 테스트를 먼저 쓰고 그다음에 고칩니다.
이렇게 하면 고쳤다고 착각하는 일이 줄고, 같은 버그가 돌아왔을 때 바로 잡힙니다.

**"좋아진 것 같다"는 판정이 아니다.**
가설을 세우고, 지표를 정하고, 수치로 답합니다.
실패를 뭉뚱그리지 않고 종류별로 나누는 것도 중요했습니다 —
기준이 조금 어긋난 것과 아예 틀린 것은 원인도 해법도 다릅니다.

**파이프라인은 실패가 어디서 나는지 보이게 쪼갠다.**
한 덩어리로 두면 무엇이 깨졌는지 알 수 없습니다.
단계를 나누면 느려 보여도 결국 빨리 고칩니다.

**비용은 나중에 붙이는 제약이 아니라 설계 변수다.**
값싼 모델이 초안을 만들고 비싼 모델이 검증하는 구조를 즐겨 씁니다.
전부 최고 성능으로 돌리는 설계는 대개 필요하지 않았습니다.

**모델에게 돌려 묻지 않는다.**
알고 싶은 것을 에둘러 묻는 프롬프트보다 그대로 묻는 프롬프트가 잘 동작했습니다.

## 만든 것

공개된 저장소 기준입니다. 실험으로 끝난 것도 그대로 적었습니다.

### 에이전트 · LLM

| 저장소 | 무엇 |
|---|---|
| [deepagent](https://github.com/qja1998/deepagent) | LangChain DeepAgent와 MCP로 코딩 에이전트를 만들어 본 것. 코드 인덱싱·컨텍스트·상태 관리를 분리해 구성 |
| [github_mcp](https://github.com/qja1998/github_mcp) | GitHub을 다루는 MCP 서버와 그것을 쓰는 에이전트 실험 |
| [nunuDream_rag](https://github.com/qja1998/nunuDream_rag) | CLOVA Studio 기반 RAG 챗봇 |
| [MoMoSo](https://github.com/qja1998/MoMoSo) | AI로 소설을 생성하고 그 소설을 토론하는 서비스. SSAFY 12기 공통 프로젝트 |

### 데이터 · 머신러닝

| 저장소 | 무엇 |
|---|---|
| [2024_ai_factory_satellite](https://github.com/qja1998/2024_ai_factory_satellite) | 위성 영상 세그멘테이션. RLE 디코딩과 증강 파이프라인 |
| [co2_forecast](https://github.com/qja1998/co2_forecast) · [co2-emission-management](https://github.com/qja1998/co2-emission-management) | 탄소 배출량 예측 모델과 이를 다루는 Django API + Vue 관리 도구 |
| [dacon](https://github.com/qja1998/dacon) | DACON 대회 참가 기록 (전력, HD 챌린지, 대출등급) |
| [style_transform_with_streamlit](https://github.com/qja1998/style_transform_with_streamlit) | MobileNetV2 기반 Neural Style Transfer를 Streamlit으로 띄운 데모 |
| [pretrain_issue_bert](https://github.com/qja1998/pretrain_issue_bert) | 이슈 텍스트로 BERT를 추가 학습해 본 것 |

### 도구 · 인프라

| 저장소 | 무엇 |
|---|---|
| [algo-study-manager](https://github.com/qja1998/algo-study-manager) | 백준 알고리즘 스터디 그룹 관리 시스템 (TypeScript) |
| [CoyoTe](https://github.com/qja1998/CoyoTe) | 함께 운영한 백준 알고리즘 스터디 그룹 |
| [GitAuto](https://github.com/qja1998/GitAuto) | 교육생용 GitLab 자동 pull/push 도구 |
| [chuibot](https://github.com/qja1998/chuibot) | Django + Vue + PostgreSQL을 도커로 묶은 챗봇 |
| [weave](https://github.com/qja1998/weave) | Jenkins와 docker-compose로 배포 파이프라인을 짜 본 것 |

오픈소스 쪽은 아직 크게 기여한 것이 없습니다.
[imgaug의 NumPy 2.0 호환 문제](https://github.com/aleju/imgaug/issues/859)를 보고한 정도입니다.

## 알고리즘

[solved.ac](https://solved.ac/profile/qja1998) 기준입니다.

| 항목 | 값 |
|---|---|
| 티어 | 플래티넘 V |
| 해결 | 314문제 |
| 클래스 | 5 |
| 최장 연속 | 93일 |

이 블로그의 풀이 글은 109편입니다. 백준 77편(골드 32 · 실버 41 · 브론즈 4),
프로그래머스 SQL 27편, SWEA 5편.

답을 맞히는 것보다 왜 그 방법을 떠올렸는지를 남기려고 합니다.

## 이 블로그

2022년 2월부터 2025년 10월까지 165편. 태그는 117종입니다.

| 분류 | 편수 | 내용 |
|---|---|---|
| 백준 | 77 | 문제 풀이. 접근 방법과 코드 |
| 프로그래머스 | 27 | SQL 문제. 쿼리를 어떻게 짰는지 |
| PyTorch | 26 | 「모두를 위한 딥러닝」을 따라가며 정리한 실습 |
| 트러블슈팅 | 16 | 막혔던 문제와 그것을 어떻게 풀었는지 |
| Docker | 7 | 컨테이너·네트워크·컴포즈 챕터별 정리 |
| 배경지식 | 6 | 엔트로피, 역전파, 어텐션처럼 따로 파고들어야 했던 개념 |
| SWEA · 생성모델 | 6 | |

가장 많이 쓴 태그는 `implementation`, `sql`, `graph theory`, `graph traversal`, `docker`, `bfs` 순입니다.

홈의 카드 표지에는 **그 글에서 뽑은 낱말 두 개**가 크게 적혀 있습니다.
`오븐 · 반죽`, `토크나이저 · token_type_ids`, `유클리드 호제법 · 최대공약수` 처럼요.
제가 붙인 태그가 아니라, 본문에서 후보를 뽑아 임베딩으로 글 전체와 가장 가까운 말을
고른 것입니다. 그래서 새 주제로 글을 써도 그 글의 말이 그대로 나옵니다.

표지의 **바탕색은 주제**입니다. 의미 공간에서의 방향을 색상으로 옮긴 것이라,
비슷한 글끼리 비슷한 색이 됩니다. 위쪽 분류 칩이 같은 색을 쓰고 있어서 칩 줄이
그대로 범례가 됩니다.

차트도 여러 개 만들어 봤습니다 — 코드 구조 미니맵, 임베딩 막대·파형·방사형,
3차원 도형, 여덟 축 레이더. 전부 "이 둘이 비슷하다"까지는 전하는데
"이게 무슨 글이다"는 전하지 못했습니다. 그건 낱말이 하는 일이었습니다.

계산은 빌드 때 끝나고 벡터는 브라우저로 오지 않습니다.

## 찾아보기

[검색](/search/)으로 글 전체를 찾을 수 있고,
[카테고리](/categories/)와 [태그](/tags/)로도 넘어갈 수 있습니다.
전체 목록은 [아카이브](/archives/)에 있습니다.

## 연락

- GitHub: [qja1998](https://github.com/qja1998)
- Email: qja1998@naver.com
