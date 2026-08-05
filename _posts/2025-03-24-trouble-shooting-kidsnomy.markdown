---
title: "[Troubleshooting] jenkins에서 git pull 사용시 발생하는 문제"
author: kwon
date: 2025-03-24T23:00:00 +0900
categories: [troubleshooting]
tags: [jenkins]
math: true
mermaid: false
---

# 🚫 현상

```jsx
...
+ git pull

remote: HTTP Basic: Access denied. If a password was provided for Git authentication, the password was incorrect or you're required to use a token instead of a password. If a token was provided, it was either incorrect, expired, or improperly scoped. See https://lab.ssafy.com/help/topics/git/troubleshooting_git.md#error-on-git-fetch-http-basic-access-denied
...
```
---


# 💡원인

- git pull을 시도할 경우 잘못된 인증이 진행될 가능성이 높다
    - **`git pull`은 불필요하고 잘못된 인증을 사용합니다:** 초기 `checkout` 단계에서 *이미* 최신 변경 사항을 가져오기 때문에 `git pull`은 중복됩니다. 더 중요한 것은 `git pull`이 일반 `sh` 단계 내에서 실행되기 때문에 Jenkins가 초기 `checkout`을 위해 설정한 자격 증명을 *상속하지 않는다*는 것입니다. Jenkins는 *체크아웃 작업에 대해서만* Git 클라이언트를 구성하며, 전체 빌드에 대해 전역적으로 구성하지 않습니다. 따라서 `git pull` 명령은 자격 증명 없이 (또는 잘못된 자격 증명으로) 인증을 시도하여 "HTTP Basic: Access denied" 오류가 발생합니다. `withCredentials`를 사용하더라도 `cd repo` 때문에 git 명령이 잘못된 컨텍스트에서 실행됩니다.
---


# 🛠 해결책

- jenkins 내장 checkout을 사용하는 것이 안전하다.
    
    ```groovy
    ...
    		stages {
            stage('Checkout Code') {
                steps {
                    // 내장 checkout 단계를 사용합니다. Jenkins가 모든 것을 처리하도록 합니다.
                    checkout([$class: 'GitSCM',
                              branches: [[name: '*/release']], // 또는 '*/main' 등
                              extensions: [],
                              userRemoteConfigs: [[credentialsId: 'gitlab-token',
                                                   url: 'gitlab-url']]])
                }
            }
    ...
    ```
---


# 🤔 회고

- pull이 인증 관련 문제를 일으킬 수 있다는 것을 알게 되었다.
- 웬만하면 framework 내장 기능을 사용하자
---


# 📚 Reference
