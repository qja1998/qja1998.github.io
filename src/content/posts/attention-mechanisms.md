---
title: "Attention 메커니즘 정리 - Seq2Seq에서 Transformer까지"
author: "kwon_gi_beom"
pubDatetime: 2022-06-11T01:00:00+09:00
description: "Lab11-5에서 Seq2Seq model을 공부하면서 입력 문장 전체를 vector 하나로 압축한다는 점이 계속 걸렸다."
tags: ["attention", "seq2seq", "transformer", "self-attention", "multi-head", "rnn"]
categories: ["background"]
---
### Related Post

1. [모두를 위한 딥러닝 2 - Lab11-5: Seq2Seq](/posts/dlZeroToAll-PyTorch-11-5/)
2. **Attention 메커니즘 정리**

***

Lab11-5에서 Seq2Seq model을 공부하면서 입력 문장 전체를 vector 하나로 압축한다는 점이 계속 걸렸다.
문장이 길어져도 그 vector의 크기는 그대로인데 정보가 다 들어갈 수 있을까 하는 의문이었다.

그 의문을 실제로 지적하고 해결한 것이 attention이고, 그 뒤로 attention은 여러 형태로 갈라졌다.
이 글에서는 attention이 왜 나왔는지부터 시작해서 종류별로 무엇이 다른지를 그림과 함께 정리한다.

***

## 1. 왜 attention이 필요했나

Seq2Seq는 encoder가 입력을 순서대로 읽어 마지막에 context vector $c$ 하나를 만들고, decoder는 그 $c$만 보고 출력을 만든다.

![왜 attention이 필요했나 설명 그림](/posting_imgs/attention-1.svg)

여기서 문제가 하나 생긴다. 입력이 4단어여도 40단어여도 $c$의 크기는 똑같다.
게다가 첫 단어의 정보가 $c$까지 가려면 $h_1 \rightarrow h_2 \rightarrow h_3 \rightarrow h_4$를 전부 거쳐야 한다.

이 문제를 처음 지적한 Bahdanau의 논문은 이렇게 적고 있다.

> A potential issue with this encoder-decoder approach is that a neural network needs to be able to compress all the necessary information of a source sentence into a fixed-length vector. This may make it difficult for the neural network to cope with long sentences.
>
> — Bahdanau et al., *Neural Machine Translation by Jointly Learning to Align and Translate* (2015)

**필요한 정보를 전부 고정 길이 vector에 압축해야 한다**는 것, 그래서 **긴 문장을 다루기 어려워진다**는 것이 핵심이다.

***

## 2. Attention의 기본 아이디어

해결책은 의외로 단순하다. encoder의 hidden state를 마지막 하나만 남기지 말고 **전부 보관해 두었다가**, decoder가 출력을 하나 만들 때마다 **그때그때 필요한 만큼 섞어서 쓰는** 것이다.

![Attention의 기본 아이디어 설명 그림](/posting_imgs/attention-2.svg)

“고프다”라는 단어를 만들 때는 “hungry”에 해당하는 $h_3$를 크게 보고, 나머지는 조금만 본다.
이렇게 하면 decoder 시점마다 서로 다른 context vector $c_1, c_2, c_3, \dots$ 가 만들어진다.

이 과정은 항상 아래 세 단계로 이루어진다. 앞으로 나올 모든 attention이 이 틀을 그대로 따른다.

1. **점수 매기기(score)** - decoder의 상태와 encoder의 상태 하나를 짝지어 “얼마나 맞는지”를 숫자 하나로 만든다.
2. **비율 만들기(softmax)** - 점수들을 softmax에 넣어 전부 더하면 1이 되는 비율로 바꾼다.
3. **섞기(weighted sum)** - 그 비율대로 encoder 상태들을 가중합한다.

수식으로 쓰면 다음과 같다. $i$는 decoder 시점, $j$는 encoder 위치다.

\\[ c_i = \sum_{j=1}^{T_x} \alpha_{ij} h_j \\]

\\[ \alpha_{ij} = \frac{\exp(e_{ij})}{\sum_{k=1}^{T_x} \exp(e_{ik})} \\]

\\[ e_{ij} = a(s_{i-1}, h_j) \\]

여기서 $\alpha_{ij}$가 attention weight, $a$가 점수를 매기는 함수다.
**attention의 종류가 갈리는 지점은 대부분 이 $a$를 어떻게 정하느냐이다.**

$\alpha_{ij}$를 표로 늘어놓으면 어떤 출력 단어가 어떤 입력 단어를 봤는지가 한눈에 보인다. 이것을 alignment matrix라고 부른다.

![Attention의 기본 아이디어 설명 그림 2](/posting_imgs/attention-3.svg)

