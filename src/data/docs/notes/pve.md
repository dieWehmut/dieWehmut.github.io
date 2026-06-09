---

title: Proxmox VE 初始化配置
date: 2026-06-09
tags: [Proxmox VE]
---

## PVE

### LXC扩容

```bash
pct resize <CTID> rootfs +20G
```

###

## 允许ssh root密码登录

```bash
nano /etc/ssh/sshd_config
```

>PermitRootLogin yes

```bash
systemctl restart ssh
```



## LXC初始化

