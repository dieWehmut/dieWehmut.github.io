---

title: 中转 Claude Code / Codex 配置
date: 2026-05-18
tags: [APIKey, Codex, Claude, Deepseek, AgentRouter, OpenAI,Anthropic]
---

## Claude Code配置目录

```bash
~/.claude/settings.json
```

## Codex配置目录

```bash
~/.codex/auth.json
```

```bash
~/.codex/config.toml
```

## 安装

### 一键安装

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

### 无法连接外网的情况

#### npm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

```bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
```

```bash
nvm install --lts
nvm use --lts
```

```bash
npm install -g @openai/codex
```

```bash
npm install -g @anthropic/claude
```

## 官方

```auth.json
{
  "OPENAI_API_KEY": "sk-xxx"
}
```

## Proxy

### AgentRouter

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://agentrouter.org",
    "ANTHROPIC_API_KEY": "sk-xx"
  },
  "model": "claude-opus-4-7",
  "effortLevel": "max"
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
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_CODE_SUBAGENT_MODEL": "deepseek-v4-pro[1m]",
    "ANTHROPIC_CODE_EFFORT_LEVEL": "max"
  },
  "model": "deepseek-v4-pro[1m]",
  "effortLevel": "xhigh"
}
```

### 自建中转

### Sub2api

### CodexManager

```toml
model = "gpt-5.5"

model_provider = "cm"

review_model = "gpt-5.5"

personality = "none"

model_reasoning_effort = "xhigh"

plan_mode_reasoning_effort = "xhigh"

model_reasoning_summary = "detailed"

model_verbosity = "high"

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
