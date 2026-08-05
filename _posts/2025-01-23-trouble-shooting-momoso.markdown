---
title: "[Troubleshooting] docker 안에서 gitlab-runner exec가 작동하지 않는 문제"
author: kwon
date: 2025-01-23T23:00:00 +0900
categories: [troubleshooting]
tags: [gitlab-ci-cd, docker]
math: true
mermaid: false
permalink: /posts/trouble-shooting-momoso-20250123/
---

# 🚫 현상

```bash
/ # gitlab-runner exec shell build
Runtime platform                                    arch=amd64 os=linux pid=139 revision=66a723c3 version=17.5.0
FATAL: Command exec not found.
```
---


# 💡원인

- gitlab-runner의 버전이 `v17`  이상인 경우 exec가 안되는 경우가 있다고 한다.

---


# 🛠 해결책
- gitlab-runner의 버전을 `v16.10.0`으로 내렸다.
    
    ```yaml
    services:
      gitlab-runner:
        image: gitlab/gitlab-runner:v16.10.0
        container_name: gitlab_runner
        restart: always
        volumes:
          - ./gitlab-runner/config:/etc/gitlab-runner
          - /var/run/docker.sock:/var/run/docker.sock
          - ./entrypoint.sh:/entrypoint.sh
        environment:
          - RUNNER_NAME=my-runner
          - TZ=Asia/Seoul
          - CI_SERVER_URL=${CI_SERVER_URL}
          - REGISTRATION_TOKEN=${REGISTRATION_TOKEN}
          - RUNNER_EXECUTOR=${RUNNER_EXECUTOR}
        ports:
          - "9252:9252"
        entrypoint: ["tail", "-f", "dev/null"]
    ```
    
    아래와 같이 잘 작동하는 것을 확인
    
    ```bash
    # gitlab-runner exec
    Runtime platform                                    arch=amd64 os=linux pid=13 revision=81ab07f6 version=16.10.0
    NAME:
       gitlab-runner exec - execute a build locally
    
    USAGE:
       gitlab-runner exec command [command options] [arguments...]
    
    COMMANDS:
       virtualbox      use virtualbox executor
       docker-windows  use docker-windows executor
       docker+machine  use docker+machine executor
       custom          use custom executor
       parallels       use parallels executor
       docker          use docker executor
       kubernetes      use kubernetes executor
       shell           use shell executor
       ssh             use ssh executor
    
    OPTIONS:
       --help, -h  show help
    ```

---


# 🤔 회고

- 버전 억까가 있을 경우 gpt가 잘 해결하지 못한다. 버전 문제가 의심된다면 구글링을 통해 비슷한 경우가 있는지 살펴보자.

---


# 📚 Reference
- [https://gitlab.com/gitlab-org/gitlab-runner/-/issues/37523](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/37523)