---

title: 中转 Claude Code / Codex 配置
date: 2026-05-18
tags: [API, Codex, Claude, Deepseek, AgentRouter, OpenAI]
---

## Claude Code配置目录

### Ubuntu/Debian

```bash
~/.claude/settings.json
```

### Windows

```Powershell
C:\Users\你的用户名\.claude\settings.json
```

## Codex配置目录

### Ubuntu / Debian

```bash
~/.codex/config.toml
~/.codex/auth.json
```

### Windows

```powershell
C:\Users\你的用户名\.codex\config.toml
C:\Users\你的用户名\.codex\auth.json
```

## Proxy

### AgentRouter

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://agentrouter.org",
    "ANTHROPIC_AUTH_TOKEN": "sk-xx",
    "ANTHROPIC_API_KEY": "sk-xx"
  },
  "model": "opus[1m]"
}
```

### Deepseek Anthropic

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",

    "ANTHROPIC_AUTH_TOKEN": "sk-xx",
    "ANTHROPIC_API_KEY": "sk-xx",

    "ANTHROPIC_MODEL": "deepseek-v4-pro[1m]",

    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-flash",

    "ANTHROPIC_CODE_SUBAGENT_MODEL": "deepseek-v4-flash",
    "ANTHROPIC_CODE_EFFORT_LEVEL": "max"
  },

  "model": "deepseek-v4-pro[1m]",
  "effortLevel": "high"
}
```

### 自建CodexManager

```toml
model = "gpt-5.5"

model_provider = "cm"

review_model = "gpt-5.3-codex"

personality = "none"

model_reasoning_effort = "xhigh"

plan_mode_reasoning_effort = "medium"

model_reasoning_summary = "detailed"

model_verbosity = "medium"

model_supports_reasoning_summaries = true

allow_login_shell = true

sandbox_mode = "workspace-write"

cli_auth_credentials_store = "file"

chatgpt_base_url = "https://chatgpt.com/backend-api/"

mcp_oauth_credentials_store = "auto"

check_for_update_on_startup = true

web_search = "live"

approvals_reviewer = "user"

[model_providers.cm]

approval_policy = "on-request"

web_search = "live"

name = "OpenAI"

base_url = "https://your-api.example.com"

wire_api = "responses"
```

```json
{
  "OPENAI_API_KEY": "sk-xx",
  "auth_mode": "apikey"
}
```
