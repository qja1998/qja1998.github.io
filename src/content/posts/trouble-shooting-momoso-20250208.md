---
title: "[Troubleshooting] SSL 발급 억까 탐방기"
author: "kwon_gi_beom"
pubDatetime: 2025-02-08T23:00:00+09:00
description: "인증서를 받기도 전에 nginx conf 가 listen 443 ssl 을 쓰고 있어 nginx 가 죽었고, 그 탓에 certbot 인증 경로에도 못 붙었다. ssl 지시문을 빼고 먼저 발급받았다."
tags: ["ssl", "docker"]
categories: ["troubleshooting"]
---
# 🚫 현상

1. 처음부터 SSL 사용하는 conf로 nginx를 실행하려고 하니 안됨(당연한 것)
    
    ```bash
    /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
    /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
    /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
    10-listen-on-ipv6-by-default.sh: info: /etc/nginx/conf.d/default.conf is not a file or does not exist
    /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
    /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
    /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
    /docker-entrypoint.sh: Configuration complete; ready for start up
    2025/02/07 15:42:06 [emerg] 1#1: no "ssl_certificate" is defined for the "listen ... ssl" directive in /etc/nginx/conf.d/app.conf:14
    nginx: [emerg] no "ssl_certificate" is defined for the "listen ... ssl" directive in /etc/nginx/conf.d/app.conf:14
    ```
    
2. 인증서 발급을 위한 경로에 접근이 불가능
    
    ```bash
    Saving debug log to /var/log/letsencrypt/letsencrypt.log
    Requesting a certificate for momoso106.duckdns.org
    
    Certbot failed to authenticate some domains (authenticator: webroot). The Certificate Authority reported these problems:
      Domain: momoso106.duckdns.org
      Type:   connection
      Detail: 43.202.64.156: Fetching http://momoso106.duckdns.org/.well-known/acme-challenge/0l6GR-2vhm72SJgBTBK83sLAUCt3sMbVqx-nPwfwRrk: Connection refused
    
    Hint: The Certificate Authority failed to download the temporary challenge files created by Certbot. Ensure that the listed domains serve their content from the provided --webroot-path/-w and that files created there can be downloaded from the internet.
    
    Some challenges have failed.
    Ask for help or search for solutions at https://community.letsencrypt.org. See the logfile /var/log/letsencrypt/letsencrypt.log or re-run Certbot with -v for more details.
    ```
---


# 💡원인

1. `app.conf`가 SSL을 발급 받기 전에 SSL을 사용하려 하고 있음
    
    ```yaml
    server {
        listen 80;
        server_name momoso106.duckdns.org;
    
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    
        location / {
            return 301 https://$host$request_uri;
        }
    }
    
    server {
        listen 443 ssl; // 이게 문제임
        server_name momoso106.duckdns.org;
    
        location / {
            root /app/frontend/build;
            index index.html;
            try_files $uri /index.html;
        }
    
        location /api/ {
            proxy_pass http://backend:8000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }
    
        location /openvidu/ {
            proxy_pass https://openvidu:4443/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_ssl_verify off;
        }
    }
    
    ```

2. directory 직접 만들어보기도 하고 별 짓 다 했는데, 결국 nginx가 1번 이유 때문에 계속 꺼져서 생기던 문제였음

---


# 🛠 해결책

1. `listen 443 ssl`을 지우고 먼저 ssl 인증서를 발급
    
    ```yaml
    server {
        listen 80;
        server_name momoso106.duckdns.org;
    
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
    
        location / {
            return 301 https://$host$request_uri;
        }
    	}
    ```
    
    발급 성공
    
    ```bash
    $ docker run --rm -v $(pwd)/certbot/www:/var/www/certbot -v $(pwd)/certbot/conf:/etc/letsencrypt certbot/certbot certonly --webroot -w /var/www/certbot -d momoso106.duckdns.org --email qja1998@naver.com --agree-tos --no-eff-email
    Saving debug log to /var/log/letsencrypt/letsencrypt.log
    Requesting a certificate for momoso106.duckdns.org
    
    Successfully received certificate.
    Certificate is saved at: /etc/letsencrypt/live/momoso106.duckdns.org/fullchain.pem
    Key is saved at:         /etc/letsencrypt/live/momoso106.duckdns.org/privkey.pem
    This certificate expires on 2025-05-08.
    These files will be updated when the certificate renews.
    NEXT STEPS:
    - The certificate will need to be renewed before it expires. Certbot can automatically renew the certificate in the background, but you may need to take steps to enable that functionality. See https://certbot.org/renewal-setup for instructions.
    
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    If you like Certbot, please consider supporting our work by:
     * Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
     * Donating to EFF:                    https://eff.org/donate-le
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    ```
---


# 🤔 회고

- 오랜만에 느껴보는 역대급 억까
- 천천히 이유를 파악해보자
---


# 📚 Reference

- [https://chatgpt.com/share/67a63056-27e4-8013-8566-54ad57ac11ad](https://chatgpt.com/share/67a63056-27e4-8013-8566-54ad57ac11ad)