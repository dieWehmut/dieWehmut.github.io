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
  codeRunner?: boolean
  path: string
}

export const generatedDocMeta: GeneratedDocMeta[] = [
  {
    "id": "ComputingMethod",
    "type": "note",
    "title": "Computing Method Notes",
    "date": "2026-06-16",
    "tags": [
      "Computing Method",
      "Notes"
    ],
    "summary": "计算方法 (Computing Method) / 数值分析 (Numerical Analysis) / 数值计算 (Numerical Computing)\n一.绪论\n1. 研究对象与特点\n2. 误差来源与分析\n3. 误差的基本概...",
    "wordCount": 46098,
    "readingMinutes": 116,
    "updated": "",
    "path": "./notes/ComputingMethod.md"
  },
  {
    "id": "TestSandkasten",
    "type": "post",
    "title": "Sandkasten 测试",
    "date": "2026-06-13",
    "tags": [
      "sandkasten",
      "Code"
    ],
    "summary": "Sandkasten 测试\n本文测试 Sandkasten 后端支持的全部语言 / 运行时。程序语言代码块用于运行；HTML、CSS、Markdown、LaTeX、Typst、Graphviz、Vue、TSX 等前端 / 文档代码块用...",
    "wordCount": 1161,
    "readingMinutes": 3,
    "updated": "",
    "codeRunner": true,
    "path": "./posts/TestSandkasten.md"
  },
  {
    "id": "Win",
    "type": "post",
    "title": "Win服务器控制",
    "date": "2026-06-13",
    "tags": [
      "Windows"
    ],
    "summary": "ssh\n启动ssh-agent\n清除同ip地址的ssh key冲突",
    "wordCount": 42,
    "readingMinutes": 1,
    "updated": "",
    "path": "./posts/Win.md"
  },
  {
    "id": "gpt-image2",
    "type": "note",
    "title": "gpt-image2笔记生图",
    "date": "2026-06-09",
    "tags": [
      "OpenAI",
      "gpt-image2"
    ],
    "summary": "无限号池那天玩image2生成的(\ncalculus\nchemistry\ndb\nlinear-algebra\nmath\nphysics\ncalculus\ncalculus/1 (1).png\ncalculus/1 (2).png\nca...",
    "wordCount": 633,
    "readingMinutes": 2,
    "updated": "",
    "path": "./notes/gpt-image2.md"
  },
  {
    "id": "PVE",
    "type": "post",
    "title": "Proxmox VE 初始化配置",
    "date": "2026-06-09",
    "tags": [
      "Proxmox VE"
    ],
    "summary": "自部署脚本参考\n[https://community-scripts.org/]\nLXC初始化\ne.g:curl, git, unzip,wget, etc.\nDocker\nGit 登录\nPVE\nLXC扩容\n允许ssh root密码登...",
    "wordCount": 208,
    "readingMinutes": 1,
    "updated": "",
    "path": "./posts/PVE.md"
  },
  {
    "id": "ApiKey",
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
    "summary": "Claude Code配置目录\nCodex配置目录\n安装\n一键安装\n无法连接外网的情况\nnpm\n官方\nProxy\nAgentRouter\nDeepseek Anthropic\n自建中转\nSub2api\nCodexManager",
    "wordCount": 263,
    "readingMinutes": 1,
    "updated": "",
    "path": "./posts/ApiKey.md"
  },
  {
    "id": "GoLearning",
    "type": "post",
    "title": "Go Golang",
    "date": "2026/01/20 - 2026/03/02",
    "tags": [
      "Golang",
      "Code"
    ],
    "summary": "2026-01-20 | Tuesday\n好几个月前就配了环境，也ai写了点调ai的api的代码测试，今天开始系统了解和学习go语言\n**初步认识:**\ngo像cpp那样有{}，又像python那样没有\";\"\n大小写就能区分publi...",
    "wordCount": 5527,
    "readingMinutes": 14,
    "updated": "",
    "codeRunner": true,
    "path": "./posts/GoLearning.md"
  },
  {
    "id": "Calculus",
    "type": "note",
    "title": "Calculus Notes",
    "date": "2025-11-06",
    "tags": [
      "Calculus",
      "Notes"
    ],
    "summary": "极限定义与收敛/发散\n数列极限：\n\\(\n\\forall \\varepsilon>0,\\ \\exists N\\in\\mathbb N,\\ \\forall n>N,\\ |x_n-A| 0,\\ \\exists N\\in\\mathbb N,\\ \\forall m,n>N,\\ |x_m-x_n| 0,\\ \\exists\\delta>0,\\ 0 0,\\ \\exists K>0,\\ |x|>K\\Rightarrow |f(x)-A| 0,\\ \\exists N,\\ n>N\\Rightarrow x_n>G\n\\)...",
    "wordCount": 9155,
    "readingMinutes": 23,
    "updated": "",
    "path": "./notes/Calculus.md"
  },
  {
    "id": "LinearAlgebra",
    "type": "note",
    "title": "Linear Algebra Notes",
    "date": "2025-11-06",
    "tags": [
      "LinearAlgebra",
      "Notes"
    ],
    "summary": "全章导图\n行列式的求解与性质\n行列式可以按排列定义（$n$ 阶行列式共 $n!$ 项，每项取自不同行不同列）：\n\\(D_n=\\sum_{s_1s_2\\cdots s_n}(-1)^{\\tau(s_1s_2\\cdots s_n)}a_{1s_1}a_{2s_2}\\cdots a_{ns_n}\\)...",
    "wordCount": 4786,
    "readingMinutes": 12,
    "updated": "",
    "path": "./notes/LinearAlgebra.md"
  },
  {
    "id": "HighSchoolChemistry",
    "type": "note",
    "title": "High School Chemistry Notes Summary",
    "date": "2024-06-09",
    "tags": [
      "Chemistry",
      "Notes"
    ],
    "summary": "化学做题总原则（优先检查有无遗漏，错的多想几种可能）\n化学题要有\"透过现象看本质\"的意识，每做完一步都要回头检查有没有遗漏。\n**一、守恒观**：原子守恒、电荷守恒、电子得失守恒。\n方程式 → 1. 判断正误；2. 书写。\n实验现象...",
    "wordCount": 4896,
    "readingMinutes": 13,
    "updated": "",
    "path": "./notes/HighSchoolChemistry.md"
  },
  {
    "id": "HighSchoolPhysics",
    "type": "note",
    "title": "High School Physics Notes Summary",
    "date": "2024-06-08",
    "tags": [
      "Physics",
      "Notes"
    ],
    "summary": "物理题的基本分析框架\n物理题三步走：读题、画图、列式。读题要圈出已知量、待求量、关键词；画图要标方向、标符号、标坐标系；列式要先写普适方程再代入数值。\n分析题目的五个抓手：\n题设条件：什么物体、什么过程、什么状态。\n正方向选择：选定后...",
    "wordCount": 15480,
    "readingMinutes": 39,
    "updated": "",
    "path": "./notes/HighSchoolPhysics.md"
  },
  {
    "id": "HighSchoolMaths",
    "type": "note",
    "title": "High School Maths Notes Summary",
    "date": "2024-06-07",
    "tags": [
      "Maths",
      "Notes"
    ],
    "summary": "审题与总策略\n拿到题先审题：圈出\"必要\"与\"非必要\"条件，把已知量、未知量、隐含条件分别列清楚。\n重要题要多次回看题干，避免漏读\"非负\"\"整数\"\"恰好\"等关键限定词。\n分类讨论要看清动参数 / 动点的范围，尤其端点取等、空集、判别式为...",
    "wordCount": 19290,
    "readingMinutes": 49,
    "updated": "",
    "path": "./notes/HighSchoolMaths.md"
  }
] as GeneratedDocMeta[]

export default generatedDocMeta
