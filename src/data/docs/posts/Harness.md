---
title: Harness自进化初探
date: 2026-07-14
tags: [Harness, Agent, LLM, self-evolution]
---

## 前置知识

### Agent

>agent自拉丁语agere(做，行动)->能够感知环境，并采取行动实现目标,类似于以前说的机器人啥的,这几年llm强大起来之后大家的讨论基本上转向了软件工程界(前几年对ai的认知还是对话机器)，即编程界

- 从ReAct(边想边干),Plan-and-Execute(想全再干),Reflexion(外加buff:检查试卷)到LangChain(最通用),AutoGen(Microsoft),

总之并非死磕prompt,框架内部可能都优化地挺好的了,很多用reasoning Model,在提示词里面给llm多说一句"一步一步思考""分步实现"可能也就是起强调作用(不说这些agent也会这样干)

#### 常见的能力

- 自治(自主)
- 记忆
- 调用外部工具
- 自我修正

>人类没那么高级(?

#### Multi-Agent

- 集中式(Controller-Agents):控制层-A,B,C
- 去中心式(Peer-to-Peer):$A \leftrightarrow B\leftrightarrow C$
- 分层式(Hierarchical):管理-协调-执行

### Harness

很多文章基本上都出现的一个"公式":
>Agent = Model + Harness

Model即llm(脑子,接prompt),负责想;Harness即控制程序,外层代码(脑子以外,身体等),让agent在真实世界做出行动(在coding语境下就是浏览器，代码执行，记忆文件管理,网络请求...)

就是说并不是像网页端/app里面问一个问题调用一次llm直接给出答案，而是不断地调用llm(非常烧token)走一轮Harness代码

#### 一种层级划分方式

- 能力层(会什么skills，tools)
- 连接层(API,MCP)
- 构建层(prompt策略,agent框架,SDK,任务编排等等)
- **运行管控层**(runtime/sandbox,memory,hooks,中间件,轨迹等)

#### 有关Harness Engineering

>一个说法:模型能力相近的情况(也没有趋同,5.6-sol和fable),优化harness(XXX.md/约束/自动化/反馈链路等)提升agent能力上限(X大原则/共识/支柱...
- Vibe Coding -> Prompt/Context/Spec/Harness/xxx Engineering，没有改agent底层代码，只是Requirements/Rules变得更规范化-SDD(Spec-Driven Development)

---

## 外壳进化

- prompt优化/agent协同进化/轨迹研究
- 源码结构可拆解

### 常见框架

- TTHE:Proposer并发生成N个代码分支->真实工程环境无标准答案->Compile / Execute / Proxy Metrics 验证->选择
- HarnessX:积木拆解->隔离变异
- Meta-Harness:历史运行轨迹->AutoML 打分
- Moss:Negative Feedback->Source-level Rewriting
- Voyager(MC里面的):跑通->经验包装成Skill

### 设计/难绷原理

- 报错/执行日志->分析->重写->验证
- 烧token/Context
- 单样本过拟合/大模型抽风
- Skills膨胀/史山堆叠
- 环境误判

## Reference

1.[TTHE: Test-Time Harness Evolution](https://arxiv.org/pdf/2607.08124)

2.[REACT: SYNERGIZING REASONING AND ACTING IN LANGUAGE MODELS](https://arxiv.org/pdf/2210.03629)

3.[Voyager: An Open-Ended Embodied Agent with Large Language Models](https://arxiv.org/pdf/2305.16291)

4.[Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/abs/2303.11366)

5.[AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/abs/2308.08155)

6.[HarnessX: A Composable, Adaptive, and Evolvable Agent Harness Foundry](https://arxiv.org/pdf/2606.14249v1)

7.[Meta-Harness: End-to-end optimization of model harnesses](https://arxiv.org/pdf/2603.28052)

8.[MOSS: Self-evolution through source-level rewriting in autonomous agent systems](https://arxiv.org/pdf/2605.22794)
