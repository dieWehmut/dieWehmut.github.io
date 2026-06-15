---

title: Proxmox VE 初始化配置
date: 2026-06-09
tags: [Proxmox VE]
---

## 安装基本依赖

```bash
apt update && apt upgrade -y
```

```bash
apt install xxx -y
```

>e.g:curl, git, unzip,wget, etc.

```bash
apt install curl git unzip wget -y
```

## Git 登录

```bash
apt install gh -y
```

```bash
gh auth login
```

## PVE

### LXC扩容

```bash
pct resize <CTID> rootfs +20G
```

## 允许ssh root密码登录

```bash
nano /etc/ssh/sshd_config
```

>PermitRootLogin yes

```bash
systemctl restart ssh
```

## LXC初始化

## Nginx

```bash
apt update
apt install -y nginx
```

```bash
cd /etc/nginx/sites-available
```

```bash
server { 
    listen 80;
    server_name codex.* ai.*;
    location / {
        proxy_pass http://192.168.xx.xx:xxxx; 
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
ln -s /etc/nginx/sites-available/xxx /etc/nginx/sites-enabled/
```

```bash
nginx -t
systemctl restart nginx
```

## CF Tunnel

```bash
cd /etc/cloudflared
```

```bash
systemctl start cloudflared
```
