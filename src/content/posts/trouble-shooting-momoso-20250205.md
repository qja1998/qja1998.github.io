---
title: "[Troubleshooting] docker 빌드 중 npm install 의존성 충돌"
author: "kwon_gi_beom"
pubDatetime: 2025-02-05T23:00:00+09:00
description: "컨테이너에서 npm install 이 실패. webpack-cli 5 는 webpack 5 를 요구하는데 프로젝트가 webpack 4 를 쓰고 있던 의존성 충돌이라 webpack 을 5 로 올렸다."
tags: ["gitlab-ci-cd", "docker"]
categories: ["troubleshooting"]
---
# 🚫 현상

- docker container 상에서 `npm install`을 했을 때 의존성 충돌 문제 발생
    
    ```bash
     > [frontend 4/5] RUN npm install:
    11.95 npm error code ERESOLVE
    11.95 npm error ERESOLVE unable to resolve dependency tree
    11.95 npm error
    11.95 npm error While resolving: ssafy-vue@0.1.0
    11.95 npm error Found: webpack@4.47.0
    11.95 npm error node_modules/webpack
    11.95 npm error   dev webpack@"^4.46.0" from the root project
    11.95 npm error
    11.95 npm error Could not resolve dependency:
    11.95 npm error peer webpack@"5.x.x" from webpack-cli@5.1.4
    11.95 npm error node_modules/webpack-cli
    11.95 npm error   dev webpack-cli@"^5.1.4" from the root project
    11.95 npm error
    11.95 npm error Fix the upstream dependency conflict, or retry
    11.95 npm error this command with --force or --legacy-peer-deps
    11.95 npm error to accept an incorrect (and potentially broken) dependency resolution.
    11.95 npm error
    11.95 npm error
    11.95 npm error For a full report see:
    11.95 npm error /root/.npm/_logs/2025-02-04T16_58_55_692Z-eresolve-report.txt
    11.96 npm notice
    11.96 npm notice New major version of npm available! 10.8.2 -> 11.1.0
    11.96 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.1.0
    11.96 npm notice To update run: npm install -g npm@11.1.0
    11.96 npm notice
    11.96 npm error A complete log of this run can be found in: /root/.npm/_logs/2025-02-04T16_58_55_692Z-debug-0.log
    ------
    failed to solve: process "/bin/sh -c npm install" did not complete successfully: exit code: 1
    ```
---


# 💡원인

- `webpack@4.47.0`과 `webpack-cli@5.1.4` 간의 의존성 충돌 문제이다. `webpack-cli@5.x.x`는 `webpack@5.x.x`를 필요로 하지만, 현재 프로젝트에서는 `webpack@4.47.0`이 사용되고 있기 때문.
---


# 🛠 해결책

- 일단 webpack의 버전을 5로 올려줬다.
    
    ```bash
    npm install webpack@5 --save-dev
    ```
    
- 추후에 front 담당자와 확실히 정하면 될 거 같다.
---


# 🤔 회고


---


# 📚 Reference