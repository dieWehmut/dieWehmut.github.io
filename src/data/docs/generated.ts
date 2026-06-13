export type GeneratedDocMeta = {
  id: string
  type: 'post' | 'note'
  title: string
  date: string
  tags: string[]
  summary: string
  wordCount: number
  readingMinutes: number
  updated: string
  path: string
}

export const generatedDocMeta: GeneratedDocMeta[] = [
  {
    "id": "testSandkasten",
    "type": "post",
    "title": "Sandkasten 测试",
    "date": "2026-06-13",
    "tags": [
      "sandkasten"
    ],
    "summary": "Sandkasten 测试 本文测试 Sandkasten 后端支持的全部语言 / 运行时。 系统 / 底层 Go Assembly (GAS x86-64) C C++ Rust Zig V Nim Pascal (Free Pas...",
    "wordCount": 440,
    "readingMinutes": 2,
    "updated": "2026/06/13 17:31",
    "path": "./posts/testSandkasten.md"
  },
  {
    "id": "pve",
    "type": "post",
    "title": "Proxmox VE 初始化配置",
    "date": "2026-06-09",
    "tags": [
      "Proxmox VE"
    ],
    "summary": "安装基本依赖 e.g:curl, git, unzip,wget, etc. Git PVE LXC扩容 允许ssh root密码登录 PermitRootLogin yes LXC初始化 Nginx CF Tunnel",
    "wordCount": 169,
    "readingMinutes": 1,
    "updated": "2026/06/11 19:41",
    "path": "./posts/pve.md"
  },
  {
    "id": "ai-api",
    "type": "post",
    "title": "中转 Claude Code / Codex 配置",
    "date": "2026-05-18",
    "tags": [
      "APIKey",
      "Codex",
      "Claude",
      "Deepseek",
      "AgentRouter",
      "OpenAI",
      "Anthropic"
    ],
    "summary": "Claude Code配置目录 Codex配置目录 安装 Codex Claude Code 官方 Proxy AgentRouter Deepseek Anthropic 自建中转 Sub2api CodexManager",
    "wordCount": 268,
    "readingMinutes": 1,
    "updated": "2026/06/11 19:41",
    "path": "./posts/ai-api.md"
  },
  {
    "id": "go-learning",
    "type": "post",
    "title": "Go Golang",
    "date": "2026/01/20 - 2026/03/02",
    "tags": [
      "Golang"
    ],
    "summary": "2026-01-20 | Tuesday 好几个月前就配了环境，也ai写了点调ai的api的代码测试，今天开始系统了解和学习go语言 **初步认识:** go像cpp那样有{}，又像python那样没有\";\" 大小写就能区分publi...",
    "wordCount": 5527,
    "readingMinutes": 14,
    "updated": "2026/06/10 13:07",
    "path": "./posts/go-learning.md"
  },
  {
    "id": "calculus-notes",
    "type": "note",
    "title": "Calculus Notes",
    "date": "2025-11-06",
    "tags": [
      "Calculus",
      "Notes"
    ],
    "summary": "极限定义与收敛/发散 数列极限： \\( \\forall \\varepsilon>0,\\ \\exists N\\in\\mathbb N,\\ \\forall n>N,\\ |x_n-A| 0,\\ \\exists N\\in\\mathbb N,\\ \\forall m,n>N,\\ |x_m-x_n| 0,\\ \\exists\\delta>0,\\ 0 0,\\ \\exists K>0,\\ |x|>K\\Rightarrow |f(x)-A| 0,\\ \\exists N,\\ n>N\\Rightarrow x_n>G \\)...",
    "wordCount": 9155,
    "readingMinutes": 23,
    "updated": "2026/06/08 21:06",
    "path": "./notes/calculus-notes.md"
  },
  {
    "id": "linear-algebra-notes",
    "type": "note",
    "title": "Linear Algebra Notes",
    "date": "2025-11-06",
    "tags": [
      "LinearAlgebra",
      "Notes"
    ],
    "summary": "全章导图 行列式的求解与性质 行列式可以按排列定义（$n$ 阶行列式共 $n!$ 项，每项取自不同行不同列）： \\(D_n=\\sum_{s_1s_2\\cdots s_n}(-1)^{\\tau(s_1s_2\\cdots s_n)}a_{1s_1}a_{2s_2}\\cdots a_{ns_n}\\)...",
    "wordCount": 4786,
    "readingMinutes": 12,
    "updated": "2026/06/08 21:06",
    "path": "./notes/linear-algebra-notes.md"
  },
  {
    "id": "chemistry-notes",
    "type": "note",
    "title": "High School Chemistry Notes Summary",
    "date": "2024-06-09",
    "tags": [
      "Chemistry",
      "Notes"
    ],
    "summary": "化学做题总原则（优先检查有无遗漏，错的多想几种可能） 化学题要有\"透过现象看本质\"的意识，每做完一步都要回头检查有没有遗漏。 **一、守恒观**：原子守恒、电荷守恒、电子得失守恒。 方程式 → 1. 判断正误；2. 书写。 实验现象...",
    "wordCount": 4896,
    "readingMinutes": 13,
    "updated": "2026/06/08 21:06",
    "path": "./notes/chemistry-notes.md"
  },
  {
    "id": "physics-notes",
    "type": "note",
    "title": "High School Physics Notes Summary",
    "date": "2024-06-08",
    "tags": [
      "Physics",
      "Notes"
    ],
    "summary": "物理题的基本分析框架 物理题三步走：读题、画图、列式。读题要圈出已知量、待求量、关键词；画图要标方向、标符号、标坐标系；列式要先写普适方程再代入数值。 分析题目的五个抓手： 题设条件：什么物体、什么过程、什么状态。 正方向选择：选定后...",
    "wordCount": 15480,
    "readingMinutes": 39,
    "updated": "2026/06/08 23:19",
    "path": "./notes/physics-notes.md"
  },
  {
    "id": "maths-notes",
    "type": "note",
    "title": "High School Maths Notes Summary",
    "date": "2024-06-07",
    "tags": [
      "Maths",
      "Notes"
    ],
    "summary": "审题与总策略 拿到题先审题：圈出\"必要\"与\"非必要\"条件，把已知量、未知量、隐含条件分别列清楚。 重要题要多次回看题干，避免漏读\"非负\"\"整数\"\"恰好\"等关键限定词。 分类讨论要看清动参数 / 动点的范围，尤其端点取等、空集、判别式为...",
    "wordCount": 19290,
    "readingMinutes": 49,
    "updated": "2026/06/08 21:06",
    "path": "./notes/maths-notes.md"
  }
] as GeneratedDocMeta[]

export default generatedDocMeta
