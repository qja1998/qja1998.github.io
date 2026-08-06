---
title: "[Troubleshooting] docker 상에서 redis가 정상적으로 연결되지 않는 문제"
author: "kwon_gi_beom"
pubDatetime: 2025-02-16T23:01:00+09:00
description: "docker 상에서 redis가 정상적으로 연결되지 않는 문제 문제를 만난 상황과 해결 과정 기록."
tags: ["docker", "redis"]
categories: ["troubleshooting"]
---
# 🚫 현상

```bash
...
dev-backend   |     connection.connect()
dev-backend   |     ~~~~~~~~~~~~~~~~~~^^
dev-backend   |   File "/usr/local/lib/python3.13/site-packages/redis/connection.py", line 363, in connect
dev-backend   |     raise ConnectionError(self._error_message(e))
dev-backend   | redis.exceptions.ConnectionError: Error 111 connecting to 127.0.0.1:6379. Connection refused.
```
---


# 💡원인

- redis가 docker에 제대로 연결되지 않아 발생하는 문제
    - `127.0.0.1`은 local에서 사용하는 것이므로 docker에 맞게 바꿔줄 필요가 있음
---


# 🛠 해결책

```yaml
from redis import Redis
from fastapi import HTTPException
from twilio.rest import Client
import random
import os

# Redis 설정
redis_client = Redis(host=**"redis"**, port=6379, db=0, decode_responses=True)
...
```

- host에 docker container의 이름이 들어가야 합니다.
---


# 🤔 회고


---


# 📚 Reference