***

## 3. Bahdanau attention (additive attention)

가장 처음 제안된 방식이다. 점수를 매길 때 작은 신경망을 하나 쓴다.

\\[ e_{ij} = a(s_{i-1}, h_j) = v_a^\top \tanh(W_a s_{i-1} + U_a h_j) \\]

![Bahdanau attention (additive attention) 설명 그림](/posting_imgs/attention-4.svg)

$s_{i-1}$과 $h_j$를 각각 행렬로 변환한 뒤 **더하고**, $\tanh$를 통과시킨 다음, vector $v_a$와 내적해서 숫자 하나로 만든다.
두 vector를 더해서 점수를 낸다고 해서 **additive attention**이라고 부른다.

여기서 짚고 갈 점이 세 가지 있다.

- $W_a$, $U_a$, $v_a$는 미리 정해진 값이 아니라 **번역 모델과 함께 학습되는 파라미터**다. 논문에서는 이 alignment model을 "a feedforward neural network which is jointly trained with all the other components"라고 설명한다.
- encoder는 양방향 RNN을 쓴다. 정방향 상태와 역방향 상태를 이어 붙인 것을 $h_j$로 사용하기 때문에, $h_j$는 $j$번째 단어를 중심으로 앞뒤 문맥을 모두 담는다.
- 점수를 낼 때 쓰는 decoder 상태가 **직전 상태 $s_{i-1}$** 이다. 이 점이 다음에 볼 Luong attention과 갈리는 지점이 된다.

***

## 4. Luong attention

Luong의 논문은 “점수를 꼭 그렇게 복잡하게 매겨야 하는가”를 물으면서 세 가지 방식을 비교했다.
표기는 원 논문을 따라 decoder 상태를 $h_t$, encoder 상태를 $\bar{h}_s$로 쓴다.

\\[ \text{score}(h_t, \bar{h}_s) = \begin{cases} h_t^\top \bar{h}_s & \textit{dot} \\\\ h_t^\top W_a \bar{h}_s & \textit{general} \\\\ v_a^\top \tanh(W_a [h_t ; \bar{h}_s]) & \textit{concat} \end{cases} \\]

![Luong attention 설명 그림](/posting_imgs/attention-5.svg)

- **dot**은 두 vector를 그냥 내적한다. 학습되는 파라미터가 아예 없어서 가장 싸지만, 두 vector가 같은 차원·같은 의미 공간에 있어야 말이 된다.
- **general**은 가운데에 학습되는 행렬 $W_a$를 끼운다. 두 공간이 달라도 맞춰 줄 수 있어서 dot의 자연스러운 일반화다.
- **concat**은 두 vector를 이어 붙여 작은 신경망에 통과시킨다. 3절에서 본 Bahdanau의 방식과 같은 계열이다. 실제로 Luong의 논문은 Bahdanau가 "only experimented with one alignment function, the concat product"라고 정리하고 있다.

점수를 낸 뒤에는 세 방식 모두 똑같이 softmax → 가중합을 거친다.
다만 만들어진 context를 쓰는 방법이 Bahdanau와 다르다.

\\[ \tilde{h}_t = \tanh(W_c [c_t ; h_t]) \\]

context $c_t$와 현재 상태 $h_t$를 이어 붙여 한 번 더 변환한 $\tilde{h}_t$를 만들고, 이것으로 다음 단어를 예측한다.

![Luong attention 설명 그림 2](/posting_imgs/attention-6.svg)

> 위 그림에서 `h_att(t)`로 적은 것이 $\tilde{h}_t$ 이다. 그림에서는 읽기 쉽도록 이름을 풀어 썼다.

두 방식의 차이를 논문의 표현으로 정리하면 이렇다.

- Bahdanau는 $s_{t-1} \rightarrow a_t \rightarrow c_t \rightarrow s_t$ 순서로 계산한다. context가 나와야 이번 시점 상태를 만들 수 있으므로 attention이 decoder RNN **안쪽**에 끼어 있다.
- Luong은 $h_t \rightarrow a_t \rightarrow c_t \rightarrow \tilde{h}_t$ 순서다. 이번 시점 상태를 먼저 만들고 나서 attention을 하므로 RNN **바깥의 후처리**가 된다. 논문은 이를 두고 "our computation path is simpler"라고 적었다.

이 논문에는 두 가지가 더 나온다.

- **global vs local attention** - global은 매 시점 입력 전체를 본다. local은 볼 위치를 하나 정하고 그 주변만 본다. 입력이 길 때 계산을 줄이려는 시도다.
- **input feeding** - 이번 시점에 만든 $\tilde{h}_t$를 다음 시점 입력에 함께 넣어 준다. 지금까지 어디를 봤는지를 모델이 기억하게 하려는 장치다.

