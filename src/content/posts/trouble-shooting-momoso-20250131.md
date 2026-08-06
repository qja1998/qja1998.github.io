---
title: "[Troubleshooting] pem 키로 ssh 접근 시 권한 문제가 발생하는 경우"
author: "kwon_gi_beom"
pubDatetime: 2025-01-31T23:00:00+09:00
description: "pem 키로 ssh 접근 시 권한 문제가 발생하는 경우 문제를 만난 상황과 해결 과정 기록."
tags: ["ssh", "aws"]
categories: ["troubleshooting"]
---
# 🚫 현상

- pem키를 사용하여 ssh 접근 시 다음과 같이 에러가 발생
    
    ```bash
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    @         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
    @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
    Permissions 0644 for 'amazonec2.pem' are too open.
    It is recommended that your private key files are NOT accessible by others.
    This private key will be ignored.
    bad permissions: ignore key: amazonec2.pem
    Permission denied (publickey).
    ```
---


# 💡원인

- pem 파일에 너무 많은 권한이 부여되어 보안 상 AWS에서 거부한 것
---


# 🛠 해결책

- 읽기만 가능하도록 접근 권한을 바꿔줘야 한다.
    
    ```bash
    # unix 기반
    chmod 400 key.pem
    
    # windows
    icacls.exe key.pem /reset
    icacls.exe key.pem /grant:r %username%:(R)
    icacls.exe key.pem /inheritance:r
    ```
---


# 🤔 회고

- 키를 저장하고 있는 파일의 권한에 따라 접근이 거부될 줄은 몰랐다. 생각해보니 너무 많은 권한이 키에 있을 경우 상당히 위험할 수 있겠다는 생각이 들어 수긍하였다.
---


# 📚 Reference

- [https://dabid.tistory.com/11](https://dabid.tistory.com/11)