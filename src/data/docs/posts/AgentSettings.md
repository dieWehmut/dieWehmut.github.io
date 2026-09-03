---

title: Agent配置
date: 2026-05-18
tags: [APIKey, Codex, Claude, Opencode,Hermes,Deepseek, AgentRouter, OpenAI,Anthropic]
---

## Codex

```bash
~/.codex/auth.json
```

```bash
~/.codex/config.toml
```

```config.toml
model_provider = "deepseek"
model = "deepseek-v4-flash"
review_model = "deepseek-v4-flash"
model_reasoning_effort = "max"
disable_response_storage = true
network_access = "enabled"
windows_wsl_setup_acknowledged = true
approvals_reviewer = "user"
plan_mode_reasoning_effort = "ultra"
service_tier = "default"
model_catalog_json = "~/.codex/models.json"
preferred_auth_method = "apikey"
forced_login_method = "api"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.example.com/v1"
wire_api = "responses"
requires_openai_auth = true
experimental_bearer_token = "sk-xx"

[features]
goals = true

[tui]
status_line = ["current-dir", "model",  "reasoning", "permissions", "fast-mode","task-progress"]
status_line_use_colors = false

[tui.model_availability_nux]
"gpt-5.6-sol" = 4

[windows]
sandbox = "elevated"

[notice]
hide_full_access_warning = true
hide_rate_limit_model_nudge = true
```

## Claude

```bash
~/.claude/settings.json
```

```settings.json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.example.com",
    "ANTHROPIC_API_KEY": "sk-xx"
  },
  "model": "claude-opus-5",
  "effortLevel": "max"
}
```

## Opencode

```bash
~/.config/opencode/opencode.jsonc
```

```opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "agentrouter": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "AgentRouter (OpenAI Compatible)",
      "options": {
        "baseURL": "https://api.example.com/v1",
        "apiKey": "sk-xx"
      },
      "models": {
        "gpt-5.5": {
          "name": "gpt5.5"
        }
      }
    }
  },
  "model": "agentrouter/gpt5.5"
}
```

## Agent安装

### 一键安装

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

```bash
curl -fsSL https://opencode.ai/install | bash
```

```bash

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
npm install -g @anthropic-ai/claude-code@latest
```

```bash
npm install -g opencode-ai
```