***

## 5. Self-attention과 Scaled Dot-Product Attention

지금까지의 attention은 전부 **decoder가 encoder를 보는** 구조였다. 서로 다른 두 문장 사이의 관계를 다룬 것이다.

여기서 질문을 하나 바꿔 볼 수 있다. **한 문장이 자기 자신을 보면 어떻게 될까?**

“그 학생은 배가 고파서 그것을 먹었다”에서 “그것”이 무엇인지 알려면 같은 문장 안의 다른 단어를 봐야 한다.
이렇게 하나의 sequence 안에서 위치끼리 서로를 보는 것이 **self-attention**이다.

### Query, Key, Value

Transformer는 attention을 세 가지 역할로 나눠서 정리했다.

![Query, Key, Value 설명 그림](/posting_imgs/attention-7.svg)

- **Query** - 지금 내가 찾고 있는 것 (질문)
- **Key** - 각 자리에 붙어 있는 이름표 (색인)
- **Value** - 실제로 꺼내 쓸 내용

Query와 Key를 견주어 점수를 내고, 그 점수 비율대로 Value를 섞는다.
앞서 본 “점수 → 비율 → 섞기” 세 단계와 정확히 같은 구조이며, 이름만 정리된 것이다.

이것을 행렬로 한 번에 쓰면 다음과 같다.

\\[ \text{Attention}(Q, K, V) = \text{softmax}\left( \frac{QK^\top}{\sqrt{d_k}} \right) V \\]

Luong의 dot 방식과 뼈대가 같고, 다른 점은 $\sqrt{d_k}$로 나누는 것뿐이다. 그래서 이름이 **Scaled** Dot-Product Attention이다.

### 왜 $\sqrt{d_k}$로 나누는가

논문은 이유를 이렇게 설명한다.

> We suspect that for large values of $d_k$, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients.
>
> — Vaswani et al., *Attention Is All You Need* (2017)

각 성분이 평균 0, 분산 1인 독립 확률변수라고 하면 $q \cdot k = \sum_{i=1}^{d_k} q_i k_i$ 의 분산은 $d_k$가 된다.
$d_k = 64$면 표준편차가 8쯤 되고, 점수들이 그만큼 벌어지면 softmax는 한 칸에 거의 전부를 몰아 준다.

말로만 들으면 잘 와닿지 않아서 직접 계산해 봤다. $d_k = 64$, key 8개로 5000번 뽑아 본 결과다.

![스케일 유무에 따른 softmax 분포 비교](/posting_imgs/attention-8.svg)

| | 스케일 없음 | $\sqrt{d_k}$로 나눔 |
|---|---|---|
| 가장 큰 attention weight의 평균 | 0.879 | 0.361 |
| 한 칸이 0.99를 넘은 비율 | 38.0 % | 0.0 % |
| 기울기 지표 $\sum_i p_i(1-p_i)$ 의 평균 | 0.172 | 0.768 |

스케일을 하지 않으면 10번 중 4번 가까이 한 칸이 0.99 이상을 가져간다.
softmax의 출력이 0 또는 1에 붙으면 $p(1-p)$가 0에 가까워지므로 기울기가 거의 흐르지 않는다. 학습이 진행되지 않는다는 뜻이다.

***

## 6. Multi-Head Attention

attention을 512차원에서 한 번 하는 대신, 64차원짜리로 8번 나눠서 한다.

![Multi-Head Attention 설명 그림](/posting_imgs/attention-9.svg)

\\[ \text{MultiHead}(Q,K,V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) W^O \\]

\\[ \text{head}_i = \text{Attention}(QW_i^Q, KW_i^K, VW_i^V) \\]

head마다 $W_i^Q, W_i^K, W_i^V$를 따로 두기 때문에, head마다 서로 다른 기준으로 점수를 매기게 된다.
논문의 기본 설정은 $h = 8$, $d_{model} = 512$, $d_k = d_v = d_{model} / h = 64$ 이다.

head를 8개로 늘렸는데 계산량이 8배가 되지 않는 이유는 차원을 그만큼 줄였기 때문이다.
논문도 "the total computational cost is similar to that of single-head attention with full dimensionality"라고 적고 있다.

***

## 7. Transformer 안에서 attention이 쓰이는 세 자리

Transformer는 같은 Multi-Head Attention을 세 자리에 쓴다. 계산 방법은 완전히 같고, **Q·K·V를 어디에서 가져오는지**만 다르다.

![Transformer 안에서 attention이 쓰이는 세 자리 설명 그림](/posting_imgs/attention-10.svg)

