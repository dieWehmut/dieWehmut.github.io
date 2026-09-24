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
    "id": "yjango",
    "type": "post",
    "title": "yjango学习观批判性学习",
    "date": "2026-09-21",
    "tags": [
      "learning"
    ],
    "summary": "2026-09-21 | Monday\n知其人\n计算机科学 → 机器学习 → 深度学习 → 多模态信息融合 → 人类行为建模\n与\"教育学 → 学习心理学 → 学习方法\"不一样\n早期重点是AI 从知乎短视频到《学习观》2020年后精力转...",
    "wordCount": 5046,
    "readingMinutes": 13,
    "updated": "2026/09/23 21:11",
    "path": "./posts/yjango.md"
  },
  {
    "id": "ComputerNetwork",
    "type": "note",
    "title": "Computer Network Notes",
    "date": "2026-08-28",
    "tags": [
      "ComputerNetwork",
      "Notes"
    ],
    "summary": "",
    "wordCount": 0,
    "readingMinutes": 0,
    "updated": "2026/09/03 10:57",
    "path": "./notes/ComputerNetwork.md"
  },
  {
    "id": "DigitalSignalProcessing",
    "type": "note",
    "title": "Digital Signal Processing",
    "date": "2026-08-27",
    "tags": [
      "DigitalSignalProcessing",
      "Notes"
    ],
    "summary": "or 数字信号处理 信号与系统\n导论\n信号\n反映信息的物理量,系统直接进行加工、变换以实现通信的对象，一般是随时间变化的有限的实值函数\n连续->模拟 离散->数字\n确定信号 随机信号\nalt text\n时域:以时间为自变量描述信号和系...",
    "wordCount": 974,
    "readingMinutes": 3,
    "updated": "2026/09/14 21:51",
    "path": "./notes/DigitalSignalProcessing.md"
  },
  {
    "id": "Neuroscience",
    "type": "note",
    "title": "Neuroscience Notes",
    "date": "2026-08-27",
    "tags": [
      "Neuroscience",
      "Notes"
    ],
    "summary": "##",
    "wordCount": 0,
    "readingMinutes": 0,
    "updated": "2026/09/03 10:57",
    "path": "./notes/Neuroscience.md"
  },
  {
    "id": "GoRust",
    "type": "post",
    "title": "Go Rust",
    "date": "2026/08/24",
    "tags": [
      "Rust",
      "Code"
    ],
    "summary": "严肃学习Rust圣经\n2026-08-24 | Monday\n无gc 安全 \"用Rust重写\"\nCargo.toml 描述文件\nCargo.lock 依赖\n2026-08-25 | Tuesday\n变量绑定\nstruct Struct...",
    "wordCount": 1513,
    "readingMinutes": 4,
    "updated": "2026/09/14 21:51",
    "codeRunner": true,
    "path": "./posts/GoRust.md"
  },
  {
    "id": "CurrentAffairsReading",
    "type": "note",
    "title": "英语时文阅读笔记",
    "date": "2026-08-13",
    "tags": [
      "English",
      "Reading",
      "Notes"
    ],
    "summary": "一、时代变了，但问题没变：如何找到自己人生的解法？\n**原文标题**：There Are No Rules for Success（成功，没有铁律）\n**作者**：Andy Kessler\n**发布日期**：2026.01.06...",
    "wordCount": 23578,
    "readingMinutes": 59,
    "updated": "2026/08/14 21:42",
    "path": "./notes/CurrentAffairsReading.md"
  },
  {
    "id": "HarnessEvolution",
    "type": "post",
    "title": "Harness自进化初探",
    "date": "2026-07-14",
    "tags": [
      "Harness",
      "Agent",
      "LLM",
      "self-evolution"
    ],
    "summary": "前置知识\nAgent\nagent自拉丁语agere(做，行动)->能够感知环境，并采取行动实现目标,类似于以前说的机器人啥的,这几年llm强大起来之后大家的讨论基本上转向了软件工程界(前几年对ai的认知还是对话机器)，即编程界\n从Re...",
    "wordCount": 710,
    "readingMinutes": 2,
    "updated": "2026/09/03 10:57",
    "path": "./posts/HarnessEvolution.md"
  },
  {
    "id": "Tauri",
    "type": "post",
    "title": "Tauri",
    "date": "2026-07-10",
    "tags": [
      "Rust",
      "Tauri"
    ],
    "summary": "接触Vue的Capacity，Android studio，react-nativeexpo go，qt，之后，终于决定尝试一下Tauri，顺便熟悉Rust\n环境安装\nRust，Tauri，Node.js\npnpm初始化\n配置图标\n自...",
    "wordCount": 92,
    "readingMinutes": 1,
    "updated": "2026/07/15 21:34",
    "path": "./posts/Tauri.md"
  },
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
    "updated": "2026/07/04 21:41",
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
    "updated": "2026/06/16 10:35",
    "codeRunner": true,
    "path": "./posts/TestSandkasten.md"
  },
  {
    "id": "Win",
    "type": "post",
    "title": "Win控制机",
    "date": "2026-06-13",
    "tags": [
      "Windows"
    ],
    "summary": "ssh\n启动ssh-agent\n清除同ip地址的ssh key冲突",
    "wordCount": 42,
    "readingMinutes": 1,
    "updated": "2026/07/10 20:28",
    "path": "./posts/Win.md"
  },
  {
    "id": "GPT-Image2",
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
    "updated": "2026/07/04 21:41",
    "path": "./notes/GPT-Image2.md"
  },
  {
    "id": "pve",
    "type": "post",
    "title": "Proxmox VE 初始化配置",
    "date": "2026-06-09",
    "tags": [
      "Proxmox VE"
    ],
    "summary": "Debian LXC初始化\ne.g:curl, git, unzip,wget, etc.\nDocker\nGit 登录\nVM\nPVE\nLXC扩容\n允许ssh root密码登录\nPermitRootLogin yes\nSSH Key 登...",
    "wordCount": 257,
    "readingMinutes": 1,
    "updated": "2026/07/09 20:50",
    "path": "./posts/pve.md"
  },
  {
    "id": "AgentSettings",
    "type": "post",
    "title": "Agent配置",
    "date": "2026-05-18",
    "tags": [
      "APIKey",
      "Codex",
      "Claude",
      "Opencode",
      "Hermes",
      "Deepseek",
      "AgentRouter",
      "OpenAI",
      "Anthropic"
    ],
    "summary": "Codex\nClaude\nOpencode\nAgent安装\n一键安装\n无法连接外网的情况\nnpm",
    "wordCount": 283,
    "readingMinutes": 1,
    "updated": "2026/09/03 10:57",
    "path": "./posts/AgentSettings.md"
  },
  {
    "id": "GoGolang",
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
    "updated": "2026/09/03 10:57",
    "codeRunner": true,
    "path": "./posts/GoGolang.md"
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
    "updated": "2026/06/16 10:35",
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
    "updated": "2026/06/16 10:35",
    "path": "./notes/LinearAlgebra.md"
  },
  {
    "id": "CognitiveScience",
    "type": "note",
    "title": "Cognitive Science Notes",
    "date": "2025-06-16",
    "tags": [
      "CognitiveScience",
      "Notes"
    ],
    "summary": "一、认知心理学与认知神经科学导论\n认知心理学概述\n**学科定义**：认知心理学是对**思维与头脑（Mind）**的科学研究。\n**研究核心**：关注信息如何从外部世界获取、在内部储存、加工转换，并用于解决问题、驱动思维以及生成言语。...",
    "wordCount": 11450,
    "readingMinutes": 29,
    "updated": "2026/09/03 10:57",
    "path": "./notes/CognitiveScience.md"
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
    "updated": "2026/06/16 10:35",
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
    "updated": "2026/06/16 10:35",
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
    "updated": "2026/06/16 10:35",
    "path": "./notes/HighSchoolMaths.md"
  },
  {
    "id": "DeepLearning",
    "type": "note",
    "title": "DeepLearning",
    "date": "",
    "tags": [],
    "summary": "",
    "wordCount": 0,
    "readingMinutes": 0,
    "updated": "2026/09/03 10:57",
    "path": "./notes/DeepLearning.md"
  }
] as GeneratedDocMeta[]

export default generatedDocMeta
