---

title: Win服务器控制
date: 2026-06-13
tags: [Windows]
---

## ssh

### 启动ssh-agent

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
```

```powershell
ssh-add C:\path\to\your\private_key
```

>e.g:

```powershell
ssh-add $HOME\.ssh\aws-key1.pem
```

### 清除同ip地址的ssh key冲突

```powershell
ssh-keygen -R ip_address
```