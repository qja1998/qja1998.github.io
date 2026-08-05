---
title: "gitlab-runner container에서 Command not found가 발생하는 문제"
author: kwon
date: 2025-01-21T23:00:01 +0900
categories: [troubleshooting]
tags: [gitlab-ci-cd, docker]
math: true
mermaid: false
permalink: /posts/trouble-shooting-momoso-20250121-2/
---

# 🚫 현상

- gitlab runner 이미지로 만든 컨테이너에서 `sh`, `bash`, `tail`과 같은 명령어를 사용하려고 할 때 아래와 같은 문제 발생
    
    ```bash
    gitlab_runner   | Runtime platform                                    arch=amd64 os=linux pid=7 revision=782c6ecb version=16.9.1
    gitlab_runner   | FATAL: Command tail not found.  
    ```
    
---

# 💡원인

- ~~왜 됨…?~~

이 문제는 GitLab Runner 컨테이너가 실행될 때 `entrypoint` 스크립트에 의해 예상치 못한 명령어(`tail` 등)가 실행되면서 발생한 오류입니다. 이를 해결하기 위해 `entrypoint: [""]`를 추가하면, 컨테이너의 기본 엔트리포인트 동작이 비활성화되고 직접 지정한 명령어만 실행됩니다.

### 이유와 원리

1. **기본 Entrypoint와 CMD**:
    - Docker 이미지는 보통 `ENTRYPOINT`와 `CMD`를 지정할 수 있습니다.
    - `ENTRYPOINT`는 컨테이너가 실행될 때 무조건 실행되는 스크립트나 명령어를 정의합니다.
    - `CMD`는 `ENTRYPOINT`와 함께 전달될 추가 인자를 정의하거나, `ENTRYPOINT`가 없을 경우 기본 명령어로 사용됩니다.
2. **문제의 원인**:
    - GitLab Runner의 Docker 이미지는 `ENTRYPOINT`로 기본 동작이 정의되어 있습니다. 특정 상황에서는 이 `ENTRYPOINT` 스크립트가 `tail` 명령어를 사용하거나 잘못된 실행 환경을 유발할 수 있습니다.
    - `tail not found`라는 오류는 컨테이너 내부에서 `tail` 명령어를 실행하려 했지만, `tail`이 설치되어 있지 않거나 경로 설정이 올바르지 않은 경우 발생합니다.
3. **`entrypoint: [""]`의 효과**:
    - `entrypoint: [""]`를 추가하면 Docker Compose는 기본 이미지를 사용할 때 지정된 `ENTRYPOINT`를 비활성화합니다.
    - 이로 인해 컨테이너가 실행될 때 `CMD` 또는 `command`에서 지정한 명령만 실행됩니다.

### 해결 방법의 작동 방식

- 기본 `ENTRYPOINT`를 비활성화하면 GitLab Runner 컨테이너가 의존하는 스크립트나 명령이 실행되지 않으므로, 사용자가 명시적으로 지정한 명령만 실행되어 오류를 피할 수 있습니다.

### 주의점

1. `entrypoint: [""]`로 `ENTRYPOINT`를 비활성화했을 때, 컨테이너의 의도된 기본 동작이 실행되지 않을 수 있습니다. 따라서 명령어(`command` 또는 `CMD`를 통해})를 명확히 지정해야 합니다.

---


# 🛠 해결책

- docker-comspose에 `entrypoint: [""]` 를 추가하여 해결
    
    ```yaml
    # docker-compsoe.yml
    ...
      gitlab-runner:
        image: gitlab/gitlab-runner:v16.9.1
        container_name: gitlab_runner
        restart: unless-stopped
        volumes:
          - ./gitlab-runner/config:/etc/gitlab-runner
          - /var/run/docker.sock:/var/run/docker.sock
        environment:
          - TZ=Asia/Seoul
          - CI_SERVER_URL=${CI_SERVER_URL}
          - REGISTRATION_TOKEN=${REGISTRATION_TOKEN}
          - RUNNER_EXECUTOR=${RUNNER_EXECUTOR}     # docker, shell 등
        command: >
          sh -c "
            gitlab-runner register
              --non-interactive
              --url $CI_SERVER_URL
              --registration-token $REGISTRATION_TOKEN
              --executor $RUNNER_EXECUTOR
              --description 'my-docker-runner'
              --tag-list 'docker,fastapi'
              --run-untagged='true'
              --locked='false'
              --access-level='not_protected'
            && gitlab-runner run --working-directory=/home/gitlab-runner
          " 
        entrypoint: [""]
        networks:
          - default
    ...
    ```
---

# 🤔 회고

- 단지 gtilab-ci에 대한 이해가 부족해서 생긴 문제

---
# 📚 Reference

- [https://stackoverflow.com/questions/48945972/gitlab-runner-locally-no-such-command-sh](https://stackoverflow.com/questions/48945972/gitlab-runner-locally-no-such-command-sh)

- [https://docs.gitlab.com/ee/ci/docker/using_docker_images.html#overriding-the-entrypoint-of-an-image](https://docs.gitlab.com/ee/ci/docker/using_docker_images.html#overriding-the-entrypoint-of-an-image)