1. **Encoder self-attention** - Q, K, V 모두 encoder의 이전 층에서 온다. 입력 문장 안에서 단어끼리 서로를 본다.
2. **Decoder masked self-attention** - Q, K, V 모두 decoder의 이전 층에서 오지만, 뒤쪽 자리를 가린다.
3. **Encoder-decoder attention** - Q는 decoder에서, K와 V는 encoder의 출력에서 온다. 2절부터 5절까지 본 Seq2Seq attention이 하던 일과 같은 자리다.

### masking은 어떻게 하는가

decoder는 문장을 앞에서부터 한 단어씩 만든다. 그런데 학습할 때는 정답 문장 전체가 이미 주어져 있으므로, 그냥 두면 아직 만들지 않았어야 할 뒷단어를 미리 보게 된다.

그래서 softmax에 넣기 **전에** 뒤쪽에 해당하는 점수를 $-\infty$로 바꿔 버린다.

![masking은 어떻게 하는가 설명 그림](/posting_imgs/attention-11.svg)

$\exp(-\infty) = 0$ 이므로 가려진 칸의 attention weight는 정확히 0이 되고, 남은 칸끼리만 합이 1이 된다.
논문은 이를 "masking out (setting to $-\infty$) all values in the input of the softmax which correspond to illegal connections"라고 표현한다.

***

## 8. 정리

지금까지 본 것들을 한 표로 모으면 이렇다.

| 종류 | 점수 함수 | Q의 출처 | K, V의 출처 | 출처 논문 |
|---|---|---|---|---|
| Bahdanau (additive) | $v_a^\top \tanh(W_a s_{t-1} + U_a h_j)$ | decoder 직전 상태 | encoder 전체 | Bahdanau et al. (2015) |
| Luong dot | $h_t^\top \bar{h}_s$ | decoder 현재 상태 | encoder 전체 | Luong et al. (2015) |
| Luong general | $h_t^\top W_a \bar{h}_s$ | decoder 현재 상태 | encoder 전체 | Luong et al. (2015) |
| Luong concat | $v_a^\top \tanh(W_a[h_t ; \bar{h}_s])$ | decoder 현재 상태 | encoder 전체 | Luong et al. (2015) |
| Encoder self-attention | $QK^\top / \sqrt{d_k}$ | encoder 이전 층 | encoder 이전 층 | Vaswani et al. (2017) |
| Masked self-attention | $QK^\top / \sqrt{d_k}$ (뒤쪽 $-\infty$) | decoder 이전 층 | decoder 이전 층 | Vaswani et al. (2017) |
| Encoder-decoder attention | $QK^\top / \sqrt{d_k}$ | decoder 이전 층 | encoder 출력 | Vaswani et al. (2017) |

종류는 여러 가지지만 뼈대는 처음부터 끝까지 하나다. **점수를 매기고, softmax로 비율을 만들고, 그 비율로 섞는다.**
달라지는 것은 점수를 어떻게 매기는지, 무엇을 보고 무엇을 가리는지뿐이다.

### 왜 RNN 대신 self-attention을 쓰는가

Transformer 논문은 층 하나를 계산하는 비용을 이렇게 비교했다. $n$은 sequence 길이, $d$는 표현 차원이다.

| Layer Type | 층당 계산 복잡도 | 순차적으로 해야 하는 연산 | 두 위치를 잇는 최대 경로 길이 |
|---|---|---|---|
| Self-Attention | $O(n^2 \cdot d)$ | $O(1)$ | $O(1)$ |
| Recurrent | $O(n \cdot d^2)$ | $O(n)$ | $O(n)$ |
| Convolutional | $O(k \cdot n \cdot d^2)$ | $O(1)$ | $O(\log_k n)$ |

RNN은 앞에서부터 하나씩 계산해야 하므로 순차 연산이 $O(n)$이고, 첫 단어와 마지막 단어를 잇는 경로도 $O(n)$이다.
1절에서 본 병목이 바로 이 긴 경로 때문이었다.

self-attention은 모든 위치가 한 번에 서로를 보므로 두 경로 모두 $O(1)$이다. 순차 의존이 없어 병렬 계산도 가능하다.
대신 층당 계산량이 $n^2$에 비례하므로 문장이 길어질수록 비용이 빠르게 늘어난다. 이 부분은 따로 정리해 볼 만한 주제다.

***

## 참고 자료

- Bahdanau, D., Cho, K., & Bengio, Y. (2015). [Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)
- Luong, M., Pham, H., & Manning, C. D. (2015). [Effective Approaches to Attention-based Neural Machine Translation](https://aclanthology.org/D15-1166/)
- Vaswani, A., et al. (2017). [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
