---
title: Computing Method Notes
date: 2026-06-16
tags: [Computing Method, Notes]
---

> 计算方法 (Computing Method) / 数值分析 (Numerical Analysis) / 数值计算 (Numerical Computing)

- [一.绪论](#一绪论)
  - [1. 研究对象与特点](#1-研究对象与特点)
  - [2. 误差来源与分析](#2-误差来源与分析)
  - [3. 误差的基本概念](#3-误差的基本概念)
  - [4. 误差分析的方法与原则](#4-误差分析的方法与原则)
- [二.插值法](#二插值法)
  - [1. 引言](#1-引言)
  - [2. Lagrange 插值](#2-lagrange-插值)
  - [3. 逐次线性插值](#3-逐次线性插值)
  - [4. 差商与 Newton 插值公式](#4-差商与-newton-插值公式)
  - [5. 差分与等距节点插值公式](#5-差分与等距节点插值公式)
  - [6. Hermite 插值](#6-hermite-插值)
  - [7. 分段低次插值](#7-分段低次插值)
  - [8. 三次样条插值](#8-三次样条插值)
- [三.函数逼近与计算](#三函数逼近与计算)
  - [1. 引言与预备知识](#1-引言与预备知识)
  - [2. 最佳一致逼近多项式](#2-最佳一致逼近多项式)
  - [3. 最佳平方逼近](#3-最佳平方逼近)
  - [4. 正交多项式](#4-正交多项式)
  - [5. 函数按正交多项式展开](#5-函数按正交多项式展开)
  - [6. 曲线拟合的最小二乘法](#6-曲线拟合的最小二乘法)
- [四.数值积分与数值微分](#四数值积分与数值微分)
  - [1. 引言](#1-引言-1)
  - [2. Newton-Cotes 公式](#2-newton-cotes-公式)
  - [3. 复合求积公式](#3-复合求积公式)
  - [4. Romberg 求积公式](#4-romberg-求积公式)
  - [5. Gauss 求积公式](#5-gauss-求积公式)
  - [6. 数值微分](#6-数值微分)
- [六.方程求根](#六方程求根)
  - [1. 引言](#1-引言-2)
  - [2. 二分法](#2-二分法)
  - [3. 不动点迭代法](#3-不动点迭代法)
  - [4. 迭代加速收敛](#4-迭代加速收敛)
  - [5. Newton 法](#5-newton-法)
  - [6. 弦截法与抛物线法](#6-弦截法与抛物线法)
- [七.解线性方程组的直接方法](#七解线性方程组的直接方法)
  - [1. 引言与预备知识](#1-引言与预备知识-1)
  - [2. Gauss 消去法](#2-gauss-消去法)
  - [3. Gauss 主元素消去法](#3-gauss-主元素消去法)
  - [4. 矩阵三角分解法](#4-矩阵三角分解法)
  - [5. 向量与矩阵的范数](#5-向量与矩阵的范数)
  - [6. 误差分析](#6-误差分析)
- [八.解线性方程组的迭代法](#八解线性方程组的迭代法)
  - [1. 引言](#1-引言-3)
  - [2. 基本迭代法](#2-基本迭代法)
  - [3. 迭代法的收敛性](#3-迭代法的收敛性)
  - [4. 共轭梯度法](#4-共轭梯度法)
- [九.矩阵的特征值与特征向量计算](#九矩阵的特征值与特征向量计算)
  - [1. 引言](#1-引言-4)
  - [2. 幂法与反幂法](#2-幂法与反幂法)
  - [3. Householder 变换](#3-householder-变换)
  - [4. QR 算法](#4-qr-算法)
  - [5. Jacobi 方法](#5-jacobi-方法)

## 一.绪论

### 1. 研究对象与特点

研究**用计算机解决数学问题的数值方法及其理论**：

$$
\text{实际问题}\;\xrightarrow{\text{建模}}\;\text{数学模型}\;\xrightarrow{\text{数值方法}}\;\text{程序设计}\;\xrightarrow{\text{执行}}\;\text{数值解}
$$

| 分类 | 核心算子 | 输出 |
|------|---------|------|
| 解析法 Analytical | $x^{1/2},\ \nabla,\ \int,\ \mathcal{F},\ \min,\ \max,\ \dots$ | 闭式解 $f(x)$ |
| **数值法 Numerical** | `&`,`\|`, `+`, `-`, `*`, `/` | 满足精度 $\varepsilon$ 的近似解 $x^*$ |

### 2. 误差来源与分析

**误差的四个来源**：

```markdown
[ 实际问题 ]
     │ ─► (模型误差)
     ▼
[ 建立数学模型 ]
     │ ─► (截断误差 / 方法误差)
     ▼
[ 设计数值算法 ]
     │ ─► (舍入误差)
     ▼
[ 数值运算的执行 ] ◄─ [ 观测数据 ] ◄─(观测误差) ─[ 现实世界 ]
     │
     ▼
[ 计算结果 ]
```

设真实物理量为 $\tilde{x}$，最终数值结果为 $x_{\text{num}}$，则总误差可分解为：

$$
\begin{aligned}
\underbrace{x_{\text{num}} - \tilde{x}}_{\text{总误差}}
&= \underbrace{(x_{\text{num}} - x_h)}_{\text{舍入}} + \underbrace{(x_h - x)}_{\text{截断}} \\
&\quad + \underbrace{(x - \hat{x})}_{\text{模型}} + \underbrace{(\hat{x} - \tilde{x})}_{\text{观测}}
\end{aligned}
$$

- **模型误差**：建模时对实际问题做的抽象 / 简化所引入
- **观测误差**：温度、长度、电压等参量本身就是测出来的，不可能精确
- **截断误差 / 方法误差**：用数值方法近似精确解时引入（例：Taylor 截断）
- **舍入误差**：计算机字长有限，原始数据存储与中间运算都会舍入

**截断误差例子**：用 Taylor 多项式近似 $f(x)$：

$$
\begin{aligned}
P_n(x)
&= f(0) + \frac{f'(0)}{1!}x + \frac{f''(0)}{2!}x^2 + \cdots + \frac{f^{(n)}(0)}{n!}x^n \\
&= \sum_{k=0}^{n}\frac{f^{(k)}(0)}{k!}x^k
\end{aligned}
$$

由 Lagrange 型 Taylor 余项定理，**截断误差**为

$$
R_n(x) = f(x) - P_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\, x^{n+1},\quad \xi \in (0,\, x)
$$

对指数函数 $e^x = \displaystyle\sum_{k=0}^{\infty}\frac{x^k}{k!}$，取前 $n+1$ 项的截断量为

$$
e^x - P_n(x) = \frac{x^{n+1}}{(n+1)!}\, e^{\theta x},\quad 0 < \theta < 1
$$

由 Stirling 公式 $(n+1)! \sim (2\pi(n+1))^{1/2}\bigl(\tfrac{n+1}{e}\bigr)^{n+1}$，截断误差**随 $n$ 超指数衰减**，故 Taylor 级数能"任意逼近"。

**舍入误差例子**：

$$
\begin{aligned}
\pi - 3.14159 &= 2.6\ldots \times 10^{-6} \\
2^{1/2} &= 1.41421356237\ldots \approx 1.4142 \\
\ln 2 &= 0.69314718056\ldots \approx 0.6931
\end{aligned}
$$

工程实践：精度链

$$
\text{FP64}\ (\varepsilon \approx 2.2\!\times\!10^{-16})\;\rightarrow\;\text{FP32}\ (\varepsilon \approx 1.2\!\times\!10^{-7})\;\rightarrow\;\text{FP16}\ (\varepsilon \approx 9.8\!\times\!10^{-4})\;\rightarrow\;\text{FP8}
$$

IEEE-754 浮点的舍入误差模型：

$$
\text{fl}(x) = x\,(1 + \delta),\quad \lvert\delta\rvert \le u,\quad u = 2^{-t}
$$

其中 $u$ 为机器精度，$t$ 为尾数位数。

**四舍五入与误差限**：记 $x = \pi = 3.14159265\ldots$：

| 截取位 | 近似值 $x^*$ | 误差限 |
|--------|-------------|--------|
| 前 3 位 | $3.14$ | $ e_2^* = \lvert\pi - 3.14\rvert \le 0.002 \le \tfrac{1}{2} \times 10^{-2}$ |
| 前 5 位 | $3.1416$ | $ e_4^* = \lvert\pi - 3.1416\rvert \le 0.000008 \le \tfrac{1}{2} \times 10^{-4}$ |

**结论**：四舍五入到 $k$ 位小数后，误差满足

$$
\lvert x - x^*\rvert \le \tfrac{1}{2} \times 10^{-k}
$$

即不超过末位的半个单位。

**综合例子（截断 + 舍入误差）**：近似计算

$$
I = \int_0^1 e^{-x^2}\,dx = \tfrac{1}{2}\pi^{1/2}\,\operatorname{erf}(1) = 0.74682413\ldots
$$

将 $e^{-x^2} = \displaystyle\sum_{k=0}^{\infty}\frac{(-1)^k x^{2k}}{k!}$ 逐项积分：

$$
\begin{aligned}
I
&= \int_0^1\!\left(1 - x^2 + \frac{x^4}{2!} - \frac{x^6}{3!} + \frac{x^8}{4!} - \cdots\right)dx \\
&= \sum_{k=0}^{\infty}\frac{(-1)^k}{k!\,(2k+1)} \\
&= 1 - \frac{1}{3} + \frac{1}{2!}\cdot\frac{1}{5} - \frac{1}{3!}\cdot\frac{1}{7} + \frac{1}{4!}\cdot\frac{1}{9} - \cdots
\end{aligned}
$$

取前 4 项 $S_4 = 1 - \frac{1}{3} + \frac{1}{10} - \frac{1}{42}$，由 Leibniz 型交错级数余项估计：

$$
\lvert R_4\rvert \le \left\lvert\frac{1}{4!\cdot 9}\right\rvert = \frac{1}{216} < 0.005
$$

- **截断误差** $\lvert R_4\rvert < 0.005$
- $S_4 \approx 1 - 0.333 + 0.1 - 0.024 = 0.743$
- **舍入误差** $\le 0.0005 \times 2 = 0.001$（每项保留 3 位小数）
- **总误差** $\lvert I - 0.743\rvert \le \lvert R_4\rvert + \lvert R_{\text{round}}\rvert < 0.005 + 0.001 = 0.006$

> 💡 算法精度 (截断 $R_n$) + 计算精度 (舍入 $R_{\text{round}}$) = 总误差。

**例 1.1：方案 A vs 方案 B —— 数值稳定性的本质**

计算 $I_n = e^{-1}\!\int_0^1 x^n e^{x}\,dx$（$n = 0, 1, 2, \ldots$）并估计误差。用分部积分 $u = x^n,\ v' = e^x$：

$$
\begin{aligned}
I_n
&= e^{-1}\!\left(x^n e^x\Big|_0^1 - n\!\int_0^1 x^{n-1} e^x\,dx\right) \\
&= e^{-1}\!\left(e - n\!\int_0^1 x^{n-1} e^x\,dx\right) \\
&= 1 - n\, I_{n-1}
\end{aligned}
$$

初值 $I_0 = e^{-1}(e - 1) = 1 - e^{-1}$。

**方案 A（向前递推）**：$I_n = 1 - n\, I_{n-1}$。先用 Taylor 展开求 $e^{-1} \approx 0.3679$，截断误差 $\lvert R_7\rvert \le 1/8! < \tfrac{1}{4}\times 10^{-4}$。

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|-----|---|---|---|---|---|---|---|---|---|---|
| $I_n^A$ | $0.6321$ | $0.3679$ | $0.2642$ | $0.2074$ | $0.1704$ | $0.1480$ | $0.1120$ | $0.2160$ | $\mathbf{-0.728}$ | $\mathbf{7.552}$ |

误差递推 $E_n = -n\, E_{n-1} \Rightarrow E_n = (-1)^n\, n!\, E_0$，初值的小误差被放大 $n!$ 倍 — **误差爆炸💥**。

**方案 B（向后递推）**：由积分中值定理 $\dfrac{e^{-1}}{n+1} \le I_n \le \dfrac{1}{n+1}$，对 $n = 9$ 粗取 $I_9^* \approx 0.0684$，反向递推

$$
I_{n-1}^* = \frac{1}{n}\bigl(1 - I_n^*\bigr),\quad n = 9, 8, \ldots, 1
$$

误差递推 $E_{n-1}^* = -\frac{1}{n}\, E_n^* \Rightarrow E_0^* = (-1)^n\,\frac{1}{n!}\, E_n^*$，初值即使有较大误差 $\lvert E_9^*\rvert \sim 0.1$，每步**缩小 $n!$ 倍**：$\lvert E_0^*\rvert \approx 2.8 \times 10^{-7}$。

| $n$ | $I_n^A$ | $I_n^*\,(B)$ |     | $n$ | $I_n^A$ | $I_n^*\,(B)$ |
|-----|---------|--------------|-----|-----|---------|--------------|
| 0   | $0.6321$  | $0.6321$       |     | 5   | $0.1480$  | $0.1455$       |
| 1   | $0.3679$  | $0.3679$       |     | 6   | $0.1120$  | $0.1268$       |
| 2   | $0.2642$  | $0.2643$       |     | 7   | $0.2160$  | $0.1121$       |
| 3   | $0.2074$  | $0.2073$       |     | 8   | $-0.728$  | $0.1035$       |
| 4   | $0.1704$  | $0.1708$       |     | 9   | $7.552$   | $0.0684$       |

> 🔑 **核心洞见**：同一数学问题，正向递推放大因子 $\lvert\lambda_n\rvert = n \to \infty$；反向递推 $\lvert\lambda_n^*\rvert = \tfrac{1}{n} \to 0$ — 数值稳定性的雏形。

### 3. 误差的基本概念

**绝对误差与误差限**：设 $x$ 为精确值，$x^*$ 为近似值，
绝对误差 $e^* := x - x^*$

**误差限** $\varepsilon^* > 0$ 使得 $\lvert e^*\rvert \le \varepsilon^*$，不能完全表示近似值的好坏

$x = x^* \pm \varepsilon^*\Longleftrightarrow x \in [\,x^* - \varepsilon^*,\;x^* + \varepsilon^*\,]$

**例**：用游标卡尺测得 $L^* = 12.34\,\text{mm}$，刻度精度 $0.01\,\text{mm}$，则 $L = 12.34 \pm 0.005\,\text{mm}$，$\varepsilon^* = 0.005\,\text{mm}$。

**相对误差**：

$$
\begin{aligned}
e_r^* &:= \frac{e^*}{x} = \frac{x - x^*}{x} \\
&\approx \frac{x - x^*}{x^*} = \frac{e^*}{x^*}
\end{aligned}
$$

二者偏差为高阶小量 $\dfrac{e^*}{x^*} - \dfrac{e^*}{x} = \dfrac{(e^*)^2}{x\, x^*} = O\!\bigl((e^*)^2\bigr)$。
**相对误差限**$\varepsilon_r^* := \dfrac{\varepsilon^*}{\lvert x^*\rvert}$，满足 $\lvert e_r^*\rvert \le \varepsilon_r^*$。

**有效数字**：从左数第一个非零数字起到末位，全部参与计数,若 $x^*$ 写成规范浮点形式

$$x^* = \pm 10^m \times (a_1 + a_2 \times 10^{-1} + \dots + a_n \times 10^{-(n-1)}) = \pm a_1.a_2\dots a_n \times 10^m \\
其中 a_1 \in [1, 9]，a_2, \dots, a_n \in [0, 9] \\
| x - x^* | \le \frac{1}{2} \times 10^{m-n+1}$$

| $x^*$ | $m$ | 有效位数 $n$ | 误差限 |
|-------|-----|--------------|--------|
| $1.73$ | $1$ | $3$ | $\tfrac{1}{2}\times 10^{0-3+1}$ |
| $1.7321$ | $1$ | $5$ | $\tfrac{1}{2}\times 10^{0-5+1}$ |
| $1.7320$ | $1$ | $4$ | $\tfrac{1}{2}\times 10^{0-4+1}$ |

**定理 1.1（有效数字 ↔ 相对误差限）**：设 $x^* = \pm 10^m \times 0.a_1 a_2 \cdots a_n$（$a_1 \ne 0$）是 $x$ 的近似。

$(1)$ 若 $x^*$ 有 $n$ 位有效数字，则 $\varepsilon_r^* \le \dfrac{1}{2 a_1}\times 10^{-(n-1)}$。

$(2)$ 反之，若 $\varepsilon_r^* \le \dfrac{1}{2(a_1 + 1)}\times 10^{-(n-1)}$，则 $x^*$ 至少有 $n$ 位有效数字。

**证 (1)**：由 $a_1\ne 0$ 得 $a_1\times 10^{m-1} \le \lvert x^*\rvert \le (a_1+1)\times 10^{m-1}$，故

$$
\begin{aligned}
\varepsilon_r^*
&= \frac{\lvert e^*\rvert}{\lvert x^*\rvert}
\le \frac{\tfrac{1}{2}\times 10^{m-n}}{a_1 \times 10^{m-1}} \\
&= \frac{1}{2 a_1}\times 10^{-(n-1)}\;\blacksquare
\end{aligned}
$$

**证 (2)**：

$$
\begin{aligned}
\lvert e^*\rvert
&= \varepsilon_r^*\cdot \lvert x^*\rvert
\le \frac{1}{2(a_1+1)}\times 10^{-(n-1)}\cdot (a_1+1)\times 10^m \\
&= \tfrac{1}{2}\times 10^{m-n}\;\blacksquare
\end{aligned}
$$

**例 1.3**：$\pi \approx 3.1416$，$a_1 = 3,\ n = 5$，$\varepsilon_r^* \le \dfrac{1}{2\times 3}\times 10^{-4} \approx 1.67\times 10^{-5}$。

**例 1.4（反问题）**：求 $20^{1/2}$ 的近似值有 $n=4$ 位有效数字所需相对误差限。$20^{1/2}\approx 4.472$，$a_1 = 4$：$\varepsilon_r^* \le \dfrac{1}{2(4+1)}\times 10^{-3} = 10^{-4}$。故只要相对误差 $\le 0.01\%$ 即可保证 4 位有效数字。

**四则运算的误差限传播**：设 $x_1, x_2$ 的误差限分别为 $\varepsilon(x_1^*),\ \varepsilon(x_2^*)$，则

$$
\begin{aligned}
\varepsilon(x_1^* \pm x_2^*)
&\le \varepsilon(x_1^*) + \varepsilon(x_2^*) \\
\varepsilon(x_1^* x_2^*)
&\approx\lvert x_2^*\rvert\,\varepsilon(x_1^*) + \lvert x_1^*\rvert\,\varepsilon(x_2^*) \\
\varepsilon\!\left(\frac{x_1^*}{x_2^*}\right)
&\approx\frac{\lvert x_2^*\rvert\,\varepsilon(x_1^*) + \lvert x_1^*\rvert\,\varepsilon(x_2^*)}{(x_2^*)^2}, x_2^* \ne 0
\end{aligned}
$$

**相对误差**形式更对称（乘除时相加，因 $\ln$ 化乘为加）：

$$
\begin{aligned}
\varepsilon_r(x_1^* x_2^*)
&\approx \varepsilon_r(x_1^*) + \varepsilon_r(x_2^*) \\
\varepsilon_r\!\left(\frac{x_1^*}{x_2^*}\right)
&\approx \varepsilon_r(x_1^*) + \varepsilon_r(x_2^*)
\end{aligned}
$$

加减法的相对误差则**没有**这种好性质——这是「避免两相近数相减」的根源。

**一元函数的误差估计**：

$$
\begin{aligned}
y - y^*
&= f(x) - f(x^*) \\
&= f'(x^*)(x - x^*) + \tfrac{1}{2}f''(\xi)(x - x^*)^2 \\
\end{aligned}
$$
$$| f(x) - f(x^*) | \le | f'(x^*) | \epsilon(x^*) + \tfrac{1}{2}|f''(\xi)|(x - x^*)^2 $$
故 $\varepsilon(y^*) \approx \lvert f'(x^*)\rvert\,\varepsilon(x^*)$。相对误差：

$$
\begin{aligned}
\varepsilon_r(y^*)
&\approx \frac{\lvert f'(x^*)\rvert}{\lvert f(x^*)\rvert}\,\lvert x^*\rvert\cdot \frac{\varepsilon(x^*)}{\lvert x^*\rvert} \\
&= \underbrace{\left\lvert\frac{x^*\, f'(x^*)}{f(x^*)}\right\rvert}_{\text{条件数}\ \kappa(x^*)}\cdot \varepsilon_r(x^*)
\end{aligned}
$$

**条件数** $\kappa$ 衡量函数 $f$ 在 $x^*$ 处对相对扰动的放大倍率：

- $\kappa \ll 1$：问题良态 (well-conditioned)
- $\kappa \gg 1$：问题病态 (ill-conditioned)，如 $f(x) = \ln x$ 在 $x \to 1$ 时 $\kappa \to \infty$

**多元函数的误差估计**：当 $f$ 为多元函数时，计算 $A = f(x_1, x_2, \dots, x_n)$。若 $x_1, x_2, \dots, x_n$ 的近似值为 $x_1^*, x_2^*, \dots, x_n^*$，则 $A$ 的近似值为

$$
A^* = f(x_1^*, x_2^*, \dots, x_n^*)
$$

由 Taylor 展开，函数值 $A^*$ 的误差 $e(A^*)$ 为：

$$
\begin{aligned}
e(A^*)
&= A^* - A =   f(x_1^*, x_2^*, \dots, x_n^*) - f(x_1, x_2, \dots, x_n)\\
&\approx \sum_{i=1}^{n}\frac{\partial f(x_1^*, x_2^*, \dots, x_n^*)}{\partial x_i}\,(x_i^* - x_i) \\
&= \sum_{i=1}^{n}\frac{\partial f}{\partial x_i}\bigg|_{x^*}\, e_i^*
\end{aligned}
$$

故 $A^*$ 的**绝对误差限**为：

$$
\varepsilon(A^*) \approx \sum_{i=1}^{n}\left\lvert\frac{\partial f}{\partial x_i}\bigg|_{x^*}\right\rvert\,\varepsilon(x_i^*)
$$

$A^*$ 的**相对误差限**为：

$$
\varepsilon_r^*=\varepsilon_r(A^*) = \frac{\varepsilon(A^*)}{\lvert A^*\rvert} \approx \sum_{i=1}^{n}\left\lvert\frac{\partial f}{\partial x_i}\bigg|_{x^*}\right\rvert\,\frac{\varepsilon(x_i^*)}{\lvert A^*\rvert}
$$

**例 1.5**：测得某场地长 $l$ 的值为 $l^* = 110\,\text{m}$，宽 $d$ 的值为 $d^* = 80\,\text{m}$，已知 $\lvert l - l^*\rvert \le 0.2\,\text{m}$，$\lvert d - d^*\rvert \le 0.1\,\text{m}$，试求面积 $S = ld$ 的绝对误差限和相对误差限。

由多元函数误差限公式，知

$$
\varepsilon(S^*) \approx \left\lvert\frac{\partial S}{\partial l}\bigg|_{*}\right\rvert\,\varepsilon(l^*) + \left\lvert\frac{\partial S}{\partial d}\bigg|_{*}\right\rvert\,\varepsilon(d^*)
$$

其中 $\dfrac{\partial S}{\partial l}\bigg|_{*} = d^* = 80\,\text{m}$，$\dfrac{\partial S}{\partial d}\bigg|_{*} = l^* = 110\,\text{m}$，$\varepsilon(l^*) = 0.2\,\text{m}$，$\varepsilon(d^*) = 0.1\,\text{m}$。

故绝对误差限为：

$$
\varepsilon(S^*) \approx 80\times 0.2 + 110\times 0.1 = 27\,\text{m}^2
$$

相对误差限为：

$$
\varepsilon_r(S^*) = \frac{\varepsilon(S^*)}{\lvert S^*\rvert} = \frac{27}{l^*\, d^*} = \frac{27}{8800} \approx 0.31\%
$$

### 4. 误差分析的方法与原则


实际工程或科学计算问题往往要运算千万次：每步都作误差分析是不可能的；误差积累有正有负，绝对值有大有小，按最坏情况估计得到的结果比实际误差大得多。

**概率分析法**：将数据/运算中的舍入误差视为适合某种分布的随机变量，确定结果的误差分布。

**误差定性分析（数值稳定性）**：

> 运算过程舍入误差不增长的计算公式是数值稳定的，否则不稳定。

回顾**例 1.1**：方案（A）向前递推 $I_n = 1 - n I_{n-1}$，误差以 $n!$ 倍放大，是数值不稳定的；方案（B）向后递推 $I_{n-1}^* = (1 - I_n^*)/n$，误差以 $1/n!$ 倍缩小，是数值稳定的。

研究一个计算公式是否稳定的方法：

- 假定初始值有误差 $\varepsilon$，中间不再产生新误差，考察由 $\varepsilon$ 引起的误差积累是否增长，如不增长就认为是稳定的，否则不稳定
- 对于稳定的计算公式，不具体估计舍入误差积累也可相信它是可用的，误差限不会太大
- 不稳定的公式通常就不能使用；如要使用，其计算步数也只能很少，并注意控制累计误差

**原则 1：要避免除数绝对值远远小于被除数绝对值**

用绝对值小的数作除数，舍入误差会增大。计算 $z = x/y$，若 $0 < |y| \ll |x|$：

$$
\varepsilon(z^*) \approx \frac{\varepsilon(x^*)}{|y^*|} + \frac{|x^*|}{(y^*)^2}\,\varepsilon(y^*)
$$

表明当 $y$ 相对太小时，商的绝对误差可能很大。

**例 1.6**：线性方程组

$$
\begin{cases}
0.00001\, x_1 + x_2 = 1 \\
2 x_1 + x_2 = 2
\end{cases}
$$

的准确解为

$$
x_1 = \frac{200000}{399999} \approx 0.50000125,\quad x_2 = \frac{199998}{199999} \approx 0.999995
$$

若用四位浮点十进制数下用消去法求解，先把方程规格化为

$$
\begin{cases}
10^{-5} \times 0.1000\, x_1 + 10^{0} \times 0.1000\, x_2 = 10^{0} \times 0.1000 & ① \\
10^{1} \times 0.2000\, x_1 + 10^{1} \times 0.1000\, x_2 = 10^{1} \times 0.2000 & ②
\end{cases}
$$

**做法 A（错误）**：用 $① / (10^{-5} \times 0.1000 / 2)$ 消去 $x_1$，此处即"大数除小数"，得

$$
10^{1} \times 0.2000\, x_1 + 10^{6} \times 0.2000\, x_2 = 10^{6} \times 0.2000 \quad ③
$$

由 $③ - ②$ 消去 $x_1$，再因精度有限忽略小数字：

$$
10^{6} \times 0.2000\, x_2 = 10^{6} \times 0.2000
$$

回代得 $x_1 = 0,\ x_2 = 1$，**严重失真**。

**做法 B（正确）**：直接用 $② - ①$ 消去 $x_1$（② 的系数 $10^1$ 比 ① 大，等价于以大数为主元），得

$$
10^{1} \times 0.2000\, x_2 - 10^{0} \times 0.1000\, x_2 = 10^{1} \times 0.1000
$$

精度有限忽略小数字：

$$
10^{1} \times 0.2000\, x_2 = 10^{1} \times 0.1000
$$

由此解出 $x_1 = 0.5,\ x_2 = 1$，**基本正确**。

> 💡 选大主元（partial pivoting）正是为了避免出现"除以小数"。

**原则 2：要避免两相近数相减**

例如 $x = 532.65,\ y = 532.52$ 都有五位有效数字，但 $x - y = 0.13$ 只剩**两位**有效数字。

分析相对误差：令 $z = y - x$，则 $\varepsilon(z) = \varepsilon(y) + \varepsilon(x)$，故

$$
\varepsilon_r(z) = \frac{\varepsilon(z)}{|z|} = \frac{\varepsilon(y) + \varepsilon(x)}{|z|} = \frac{|y|}{|z|}\,\varepsilon_r(y) + \frac{|x|}{|z|}\,\varepsilon_r(x)
$$

当 $y \approx x$ 时 $z \approx 0$，相对误差限会很大。

**例 1.7**：计算 $A = 10^{5}\,(1 - \cos 2°)$。

- 若直接利用 $\cos 2° = 0.9994$，得

$$
A = 10^{5}\,(1 - \cos 2°) = 10^{5}\,(1 - 0.9994) = 6 \times 10^{1}
$$

只有 **1 位**有效数字。

- 若利用三角恒等式 $1 - \cos x = 2 \sin^2 \dfrac{x}{2}$ 等价变形，则

$$
A = 10^{5}\,(1 - \cos 2°) = 2 \times (\sin 1°)^2 \times 10^{5} = 6.13 \times 10^{1}
$$

有 **3 位**有效数字（其中 $\sin 1° = 0.0175$）。

**解决方法 1：改变计算公式**——用代数恒等式消去相消项：

- 如果 $x_1$ 和 $x_2$ 很接近：$\lg x_1 - \lg x_2 = \lg(x_1 / x_2)$
- 当 $x$ 很大时：$(x+1)^{1/2} - x^{1/2} = \dfrac{1}{(x+1)^{1/2} + x^{1/2}}$
- 若 $f(x) \approx f(x^*)$，可用 Taylor 展开：

$$
f(x) - f(x^*) = f'(x^*)(x - x^*) + \frac{f''(x^*)}{2}(x - x^*)^2 + \cdots
$$

**解决方法 2：增加有效位数进行运算**——如 half 变 float，float 变 double。

**原则 3：要防止大数"吃掉"小数**

参加运算的数有时数量级相差很大；计算机位数有限，如不注意运算次序，会出现**大数"吃掉"小数**的现象，影响结果可靠性。

**解决方案**：

- 按绝对值由小到大的顺序累加
- 合理分组，保证数量级大致相同

**例 1.8**：在五位十进制计算机上计算

$$
A = 52492 + \sum_{n=1}^{1000} \delta_n,\quad 0.1 \le \delta_n \le 0.9
$$

把运算的数写成规格化形式：

$$
A = 0.52492 \times 10^{5} + \sum_{n=1}^{1000} \delta_n
$$

计算时要**对阶**。若取 $\delta_n = 0.9$，对阶时 $\delta_n = 0.000009 \times 10^{5}$，在五位的计算机中表示为 $0$，计算结果为 $52492$，**不可靠**。

如果先把数量级相同的 1000 个 $\delta_n$ 相加，最后再加上 52492，这时

$$
0.1 \times 10^{3} \le \sum_{n=1}^{1000} \delta_n \le 0.9 \times 10^{3}
$$

则有

$$
0.001 \times 10^{5} + 0.52492 \times 10^{5} \le A \le 0.009 \times 10^{5} + 0.52492 \times 10^{5}
$$

即 $52592 \le A \le 53392$，结果可靠。

**原则 4：注意简化计算步骤，减少运算次数**

减少运算次数既能节省计算机的计算时间，还能减小舍入误差，**是数值计算必须遵从的原则**。

**例 1.9**：计算 $x^{255}$ 的值。

- 逐个相乘要用 **254 次**乘法
- 若用

$$
x^{255} = x \cdot x^{2} \cdot x^{4} \cdot x^{8} \cdot x^{16} \cdot x^{32} \cdot x^{64} \cdot x^{128}
$$

则只需要 **14 次**运算（先平方迭代得到各 $x^{2^k}$ 共 7 次，再相乘 7 次）。

**秦九韶算法（Horner's method）**

计算多项式 $P_n(x) = a_n x^n + a_{n-1} x^{n-1} + \cdots + a_1 x + a_0$。

- 直接计算 $a_k x^k$ 再逐项相加，一共需做 $n$ 次加法及

$$
n + (n-1) + \cdots + 2 + 1 = \frac{n(n+1)}{2}\ \text{次乘法}
$$

- 秦九韶算法只需 $n$ 次乘法和 $n$ 次加法：

$$
P_n(x) = (\cdots((a_n x + a_{n-1}) x + a_{n-2}) x + \cdots + a_1) x + a_0
$$

迭代式：

$$
\begin{aligned}
S_n &= a_n \\
S_k &= x \cdot S_{k+1} + a_k,\quad (k = n-1, n-2, \ldots, 0) \\
P_n(x) &= S_0
\end{aligned}
$$

## 二.插值法

### 1. 引言

实际问题中常需通过函数 $y = f(x)$ 表示某种内在规律的数量关系：

- 部分函数通过实验或观测得到，只能给出 $f$ 在一系列点 $x_i$ 处的值 $y_i = f(x_i)$ ($i = 0, 1, \ldots, n$)
- 部分函数虽有解析式但计算复杂（如三角函数、对数函数），实践中只能建立函数表查询

希望基于观测值 / 函数表构造**简单函数** $P(x)$ 满足：

- $P(x)$ 既能反映 $f(x)$ 特性，又便于计算，从而可以用 $P(x)$ 近似 $f(x)$
- $P(x_i) = f(x_i)$，对 $i = 0, 1, \ldots, n$ 成立

**定义 2.1**：设函数 $y = f(x)$ 在区间 $[a, b]$ 上有定义，且已知在节点 $a \le x_0 < x_1 < \cdots < x_n \le b$ 上的值 $y_0, y_1, \ldots, y_n$。若存在简单函数 $P(x)$ 使

$$
P(x_i) = y_i \quad (i = 0, 1, \ldots, n) 
$$

则有以下

- **插值函数**——满足 (2.1.1) 的简单函数 $P(x)$
- **插值节点**——给定的 $x_0, x_1, \ldots, x_n$
- **插值区间**——包含全部插值节点的区间 $[a, b]$
- **插值法**——求插值函数 $P(x)$ 的方法

进一步，若 $P(x)$ 是次数不超过 $n$ 的代数多项式

$$
P(x) = a_0 + a_1 x + \cdots + a_n x^n 
$$

其中 $a_i$ 为实数，则有：

- **插值多项式**——形如 (2.1.2) 的多项式形式插值函数 $P(x)$
- **多项式插值**——以多项式作为插值函数的插值法
- **分段插值**——$P(x)$ 为分段多项式的插值法
- **三角插值**——$P(x)$ 为三角多项式的插值法

> 几何意义：插值法就是求曲线 $y = P(x)$ 通过给定的 $n+1$ 个点 $(x_i, y_i)$，用它近似已知曲线 $y = f(x)$。历史上我国早在一千多年前的历法研究中就应用了线性插值与二次插值，基本理论在微积分产生以后才逐步完善，计算机普及后由于航空、造船、精密机械加工等需求得到进一步发展。

### 2. Lagrange 插值

**插值多项式的存在唯一性**：设 $H_n$ 代表所有次数不超过 $n$ 的多项式集合，$P(x) \in H_n$，由 $P(x_i) = y_i$ 可得 $a_0, a_1, \ldots, a_n$ 的 $n+1$ 元线性方程组

$$
\begin{cases}
a_0 + a_1 x_0 + \cdots + a_n x_0^n = y_0 \\
a_0 + a_1 x_1 + \cdots + a_n x_1^n = y_1 \\
\quad \vdots \\
a_0 + a_1 x_n + \cdots + a_n x_n^n = y_n
\end{cases} 
$$

其系数行列式为 **Vandermonde 行列式**：

$$
V_n(x_0, x_1, \ldots, x_n) = \begin{vmatrix}
1 & x_0 & x_0^2 & \cdots & x_0^n \\
1 & x_1 & x_1^2 & \cdots & x_1^n \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & x_n & x_n^2 & \cdots & x_n^n
\end{vmatrix} = \prod_{i=1}^{n}\prod_{j=0}^{i-1}(x_i - x_j) 
$$

由于 $i \ne j$ 时插值节点 $x_i \ne x_j$，故 $V_n \ne 0$，矩阵满秩，方程组有唯一解。

> **定理 2.1**：满足式 (2.1.1) 的插值多项式唯一。

直接求解方程组 (2.2.1) 不仅计算复杂，且难以得到简洁表达式。下面采用**基函数方法**。

**线性插值（$n = 1$）**：已知区间 $[x_k, x_{k+1}]$ 端点处 $y_k = f(x_k),\ y_{k+1} = f(x_{k+1})$，求线性插值多项式 $L_1(x)$ 满足 $L_1(x_k) = y_k,\ L_1(x_{k+1}) = y_{k+1}$。

- 点斜式：

$$
L_1(x) = y_k + \frac{y_{k+1} - y_k}{x_{k+1} - x_k}(x - x_k) 
$$

- 两点式：

$$
L_1(x) = \frac{x - x_{k+1}}{x_k - x_{k+1}} y_k + \frac{x - x_k}{x_{k+1} - x_k} y_{k+1} 
$$

视作两个线性函数的线性组合：

$$
L_1(x) = y_k\, l_k(x) + y_{k+1}\, l_{k+1}(x),\quad l_k(x) = \frac{x - x_{k+1}}{x_k - x_{k+1}},\ \ l_{k+1}(x) = \frac{x - x_k}{x_{k+1} - x_k} 
$$

$l_k(x), l_{k+1}(x)$ 是线性插值多项式，且满足

$$
l_k(x_k) = 1,\ l_k(x_{k+1}) = 0;\quad l_{k+1}(x_k) = 0,\ l_{k+1}(x_{k+1}) = 1
$$

- **一次插值基函数（线性插值基函数）**——满足上述端点取值条件的两个一次多项式 $l_k(x), l_{k+1}(x)$

**二次（抛物）插值（$n = 2$）**：节点 $x_{k-1}, x_k, x_{k+1}$，求 $L_2(x)$ 使 $L_2(x_j) = y_j$（$j = k-1, k, k+1$）。基函数 $l_{k-1}, l_k, l_{k+1}$ 是二次函数且满足

$$
l_j(x_i) = \delta_{ji},\quad i, j \in \{k-1, k, k+1\} 
$$

$l_{k-1}(x)$ 以 $x_k, x_{k+1}$ 为零点，设 $l_{k-1}(x) = A(x - x_k)(x - x_{k+1})$，由 $l_{k-1}(x_{k-1}) = 1$ 得 $A = \dfrac{1}{(x_{k-1}-x_k)(x_{k-1}-x_{k+1})}$。同理可得 $l_k, l_{k+1}$：

$$
\begin{aligned}
l_{k-1}(x) &= \frac{(x-x_k)(x-x_{k+1})}{(x_{k-1}-x_k)(x_{k-1}-x_{k+1})} \\
l_k(x) &= \frac{(x-x_{k-1})(x-x_{k+1})}{(x_k-x_{k-1})(x_k-x_{k+1})} \\
l_{k+1}(x) &= \frac{(x-x_{k-1})(x-x_k)}{(x_{k+1}-x_{k-1})(x_{k+1}-x_k)}
\end{aligned}
$$

抛物插值表达式：

$$
L_2(x) = y_{k-1}\, l_{k-1}(x) + y_k\, l_k(x) + y_{k+1}\, l_{k+1}(x) 
$$

**$n$ 次 Lagrange 插值多项式**：考虑 $n+1$ 个节点 $x_0 < x_1 < \cdots < x_n$ 的 $n$ 次插值多项式 $L_n(x_j) = y_j$。

**定义 2.2**：若 $n$ 次多项式 $l_j(x)$（$j = 0, 1, \ldots, n$）在节点上满足

$$
l_j(x_k) = \delta_{jk} = \begin{cases} 1, & k = j \\ 0, & k \ne j \end{cases} \quad (j, k = 0, 1, \ldots, n) 
$$

- **$n$ 次插值基函数**——满足 (2.2.9) 的 $n+1$ 个 $n$ 次多项式 $l_j(x)$（$j = 0, 1, \ldots, n$），它们附着在节点 $x_k$ 上

类似推导得

$$
l_k(x) = \frac{(x-x_0)\cdots(x-x_{k-1})(x-x_{k+1})\cdots(x-x_n)}{(x_k-x_0)\cdots(x_k-x_{k-1})(x_k-x_{k+1})\cdots(x_k-x_n)},\quad k = 0, 1, \ldots, n
$$

**Lagrange 插值多项式**：

$$
L_n(x) = \sum_{k=0}^{n} y_k\, l_k(x) 
$$

代入易验证 $L_n(x_j) = y_j$。

引入

$$
\omega_{n+1}(x) = (x - x_0)(x - x_1) \cdots (x - x_n) 
$$

则 $\omega_{n+1}'(x_k) = (x_k - x_0)\cdots(x_k - x_{k-1})(x_k - x_{k+1})\cdots(x_k - x_n)$，式 (2.2.11) 可写成

$$
L_n(x) = \sum_{k=0}^{n} y_k\, \frac{\omega_{n+1}(x)}{(x - x_k)\, \omega_{n+1}'(x_k)} 
$$

> 注意：$n$ 次插值多项式 $L_n(x)$ 不一定恰好是 $n$ 次多项式，例如三点共线时 $L_2$ 实为一次多项式。

- **插值余项**——用 $L_n(x)$ 近似 $f(x)$ 时的截断误差 $R_n(x) = f(x) - L_n(x)$

> **定理 2.2**：设 $f^{(n)}(x)$ 在 $[a, b]$ 上连续，$f^{(n+1)}(x)$ 在 $(a, b)$ 内存在，节点 $a \le x_0 < x_1 < \cdots < x_n \le b$，$L_n(x)$ 是满足式 (2.2.8) 的插值多项式，则对任何 $x \in [a, b]$：
>
> $$
> R_n(x) = f(x) - L_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\, \omega_{n+1}(x),\quad \xi \in (a, b) 
> $$
>
> 这里 $\xi \in (a, b)$ 且依赖于 $x$。

**证**：$R_n(x_k) = 0$（$k = 0, \ldots, n$），故可设

$$
R_n(x) = K(x)\, (x - x_0)(x - x_1) \cdots (x - x_n) = K(x)\, \omega_{n+1}(x)
$$

把 $x$ 看成 $[a, b]$ 上一固定点，定义辅助函数

$$
\varphi(t) = f(t) - L_n(t) - K(x)\, (t - x_0)(t - x_1) \cdots (t - x_n)
$$

$\varphi(t)$ 在 $x_0, x_1, \ldots, x_n, x$ 处均为零，共 $n+2$ 个零点。由 Rolle 定理：$\varphi'(t)$ 至少有 $n+1$ 个零点，依此类推，$\varphi^{(n+1)}(t)$ 在 $(a, b)$ 内至少有 1 个零点 $\xi$，使 $\varphi^{(n+1)}(\xi) = 0$。代入：

$$
\varphi^{(n+1)}(\xi) = f^{(n+1)}(\xi) - (n+1)!\, K(x) = 0 \Longrightarrow K(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\;\blacksquare
$$

若已知 $\max\limits_{a \le x \le b} \lvert f^{(n+1)}(x)\rvert = M_{n+1}$，则

$$
\lvert R_n(x)\rvert \le \frac{M_{n+1}}{(n+1)!}\, \lvert\omega_{n+1}(x)\rvert 
$$

特例：

- $n = 1$：$R_1(x) = \tfrac{1}{2}\, f''(\xi)(x - x_0)(x - x_1)$
- $n = 2$：$R_2(x) = \tfrac{1}{6}\, f'''(\xi)(x - x_0)(x - x_1)(x - x_2)$

**例 2.1**：已知 $\sin 0.32 = 0.314567,\ \sin 0.34 = 0.333487,\ \sin 0.36 = 0.352274$，用线性插值及抛物插值求 $\sin 0.3367$ 并估计截断误差。

**线性插值（内插）**：取 $x_0 = 0.32,\ x_1 = 0.34$：

$$
\sin 0.3367 \approx L_1(0.3367) = 0.314567 + \frac{0.01892}{0.02} \times 0.0167 = 0.330365
$$

$$
\lvert R_1(0.3367)\rvert \le \frac{M_2}{2} \lvert 0.3367-0.32\rvert\cdot \lvert 0.3367-0.34\rvert \le \frac{0.3335}{2}\times 0.0167\times 0.0033 \le 0.92\times 10^{-5}
$$

其中 $M_2 = \max \lvert\sin x\rvert \le \sin 0.34 \le 0.3335$。

**线性插值（外推）**：取 $x_1 = 0.34,\ x_2 = 0.36$：

$$
\sin 0.3367 \approx \tilde L_1(0.3367) = 0.333487 + \frac{0.018787}{0.02}\times(-0.0033) = 0.330387
$$

$\lvert\tilde R_1(0.3367)\rvert \le \frac{0.3523}{2}\times 0.0033 \times 0.0233 \le 1.36\times 10^{-5}$。

**抛物插值**：

$$
\sin 0.3367 \approx L_2(0.3367) = 0.314567\times \tfrac{0.7689\times 10^{-3}}{0.0008} + 0.333487\times \tfrac{3.89\times 10^{-3}}{0.0004} + 0.352274\times \tfrac{-0.5511\times 10^{-3}}{0.0008} = 0.330374
$$

与六位有效数字的正弦函数表完全一致。截断误差：

$$
\lvert R_2(0.3367)\rvert \le \frac{M_3}{6}\times 0.0167\times 0.0033\times 0.0233 \le \frac{0.828}{6}\times \cdots \le 0.178\times 10^{-6}
$$

> 💡 高次插值通常优于低次插值。

**Lagrange 插值的优缺点**：

- ✓ 简单直观、容易实现
- ✗ 无法增量计算：增加插值节点，原计算结果全部不能复用，须重新计算

这正是引出**逐次线性插值**的动机。

### 3. 逐次线性插值

抛物插值计算 $\sin 0.3367$ 时，$L_2(0.3367)$ 亦可由 $L_1(0.3367)$ 和 $\tilde L_1(0.3367)$ 按类似线性插值的方法得到：

$$
L_2(0.3367) = L_1(0.3367) + \frac{\tilde L_1(0.3367) - L_1(0.3367)}{0.36 - 0.32}\times (0.3367 - 0.32) = 0.330365 + \tfrac{0.000022}{0.04}\times 0.0167 = 0.330374
$$

**推广**：两个 $k$ 次插值多项式可通过线性插值组合得到 $k+1$ 次插值多项式。

记 $I_{i_1, i_2, \ldots, i_k}(x)$ 为函数 $f(x)$ 关于节点 $x_{i_1}, x_{i_2}, \ldots, x_{i_k}$ 的 $k-1$ 次插值多项式，例如：

- $I_k(x)$ 是过 $x_k$ 的零次多项式，$I_k(x) = f(x_k)$
- $I_{0,1,\ldots,k}(x)$ 是过 $x_0, x_1, \ldots, x_k$ 的 $k$ 次多项式

**Aitken（艾特肯）逐次线性插值公式**：

$$
I_{0,1,\ldots,k,i}(x) = I_{0,1,\ldots,k}(x) + \frac{I_{0,1,\ldots,k-1,i}(x) - I_{0,1,\ldots,k}(x)}{x_i - x_k}\, (x - x_k) 
$$

可以验证：

- $x = x_j\ (j = 0, 1, \ldots, k-1)$：$I_{0,1,\ldots,k-1,i}(x_j) - I_{0,1,\ldots,k}(x_j) = 0$，故 $I_{0,1,\ldots,k,i}(x_j) = f(x_j)$
- $x = x_k$：$x_k - x_k = 0$，故 $I_{0,1,\ldots,k,i}(x_k) = I_{0,1,\ldots,k}(x_k) = f(x_k)$
- $x = x_i$：$I_{0,1,\ldots,k,i}(x_i) = I_{0,1,\ldots,k}(x_i) + \frac{f(x_i) - I_{0,1,\ldots,k}(x_i)}{x_i - x_k}(x_i - x_k) = f(x_i)$

**Aitken 表**（由 $k = 0$ 到 $k = n-1$ 逐次求得）：

| $x_i$ | $f(x_i)$ |   |   |   |   |
|-------|----------|---|---|---|---|
| $x_0$ | $I_0$    |   |   |   |   |
| $x_1$ | $I_1$    | $I_{0,1}$ |   |   |   |
| $x_2$ | $I_2$    | $I_{0,2}$ | $I_{0,1,2}$ |   |   |
| $x_3$ | $I_3$    | $I_{0,3}$ | $I_{0,1,3}$ | $I_{0,1,2,3}$ |   |
| $x_4$ | $I_4$    | $I_{0,4}$ | $I_{0,1,4}$ | $I_{0,1,2,4}$ | $I_{0,1,2,3,4}$ |

- 每增加一个节点就计算一行
- 斜线上是 1 次到 4 次插值多项式的值
- 如精度不满足要求，再增加节点，前面计算依然有效

**Neville（内维尔）逐次线性插值**（等价形式，下标连续）：

$$
I_{0,1,\ldots,k+1}(x) = I_{0,1,\ldots,k}(x) + \frac{I_{1,2,\ldots,k+1}(x) - I_{0,1,\ldots,k}(x)}{x_{k+1} - x_0}\, (x - x_0) 
$$

**Neville 表**：

| $x_i$ | $f(x_i)$ |   |   |   |   |
|-------|----------|---|---|---|---|
| $x_0$ | $I_0$    |   |   |   |   |
| $x_1$ | $I_1$    | $I_{0,1}$ |   |   |   |
| $x_2$ | $I_2$    | $I_{1,2}$ | $I_{0,1,2}$ |   |   |
| $x_3$ | $I_3$    | $I_{2,3}$ | $I_{1,2,3}$ | $I_{0,1,2,3}$ |   |
| $x_4$ | $I_4$    | $I_{3,4}$ | $I_{2,3,4}$ | $I_{1,2,3,4}$ | $I_{0,1,2,3,4}$ |

**例 2.2**：已知 $f(x) = \operatorname{sh} x$ 的值，用 Aitken 插值求 $\operatorname{sh}(0.23)$ 的近似值。

| $x_i$ | $f(x_i)$ |          |          |          |          |
|-------|----------|----------|----------|----------|----------|
| 0.00  | 0.00000  |          |          |          |          |
| 0.20  | 0.20134  | 0.231541 |          |          |          |
| 0.30  | 0.30452  | 0.233465 | 0.232118 |          |          |
| 0.50  | 0.52110  | 0.239706 | 0.232358 | 0.232034 |          |
| 0.60  | 0.63665  | 0.244049 | 0.232479 | 0.232034 | 0.232034 |

> 3 次插值的两个结果相同，故不必计算 4 次插值，得 $\operatorname{sh}(0.23) \approx 0.232034$。

### 4. 差商与 Newton 插值公式

Lagrange 插值基于两点式方程并以基函数推广；本节基于**点斜式方程**推导**增量式**插值公式。

**点斜式直线** $P_1(x) = f_0 + \frac{f_1 - f_0}{x_1 - x_0}(x - x_0)$ 推广到 $n+1$ 个节点：

$$
P_n(x) = a_0 + a_1(x - x_0) + a_2(x - x_0)(x - x_1) + \cdots + a_n(x - x_0)\cdots(x - x_{n-1}) 
$$

由 $P_n(x_i) = f_i$ 逐步确定：

- $x = x_0$：$a_0 = f_0$
- $x = x_1$：$a_1 = \dfrac{f_1 - f_0}{x_1 - x_0}$
- $x = x_2$：$a_2 = \dfrac{\frac{f_2 - f_0}{x_2 - x_0} - \frac{f_1 - f_0}{x_1 - x_0}}{x_2 - x_1}$
- $\ldots$

这正是**差商**的递归结构。

**定义 2.3**：

- **一阶差商**——$f(x)$ 关于 $x_0, x_k$ 的一阶差商定义为

$$
f[x_0, x_k] = \frac{f(x_k) - f(x_0)}{x_k - x_0}
$$

- **二阶差商**——$f(x)$ 关于 $x_0, x_1, x_k$ 的二阶差商定义为

$$
f[x_0, x_1, x_k] = \frac{f[x_0, x_k] - f[x_0, x_1]}{x_k - x_1}
$$

- **$k$ 阶差商**——$f(x)$ 的 $k$ 阶差商一般地定义为

$$
f[x_0, x_1, \ldots, x_k] = \frac{f[x_0, x_1, \ldots, x_{k-2}, x_k] - f[x_0, x_1, \ldots, x_{k-1}]}{x_k - x_{k-1}} 
$$

**差商的性质**：

**性质 1**（线性组合）：$k$ 阶差商可表示为函数值 $f(x_0), f(x_1), \ldots, f(x_k)$ 的线性组合

$$
f[x_0, x_1, \ldots, x_k] = \sum_{j=0}^{k} \frac{f(x_j)}{(x_j - x_0)\cdots(x_j - x_{j-1})(x_j - x_{j+1})\cdots(x_j - x_k)} 
$$

**性质 2**（对称性）：差商与节点排列顺序无关

$$
f[x_0, x_1, \ldots, x_k] = f[x_1, x_0, x_2, \ldots, x_k] = \cdots = f[x_1, x_2, \ldots, x_k, x_0]
$$

由对称性及 (2.4.2)：

$$
f[x_0, x_1, \ldots, x_k] = \frac{f[x_1, x_2, \ldots, x_k] - f[x_0, x_1, \ldots, x_{k-1}]}{x_k - x_0} 
$$

**性质 3**（与导数的关系）：若 $f(x)$ 在 $[a, b]$ 上 $n$ 阶可导，$x_0, x_1, \ldots, x_n \in [a, b]$，则

$$
f[x_0, x_1, \ldots, x_n] = \frac{f^{(n)}(\xi)}{n!},\quad \xi \in (a, b) 
$$

**差商表**（增量式计算，类似逐次线性插值）：

| $x_i$ | $f(x_i)$ | 一阶差商 | 二阶差商 | 三阶差商 | 四阶差商 |
|-------|----------|---------|---------|---------|---------|
| $x_0$ | $f(x_0)$ |         |         |         |         |
| $x_1$ | $f(x_1)$ | $f[x_0, x_1]$ |         |         |         |
| $x_2$ | $f(x_2)$ | $f[x_1, x_2]$ | $f[x_0, x_1, x_2]$ |         |         |
| $x_3$ | $f(x_3)$ | $f[x_2, x_3]$ | $f[x_1, x_2, x_3]$ | $f[x_0, x_1, x_2, x_3]$ |         |
| $x_4$ | $f(x_4)$ | $f[x_3, x_4]$ | $f[x_2, x_3, x_4]$ | $f[x_1, x_2, x_3, x_4]$ | $f[x_0, x_1, x_2, x_3, x_4]$ |

**Newton 插值公式**：根据一阶差商定义 $f(x) = f(x_0) + f[x, x_0](x - x_0)$，再代入高阶差商

$$
\begin{aligned}
f[x, x_0] &= f[x_0, x_1] + f[x, x_0, x_1](x - x_1) \\
&\;\vdots \\
f[x, x_0, \ldots, x_{n-1}] &= f[x_0, x_1, \ldots, x_n] + f[x, x_0, \ldots, x_n](x - x_n)
\end{aligned}
$$

逐步代入，可得

$$
f(x) = N_n(x) + R_n(x)
$$

**Newton 差商插值多项式**：

$$
\begin{aligned}
N_n(x) &= f(x_0) + f[x_0, x_1](x - x_0) + f[x_0, x_1, x_2](x - x_0)(x - x_1) + \cdots \\
&\quad + f[x_0, x_1, \ldots, x_n](x - x_0)(x - x_1)\cdots(x - x_{n-1})
\end{aligned} 
$$

**余项**：

$$
R_n(x) = f(x) - N_n(x) = f[x, x_0, x_1, \ldots, x_n]\, \omega_{n+1}(x) 
$$

由插值多项式唯一性，(2.4.7) 等价于 (2.2.14)，得

$$
f[x, x_0, \ldots, x_n] = \frac{f^{(n+1)}(\xi)}{(n+1)!}
$$

> 系数 $a_k = f[x_0, x_1, \ldots, x_k]$ 就是差商表对角线（或斜线）上的差商。Newton 公式比 Lagrange 节省计算量、便于程序设计，并具增量性：增加节点只需添加一项。

> 式 (2.4.7) 更具一般性：当 $f$ 由离散点给出或 $f^{(n+1)}$ 不存在时仍适用。

**例 2.3**：给出 $f(x)$ 函数表，求 4 次 Newton 插值多项式并计算 $f(0.596)$。

差商表：

| $x_i$ | $f(x_i)$ | 一阶差商 | 二阶差商 | 三阶差商 | 四阶差商 | 五阶差商 |
|-------|----------|---------|---------|---------|---------|---------|
| 0.40  | 0.41075  |         |         |         |         |         |
| 0.55  | 0.57815  | 1.11600 |         |         |         |         |
| 0.65  | 0.69675  | 1.18600 | 0.28000 |         |         |         |
| 0.80  | 0.88811  | 1.27573 | 0.35893 | 0.19733 |         |         |
| 0.90  | 1.02652  | 1.38410 | 0.43348 | 0.21300 | 0.03134 |         |
| 1.05  | 1.25382  | 1.51533 | 0.52493 | 0.22863 | 0.03126 | $-0.00012$ |

四阶差商接近常数，取 4 次插值多项式：

$$
\begin{aligned}
N_4(x) &= 0.41075 + 1.116(x - 0.4) + 0.28(x - 0.4)(x - 0.55) \\
&\quad + 0.19733(x - 0.4)(x - 0.55)(x - 0.65) \\
&\quad + 0.03134(x - 0.4)(x - 0.55)(x - 0.65)(x - 0.8)
\end{aligned}
$$

$f(0.596) \approx N_4(0.596) = 0.63195$。截断误差：

$$
\lvert R_4(0.596)\rvert \approx \lvert f[x_0, x_1, \ldots, x_5]\rvert\cdot \lvert\omega_5(0.596)\rvert \le 3.63\times 10^{-9}
$$

### 5. 差分与等距节点插值公式

若插值节点等距，则前述插值公式可进一步简化。

设 $y = f(x)$ 在等距节点 $x_k = x_0 + kh$（$k = 0, 1, \ldots, n$）上的值 $f_k = f(x_k)$ 为已知，$h$ 为常数：

- **步长**——相邻等距节点之间的固定间距 $h$

**定义 2.4**（一阶差分）：

$$
\begin{aligned}
\Delta f_k &= f_{k+1} - f_k & (\text{向前差分})  \\
\nabla f_k &= f_k - f_{k-1} & (\text{向后差分})  \\
\delta f_k &= f\!\left(x_k + \tfrac{h}{2}\right) - f\!\left(x_k - \tfrac{h}{2}\right) = f_{k+\frac{1}{2}} - f_{k-\frac{1}{2}} & (\text{中心差分}) 
\end{aligned}
$$

- **向前差分算子 $\Delta$**——把 $f_k$ 映为 $f_{k+1} - f_k$ 的算子
- **向后差分算子 $\nabla$**——把 $f_k$ 映为 $f_k - f_{k-1}$ 的算子
- **中心差分算子 $\delta$**——把 $f_k$ 映为 $f_{k+1/2} - f_{k-1/2}$ 的算子

**二阶及高阶差分**：

$$
\Delta^2 f_k = \Delta f_{k+1} - \Delta f_k = f_{k+2} - 2 f_{k+1} + f_k
$$

一般地 $\Delta^m f_k = \Delta^{m-1} f_{k+1} - \Delta^{m-1} f_k$，$\nabla^m f_k = \nabla^{m-1} f_k - \nabla^{m-1} f_{k-1}$。

中心差分的新形式：$\delta f_k = f_{k+\frac{1}{2}} - f_{k-\frac{1}{2}}$，二阶中心差分 $\delta^2 f_k = \delta f_{k+\frac{1}{2}} - \delta f_{k-\frac{1}{2}} = f_{k+1} + f_{k-1} - 2 f_k$。

**不变算子与移位算子**：

$$
I f_k = f_k,\quad E f_k = f_{k+1}
$$

因此 $\Delta f_k = (E - I) f_k$，即

$$
\Delta = E - I,\quad \nabla = I - E^{-1},\quad \delta = E^{\frac{1}{2}} - E^{-\frac{1}{2}}
$$

**性质 1**（差分↔函数值）：各阶差分均可用函数值表示

$$
\Delta^n f_k = (E - I)^n f_k = \sum_{j=0}^{n} (-1)^j \binom{n}{j} E^{n-j} f_k = \sum_{j=0}^{n} (-1)^j \binom{n}{j} f_{n+k-j} 
$$

$$
\nabla^n f_k = (I - E^{-1})^n f_k = \sum_{j=0}^{n} (-1)^j \binom{n}{j} f_{k-j} 
$$

其中 $\binom{n}{j} = \dfrac{n(n-1)\cdots(n-j+1)}{j!}$ 为二项式展开系数。

**性质 2**（函数值↔差分）：

$$
f_{n+k} = E^n f_k = (I + \Delta)^n f_k = \sum_{j=0}^{n} \binom{n}{j} \Delta^j f_k 
$$

**性质 3**（差商与差分的关系）：

$$
f[x_k, x_{k+1}] = \frac{f_{k+1} - f_k}{x_{k+1} - x_k} = \frac{\Delta f_k}{h}
$$

$$
f[x_k, x_{k+1}, x_{k+2}] = \frac{\frac{\Delta f_{k+1}}{h} - \frac{\Delta f_k}{h}}{2h} = \frac{1}{2 h^2}\, \Delta^2 f_k
$$

一般地

$$
f[x_k, x_{k+1}, \ldots, x_{k+m}] = \frac{1}{m!\, h^m}\, \Delta^m f_k \quad (m = 1, 2, \ldots, n) 
$$

向后差分形式：

$$
f[x_k, x_{k-1}, \ldots, x_{k-m}] = \frac{1}{m!\, h^m}\, \nabla^m f_k 
$$

结合 (2.5.7) 和 (2.4.5)，可得**差分与导数的关系**：

$$
\Delta^n f_k = h^n\, f^{(n)}(\xi),\quad \xi \in (x_k, x_{k+n}) 
$$

**差分表**（向前差分）：

| $x_i$ | $f_i$ | $\Delta$ | $\Delta^2$ | $\Delta^3$ | $\Delta^4$ |
|-------|-------|----------|------------|------------|------------|
| $x_0$ | $f_0$ | $\Delta f_0$ | $\Delta^2 f_0$ | $\Delta^3 f_0$ | $\Delta^4 f_0$ |
| $x_1$ | $f_1$ | $\Delta f_1$ | $\Delta^2 f_1$ | $\Delta^3 f_1$ | |
| $x_2$ | $f_2$ | $\Delta f_2$ | $\Delta^2 f_2$ | | |
| $x_3$ | $f_3$ | $\Delta f_3$ | | | |
| $x_4$ | $f_4$ | | | | |

**Newton 前插公式**：设节点 $x_k = x_0 + kh$，要计算 $x_0$ 附近 $x$ 的函数值。令 $x = x_0 + t h$（$0 \le t \le 1$），得

$$
\omega_{k+1}(x) = \prod_{j=0}^{k}(x - x_j) = t(t-1)\cdots(t-k)\, h^{k+1}
$$

代入 (2.4.6) 并利用 (2.5.7)：

$$
N_n(x_0 + t h) = f_0 + t\, \Delta f_0 + \frac{t(t-1)}{2!}\, \Delta^2 f_0 + \cdots + \frac{t(t-1)\cdots(t-n+1)}{n!}\, \Delta^n f_0 
$$

由 (2.2.14) 得余项

$$
R_n(x) = \frac{t(t-1)\cdots(t-n)}{(n+1)!}\, h^{n+1}\, f^{(n+1)}(\xi),\quad \xi \in (x_0, x_n) 
$$

**Newton 后插公式**：计算 $x_n$ 附近 $x$ 的函数值，节点按 $x_n, x_{n-1}, \ldots, x_0$ 顺序排列，作变换 $x = x_n + t h$（$-1 \le t \le 0$），利用 (2.5.8)：

$$
N_n(x_n + t h) = f_n + t\, \nabla f_n + \frac{t(t+1)}{2!}\, \nabla^2 f_n + \cdots + \frac{t(t+1)\cdots(t+n-1)}{n!}\, \nabla^n f_n 
$$

余项

$$
R_n(x) = \frac{t(t+1)\cdots(t+n)\, h^{n+1}}{(n+1)!}\, f^{(n+1)}(\xi),\quad \xi \in (x_0, x_n)
$$

> **应用动机**：很多工程设计计算需要查各种函数表，若把整个函数表存入内存往往占用太多空间，若用解析表达式近似又可能达不到精度要求；采用**存放大间隔函数表 + 插值公式**计算函数近似值是可行方案。

**例 2.4**：微电机设计中需查磁化曲线表 $at = f(B_m)$，磁密 $B_m$ 每间隔 500 高斯给出磁路每厘米所需安匝数 $at$。

| $i$ | $B_m$ | $at$ | $\Delta f$ | $\Delta^2 f$ | $\Delta^3 f$ |
|-----|-------|------|------------|--------------|--------------|
| 0   | 4000  | 1.38 | 0.10 | 0     | 0.01  |
| 1   | 4500  | 1.48 | 0.10 | 0.01  | 0     |
| 2   | 5000  | 1.58 | 0.11 | 0.01  | 0     |
| 3   | 5500  | 1.69 | 0.12 | 0.01  | 0.02  |
| 4   | 6000  | 1.81 | 0.13 | 0.03  | $-0.01$ |
| 5   | 6500  | 1.94 | 0.16 | 0.02  | 0.02  |
| 6   | 7000  | 2.10 | 0.18 | 0.04  | 0     |
| 7   | 7500  | 2.28 | 0.22 | 0.04  | 0     |
| 8   | 8000  | 2.50 | 0.26 | 0.04  | 0.01  |
| 9   | 8500  | 2.76 | 0.30 | 0.05  | 0.02  |
| 10  | 9000  | 3.06 | 0.35 | 0.07  | 0.01  |
| 11  | 9500  | 3.41 | 0.42 | 0.08  | 0.02  |
| 12  | 10000 | 3.83 | 0.50 | 0.10  |       |
| 13  | 10500 | 4.33 | 0.60 |       |       |
| 14  | 11000 | 4.93 |      |       |       |

三阶差分近似为 0，计算时只用二阶差分（$n = 2$）。求 $f(5200)$：取 $B_0 = 5000,\ f_0 = 1.58,\ \Delta f_0 = 0.11,\ \Delta^2 f_0 = 0.01$，$h = 500,\ t = 0.4$，由 (2.5.10)：

$$
f(5200) \approx 1.58 + 0.4\times 0.11 + \frac{0.4\times(-0.6)}{2}\times 0.01 \approx 1.62
$$

> 当 $4000 \le B_m \le 10500$ 用 Newton 前插；当 $10500 < B_m \le 11000$ 因前插缺少信息，用 Newton 后插。

### 6. Hermite 插值

不少实际问题不仅要求节点上函数值相等，还要求导数值相等，甚至高阶导数值也相等。

设在节点 $a \le x_0 < x_1 < \cdots < x_n \le b$ 上 $y_j = f(x_j)$，$m_j = f'(x_j)$（$j = 0, 1, \ldots, n$），插值多项式 $H(x)$ 满足

$$
H(x_j) = y_j,\quad H'(x_j) = m_j \quad (j = 0, 1, \ldots, n) 
$$

一个节点 2 个条件，共 $2n + 2$ 个条件，可唯一确定次数不超过 $2n + 1$ 的多项式 $H_{2n+1}(x)$。

**基函数方法**：设置 $2n + 2$ 个插值基函数 $\alpha_j(x),\ \beta_j(x)$，均为 $2n + 1$ 次多项式，满足

$$
\begin{aligned}
\alpha_j(x_k) &= \delta_{jk},\quad \alpha_j'(x_k) = 0 \\
\beta_j(x_k) &= 0,\quad \beta_j'(x_k) = \delta_{jk}
\end{aligned} \quad (j, k = 0, 1, \ldots, n) 
$$

**Hermite 插值多项式**：

$$
H_{2n+1}(x) = \sum_{j=0}^{n}\bigl[y_j\, \alpha_j(x) + m_j\, \beta_j(x)\bigr] 
$$

显然满足条件 $H_{2n+1}(x_k) = y_k,\ H_{2n+1}'(x_k) = m_k$。

**基函数求解**：$\alpha_j(x)$ 是 $2n + 1$ 次多项式且过 $x_0, x_1, \ldots, x_{j-1}, x_{j+1}, \ldots, x_n$ 二重根，故设

$$
\alpha_j(x) = (a x + b)\, l_j^2(x)
$$

其中 $l_j(x)$ 是 Lagrange 插值基函数。由 (2.6.2) 得

$$
\begin{aligned}
\alpha_j(x_j) &= (a x_j + b)\, l_j^2(x_j) = a x_j + b = 1 \\
\alpha_j'(x_j) &= a\, l_j^2(x_j) + 2 (a x_j + b)\, l_j(x_j)\, l_j'(x_j) = a + 2\, l_j'(x_j) = 0
\end{aligned}
$$

解得 $a = -2\, l_j'(x_j),\ b = 1 + 2 x_j\, l_j'(x_j)$。

对 $l_j(x) = \prod_{i \ne j}\dfrac{x - x_i}{x_j - x_i}$ 两边取对数求导：

$$
\frac{l_j'(x)}{l_j(x)} = \sum_{i \ne j}\frac{1}{x - x_i} \Longrightarrow l_j'(x_j) = \sum_{i \ne j}\frac{1}{x_j - x_i}
$$

进而

$$
\alpha_j(x) = \left[1 - 2(x - x_j)\sum_{i \ne j}\frac{1}{x_j - x_i}\right] l_j^2(x) 
$$

同理可推

$$
\beta_j(x) = (x - x_j)\, l_j^2(x) 
$$

**唯一性**（反证法）：假设 $H_{2n+1}(x)$ 与 $\tilde H_{2n+1}(x)$ 均满足 (2.6.1)，定义 $\varphi(x) = H_{2n+1}(x) - \tilde H_{2n+1}(x)$。$\varphi$ 在每个节点 $x_j$ 上均为二重根，共 $2n + 2$ 重根；但 $\varphi$ 是不高于 $2n + 1$ 次的多项式，由代数基本定理 $\varphi \equiv 0$。

**插值余项**：若 $f^{(2n+2)}(x)$ 在 $(a, b)$ 内存在

$$
R(x) = f(x) - H_{2n+1}(x) = \frac{f^{(2n+2)}(\xi)}{(2n+2)!}\, \omega_{n+1}^2(x) 
$$

$\xi \in (a, b)$ 与 $x$ 有关。

**两点三次 Hermite 插值（$n = 1$）**：最常用、最重要的特例。取节点 $x_k, x_{k+1}$，多项式 $H_3(x)$ 满足

$$
\begin{aligned}
H_3(x_k) &= y_k,\ H_3(x_{k+1}) = y_{k+1} \\
H_3'(x_k) &= m_k,\ H_3'(x_{k+1}) = m_{k+1}
\end{aligned} 
$$

由 (2.6.4)、(2.6.5)：

$$
\begin{aligned}
\alpha_k(x) &= \left(1 + 2\, \frac{x - x_k}{x_{k+1} - x_k}\right)\left(\frac{x - x_{k+1}}{x_k - x_{k+1}}\right)^{\!2} \\
\alpha_{k+1}(x) &= \left(1 + 2\, \frac{x - x_{k+1}}{x_k - x_{k+1}}\right)\left(\frac{x - x_k}{x_{k+1} - x_k}\right)^{\!2}
\end{aligned} 
$$

$$
\begin{aligned}
\beta_k(x) &= (x - x_k)\left(\frac{x - x_{k+1}}{x_k - x_{k+1}}\right)^{\!2} \\
\beta_{k+1}(x) &= (x - x_{k+1})\left(\frac{x - x_k}{x_{k+1} - x_k}\right)^{\!2}
\end{aligned} 
$$

两点三次 Hermite 插值多项式：

$$
H_3(x) = y_k\, \alpha_k(x) + y_{k+1}\, \alpha_{k+1}(x) + m_k\, \beta_k(x) + m_{k+1}\, \beta_{k+1}(x) 
$$

余项：

$$
R(x) = f(x) - H_3(x) = \frac{f^{(4)}(\xi)}{4!}\, (x - x_k)^2 (x - x_{k+1})^2
$$

**例 2.5**：求满足 $P(x_j) = f(x_j)$（$j = 0, 1, 2$）及 $P'(x_1) = f'(x_1)$ 的插值多项式及其余项。

3 + 1 个等式可确定次数不超过 3 的多项式 $P$。前 3 个插值条件类似 Newton 差商插值，再补一个含待定常数 $A$ 的修正项：

$$
P(x) = f(x_0) + f[x_0, x_1](x - x_0) + f[x_0, x_1, x_2](x - x_0)(x - x_1) + A(x - x_0)(x - x_1)(x - x_2)
$$

由 $P'(x_1) = f'(x_1)$：

$$
P'(x_1) = f[x_0, x_1] + f[x_0, x_1, x_2](x_1 - x_0) + A(x_1 - x_0)(x_1 - x_2) = f'(x_1)
$$

解出

$$
A = \frac{f'(x_1) - f[x_0, x_1] - (x_1 - x_0)\, f[x_0, x_1, x_2]}{(x_1 - x_0)(x_1 - x_2)}
$$

**余项**：设 $R(x) = f(x) - P(x) = K(x)\, (x - x_0)(x - x_1)^2 (x - x_2)$，构造辅助函数

$$
\varphi(t) = f(t) - P(t) - K(x)\, (t - x_0)(t - x_1)^2 (t - x_2)
$$

$\varphi(x_j) = 0$（$j = 0, 1, 2$），$\varphi'(x_1) = 0$，$\varphi(x) = 0$，故 $\varphi$ 在 $(a, b)$ 上有 5 个零点（$x_1$ 算二重根）。由 Rolle 定理逐次求导，$\varphi^{(4)}$ 在 $(a, b)$ 内至少有一个零点 $\xi$，$\varphi^{(4)}(\xi) = f^{(4)}(\xi) - 4!\, K(x) = 0$，得 $K(x) = \dfrac{f^{(4)}(\xi)}{4!}$，故

$$
R(x) = \frac{f^{(4)}(\xi)}{4!}\, (x - x_0)(x - x_1)^2 (x - x_2)
$$

其中 $\xi$ 位于 $x_0, x_1, x_2$ 和 $x$ 界定的范围内。

### 7. 分段低次插值

根据区间 $[a, b]$ 上给出的节点构造插值多项式 $L_n(x)$ 近似 $f(x)$，次数 $n$ 是否越高逼近程度越好？✗ 对于任意插值节点，当 $n \to \infty$，$L_n(x)$ **未必收敛**。

**Runge（龙格）现象**：函数 $f(x) = \dfrac{1}{1 + x^2}$，在 $[-5, 5]$ 上各阶导数均存在。取等距节点 $x_k = -5 + \dfrac{10 k}{n}$（$k = 0, 1, \ldots, n$），构造 Lagrange 插值多项式 $L_n(x)$，则当 $n \to \infty$ 时 $L_n$ 只在 $\lvert x\rvert \le 3.63$ 内收敛，区间外发散。取 $n = 10$ 时在 $x = \pm 5$ 附近 $L_{10}(x)$ 与 $f(x)$ 偏差较大，说明**高次插值未必更好**。

> 改进思路：用分段折线 / 分段低次多项式连接节点逼近 $f$，避免高次振荡。

**分段线性插值**：将插值点用折线段连接逼近 $f(x)$。已知节点 $a = x_0 < x_1 < \cdots < x_n = b$ 上的 $f_0, f_1, \ldots, f_n$，记 $h_k = x_{k+1} - x_k,\ h = \max_k h_k$。

- **分段线性插值函数**——满足以下三条的函数 $I_h(x)$：
  - $I_h(x) \in C[a, b]$
  - $I_h(x_k) = f_k$（$k = 0, 1, \ldots, n$）
  - $I_h(x)$ 在每个区间 $[x_k, x_{k+1}]$ 上是线性函数

$I_h(x)$ 在 $[x_k, x_{k+1}]$ 上可表示为

$$
I_h(x) = \frac{x - x_{k+1}}{x_k - x_{k+1}}\, f_k + \frac{x - x_k}{x_{k+1} - x_k}\, f_{k+1},\quad x_k \le x \le x_{k+1} 
$$

用插值基函数表示：

$$
I_h(x) = \sum_{j=0}^{n} f_j\, l_j(x) 
$$

$l_j(x)$ 满足 $l_j(x_k) = \delta_{jk}$，呈"帐篷形"：

$$
l_j(x) = \begin{cases}
\dfrac{x - x_{j-1}}{x_j - x_{j-1}}, & x_{j-1} \le x \le x_j\quad (j = 0 \text{ 略去}) \\
\dfrac{x - x_{j+1}}{x_j - x_{j+1}}, & x_j \le x \le x_{j+1}\quad (j = n \text{ 略去}) \\
0, & x \in [a, b],\ x \notin [x_{j-1}, x_{j+1}]
\end{cases} 
$$

**局部非零性质**：$l_j(x)$ 只在 $x_j$ 附近不为零。当 $x \in [x_k, x_{k+1}]$ 时

$$
1 = \sum_{j=0}^{n} l_j(x) = l_k(x) + l_{k+1}(x),\quad I_h(x) = f_k\, l_k(x) + f_{k+1}\, l_{k+1}(x)
$$

**收敛性证明**：当 $x \in [x_k, x_{k+1}]$ 时

$$
\begin{aligned}
\lvert f(x) - I_h(x)\rvert &= \lvert [l_k(x) + l_{k+1}(x)] f(x) - f_k\, l_k(x) - f_{k+1}\, l_{k+1}(x)\rvert \\
&\le l_k(x)\lvert f(x) - f_k\rvert + l_{k+1}(x)\lvert f(x) - f_{k+1}\rvert \\
&\le [l_k(x) + l_{k+1}(x)]\, \omega_f(h) = \omega_f(h)
\end{aligned}
$$

其中 $\omega_f(h)$ 是 $f$ 在 $[a, b]$ 上的**连续模**：对任意 $x', x'' \in [a, b]$，$\lvert x' - x''\rvert \le h \Rightarrow \lvert f(x') - f(x'')\rvert \le \omega_f(h)$。当 $f \in C[a, b]$ 时 $\lim\limits_{h \to 0}\omega_f(h) = 0$，故 $\lim\limits_{h \to 0} I_h(x) = f(x)$。

**分段三次 Hermite 插值**：分段线性插值导数间断、函数连续但不光滑。改进思路：除节点函数值外，也考虑节点导数值 $f_k' = m_k$，构造导数连续的分段插值函数。

- **分段三次 Hermite 插值函数**——满足以下三条的函数 $I_h(x)$：
  - $I_h(x) \in C^1[a, b]$
  - $I_h(x_k) = f_k,\ I_h'(x_k) = f_k'$（$k = 0, 1, \ldots, n$）
  - $I_h(x)$ 在每个 $[x_k, x_{k+1}]$ 上是三次多项式

由两点三次 Hermite (2.6.10)，$I_h(x)$ 在 $[x_k, x_{k+1}]$ 上：

$$
\begin{aligned}
I_h(x) ={} & \left(1 + 2\, \frac{x - x_k}{x_{k+1} - x_k}\right)\left(\frac{x - x_{k+1}}{x_k - x_{k+1}}\right)^{\!2} f_k \\
& + \left(1 + 2\, \frac{x - x_{k+1}}{x_k - x_{k+1}}\right)\left(\frac{x - x_k}{x_{k+1} - x_k}\right)^{\!2} f_{k+1} \\
& + \left(\frac{x - x_{k+1}}{x_k - x_{k+1}}\right)^{\!2} (x - x_k)\, f_k' + \left(\frac{x - x_k}{x_{k+1} - x_k}\right)^{\!2} (x - x_{k+1})\, f_{k+1}'
\end{aligned} 
$$

在整个 $[a, b]$ 上定义一组分段三次插值基函数 $\alpha_j(x), \beta_j(x)$：

$$
I_h(x) = \sum_{j=0}^{n}\bigl[f_j\, \alpha_j(x) + f_j'\, \beta_j(x)\bigr] 
$$

它们都是局部非零的三次函数（详见 2.7.7、2.7.8）：

$$
\alpha_j(x) = \begin{cases}
\left(1 + 2\, \dfrac{x - x_j}{x_{j-1} - x_j}\right)\left(\dfrac{x - x_{j-1}}{x_j - x_{j-1}}\right)^{\!2}, & x_{j-1} \le x \le x_j \\
\left(1 + 2\, \dfrac{x - x_j}{x_{j+1} - x_j}\right)\left(\dfrac{x - x_{j+1}}{x_j - x_{j+1}}\right)^{\!2}, & x_j \le x \le x_{j+1} \\
0, & \text{其他}
\end{cases} 
$$

$$
\beta_j(x) = \begin{cases}
(x - x_j)\left(\dfrac{x - x_{j-1}}{x_j - x_{j-1}}\right)^{\!2}, & x_{j-1} \le x \le x_j \\
(x - x_j)\left(\dfrac{x - x_{j+1}}{x_j - x_{j+1}}\right)^{\!2}, & x_j \le x \le x_{j+1} \\
0, & \text{其他}
\end{cases} 
$$

**收敛性**：$\alpha_j, \beta_j$ 的局部非零性质：当 $x \in [x_k, x_{k+1}]$ 时

$$
I_h(x) = f_k\, \alpha_k(x) + f_{k+1}\, \alpha_{k+1}(x) + f_k'\, \beta_k(x) + f_{k+1}'\, \beta_{k+1}(x) 
$$

依 (2.7.7) 可知 $0 \le \alpha_j(x) \le 1$ (2.7.10)，且

$$
\lvert\beta_k(x)\rvert \le \tfrac{4}{27}\, h_k,\quad \lvert\beta_{k+1}(x)\rvert \le \tfrac{4}{27}\, h_k 
$$

可验证 $\alpha_k(x) + \alpha_{k+1}(x) = 1$ (2.7.12)。结合误差估计

$$
\begin{aligned}
\lvert f(x) - I_h(x)\rvert &\le \alpha_k(x)\lvert f(x) - f_k\rvert + \alpha_{k+1}(x)\lvert f(x) - f_{k+1}\rvert + \tfrac{4}{27} h_k(\lvert f_k'\rvert + \lvert f_{k+1}'\rvert) \\
&\le \omega_f(h) + \frac{8 h}{27}\, \max\{\lvert f_k'\rvert, \lvert f_{k+1}'\rvert\}
\end{aligned}
$$

对 $x \in [a, b]$：

$$
\lvert f(x) - I_h(x)\rvert \le \omega_f(h) + \frac{8 h}{27}\, \max_{0 \le k \le n}\lvert f_k'\rvert 
$$

故当 $f \in C[a, b]$ 时 $\lim\limits_{h \to 0} I_h(x) = f(x)$，算法收敛。

### 8. 三次样条插值

分段低次插值的不足：

- 函数一致收敛，但**光滑性较差**
- 分段三次 Hermite 需要知道各节点导数值

早期工程师制图时把富有弹性的细长木条（样条）用压铁固定在样点上，其他地方让它自由弯曲，画下来的曲线由分段三次曲线并接而成，在连接点上**二阶导数连续**：

- **样条曲线**——上述由分段三次曲线并接、连接点处二阶导数连续的曲线

**定义 2.5**：设 $a = x_0 < x_1 < \cdots < x_n = b$ 是给定节点，函数 $S(x)$ 满足

- $S(x) \in C^2[a, b]$
- 在每个小区间 $[x_j, x_{j+1}]$ 上是三次多项式

且若在节点 $x_j$ 上给定 $y_j = f(x_j)$，进一步满足

$$
S(x_j) = y_j \quad (j = 0, 1, \ldots, n) 
$$

则有以下

- **三次样条函数**——满足前两条（光滑性 + 分段三次）的 $S(x)$
- **三次插值样条函数**——在三次样条函数基础上，进一步满足插值条件 (2.8.1) 的 $S(x)$

**条件计数**：

- $S(x)$ 在每个小区间是三次多项式 → 每段 4 个系数，共 $n$ 段 → $4n$ 个参数
- $S(x) \in C^2[a, b]$ 在内部节点 $x_j$（$j = 1, \ldots, n-1$）满足连续性条件
  $$
  S(x_j - 0) = S(x_j + 0),\ \ S'(x_j - 0) = S'(x_j + 0),\ \ S''(x_j - 0) = S''(x_j + 0) 
  $$
  共 $3(n - 1) = 3n - 3$ 个条件
- 插值条件 (2.8.1) 提供 $n + 1$ 个条件

共 $4n - 2$ 个条件，还需 2 个**边界条件**确定 $S(x)$。常见三类：

**(a) 已知两端一阶导数值**：

$$
S'(x_0) = f_0',\quad S'(x_n) = f_n' 
$$

**(b) 已知两端二阶导数值**：

$$
S''(x_0) = f_0'',\quad S''(x_n) = f_n'' 
$$

特别地，$S''(x_0) = S''(x_n) = 0$ 的特殊情形：

- **自然边界条件**——两端二阶导数同时取零的边界条件 $S''(x_0) = S''(x_n) = 0$

**(c) 周期边界条件**：假设 $f(x)$ 以 $x_n - x_0$ 为周期，则

$$
\begin{aligned}
S(x_0 + 0) &= S(x_n - 0) \\
S'(x_0 + 0) &= S'(x_n - 0) \\
S''(x_0 + 0) &= S''(x_n - 0)
\end{aligned} 
$$

此时还是 2 个独立条件（插值条件已蕴含 $S(x_0) = S(x_n)$）。

#### 三转角方程（$m$ 形式）

假定 $S'(x_j) = m_j$（实际未知），由分段三次 Hermite (2.7.6) 可得

$$
S(x) = \sum_{j=0}^{n}\bigl[y_j\, \alpha_j(x) + m_j\, \beta_j(x)\bigr] 
$$

$S(x), S'(x)$ 在 $[a, b]$ 上连续且满足 (2.8.1)。下面利用**二阶导数连续**条件求 $m_j$。

记 $h_j = x_{j+1} - x_j$。$S(x)$ 在 $[x_j, x_{j+1}]$ 上的表达式：

$$
\begin{aligned}
S(x) ={} & \frac{(x - x_{j+1})^2 [h_j + 2(x - x_j)]}{h_j^3}\, y_j + \frac{(x - x_j)^2 [h_j + 2(x_{j+1} - x)]}{h_j^3}\, y_{j+1} \\
& + \frac{(x - x_{j+1})^2 (x - x_j)}{h_j^2}\, m_j + \frac{(x - x_j)^2 (x - x_{j+1})}{h_j^2}\, m_{j+1}
\end{aligned} 
$$

求二阶导：

$$
S''(x) = \frac{6x - 2 x_j - 4 x_{j+1}}{h_j^2}\, m_j + \frac{6x - 4 x_j - 2 x_{j+1}}{h_j^2}\, m_{j+1} + \frac{6(x_j + x_{j+1} - 2x)}{h_j^3}(y_{j+1} - y_j)
$$

代入端点：

$$
S''(x_j + 0) = -\frac{4}{h_j}\, m_j - \frac{2}{h_j}\, m_{j+1} + \frac{6}{h_j^2}(y_{j+1} - y_j)
$$

类似地，在区间 $[x_{j-1}, x_j]$ 上：

$$
S''(x_j - 0) = \frac{2}{h_{j-1}}\, m_{j-1} + \frac{4}{h_{j-1}}\, m_j - \frac{6}{h_{j-1}^2}(y_j - y_{j-1})
$$

由 $S''(x_j - 0) = S''(x_j + 0)$（$j = 1, 2, \ldots, n - 1$），可得 $m_j$ 满足

$$
\frac{1}{h_{j-1}}\, m_{j-1} + 2\!\left(\frac{1}{h_{j-1}} + \frac{1}{h_j}\right)\! m_j + \frac{1}{h_j}\, m_{j+1} = 3\!\left(\frac{y_j - y_{j-1}}{h_{j-1}^2} + \frac{y_{j+1} - y_j}{h_j^2}\right) 
$$

化简为

$$
\lambda_j\, m_{j-1} + 2 m_j + \mu_j\, m_{j+1} = g_j \quad (j = 1, 2, \ldots, n - 1) 
$$

其中

$$
\lambda_j = \frac{h_j}{h_{j-1} + h_j},\quad \mu_j = \frac{h_{j-1}}{h_{j-1} + h_j} 
$$

$$
g_j = 3\bigl[\lambda_j\, f[x_{j-1}, x_j] + \mu_j\, f[x_j, x_{j+1}]\bigr] 
$$

(2.8.9) 是关于 $n + 1$ 个未知数 $m_0, m_1, \ldots, m_n$ 的 $n - 1$ 个方程，再利用 2 个边界条件。

**边界条件 (2.8.3)**：$m_0 = f_0',\ m_n = f_n'$，矩阵形式

$$
\begin{pmatrix}
2 & \mu_1 & 0 & \cdots & \cdots & 0 \\
\lambda_2 & 2 & \mu_2 & \ddots & & \vdots \\
0 & \lambda_3 & 2 & \mu_3 & \ddots & \vdots \\
\vdots & \ddots & \ddots & \ddots & \ddots & 0 \\
0 & & \ddots & \lambda_{n-2} & 2 & \mu_{n-2} \\
0 & \cdots & \cdots & 0 & \lambda_{n-1} & 2
\end{pmatrix}
\begin{pmatrix} m_1 \\ m_2 \\ m_3 \\ \vdots \\ m_{n-2} \\ m_{n-1} \end{pmatrix}
=
\begin{pmatrix} g_1 - \lambda_1 f_0' \\ g_2 \\ g_3 \\ \vdots \\ g_{n-2} \\ g_{n-1} - \mu_{n-1} f_n' \end{pmatrix} 
$$

**边界条件 (2.8.4)**：$S''(x_0) = f_0'',\ S''(x_n) = f_n''$，可推得

$$
\begin{cases}
2 m_0 + m_1 = 3 f[x_0, x_1] - \dfrac{h_0}{2}\, f_0'' = g_0 \\
m_{n-1} + 2 m_n = 3 f[x_{n-1}, x_n] + \dfrac{h_{n-1}}{2}\, f_n'' = g_n
\end{cases} 
$$

矩阵形式

$$
\begin{pmatrix}
2 & 1 & 0 & \cdots & \cdots & 0 \\
\lambda_1 & 2 & \mu_1 & \ddots & & \vdots \\
0 & \lambda_2 & 2 & \mu_2 & \ddots & \vdots \\
\vdots & \ddots & \ddots & \ddots & \ddots & 0 \\
\vdots & & \ddots & \lambda_{n-1} & 2 & \mu_{n-1} \\
0 & \cdots & \cdots & 0 & 1 & 2
\end{pmatrix}
\begin{pmatrix} m_0 \\ m_1 \\ \vdots \\ \vdots \\ m_{n-1} \\ m_n \end{pmatrix}
=
\begin{pmatrix} g_0 \\ g_1 \\ \vdots \\ \vdots \\ g_{n-1} \\ g_n \end{pmatrix} 
$$

**周期边界条件 (2.8.5)**：$m_0 = m_n$，由内部点连续得 $\mu_n m_1 + \lambda_n m_{n-1} + 2 m_n = g_n$，其中

$$
\mu_n = \frac{h_0}{h_0 + h_{n-1}},\quad \lambda_n = \frac{h_{n-1}}{h_0 + h_{n-1}},\quad g_n = 3\bigl[\mu_n f[x_0, x_1] + \lambda_n f[x_{n-1}, x_n]\bigr]
$$

矩阵形式

$$
\begin{pmatrix}
2 & \mu_1 & 0 & \cdots & \lambda_1 \\
\lambda_2 & 2 & \mu_2 & \ddots & \vdots \\
0 & \lambda_3 & \ddots & \ddots & 0 \\
\vdots & \ddots & \ddots & 2 & \mu_{n-1} \\
\mu_n & \cdots & 0 & \lambda_n & 2
\end{pmatrix}
\begin{pmatrix} m_1 \\ m_2 \\ \vdots \\ m_{n-1} \\ m_n \end{pmatrix}
=
\begin{pmatrix} g_1 \\ g_2 \\ \vdots \\ g_{n-1} \\ g_n \end{pmatrix} 
$$

> 这些方程组中每个方程都联系三个 $m_j$。$m_j$ 在力学上解释为细梁在 $x_j$ 截面处的**转角**，故得名——
>
> - **三转角方程**——以节点一阶导数 $m_j$ 为未知量、每个方程关联三个相邻 $m_j$ 的三对角线性方程组（即 (2.8.12)、(2.8.14)、(2.8.15)）
>
> 系数矩阵对角元为 2，非对角元 $\mu_j + \lambda_j = 1$，**严格对角占优**，方程组均有唯一解，可用**追赶法**求解。

#### 三弯矩方程（$M$ 形式）

设 $S''(x_j) = M_j$（$j = 0, 1, \ldots, n$）。$S(x)$ 在 $[x_j, x_{j+1}]$ 上是三次多项式，故 $S''(x)$ 在该区间是线性函数：

$$
S''(x) = \frac{x_{j+1} - x}{h_j}\, M_j + \frac{x - x_j}{h_j}\, M_{j+1} 
$$

对 $S''(x)$ 积分两次并利用 $S(x_j) = y_j,\ S(x_{j+1}) = y_{j+1}$ 确定积分常数：

$$
\begin{aligned}
S(x) ={} & \frac{(x_{j+1} - x)^3}{6 h_j}\, M_j + \frac{(x - x_j)^3}{6 h_j}\, M_{j+1} \\
& + \left(y_j - \frac{M_j\, h_j^2}{6}\right)\frac{x_{j+1} - x}{h_j} + \left(y_{j+1} - \frac{M_{j+1}\, h_j^2}{6}\right)\frac{x - x_j}{h_j}
\end{aligned} 
$$

求导

$$
S'(x) = -M_j\, \frac{(x_{j+1} - x)^2}{2 h_j} + M_{j+1}\, \frac{(x - x_j)^2}{2 h_j} + \frac{y_{j+1} - y_j}{h_j} - \frac{M_{j+1} - M_j}{6}\, h_j 
$$

得

$$
\begin{aligned}
S'(x_j + 0) &= -\frac{h_j}{3}\, M_j - \frac{h_j}{6}\, M_{j+1} + \frac{y_{j+1} - y_j}{h_j} \\
S'(x_j - 0) &= \frac{h_{j-1}}{6}\, M_{j-1} + \frac{h_{j-1}}{3}\, M_j + \frac{y_j - y_{j-1}}{h_{j-1}}
\end{aligned}
$$

由 $S'(x_j - 0) = S'(x_j + 0)$ 得

$$
\mu_j\, M_{j-1} + 2 M_j + \lambda_j\, M_{j+1} = d_j \quad (j = 1, 2, \ldots, n - 1) 
$$

其中 $\lambda_j, \mu_j$ 仍由 (2.8.10) 给出，

$$
d_j = 6\, f[x_{j-1}, x_j, x_{j+1}] 
$$

方程 (2.8.19) 与 (2.8.9) 结构完全类似。

- 取边界条件 (2.8.3)：

$$
2 M_0 + M_1 = \frac{6}{h_0}\bigl[f[x_0, x_1] - f_0'\bigr],\quad M_{n-1} + 2 M_n = \frac{6}{h_{n-1}}\bigl[f_n' - f[x_{n-1}, x_n]\bigr]
$$

- 取边界条件 (2.8.4)：$M_0 = f_0'',\ M_n = f_n''$

> $M_j$ 在力学上解释为细梁在 $x_j$ 截面处的**弯矩**，且与两个相邻的弯矩有关，故得名——
>
> - **三弯矩方程**——以节点二阶导数 $M_j$ 为未知量、每个方程关联三个相邻 $M_j$ 的三对角线性方程组
>
> 同样可用追赶法求出 $M_j$，代入 (2.8.17) 得到 $S(x)$。

**计算步骤**（以 (2.8.12) 为例）：

1. 输入初始数据 $x_j, y_j$（$j = 0, 1, \ldots, n$）及 $f_0', f_n'$ 和 $n$
2. 对 $j = 0$ 到 $n - 1$ 计算 $h_j = x_{j+1} - x_j$ 及 $f[x_j, x_{j+1}]$
3. 对 $j = 1$ 到 $n - 1$ 由 (2.8.10) 及 (2.8.11) 计算 $\lambda_j, \mu_j, g_j$
4. 用**追赶法**（参见 7.4.3 节）解方程 (2.8.12)，求出 $m_j$
5. 计算 $S(x)$ 的系数或在若干点上的值

**Runge 比较**：给定 $f(x) = \dfrac{1}{1 + x^2}$，$x \in [-5, 5]$，节点 $x_k = -5 + k$（$k = 0, 1, \ldots, 10$），用三次样条插值求 $S_{10}(x)$，取边界条件 $S_{10}'(-5) = f'(-5),\ S_{10}'(5) = f'(5)$。结果显示 $S_{10}(x)$ 能很好地逼近 $f(x)$，**不会出现 $L_{10}(x)$ 那样的 Runge 现象**。

> **定理 2.3**：若 $f(x) \in C[a, b]$，$S(x)$ 是以 $a = x_0 < x_1 < \cdots < x_n = b$ 为节点，满足条件 (2.8.1) 及 (2.8.4)′ 的三次样条插值函数，令
>
> $$
> h_j = x_{j+1} - x_j,\quad h = \max_{0 \le j \le n-1} h_j,\quad \delta = \min_{0 \le j \le n-1} h_j
> $$
>
> 设 $h / \delta < \infty$，则 $S(x)$ 在 $[a, b]$ 上**一致收敛**到 $f(x)$。

---

**第二章总结**：

- **Lagrange 插值**：插值多项式的唯一性、$n$ 次插值基函数、插值余项
- **逐次线性插值**：Aitken 逐次线性插值公式、Neville 算法
- **差商与 Newton 插值公式**：差商的定义和性质、Newton 差商插值多项式
- **差分与等距节点插值公式**：差分的定义和性质、Newton 前（后）插公式
- **Hermite 插值**：插值多项式、基函数、两点三次 Hermite 插值多项式
- **分段低次插值**：分段线性插值、分段三次 Hermite 插值、收敛性分析
- **三次样条插值**：三次样条函数、三转角方程、三弯矩方程

## 三.函数逼近与计算

### 1. 引言与预备知识

对已知函数 $f(x)$，希望求出便于计算且计算量省的公式来近似 $f(x)$。

- **Taylor 展开部分和**：$P_n(x) = f(x_0) + \dfrac{f'(x_0)}{1!}(x - x_0) + \cdots + \dfrac{f^{(n)}(x_0)}{n!}(x - x_0)^n$，仅在 $x_0$ 附近误差较小
- 例：$f(x) = e^x$ 在 $[-1, 1]$ 上近似 $P_4(x) = 1 + x + \dfrac{1}{2}x^2 + \dfrac{1}{6}x^3 + \dfrac{1}{24}x^4$

  误差 $R_4(x) = e^x - P_4(x) = \dfrac{1}{120} x^5 e^\varepsilon\ (\varepsilon \in (-1, 1))$；误差限

  $$
  |R_4(x)| \le \frac{e}{120}|x|^5 \le \frac{e}{120} \approx 0.0226
  $$

  在整个区间上误差较大；若精度要求高需取很多项，既费时又占存储。

**函数插值与函数逼近**：

- **函数插值**：给定插值节点 $x_0 < x_1 < \cdots < x_n$ 及条件，找穿过节点的函数
- **函数逼近**：给定已知函数 $f(x)$，求计算次数少的近似公式

> **定义**（函数逼近）：对于函数类 $A$ 中给定的函数 $f(x)$，要求在另一类较简单且便于计算的函数类 $B$ 中，求函数 $P(x) \in B \subseteq A$，使 $P(x)$ 与 $f(x)$ 之差在某种度量意义下最小。
>
> - $A$ 通常是 $[a, b]$ 上连续函数空间 $C[a, b]$
> - $B$ 通常为代数多项式、分式有理函数或三角多项式等

**度量标准**：

- **一致逼近（均匀逼近）度量**：$\|f - P\|_\infty = \max\limits_{a \le x \le b}|f(x) - P(x)|$
- **均方（平方）逼近度量**：$\|f - P\|_2 = \left(\int_a^b |f(x) - P(x)|^2\, dx\right)^{1/2}$

本章主要研究在这两种度量下用代数多项式 $P_n(x)$ 逼近 $f(x) \in C[a, b]$：

- **最佳一致逼近多项式**——使 $\|f - P\|_\infty$ 最小的多项式
- **最佳平方逼近多项式**——使 $\|f - P\|_2$ 最小的多项式

**一致逼近的存在性**——

> **定理 3.1（Weierstrass 定理）**：设 $f(x) \in C[a, b]$，则对于任何 $\varepsilon > 0$，总存在一个代数多项式 $P(x)$，使
>
> $$
> \|f(x) - P(x)\|_\infty < \varepsilon
> $$
>
> 在 $[a, b]$ 上一致成立。

**Bernstein 构造性证明**：Bernstein 多项式

$$
B_n(f, x) = \sum_{k=0}^{n} f\!\left(\frac{k}{n}\right) P_k(x),\quad P_k(x) = \binom{n}{k} x^k (1 - x)^{n-k} 
$$

- $\lim\limits_{n \to \infty} B_n(f, x) = f(x)$ 在 $[0, 1]$ 上一致成立
- 若 $f \in C^m[0, 1]$，则 $\lim\limits_{n \to \infty} B_n^{(m)}(f, x) = f^{(m)}(x)$

性质：由二项式定理（令 $y = 1 - x$）得

$$
\sum_{k=0}^{n} P_k(x) = \sum_{k=0}^{n}\binom{n}{k} x^k (1-x)^{n-k} = (x + (1-x))^n = 1
$$

$x \in [0,1]$ 时 $P_k(x) \ge 0$，故 $\sum |P_k(x)| = 1$ 有界。若 $|f(x)| \le \delta$，则

$$
|B_n(f, x)| \le \max_{0 \le x \le 1}|f(x)| \sum_{k=0}^{n} P_k(x) \le \delta
$$

有界，故 $B_n(f, x)$ 是**稳定**的，有良好的逼近性质。

对比 Lagrange 插值多项式 $L_n(x) = \sum f(x_k) l_k(x)$：虽 $\sum l_k(x) = 1$，但 $\sum |l_k(x)|$ **无界**，故 $L_n(x)$ 不能保证高阶插值的稳定与收敛。

> 但 $B_n(f, x)$ 收敛太慢，比三次样条逼近效果差得多，实际中很少使用。

**范数与函数距离**——$C[a, b]$ 上的范数定义：

- $L_1$ 范数：$\|f\|_1 = \int_a^b |f(x)|\, dx$
- $L_2$ 范数：$\|f\|_2 = \left(\int_a^b f^2(x)\, dx\right)^{1/2}$
- $L_\infty$ 范数：$\|f\|_\infty = \max\limits_{a \le x \le b}|f(x)|$

范数 $\|\cdot\|$ 满足：

- $\|f\| \ge 0$，且 $\|f\| = 0 \Leftrightarrow f \equiv 0$
- $\|af\| = |a|\, \|f\|$，$a \in \mathbb{R}$
- 三角不等式 $\|f + g\| \le \|f\| + \|g\|$（3.1.7）

函数距离：当 $f, g \in C[a, b]$ 时

$$
D(f, g) = \|f - g\|_\infty 
$$

由三角不等式

$$
D(f, g) \le D(f, h) + D(h, g) 
$$

$$
\bigl|\|f\|_\infty - \|g\|_\infty\bigr| \le \|f - g\|_\infty 
$$

### 2. 最佳一致逼近多项式

**研究动机**：定理 3.1 中的存在性并没有约束 $n$；$n$ 太大函数复杂、难以计算。希望**固定 $n$**，寻求最优的逼近。

**多项式集合定义**：

- 记次数不大于 $n$ 的多项式集合为 $H_n$，$H_n \subseteq C[a, b]$
- $H_n = \mathrm{span}\{1, x, \ldots, x^n\}$，其中 $1, x, \ldots, x^n$ 是 $[a, b]$ 上线性无关的一组基
- $H_n$ 中元素：$P_n(x) = a_0 + a_1 x + \cdots + a_n x^n$，$a_i \in \mathbb{R}$ 任意

**最佳一致逼近 / Chebyshev 逼近问题**：在 $H_n$ 中求 $P_n^*(x)$ 逼近 $f(x) \in C[a, b]$，使

$$
\max_{a \le x \le b}\lvert f(x) - P_n^*(x)\rvert = \min_{P_n \in H_n}\max_{a \le x \le b}\lvert f(x) - P_n(x)\rvert
$$

> **定义 3.1**：$P_n(x) \in H_n$，$f(x) \in C[a, b]$。则有以下
>
> - **$f$ 与 $P_n$ 的偏差（距离）$\Delta(f, P_n)$**——
>
> $$
> \Delta(f, P_n) = D(f, P_n) = \|f - P_n\|_\infty = \max_{a \le x \le b}|f(x) - P_n(x)|
> $$

- $\Delta(f, P_n) \ge 0$，全体组成集合，下界为 $0$
- **最小偏差** $E_n$——集合 $\{\Delta(f, P_n)\}$ 的下确界

$$
E_n = \inf_{P_n \in H_n} \Delta(f, P_n) = \inf_{P_n \in H_n}\max_{a \le x \le b}|f(x) - P_n(x)| 
$$

> **定义 3.2**：假定 $f(x) \in C[a, b]$，若存在 $P_n^*(x) \in H_n$ 使 $\Delta(f, P_n^*) = E_n$，则有以下
>
> - **最佳逼近多项式 / 最佳一致逼近多项式 / 最小偏差逼近多项式**——上述 $P_n^*(x)$

> **定理 3.2**：若 $f(x) \in C[a, b]$，总存在 $P_n^*(x) \in H_n$ 使 $\|f - P_n^*\|_\infty = E_n$。

> **定义 3.3**（偏差点）：设 $f(x) \in C[a, b]$，$P(x) \in H_n$，若在 $x = x_0$ 上有
>
> $$
> |P(x_0) - f(x_0)| = \max_{a \le x \le b}|P(x) - f(x)| = \mu
> $$
>
> - **偏差点 $x_0$**——使 $|P - f|$ 取最大值的点
> - **"正"偏差点**——若 $P(x_0) - f(x_0) = \mu$
> - **"负"偏差点**——若 $P(x_0) - f(x_0) = -\mu$

由连续性，至少存在一个 $x_0 \in [a, b]$ 使 $|P(x_0) - f(x_0)| = \mu$。

> **定理 3.3**：若 $P(x) \in H_n$ 是 $f(x) \in C[a, b]$ 的最佳逼近多项式，则 $P(x)$ **同时存在正、负偏差点**。

**反证法**：假定只有正偏差点。则对所有 $x \in [a, b]$，$P(x) - f(x) > -E_n$。$P - f$ 在 $[a, b]$ 上连续，可设最小值为 $-E_n + 2h$（$h > 0$），故

$$
-E_n + 2h \le P(x) - f(x) \le E_n \Rightarrow |P(x) - h - f(x)| \le E_n - h
$$

即多项式 $P(x) - h$ 与 $f(x)$ 的偏差小于 $E_n$，与 $E_n$ 最小矛盾。

**几何意义**：$y = P(x)$ 位于带状区域 $y = f(x) \pm E_n$ 之间，$P(x)$ 的图形应当与上下两条曲线**至少各接触一次**。否则可把 $y = P(x)$ 稍微移动得到更好的近似。

> **定理 3.4（Chebyshev 定理）**：$P(x) \in H_n$ 是 $f(x) \in C[a, b]$ 的最佳逼近多项式的**充要条件**是 $P(x)$ 在 $[a, b]$ 上至少有 $n + 2$ 个轮流为"正""负"的偏差点，即存在 $a \le x_1 < x_2 < \cdots < x_{n+2} \le b$，使
>
> $$
> P(x_k) - f(x_k) = (-1)^k \sigma\, \|P - f\|_\infty,\quad \sigma = \pm 1,\ k = 1, 2, \ldots, n+2 
> $$
>
> - **Chebyshev 交错点组**——上述 $n + 2$ 个轮流符号的偏差点组

**充分性证明**（反证法）：假定 (3.2.4) 成立。若存在 $Q(x) \in H_n,\ Q \not\equiv P$ 使 $\|f - Q\|_\infty \le \|f - P\|_\infty$，则

$$
P(x) - Q(x) = (P(x) - f(x)) - (Q(x) - f(x))
$$

在 $x_1, \ldots, x_{n+2}$ 上符号与 $P(x_k) - f(x_k)$ 一致——因 $|Q(x_k) - f(x_k)|$ 不超过 $E_n$ 不足以影响符号。故 $P - Q$ 在 $n + 2$ 个点上轮流取符号 $+, -$，由连续性在 $(a, b)$ 内有 $n + 1$ 个零点。但 $P - Q \not\equiv 0$ 是不超过 $n$ 次的多项式，矛盾。

> **推论 1**：若 $f(x) \in C[a, b]$，则在 $H_n$ 中存在**唯一**的最佳逼近多项式。

**证明**：若 $H_n$ 中有两个最佳逼近多项式 $P, Q$，则对所有 $x \in [a, b]$，$|P - f| \le E_n,\ |Q - f| \le E_n$，从而 $\left|\dfrac{P + Q}{2} - f\right| \le E_n$，即 $R(x) = \dfrac{P + Q}{2}$ 也是最佳逼近多项式。其 $n + 2$ 个交错点组 $x_k$ 满足 $R(x_k) - f(x_k) = (-1)^k \sigma E_n$。又

$$
E_n = |R(x_k) - f(x_k)| = \frac{|P(x_k) - f(x_k)|}{2} + \frac{|Q(x_k) - f(x_k)|}{2}
$$

与 $|P(x_k) - f(x_k)| \le E_n,\ |Q(x_k) - f(x_k)| \le E_n$ 配合，当且仅当

$$
\frac{P(x_k) - f(x_k)}{2} = \frac{Q(x_k) - f(x_k)}{2} = \pm \frac{E_n}{2}
$$

时成立。于是 $P(x_k) = Q(x_k)\ (k = 1, \ldots, n+2)$，即 $P - Q$ 有 $n + 2$ 个零点而其次数不超过 $n$，故 $Q \equiv P$，唯一性得证。

> **推论 2**：若 $f(x) \in C[a, b]$，则其最佳逼近多项式 $P_n^*(x) \in H_n$ 就是 $f(x)$ 的一个 Lagrange 插值多项式。

**证明**：由定理 3.4，$P_n^*(x) - f(x)$ 在 $[a, b]$ 上要么恒为零，要么有 $n + 2$ 个轮流取号偏差点。后者由连续性存在 $n + 1$ 个点 $\bar x_k \in (x_k, x_{k+1})$ 使 $P_n^*(\bar x_k) - f(\bar x_k) = 0$，即 $P_n^*$ 是以 $\bar x_k$ 为节点的 Lagrange 插值多项式（结合插值多项式的唯一性）。

**最佳一次逼近多项式**——定理 3.4 给出特性但求出 $P_n^*$ 相当困难。考虑 $n = 1$，假定 $f(x) \in C^2[a, b]$ 且 $f''(x)$ 在 $(a, b)$ 内不变号，求 $P_1(x) = a_0 + a_1 x$。

由定理 3.4，至少有 3 个点 $a \le x_1 < x_2 < x_3 \le b$ 使

$$
P_1(x_k) - f(x_k) = (-1)^k \sigma \max_{a \le x \le b}|P_1(x) - f(x)|,\quad \sigma = \pm 1,\ k = 1, 2, 3
$$

由连续性 $P_1 - f$ 在 $(a, b)$ 内至少 2 个零点；由 Rolle 定理 $(P_1 - f)' = a_1 - f'(x)$ 在 $(a, b)$ 内至少 1 个零点。$f''$ 不变号 $\Rightarrow f'$ 单调 $\Rightarrow a_1 - f'(x)$ 仅有 1 个零点 $x_2$。

故 $(P_1 - f)'$ 在 $x_2$ 处变号"+ 0 -"或"- 0 +"，导致：

- $x_2$ 处 $f'(x_2) = a_1$
- $x_1, x_3$ 在区间端点：$x_1 = a,\ x_3 = b$，$P_1(a) - f(a) = P_1(b) - f(b) = -(P_1(x_2) - f(x_2))$

由后两式联立：

$$
\begin{cases}
a_0 + a_1 a - f(a) = -(a_0 + a_1 x_2 - f(x_2)) \\
a_0 + a_1 a - f(a) = a_0 + a_1 b - f(b)
\end{cases}
$$

解得

$$
a_1 = \frac{f(b) - f(a)}{b - a},\quad a_0 = \frac{f(a) + f(x_2)}{2} - \frac{f(b) - f(a)}{b - a} \cdot \frac{a + x_2}{2} 
$$

最佳一次逼近多项式

$$
P_1(x) = \frac{1}{2}\bigl[f(a) + f(x_2)\bigr] + a_1\!\left(x - \frac{a + x_2}{2}\right)
$$

**几何意义**：直线 $y = P_1(x)$ 与弦 $MN$ 平行，且通过 $MQ$ 的中点 $D$。

**例 3.1**：求 $f(x) = (1 + x^2)^{1/2}$ 在 $[0, 1]$ 上的最佳一次逼近多项式。

由 $a_1 = \dfrac{f(b) - f(a)}{b - a}$ 得 $a_1 = 2^{1/2} - 1 \approx 0.414$。由 $f'(x_2) = a_1$ 得 $\dfrac{x_2}{(1 + x_2^2)^{1/2}} = 2^{1/2} - 1$，解得 $x_2 \approx 0.4554$，$f(x_2) = (1 + x_2^2)^{1/2} \approx 1.0986$。代入 (3.2.8)：

$$
a_0 = \frac{1 + (1 + x_2^2)^{1/2}}{2} - a_1 \cdot \frac{x_2}{2} \approx 0.955
$$

故 $P_1(x) = 0.955 + 0.414 x$，即

$$
(1 + x^2)^{1/2} \approx 0.955 + 0.414 x,\quad 0 \le x \le 1
$$

误差限：$\max\limits_{0 \le x \le 1} |(1 + x^2)^{1/2} - P_1(x)| \le |f(0) - 0.955| = 0.045$。

令 $x = b/a \le 1$，得近似求根公式

$$
(a^2 + b^2)^{1/2} \approx 0.955\, a + 0.414\, b
$$

### 3. 最佳平方逼近

若存在 $P_n^*(x) \in H_n$ 使

$$
\|f - P_n^*\|_2 = \left(\int_a^b |f(x) - P_n^*(x)|^2\, dx\right)^{1/2} = \inf_{P \in H_n}\|f - P\|_2
$$

则 $P_n^*(x)$ 是 $f(x)$ 在 $[a, b]$ 上的**最佳平方逼近多项式**。下面先准备内积空间相关概念。

> **定义 3.4**：设在区间 $(a, b)$ 内，非负函数 $\rho(x)$ 满足以下条件——
>
> - **权函数**——满足以下条件的 $\rho(x)$：
>   - $\int_a^b x^n \rho(x)\, dx\ (n = 0, 1, 2, \ldots)$ 存在
>   - 对非负连续函数 $g(x)$，若 $\int_a^b g(x) \rho(x)\, dx = 0$，则 $g(x) \equiv 0$ 在 $(a, b)$ 内成立 $$
>
> 例：$\rho(x) = 1/(1 - x^2)^{1/2}$ 对 $(-1, 1)$ 内的点赋予权重。

> **定义 3.5**：设 $f, g \in C[a, b]$，$\rho(x)$ 是 $[a, b]$ 上的权函数。
>
> - **函数内积**——
>
> $$
> (f, g) = \int_a^b \rho(x) f(x) g(x)\, dx 
> $$

满足内积四公理：

- $(f, g) = (g, f)$
- $(c f, g) = c (f, g)$，$c \in \mathbb{R}$
- $(f_1 + f_2, g) = (f_1, g) + (f_2, g)$
- $(f, f) \ge 0$，$(f, f) = 0 \Leftrightarrow f \equiv 0$

类比欧氏空间 $\mathbb{R}^n$：$\boldsymbol{f}, \boldsymbol{g} \in \mathbb{R}^n$，内积 $(\boldsymbol{f}, \boldsymbol{g}) = \sum f_k g_k$，模 $\|\boldsymbol{f}\|_2 = (\sum f_k^2)^{1/2}$。区别在于 (i) 向量空间 → 函数空间；(ii) 引入权函数。

> **定义 3.6**：$f(x) \in C[a, b]$。
>
> - **Euclid 范数（$f$ 的 $L_2^\rho$ 范数）**——
>
> $$
> \|f\|_2 = (f, f)^{1/2} = \left(\int_a^b \rho(x) f^2(x)\, dx\right)^{1/2} 
> $$

> **定理 3.5**：对任何 $f, g \in C[a, b]$，
>
> - **Cauchy-Schwarz 不等式**：$|(f, g)| \le \|f\|_2 \cdot \|g\|_2$
> - **三角不等式**：$\|f + g\|_2 \le \|f\|_2 + \|g\|_2$
> - **平行四边形定律**：$\|f + g\|_2^2 + \|f - g\|_2^2 = 2(\|f\|_2^2 + \|g\|_2^2)$

> **定义 3.7**：$f, g \in C[a, b]$。
>
> - **带权 $\rho(x)$ 正交**——若 $(f, g) = \int_a^b \rho(x) f(x) g(x)\, dx = 0$ $$
> - **正交函数族**——函数族 $\{\varphi_0, \varphi_1, \ldots\}$ 满足
>
> $$
> (\varphi_j, \varphi_k) = \int_a^b \rho(x) \varphi_j(x) \varphi_k(x)\, dx = \begin{cases} 0, & j \ne k \\ A_j > 0, & j = k \end{cases} 
> $$
>
> - **标准正交函数族**——若 $A_j \equiv 1$

**例**：三角函数族 $\{1, \cos x, \sin x, \cos 2x, \sin 2x, \ldots\}$ 在 $[-\pi, \pi]$ 上是权 $\rho \equiv 1$ 的正交函数族：

$$
\begin{aligned}
(1, 1) &= 2\pi \\
(\sin nx, \sin mx) &= \int_{-\pi}^{\pi} \sin nx \sin mx\, dx = \begin{cases} \pi, & m = n \\ 0, & m \ne n \end{cases} \\
(\cos nx, \cos mx) &= \begin{cases} \pi, & m = n \\ 0, & m \ne n \end{cases} \\
(\cos nx, \sin mx) &= 0
\end{aligned}
$$

> **定义 3.8**：设 $\varphi_0, \varphi_1, \ldots, \varphi_{n-1}$ 在 $[a, b]$ 上连续。
>
> - **线性无关**——若 $a_0 \varphi_0 + a_1 \varphi_1 + \cdots + a_{n-1} \varphi_{n-1} = 0$ 当且仅当 $a_0 = \cdots = a_{n-1} = 0$ 成立
> - **线性无关函数族**——函数族 $\{\varphi_k\}_{k=0}^\infty$ 中任何有限个 $\varphi_k$ 都线性无关

例：$\{1, x, x^2, \ldots, x^n, \ldots\}$ 就是 $[a, b]$ 上的线性无关函数族。

若 $\varphi_0, \ldots, \varphi_{n-1}$ 在 $[a, b]$ 上线性无关，则 $S(x) = a_0 \varphi_0 + \cdots + a_{n-1} \varphi_{n-1}$ 的全体记作 $\Phi = \mathrm{span}\{\varphi_0, \ldots, \varphi_{n-1}\}$。

> **定理 3.6**：$\varphi_0, \ldots, \varphi_{n-1}$ 在 $[a, b]$ 上线性无关的充要条件是它的 **Cramer 行列式（Gram 行列式）** $G_{n-1} \ne 0$：
>
> $$
> G_{n-1} = \begin{vmatrix}
> (\varphi_0, \varphi_0) & (\varphi_0, \varphi_1) & \cdots & (\varphi_0, \varphi_{n-1}) \\
> (\varphi_1, \varphi_0) & (\varphi_1, \varphi_1) & \cdots & (\varphi_1, \varphi_{n-1}) \\
> \vdots & \vdots & & \vdots \\
> (\varphi_{n-1}, \varphi_0) & (\varphi_{n-1}, \varphi_1) & \cdots & (\varphi_{n-1}, \varphi_{n-1})
> \end{vmatrix}
> $$

**最佳平方逼近函数**：对 $f \in C[a, b]$ 及 $\Phi = \mathrm{span}\{\varphi_0, \ldots, \varphi_n\}$，若存在 $S^*(x) \in \Phi$，使

$$
\|f - S^*\|_2^2 = \inf_{S \in \Phi}\|f - S\|_2^2 = \inf_{S \in \Phi}\int_a^b \rho(x)\bigl[f(x) - S(x)\bigr]^2 dx 
$$

- **最佳平方逼近函数**——上述 $S^*(x)$

求 $S^*(x)$ 等价于求多元函数

$$
I(a_0, a_1, \ldots, a_n) = \int_a^b \rho(x)\left[\sum_{j=0}^n a_j \varphi_j(x) - f(x)\right]^2 dx
$$

的最小值。由 $\dfrac{\partial I}{\partial a_k} = 0$：

$$
2\int_a^b \rho(x)\!\left[\sum_{j=0}^n a_j \varphi_j(x) - f(x)\right]\varphi_k(x)\, dx = 0 \quad (k = 0, 1, \ldots, n)
$$

化简得**法方程**

$$
\sum_{j=0}^n (\varphi_k, \varphi_j) a_j = (f, \varphi_k) \quad (k = 0, 1, \ldots, n) 
$$

即 $\boldsymbol{H} \boldsymbol{a} = \boldsymbol{d}$，$\boldsymbol{H}$ 为 Cramer 矩阵。

- 由 $\{\varphi_k\}$ 线性无关 $\Rightarrow G \ne 0$ $\Rightarrow$ 方程组有唯一解 $a_k^*\ (k = 0, \ldots, n)$，从而

$$
S^*(x) = a_0^* \varphi_0(x) + a_1^* \varphi_1(x) + \cdots + a_n^* \varphi_n(x)
$$

**验证 $S^*$ 确为最佳平方逼近**：对任何 $S \in \Phi$，考察

$$
\begin{aligned}
D &= \int_a^b \rho(x)|f - S|^2 dx - \int_a^b \rho(x)|f - S^*|^2 dx \\
  &= \int_a^b \rho(x)(S^* - S)^2 dx + 2\int_a^b \rho(x)(S^* - S)(f - S^*)\, dx
\end{aligned}
$$

因 $S^* - S \in \Phi$ 是 $\varphi_k$ 的线性组合，由 $\int \rho (f - S^*) \varphi_k\, dx = 0$ 得后一项为 $0$，故 $D = \int_a^b \rho(x)(S^* - S)^2 dx \ge 0$，即 $\|f - S\|_2 \ge \|f - S^*\|_2$。

**平方误差**：令 $\delta(x) = f(x) - S^*(x)$，则

$$
\|\delta\|_2^2 = (f - S^*, f - S^*) = (f, f - S^*) - (S^*, f - S^*)
$$

由 $\int \rho (f - S^*) \varphi_k\, dx = 0$ 得 $(S^*, f - S^*) = 0$，故

$$
\|\delta\|_2^2 = \|f\|_2^2 - (f, S^*) = \|f\|_2^2 - \sum_{k=0}^n a_k^* (\varphi_k, f) 
$$

**最佳平方逼近多项式（特例）**：取 $\varphi_k(x) = x^k$，$\rho(x) \equiv 1$，$f \in C[0, 1]$，则法方程：

$$
(\varphi_j, \varphi_k) = \int_0^1 x^{k+j}\, dx = \frac{1}{k + j + 1}
$$

$$
(f, \varphi_k) = \int_0^1 f(x) x^k\, dx \equiv d_k
$$

构造方程组 $\boldsymbol{H} \boldsymbol{a} = \boldsymbol{d}$，系数矩阵为 **Hilbert 矩阵**

$$
\boldsymbol{H} = \begin{pmatrix}
1 & 1/2 & \cdots & 1/(n+1) \\
1/2 & 1/3 & \cdots & 1/(n+2) \\
\vdots & \vdots & & \vdots \\
1/(n+1) & 1/(n+2) & \cdots & 1/(2n+1)
\end{pmatrix} 
$$

$$
\boldsymbol{a} = (a_0, a_1, \ldots, a_n)^T,\quad \boldsymbol{d} = (d_0, d_1, \ldots, d_n)^T,\quad d_k = (f, x^k) 
$$

**例 3.2**：求 $f(x) = (1 + x^2)^{1/2}$ 在 $[0, 1]$ 上的一次最佳平方逼近多项式。

$$
d_0 = \int_0^1 (1 + x^2)^{1/2} dx = \frac{1}{2}\ln(1 + 2^{1/2}) + \frac{2^{1/2}}{2} \approx 1.147
$$

$$
d_1 = \int_0^1 x (1 + x^2)^{1/2} dx = \frac{1}{3}(1 + x^2)^{3/2}\bigg|_0^1 = \frac{2 \cdot 2^{1/2} - 1}{3} \approx 0.609
$$

方程组

$$
\begin{pmatrix} 1 & 1/2 \\ 1/2 & 1/3 \end{pmatrix}\begin{pmatrix} a_0 \\ a_1 \end{pmatrix} = \begin{pmatrix} 1.147 \\ 0.609 \end{pmatrix}
$$

解得 $a_0 = 0.934,\ a_1 = 0.426$，故 $S_1^*(x) = 0.934 + 0.426 x$。

- 平方误差 $\|\delta\|_2^2 = \int_0^1 (1 + x^2)\, dx - a_1^* d_1 - a_0^* d_0 = 0.0026$
- 最大误差 $\|\delta\|_\infty = \max_{0 \le x \le 1} |(1 + x^2)^{1/2} - S_1^*(x)| = 0.066$

**存在问题**：$\{1, x, x^2, \ldots, x^n\}$ 作基时，$n$ 较大时 Hilbert 矩阵高度病态，求解法方程舍入误差很大。

**解决方案**：用**正交多项式**作基。

### 4. 正交多项式

> **定义 3.9**：设 $g_n(x)$ 是首项系数 $a_n \ne 0$ 的 $n$ 次多项式。若多项式序列 $\{g_0, g_1, \ldots\}$ 满足
>
> $$
> (g_j, g_k) = \int_a^b \rho(x) g_j(x) g_k(x)\, dx = \begin{cases} 0, & j \ne k \\ A_k > 0, & j = k \end{cases}
> $$
>
> - **带权 $\rho$ 正交的多项式序列**——上述 $\{g_n(x)\}$
> - **$n$ 次正交多项式**——序列中的 $g_n(x)$

当权 $\rho(x)$ 及区间 $[a, b]$ 给定后，可由 $\{1, x, x^2, \ldots, x^n\}$ 利用**正交化方法**构造：

$$
g_0(x) = 1,\quad g_n(x) = x^n - \sum_{k=0}^{n-1}\frac{(x^n, g_k)}{(g_k, g_k)}\, g_k(x)\quad (n = 1, 2, \ldots)
$$

**$g_n(x)$ 的性质**：

- **性质 1**：$g_n(x)$ 是最高项系数为 1 的 $n$ 次多项式
- **性质 2**：任一 $P_n(x) \in H_n$ 均可表示为 $g_0, \ldots, g_n$ 的线性组合
- **性质 3**：$n \ne m$ 时 $(g_n, g_m) = 0$，且 $g_n(x)$ 与任一次数小于 $n$ 的多项式正交
- **性质 4**：递推关系

$$
g_{n+1}(x) = (x - \alpha_n) g_n(x) - \beta_n g_{n-1}(x),\quad n = 0, 1, \ldots
$$

其中 $g_{-1}(x) = 0,\ g_0(x) = 1$，

$$
\alpha_n = \frac{(x g_n, g_n)}{(g_n, g_n)},\ n = 0, 1, \ldots,\quad \beta_n = \frac{(g_n, g_n)}{(g_{n-1}, g_{n-1})},\ n = 1, 2, \ldots
$$

- **性质 5**：$g_n(x)\ (n \ge 1)$ 的 $n$ 个根都是**单重实根**，且都在 $(a, b)$ 内

**Legendre 多项式**——在区间 $[-1, 1]$ 上带权 $\rho(x) \equiv 1$，由 $\{1, x, x^2, \ldots\}$ 正交化得到：

$$
P_0(x) = 1,\quad P_n(x) = \frac{1}{2^n n!}\, \frac{d^n}{dx^n}\bigl[(x^2 - 1)^n\bigr] \quad (n = 1, 2, \ldots)
$$

**归一化**：$(x^2 - 1)^n$ 是 $2n$ 次多项式，求 $n$ 阶导得

$$
P_n(x) = \frac{1}{2^n n!}\bigl[2n(2n-1)\cdots(n+1) x^n + a_{n-1} x^{n-1} + \cdots\bigr]
$$

最高项系数为 1 的 Legendre 多项式 $\tilde P_n(x) = \dfrac{n!}{(2n)!}\dfrac{d^n}{dx^n}[(x^2 - 1)^n]$。

**前几项**：

$$
\begin{aligned}
P_0(x) &= 1 \\
P_1(x) &= x \\
P_2(x) &= (3 x^2 - 1)/2 \\
P_3(x) &= (5 x^3 - 3 x)/2 \\
P_4(x) &= (35 x^4 - 30 x^2 + 3)/8 \\
P_5(x) &= (63 x^5 - 70 x^3 + 15 x)/8 \\
P_6(x) &= (231 x^6 - 315 x^4 + 105 x^2 - 5)/16
\end{aligned}
$$

**Legendre 多项式性质**：

- **性质 1**（正交性）：$\int_{-1}^1 P_n(x) P_m(x)\, dx = \begin{cases} 0, & m \ne n \\ \dfrac{2}{2n+1}, & m = n \end{cases}$
- **性质 2**（奇偶性）：$P_n(-x) = (-1)^n P_n(x)$
- **性质 3**（递推）：$(n + 1) P_{n+1}(x) = (2n + 1) x P_n(x) - n P_{n-1}(x),\ n = 1, 2, \ldots$
- **性质 4**：所有最高项系数为 1 的 $n$ 次多项式中，$\tilde P_n(x)$ 在 $[-1, 1]$ 上与零的平方误差最小
- **性质 5**：$P_n(x)$ 在 $(-1, 1)$ 内有 $n$ 个不同实零点

**Chebyshev 多项式**——在 $[-1, 1]$ 上带权 $\rho(x) = 1/(1 - x^2)^{1/2}$，由 $\{1, x, x^2, \ldots\}$ 正交化得：

$$
T_n(x) = \cos(n \arccos x),\quad |x| \le 1
$$

令 $x = \cos\theta$ 得 $T_n(x) = \cos(n\theta)$，$0 \le \theta \le \pi$。

> Chebyshev 多项式并不是三角函数；权函数不同、正交多项式也不同。

**Chebyshev 多项式性质**：

- **性质 1**（递推）：$T_{n+1}(x) = 2 x T_n(x) - T_{n-1}(x),\ n = 1, 2, \ldots$

  前几项：

  $$
  \begin{aligned}
  T_0 &= 1,\ T_1 = x,\ T_2 = 2x^2 - 1,\ T_3 = 4x^3 - 3x \\
  T_4 &= 8x^4 - 8x^2 + 1,\ T_5 = 16x^5 - 20x^3 + 5x \\
  T_6 &= 32x^6 - 48x^4 + 18x^2 - 1
  \end{aligned}
  $$

  $T_n(x)$ 的最高项系数是 $2^{n-1}\ (n \ge 1)$

- **性质 2**（对零的偏差最小）

  > **定理 3.7**：在 $[-1, 1]$ 上所有最高项系数为 1 的 $n$ 次多项式中，归一化 Chebyshev 多项式 $\tilde T_n(x) = T_n(x) / 2^{n-1}$ 与零的偏差最小，偏差为 $1 / 2^{n-1}$。

  推论：在 $[-1, 1]$ 上 $x^n$ 在 $H_{n-1}$ 中的最佳一致逼近多项式 $P_{n-1}^*(x)$ 的误差

  $$
  x^n - P_{n-1}^*(x) = \omega_n(x) = \frac{1}{2^{n-1}} T_n(x)
  $$

  **例 3.3**：求 $f(x) = 2 x^3 + x^2 + 2 x - 1$ 在 $[-1, 1]$ 上的最佳二次逼近多项式。

  $x^2 + 2x - 1$ 能被二次函数完美表达，仅 $2 x^3$ 造成逼近误差。由定理 3.7：

  $$
  f(x) - P_2^*(x) = 2\left(x^3 - \tilde P_2(x)\right) = \frac{1}{2^{3-1}} \cdot 2\, T_3(x) = \frac{1}{2} T_3(x)
  $$

  由 $T_3(x) = 4 x^3 - 3 x$：

  $$
  P_2^*(x) = f(x) - \frac{1}{2} T_3(x) = x^2 + \frac{7}{2} x - 1
  $$

- **性质 3**（带权正交性）：

  $$
  \int_{-1}^{1} \frac{T_n(x) T_m(x)}{(1 - x^2)^{1/2}}\, dx = \begin{cases} 0, & n \ne m \\ \pi/2, & n = m \ne 0 \\ \pi, & n = m = 0 \end{cases}
  $$

- **性质 4**：$T_{2k}(x)$ 只含 $x$ 的偶次幂；$T_{2k+1}(x)$ 只含奇次幂
- **性质 5**：$T_n(x)$ 在 $[-1, 1]$ 上有 $n$ 个零点 $x_k = \cos\dfrac{2k - 1}{2n}\pi$，$k = 1, 2, \ldots, n$
- **性质 6**：$x^n$ 可表示为 $T_0, T_1, \ldots, T_n$ 的线性组合

$$
x^n = 2^{1-n} \sum_{k=0}^{\lfloor n/2 \rfloor} \binom{n}{k}\hat T_{n-2k}(x),\quad \hat T_0 = 1/2
$$

**第二类 Chebyshev 多项式**——在 $[-1, 1]$ 上带权 $\rho(x) = (1 - x^2)^{1/2}$：

$$
U_n(x) = \frac{\sin\bigl((n + 1)\arccos x\bigr)}{(1 - x^2)^{1/2}}
$$

正交关系 $\int_{-1}^1 U_n U_m (1 - x^2)^{1/2}\, dx = \begin{cases} 0, & m \ne n \\ \pi/2, & m = n \end{cases}$；递推 $U_0 = 1,\ U_1 = 2 x,\ U_{n+1} = 2 x U_n - U_{n-1}$。

**Laguerre（拉盖尔）多项式**——在 $[0, +\infty)$ 上带权 $\rho(x) = e^{-x}$：

$$
L_n(x) = e^x \frac{d^n}{dx^n}(x^n e^{-x})
$$

正交关系 $\int_0^\infty L_n L_m e^{-x}\, dx = \begin{cases} 0, & m \ne n \\ (n!)^2, & m = n \end{cases}$；递推 $L_0 = 1,\ L_1 = 1 - x,\ L_{n+1} = (1 + 2n - x) L_n - n^2 L_{n-1}$。

**Hermite 多项式**——在 $(-\infty, +\infty)$ 上带权 $\rho(x) = e^{-x^2}$：

$$
H_n(x) = (-1)^n e^{x^2} \frac{d^n}{dx^n}(e^{-x^2})
$$

正交关系 $\int_{-\infty}^\infty H_n H_m e^{-x^2}\, dx = \begin{cases} 0, & m \ne n \\ 2^n n! \pi^{1/2}, & m = n \end{cases}$；递推 $H_0 = 1,\ H_1 = 2 x,\ H_{n+1} = 2 x H_n - 2 n H_{n-1}$。

### 5. 函数按正交多项式展开

设 $f(x) \in C[a, b]$，用正交多项式 $\{g_0, g_1, \ldots, g_n\}$ 作基，求最佳平方逼近多项式

$$
S_n(x) = a_0 g_0(x) + a_1 g_1(x) + \cdots + a_n g_n(x) 
$$

法方程 (3.3.13) 因正交性简化，无需求解 $\boldsymbol{H}\boldsymbol{a} = \boldsymbol{d}$，直接得系数

$$
a_k = \frac{(f, g_k)}{(g_k, g_k)} \quad (k = 0, 1, \ldots, n) 
$$

最佳平方逼近多项式

$$
S_n(x) = \sum_{k=0}^n \frac{(f, g_k)}{(g_k, g_k)} g_k(x) 
$$

由 (3.3.15)，均方误差

$$
\|\delta\|_2^2 = \|f - S_n\|_2^2 = \|f\|_2^2 - \sum_{k=0}^n \frac{(f, g_k)^2}{(g_k, g_k)} 
$$

$f(x)$ 在 $[a, b]$ 上按正交多项式展开

$$
f(x) \sim \sum_{k=0}^\infty a_k g_k(x) 
$$

- **广义 Fourier 级数**——(3.5.5) 右端级数
- **广义 Fourier 系数**——系数 $a_k$

任何 $f \in C[a, b]$ 均可展开成广义 Fourier 级数，其部分和 $S_n(x)$ 是 $f(x)$ 的最佳平方逼近。**系数 $a_k$ 与 $n$ 无关**：$n$ 增加时只需计算增加的系数。在 $f(x)$ 满足一定条件下也可一致收敛到 $f(x)$。

**按 Legendre 多项式展开**：$f \in C[-1, 1]$，

$$
S_n^*(x) = a_0^* P_0(x) + a_1^* P_1(x) + \cdots + a_n^* P_n(x) 
$$

$$
a_k^* = \frac{(f, P_k)}{(P_k, P_k)} = \frac{2k + 1}{2}\int_{-1}^1 f(x) P_k(x)\, dx,\quad k = 0, 1, \ldots, n
$$

平方误差

$$
\|\delta\|_2^2 = \int_{-1}^1 f^2(x)\, dx - \sum_{k=0}^n \frac{2}{2k + 1}(a_k^*)^2 
$$

**例 3.4**：求 $f(x) = e^x$ 在 $[-1, 1]$ 上的三次最佳平方逼近多项式。

$$
\begin{aligned}
(f, P_0) &= \int_{-1}^1 e^x dx \approx 2.3504 \\
(f, P_1) &= \int_{-1}^1 x e^x dx \approx 0.7358 \\
(f, P_2) &= \int_{-1}^1\!\left(\frac{3x^2 - 1}{2}\right) e^x dx \approx 0.1431 \\
(f, P_3) &= \int_{-1}^1\!\left(\frac{5x^3 - 3x}{2}\right) e^x dx \approx 0.02013
\end{aligned}
$$

由 $a_k^* = \dfrac{2k+1}{2}(f, P_k)$ 得 $a_0^* \approx 1.1752,\ a_1^* \approx 1.1036,\ a_2^* \approx 0.3578,\ a_3^* \approx 0.07046$。代入 (3.5.6):

$$
S_3^*(x) = 0.9963 + 0.9979\, x + 0.5367\, x^2 + 0.1761\, x^3
$$

均方误差 $\|\delta\|_2^2 = \int_{-1}^1 e^{2x} dx - \sum \dfrac{2}{2k+1}(a_k^*)^2 \le 0.0084$；最大误差 $\|\delta\|_\infty \le 0.0112$。

**任意区间上的函数逼近**——若 $f \in C[a, b]$，求 $[a, b]$ 上的最佳平方逼近多项式：

1. **normalization**：令 $x = \dfrac{b - a}{2} t + \dfrac{b + a}{2}$，$t \in [-1, 1]$，得 $F(t) = f(x)$
2. 用 Legendre 多项式求 $F(t)$ 的最佳平方逼近多项式 $S_n^*(t)$
3. **de-normalization**：回代 $S_n^*(x) = S_n^*\!\left(\dfrac{2 x - a - b}{b - a}\right)$

**正交多项式逼近：讨论**：

- Legendre 展开等价于 $H_n$ 中解法方程，但**不解线性方程组**，不存在病态问题
- 计算公式使用方便，通常都用此法求最佳平方逼近多项式

### 6. 曲线拟合的最小二乘法

**数据拟合**：从一组实验数据 $(x_i, y_i),\ i = 0, 1, \ldots, m$ 寻找 $x$ 与 $y$ 之间的函数关系 $y = F(x)$。

- 观测数据往往不准确，故**不要求** $y = F(x)$ 经过所有点，只要求误差 $\delta_i = F(x_i) - y_i$ 按某种标准最小
- 记 $\boldsymbol{\delta} = (\delta_0, \ldots, \delta_m)^T$，目标是使 $\|\boldsymbol{\delta}\|$ 最小

> 最大范数计算困难，通常采用 Euclid 范数 $\|\boldsymbol{\delta}\|_2$ 作误差度量。

**最小二乘逼近**：在函数空间 $\Phi = \mathrm{span}\{\varphi_0, \ldots, \varphi_n\}$ 中找 $S^*(x)$，使

$$
\|\boldsymbol{\delta}\|_2^2 = \sum_{i=0}^m \bigl[S^*(x_i) - y_i\bigr]^2 = \min_{S \in \Phi} \sum_{i=0}^m \bigl[S(x_i) - y_i\bigr]^2 
$$

其中 $S(x) = a_0 \varphi_0(x) + \cdots + a_n \varphi_n(x),\ n < m$ $$。几何上称为**曲线拟合的最小二乘**。

加权平方和：

$$
\|\boldsymbol{\delta}\|_2^2 = \sum_{i=0}^m \omega(x_i)\bigl[S^*(x_i) - f(x_i)\bigr]^2 
$$

- **权 $\omega(x_i)$**——表示不同点 $(x_i, f(x_i))$ 处的数据比重，可表示重复观测次数

**求解**：等价于求多元函数

$$
I(a_0, a_1, \ldots, a_n) = \sum_{i=0}^m \omega(x_i)\!\left[\sum_{j=0}^n a_j \varphi_j(x_i) - f(x_i)\right]^2 
$$

的极小点 $a_0^*, \ldots, a_n^*$。由 $\dfrac{\partial I}{\partial a_k} = 0$：

$$
2\sum_{i=0}^m \omega(x_i)\!\left[\sum_{j=0}^n a_j \varphi_j(x_i) - f(x_i)\right]\varphi_k(x_i) = 0,\quad k = 0, 1, \ldots, n
$$

记**离散内积**

$$
(\varphi_j, \varphi_k) = \sum_{i=0}^m \omega(x_i) \varphi_j(x_i) \varphi_k(x_i) 
$$

$$
(f, \varphi_k) = \sum_{i=0}^m \omega(x_i) f(x_i) \varphi_k(x_i) \equiv d_k
$$

得**法方程**

$$
\sum_{j=0}^n (\varphi_k, \varphi_j) a_j = d_k\quad (k = 0, 1, \ldots, n) 
$$

或矩阵形式 $\boldsymbol{G}\boldsymbol{a} = \boldsymbol{d}$，其中

$$
\boldsymbol{a} = (a_0, \ldots, a_n)^T,\quad \boldsymbol{d} = (d_0, \ldots, d_n)^T,\quad \boldsymbol{G} = ((\varphi_j, \varphi_k))
$$

由 $\{\varphi_k\}$ 线性无关，$|\boldsymbol{G}| \ne 0$，唯一解 $a_k^* = a_k$，故

$$
S^*(x) = a_0^* \varphi_0(x) + a_1^* \varphi_1(x) + \cdots + a_n^* \varphi_n(x)
$$

充分性：对任何 $S \in \Phi$，$\sum \omega [S^* - f]^2 \le \sum \omega [S - f]^2$，故 $S^*$ 是最小二乘解。

**例 3.5**：已知数据

| $x_i$ | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| $f_i$ | 4 | 4.5 | 6 | 8 | 8.5 |
| $\omega_i$ | 2 | 1 | 3 | 1 | 1 |

观察坐标点分布在一条直线附近，选 $S_1(x) = a_0 + a_1 x$，$\varphi_0(x) = 1,\ \varphi_1(x) = x$。

$$
\begin{aligned}
(\varphi_0, \varphi_0) &= \sum \omega_i = 8 \\
(\varphi_0, \varphi_1) = (\varphi_1, \varphi_0) &= \sum \omega_i x_i = 22 \\
(\varphi_1, \varphi_1) &= \sum \omega_i x_i^2 = 74 \\
(\varphi_0, f) &= \sum \omega_i f_i = 47 \\
(\varphi_1, f) &= \sum \omega_i x_i f_i = 145.5
\end{aligned}
$$

法方程

$$
\begin{cases}
8 a_0 + 22 a_1 = 47 \\
22 a_0 + 74 a_1 = 145.5
\end{cases}
$$

解得 $a_0 = 2.77,\ a_1 = 1.13$，故 $S_1^*(x) = 2.77 + 1.13 x$。

**例 3.6**：某化学反应过程，质量分数 $y\ (\times 10^{-3})$ 与时间 $t/\min$ 关系，$t = 1, 2, \ldots, 16$ 对应 $y = 4.00, 6.40, 8.00, \ldots, 10.55, 10.58, 10.60$。求拟合曲线。

观察：质量分数开始增长快，逐渐稳定。$t = 0$ 时 $y = 0$；$t \to \infty$ 时 $y$ 趋于水平渐近线。

**方法一**（双曲线型）：设 $1/y = a + b/t$。令 $\hat y_i = 1/y_i,\ x_i = 1/t_i$，用线性函数 $S_1(x) = a + b x$ 拟合 $(x_i, \hat y_i)\ (i = 1, \ldots, 16)$。可得方程组

$$
\begin{cases}
16 a + 3.38073\, b = 1.8372 \times 10^3 \\
3.38073\, a + 1.58435\, b = 0.52886 \times 10^3
\end{cases}
$$

解得 $y = \dfrac{t}{80.6621\, t + 161.6822} = F^{(1)}(t)$。

**方法二**（指数型）：设 $y = a e^{b/t}$，两端取对数 $\ln y = \ln a + b/t$。令 $\hat y_i = \ln y_i,\ A = \ln a,\ x_i = 1/t_i$，拟合 $S_1(x) = A + b x$，求解后

$$
y = 11.3253 \times 10^{-3}\, e^{-1.0567/t} = F^{(2)}(t)
$$

**比较**：

- $\delta_i^{(1)} = y_i - F^{(1)}(t_i)$ 和 $\delta_i^{(2)} = y_i - F^{(2)}(t_i)$ 都比较小
- $\|\boldsymbol{\delta}^{(1)}\|_2 = 0.568 \times 10^{-3}$，$\|\boldsymbol{\delta}^{(2)}\|_2 = 0.277 \times 10^{-3}$
- $\sum_i |\delta_i^{(1)}| = 1.19 \times 10^{-3}$，$\sum_i |\delta_i^{(2)}| = 0.34 \times 10^{-3}$

$F^{(2)}(t)$ 更好。

**数据拟合流程**：

1. 在坐标系中画出数据点，观察分布
2. 取基函数系 $\{\varphi_0, \varphi_1, \ldots, \varphi_n\}$（多项式 / 指数 / 三角等）
3. 构成法方程并求解，得到拟合曲线，分析误差

> 拟合曲线的数学模型并不是一开始就能选得好，往往要通过分析确定若干模型后再实际计算选出较好的；存在**过拟合**的风险。

**正交函数作数据拟合**：法方程系数矩阵 $\boldsymbol{G}$ 可能病态。若 $\{\varphi_0, \ldots, \varphi_n\}$ 关于点集 $\{x_i\}$ 带权 $\omega(x_i)$ 正交：

$$
(\varphi_j, \varphi_k) = \sum_{i=0}^m \omega(x_i) \varphi_j(x_i) \varphi_k(x_i) = \begin{cases} 0, & j \ne k \\ A_k > 0, & j = k \end{cases} 
$$

则法方程退化为

$$
a_k^* = \frac{(f, \varphi_k)}{(\varphi_k, \varphi_k)} = \frac{\sum_{i=0}^m \omega(x_i) f(x_i) \varphi_k(x_i)}{\sum_{i=0}^m \omega(x_i) \varphi_k^2(x_i)},\quad k = 0, 1, \ldots, n 
$$

误差 $\|\boldsymbol{\delta}\|_2^2 = \|f\|_2^2 - \sum_{k=0}^n A_k (a_k^*)^2$。

**多元最小二乘拟合**：已知多元函数 $y = f(x_1, \ldots, x_d)$ 测量数据 $(x_{1i}, \ldots, x_{di}, y_i)$ 及权 $\omega_i > 0$，求 $S_n(x_1, \ldots, x_d) = \sum_{k=0}^n a_k \varphi_k(x_1, \ldots, x_d)$ 使 $F(\boldsymbol{a}) = \sum \omega_i [y_i - S_n(\cdot)]^2$ 最小。法方程

$$
\sum_{j=0}^n (\varphi_k, \varphi_j) a_j = d_k,\quad (\varphi_k, \varphi_j) = \sum_i \omega(x_i) \varphi_k(\cdot) \varphi_j(\cdot)
$$

**数据拟合 vs 数据插值**：

- **数据拟合**：不要求拟合函数通过所有数据点；数据量大且不能保证无误差；严格通过每点不合理
- **数据插值**：插值函数必须通过每一个数据点

---

**第三章总结**：

- **3.1 引言与预备知识**：一致逼近 / 均方逼近 / 一致逼近存在性（Weierstrass 定理）/ 连续函数空间
- **3.2 最佳一致逼近多项式**：定义 / 偏差点 / Chebyshev 定理及推论 / 最佳一次逼近多项式
- **3.3 最佳平方逼近**：权函数 / 函数内积 / 函数范数 / 正交函数 / 线性无关函数 / 法方程
- **3.4 正交多项式**：Legendre 多项式 / Chebyshev 多项式 / 第二类 Chebyshev / Laguerre / Hermite
- **3.5 函数按正交多项式展开**：广义 Fourier 系数 / 任意区间上的函数逼近
- **3.6 曲线拟合的最小二乘法**：数据拟合 / 最小二乘逼近 / 正交函数作最小二乘拟合 / 多元拟合

---

## 四.数值积分与数值微分

### 1. 引言

#### 积分计算的挑战

**Newton-Leibniz 公式**：对于积分 $I = \int_a^b f(x) \mathrm{d}x$，若 $f(x)$ 的原函数为 $F(x)$，则

$$
\int_a^b f(x) \mathrm{d}x = F(b) - F(a)
$$

**实际使用中的问题**：

- 大量被积函数 $f(x)$ 难找到用初等函数表示的原函数，例如 $\dfrac{\sin x}{x}$、$e^{-x^2}$ 等
- $f(x)$ 是由测量或数值计算给出的数据表，Newton-Leibniz 公式无法直接使用

#### 积分基本思想

**积分中值定理**：在积分区间 $[a, b]$ 内存在一点 $\xi$，使

$$
\int_a^b f(x) \mathrm{d}x = (b - a) f(\xi)
$$

底为 $b - a$、高为 $f(\xi)$ 的矩形面积等于所求曲边梯形的面积 $I$。

- **平均高度** —— $f(\xi)$ 称为区间 $[a, b]$ 上的平均高度
- $\xi$ 的具体位置一般不知道，难以准确算出 $f(\xi)$

**近似平均高度 $f(\xi)$**：

- **梯形公式**：用端点高度 $f(a)$ 与 $f(b)$ 的平均近似 $f(\xi)$

$$
T = (b - a) \cdot \frac{f(a) + f(b)}{2} 
$$

- **矩形公式**：用区间中点 $c = \dfrac{a + b}{2}$ 的高度 $f(c)$ 近似 $f(\xi)$

$$
R = (b - a) f\left(\frac{a + b}{2}\right) 
$$

#### 机械求积

在区间 $[a, b]$ 上适当选取节点 $x_k$，用 $f(x_k)$ 的加权平均来近似 $f(\xi)$，得到形式

$$
\int_a^b f(x) \mathrm{d}x \approx \sum_{k=0}^n A_k f(x_k) 
$$

- **求积节点** —— 节点 $x_k$
- **求积系数** —— $A_k$，亦称伴随节点 $x_k$ 的权
- 权 $A_k$ 仅与节点 $x_k$ 的选取有关，而不依赖于被积函数 $f(x)$ 的具体形式

把积分问题转化为函数值的计算。

#### 代数精度

> **定义 4.1**：如果某个求积公式对于次数不大于 $m$ 的多项式均能准确成立，但对于 $m + 1$ 次多项式就不一定准确，则称该求积公式具有 $m$ 次代数精度。

- 梯形公式 (4.1.1) 具有 1 次代数精度
- 矩形公式 (4.1.2) 具有 1 次代数精度

欲使求积公式 $\int_a^b f(x) \mathrm{d}x \approx \sum_{k=0}^n A_k f(x_k)$ 具有 $m$ 次代数精度，只要令它对于 $f(x) = 1, x, x^2, \ldots, x^m$ 都成立，即

$$
\begin{aligned}
\sum A_k &= b - a \\
\sum A_k x_k &= \tfrac{1}{2}(b^2 - a^2) \\
&\;\;\vdots \\
\sum A_k x_k^m &= \tfrac{1}{m+1}(b^{m+1} - a^{m+1})
\end{aligned} 
$$

取 $n = m$，选定 $n + 1$ 个求积节点 $x_k$，则得到 $n + 1$ 个方程、$n + 1$ 个变量。

#### 插值型求积公式

给定一组节点 $a \leq x_0 < x_1 < \cdots < x_n \leq b$，已知 $f(x)$ 在这些节点上的值，作 $n$ 次 Lagrange 插值多项式 $L_n(x) = \sum_{k=0}^n f(x_k) l_k(x)$，则积分

$$
I_n = \int_a^b L_n(x) \mathrm{d}x = \sum_{k=0}^n \left( \int_a^b l_k(x) \mathrm{d}x \right) f(x_k)
$$

对照机械求积式 (4.1.3)，得求积系数

$$
A_k = \int_a^b l_k(x) \mathrm{d}x = \int_a^b \prod_{\substack{j=0 \\ j \ne k}}^n \frac{x - x_j}{x_k - x_j} \mathrm{d}x 
$$

- **插值型求积公式** —— 由式 (4.1.6) 确定求积系数 $A_k$ 的求积公式

**插值余项**：根据定理 2.2，

$$
R_n(x) = f(x) - L_n(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!} \omega_{n+1}(x)
$$

故插值型求积公式的余项

$$
R(f) = I - I_n = \int_a^b \frac{f^{(n+1)}(\xi)}{(n+1)!} \omega_{n+1}(x) \mathrm{d}x 
$$

> **定理 4.1**：形如式 (4.1.5) 的求积公式至少有 $n$ 次代数精度的充分必要条件是它是插值型的。

- **充分性**：次数不大于 $n$ 的多项式 $f(x)$，由 (4.1.7) 可知 $R(f) = 0$，故有 $n$ 次代数精度
- **必要性**：若公式至少具有 $n$ 次代数精度，则对插值基函数 $l_k(x)$ 准确成立，即 $\int_a^b l_k(x) \mathrm{d}x = \sum_j A_j l_k(x_j) = A_k$，与 (4.1.6) 中定义一致

---

### 2. Newton-Cotes 公式

#### Newton-Cotes 公式的构造

将积分区间 $[a, b]$ 划分为 $n$ 等份，步长 $h = \dfrac{b - a}{n}$，取等距节点 $x_k = a + kh$ 构造插值型求积公式

$$
I_n = (b - a) \sum_{k=0}^n C_k^{(n)} f(x_k) 
$$

- **Cotes 系数** —— $C_k^{(n)}$，由式 (4.1.6) 经变换 $x = a + th$ 得

$$
C_k^{(n)} = \frac{(-1)^{n-k}}{n \cdot k! (n - k)!} \int_0^n \prod_{\substack{j=0 \\ j \ne k}}^n (t - j) \mathrm{d}t 
$$

#### 低阶 Newton-Cotes 公式

**$n = 1$（梯形公式）**：$C_0^{(1)} = C_1^{(1)} = \dfrac{1}{2}$

$$
T = \frac{b - a}{2} \big[ f(a) + f(b) \big]
$$

**$n = 2$（Simpson 公式）**：$C_0^{(2)} = \dfrac{1}{6}$，$C_1^{(2)} = \dfrac{4}{6}$，$C_2^{(2)} = \dfrac{1}{6}$

$$
S = \frac{b - a}{6} \left[ f(a) + 4 f\left(\frac{a + b}{2}\right) + f(b) \right] 
$$

**$n = 4$（Cotes 公式）**：$C_0^{(4)} = \dfrac{7}{90}$，$C_1^{(4)} = \dfrac{32}{90}$，$C_2^{(4)} = \dfrac{12}{90}$，$C_3^{(4)} = \dfrac{32}{90}$，$C_4^{(4)} = \dfrac{7}{90}$

$$
C = \frac{b - a}{90} \big[ 7 f(x_0) + 32 f(x_1) + 12 f(x_2) + 32 f(x_3) + 7 f(x_4) \big] 
$$

其中 $x_k = a + kh$，$h = \dfrac{b-a}{4}$。

> 当 $n \geq 8$ 时，Cotes 系数有正有负，**稳定性得不到保证**。

#### Newton-Cotes 公式的代数精度

由定理 4.1，作为插值型公式，$n$ 阶 Newton-Cotes 公式至少具有 $n$ 次代数精度。

> **定理 4.2**：当阶 $n$ 为偶数时，Newton-Cotes 公式至少有 $n + 1$ 次代数精度。

证明思路：当 $n$ 为偶数时，对 $f(x) = x^{n+1}$ 的余项为零。由 $f^{(n+1)}(x) = (n+1)!$，余项

$$
R(f) = h^{n+2} \int_0^n \prod_{j=0}^n (t - j) \mathrm{d}t
$$

令 $t = u + \dfrac{n}{2}$（$\dfrac{n}{2}$ 为整数），被积函数 $H(u) = \prod_{j=0}^n (u + n/2 - j) = \prod_{j=-n/2}^{n/2}(u - j)$ 为奇函数，故 $R(f) = 0$。

#### Newton-Cotes 公式余项

对所有 $n$，应用加权积分中值定理

$$
R(f) = \frac{f^{(n+1)}(\eta)}{(n+1)!} \int_a^b \omega_{n+1}(x) \mathrm{d}x,\quad \eta \in [a, b]
$$

**梯形公式余项（$n = 1$）**：

$$
R_T = -\frac{(b - a)^3}{12} f''(\eta),\quad \eta \in [a, b]
$$

对 $n$ 为偶数的更紧上界：构造次数不大于 $n + 1$ 次的多项式 $H(x)$，使 $H(x_k) = L_n(x_k)$（所有节点）且 $H'(x_i) = L_n'(x_i)$（任一节点 $x_i$），运用 Rolle 定理类似 Hermite 余项推导，可得

$$
R(f) = \frac{f^{(n+2)}(\eta)}{(n+2)!} \int_a^b (x - x_i) \omega_{n+1}(x) \mathrm{d}x
$$

**Simpson 公式余项（$n = 2$，$x_i = c = \dfrac{a + b}{2}$）**：

$$
R_S = -\frac{b - a}{180} \left( \frac{b - a}{2} \right)^4 f^{(4)}(\eta) 
$$

**Cotes 公式余项（$n = 4$，$x_i = c = \dfrac{a + b}{2}$）**：

$$
R_C = -\frac{2(b - a)}{945} \left( \frac{b - a}{4} \right)^6 f^{(6)}(\eta) 
$$

### 3. 复合求积公式

#### 研究动机

使用 Newton-Cotes 公式时，提高阶的途径并不总能取得满意效果（$n \geq 8$ 时不稳定）。

**复合求积法**：

- 将积分区间 $[a, b]$ 划分为 $n$ 等份，步长 $h = \dfrac{b-a}{n}$，分点 $x_k = a + kh$
- 先用低阶 Newton-Cotes 公式求得每个子区间 $[x_k, x_{k+1}]$ 的积分值 $I_k$
- 然后求和 $\sum_{k=0}^{n-1} I_k$ 作为积分 $I$ 的近似值

> 思想：**分段低次插值，各段积分再求和**

#### 复合梯形公式

$$
T_n = \sum_{k=0}^{n-1} \frac{h}{2} \big[ f(x_k) + f(x_{k+1}) \big] = \frac{h}{2} \left[ f(a) + 2 \sum_{k=1}^{n-1} f(x_k) + f(b) \right] 
$$

**余项**：

$$
R_T = I - T_n = \sum_{k=0}^{n-1} \left( -\frac{h^3}{12} f''(\eta_k) \right) = -\frac{(b - a)}{12} h^2 f''(\eta) 
$$

#### 复合 Simpson 公式

记子区间 $[x_k, x_{k+1}]$ 的中点为 $x_{k+1/2}$：

$$
\begin{aligned}
S_n &= \sum_{k=0}^{n-1} \frac{h}{6} \big[ f(x_k) + 4 f(x_{k+1/2}) + f(x_{k+1}) \big] \\
&= \frac{h}{6} \left[ f(a) + 4 \sum_{k=0}^{n-1} f(x_{k+1/2}) + 2 \sum_{k=1}^{n-1} f(x_k) + f(b) \right]
\end{aligned} 
$$

**余项**：

$$
I - S_n = -\frac{(b - a)}{180} \left( \frac{h}{2} \right)^4 f^{(4)}(\eta)
$$

#### 复合 Cotes 公式

记子区间 $[x_k, x_{k+1}]$ 的 4 等分点 $x_{k+1/4}$、$x_{k+1/2}$、$x_{k+3/4}$：

$$
\begin{aligned}
C_n = \frac{h}{90} \bigg[ &7 f(a) + 32 \sum_{k=0}^{n-1} f(x_{k+1/4}) + 12 \sum_{k=0}^{n-1} f(x_{k+1/2}) \\
&+ 32 \sum_{k=0}^{n-1} f(x_{k+3/4}) + 14 \sum_{k=1}^{n-1} f(x_k) + 7 f(b) \bigg]
\end{aligned} 
$$

**余项**：

$$
I - C_n = -\frac{2(b - a)}{945} \left( \frac{h}{4} \right)^6 f^{(6)}(\eta) 
$$

#### 示例

**例 4.1**：计算 $I = \int_0^1 \dfrac{\sin x}{x} \mathrm{d}x$。

- 方法一：8 等份，复合梯形法 $T_8 = 0.9456909$
- 方法二：4 等份，复合 Simpson 法 $S_4 = 0.9460832$
- 准确值 $I = 0.9460831$：$T_8$ 只有 2 位有效数字，$S_4$ 有 6 位有效数字

#### 误差的渐近性

> **定义 4.2**：如果复化求积公式 $I_h$ 当 $h \to 0$ 时成立渐近关系式 $\dfrac{I - I_h}{h^p} \to C$ ($C \ne 0$)，则称求积公式 $I_h$ 是 $p$ 阶收敛的。

- 复合梯形法：2 阶收敛
- 复合 Simpson 法：4 阶收敛
- 复合 Cotes 法：6 阶收敛

误差关系：

$$
\begin{aligned}
I - T_n &\approx -\frac{h^2}{12} \big[ f'(b) - f'(a) \big]  \\
I - S_n &\approx -\frac{1}{180} \left( \frac{h}{2} \right)^4 \big[ f^{(3)}(b) - f^{(3)}(a) \big]  \\
I - C_n &\approx -\frac{2}{945} \left( \frac{h}{4} \right)^6 \big[ f^{(5)}(b) - f^{(5)}(a) \big] 
\end{aligned}
$$

$h$ 减半时，复合梯形误差变为 $1/4$，复合 Simpson 变为 $1/16$，复合 Cotes 变为 $1/64$。

---

### 4. Romberg 求积公式

#### 变步长方案

复合求积优点：对提高精度行之有效；缺点：必须给出合适的步长。

**变步长方案**：在步长逐次分半（二分）的过程中反复利用复合求积公式，直至积分值满足精度要求。

#### 梯形法的递推化

将区间二分一次，分点增至 $2n + 1$ 个。每个子区间 $[x_k, x_{k+1}]$ 增加一个分点 $x_{k+1/2} = \dfrac{1}{2}(x_k + x_{k+1})$，子区间积分（步长 $\dfrac{h}{2}$）：

$$
\frac{h}{4} \big[ f(x_k) + 2 f(x_{k+1/2}) + f(x_{k+1}) \big]
$$

各子区间积分求和后，**递推公式**：

$$
T_{2n} = \frac{1}{2} T_n + \frac{h}{2} \sum_{k=0}^{n-1} f(x_{k+1/2}) 
$$

**例 4.2**：计算 $I = \int_0^1 \dfrac{\sin x}{x} \mathrm{d}x$。

- $T_1 = \dfrac{1}{2}[f(0) + f(1)] = 0.9207355$（定义 $f(0) = 1$，$f(1) = 0.8414709$）
- $T_2 = \dfrac{1}{2} T_1 + \dfrac{1}{2} f(1/2) = 0.9397933$
- $T_4 = \dfrac{1}{2} T_2 + \dfrac{1}{4} [f(1/4) + f(3/4)] = 0.9445135$
- 变步长二分 10 次后 $T_{2^{10}} = 0.9460831$（达准确值）

#### 误差的事后估计

复合梯形法误差 $I - T_n \approx -\dfrac{h^2}{12} [f'(b) - f'(a)]$，$T_n$ 误差大致与 $h^2$ 成正比。步长二分后

$$
\frac{I - T_{2n}}{I - T_n} \approx \frac{1}{4} \;\Rightarrow\; I - T_{2n} \approx \frac{1}{3} (T_{2n} - T_n) 
$$

二分前后积分值相当接近，即可保证 $T_{2n}$ 误差很小。

#### Romberg 公式

用误差作为补偿：

$$
\bar T = T_{2n} + \frac{1}{3} (T_{2n} - T_n) = \frac{4}{3} T_{2n} - \frac{1}{3} T_n 
$$

例 4.2 中 $T_4 = 0.9445135$、$T_8 = 0.9456909$ 精度只有两三位有效数字，但

$$
\bar T = \frac{4}{3} T_8 - \frac{1}{3} T_4 = 0.9460833
$$

却有 6 位有效数字。

**$T \to S$**：比较 (4.2.9) 和 (4.2.11) 得

$$
S_n = \frac{4}{3} T_{2n} - \frac{1}{3} T_n 
$$

**$S \to C$**：Simpson 余项与 $h^4$ 成正比，步长折半误差变为 $1/16$：

$$
\bar S = \frac{16}{15} S_{2n} - \frac{1}{15} S_n = C_n 
$$

正是 Cotes 公式的积分值！

**$C \to R$**：Cotes 余项与 $h^6$ 成正比，类似可推 Romberg 公式

$$
R_n = \frac{64}{63} C_{2n} - \frac{1}{63} C_n 
$$

在变步长过程中运用 (4.3.4)、(4.3.5)、(4.3.6)，可将粗糙的梯形值 $T_n$ 逐步加工成精度较高的 Simpson 值 $S_n$、Cotes 值 $C_n$、Romberg 值 $R_n$。

**例 4.3** Romberg 加速表：

| $k$ | $T_{2^k}^{(0)}$ | $S_{2^{k-1}}^{(1)}$ | $C_{2^{k-2}}^{(2)}$ | $R_{2^{k-3}}^{(3)}$ |
|-----|-----------------|---------------------|---------------------|---------------------|
| 0 | 0.9207355 | | | |
| 1 | 0.9397933 | 0.9461459 | | |
| 2 | 0.9445135 | 0.9460869 | 0.9460830 | |
| 3 | 0.9456909 | 0.9460833 | 0.9460831 | 0.9460831 |

通过 3 次二分就得到了准确值 $I = 0.9460831$。

#### Richardson 外推加速法

> **定理 4.3**：设 $f(x) \in C^\infty[a, b]$，则复合梯形法公式可展开为

$$
T(h) = I + a_1 h^2 + a_2 h^4 + a_3 h^6 + \cdots + a_k h^{2k} + \cdots 
$$

其中系数 $a_k$ 与 $h$ 无关。

由 (4.3.7) 得

$$
T\left( \frac{h}{2} \right) = I + \frac{a_1}{4} h^2 + \frac{a_2}{16} h^4 + \frac{a_3}{64} h^6 + \cdots 
$$

两式按下列方式线性组合消去 $h^2$：

$$
T_1(h) = \frac{4}{3} T\left( \frac{h}{2} \right) - \frac{1}{3} T(h) = I + \beta_1 h^4 + \beta_2 h^6 + \beta_3 h^8 + \cdots 
$$

$\{T_1(h)\}$ 即 Simpson 值序列。继续：

$$
T_2(h) = \frac{16}{15} T_1\left( \frac{h}{2} \right) - \frac{1}{15} T_1(h) = I + \gamma_1 h^6 + \gamma_2 h^8 + \cdots
$$

$\{T_2(h)\}$ 即 Cotes 值序列。**每加速一次，误差量级提高 2 阶**。

**一般公式**：记 $T_0(h) = T(h)$，

$$
T_m(h) = \frac{4^m}{4^m - 1} T_{m-1}\left( \frac{h}{2} \right) - \frac{1}{4^m - 1} T_{m-1}(h) 
$$

经过 $m$ 次加速后余项

$$
T_m(h) = I + \delta_1 h^{2(m+1)} + \delta_2 h^{2(m+2)} + \cdots 
$$

用 $T_0^{(k)}$ 表示二分 $k$ 次后的梯形值，$T_m^{(k)}$ 表示序列 $\{T_0^{(k)}\}$ 的 $m$ 次加速值：

$$
T_m^{(k)} = \frac{4^m}{4^m - 1} T_{m-1}^{(k+1)} - \frac{1}{4^m - 1} T_{m-1}^{(k)} 
$$

可构造 $T$ 数表：

```
T_0^{(0)}
T_0^{(1)}  T_1^{(0)}
T_0^{(2)}  T_1^{(1)}  T_2^{(0)}
   ⋮         ⋮         ⋮       ⋱
```

可以证明，如果 $f(x)$ 充分光滑，$T$ 数表的每一列元素及对角线元素均收敛到所求积分值 $I$：

$$
\lim_{k \to \infty} T_m^{(k)} = I\;(m \text{ 固定}),\quad \lim_{m \to \infty} T_m^{(0)} = I
$$

#### Romberg 算法流程

1. **准备初值**：计算 $T_0^{(0)} = \dfrac{b - a}{2}[f(a) + f(b)]$，令 $k \leftarrow 1$
2. **求梯形值**：按式 (4.3.1) 计算 $T_0^{(k)}$
3. **求加速值**：逐个求出 $T$ 数表第 $k + 1$ 行其余元素 $T_j^{(k-j)}$（$j = 1, 2, \ldots, k$），按式 (4.3.13)
4. **精度控制**：对指定精度 $\varepsilon$，若 $|T_k^{(0)} - T_{k-1}^{(0)}| < \varepsilon$ 则终止，取 $T_k^{(0)}$ 为结果；否则 $k \leftarrow k + 1$，转 2

### 5. Gauss 求积公式

#### 5.1 基本思想

回顾机械求积公式

$$
\int_a^b f(x)\, \mathrm{d}x \approx \sum_{k=0}^n A_k f(x_k) 
$$

含有 $2n + 2$ 个待定参数 $x_k, A_k$（$k = 0, 1, \ldots, n$）。

- **Newton-Cotes 公式**：等距取 $x_k$，仅含 $n + 1$ 个待定参数 $A_k$，公式仅具 $n$ 或 $n + 1$ 次代数精度
- **Gauss 公式**：适当选择 $x_k, A_k$，使公式具有 **$2n + 1$ 次代数精度**

> **定义 4.3** 如果求积公式 (4.4.1) 具有 $2n + 1$ 次代数精度，则称节点 $x_k$（$k = 0, 1, \ldots, n$）是 **Gauss 点**。

求解 Gauss 点 $x_k$ 及对应 $A_k$：根据代数精度定义，联立 $2n + 2$ 个方程求解。

#### 5.2 Gauss 公式的构造：正交性条件

> **定理 4.4** 对于插值型求积公式 (4.4.1)，节点 $x_k$（$k = 0, \ldots, n$）是 Gauss 点的**充分必要条件**，是以这些点为零点的多项式
>
> $$\omega(x) = \prod_{k=0}^n (x - x_k)$$
>
> 与任意次数不超过 $n$ 的多项式 $P(x)$ 均**正交**，即
>
> $$\int_a^b P(x)\omega(x)\, \mathrm{d}x = 0 $$

**必要性证明**（Gauss 点 ⇒ 正交）：

- 设 $P(x)$ 是任意次数不超过 $n$ 的多项式，则 $P(x)\omega(x)$ 的次数不超过 $2n + 1$
- 若 $x_0, x_1, \ldots, x_n$ 是 Gauss 点，则求积公式对 $P(x)\omega(x)$ 准确成立：

$$
\int_a^b P(x)\omega(x)\, \mathrm{d}x = \sum_{k=0}^n A_k P(x_k)\omega(x_k)
$$

- 但 $\omega(x_k) = 0$（$k = 0, 1, \ldots, n$），故

$$
\int_a^b P(x)\omega(x)\, \mathrm{d}x = 0
$$

即 $P(x)$ 与 $\omega(x)$ 正交。

**充分性证明**（正交 ⇒ Gauss 点）：

- 对任意给定次数不超过 $2n + 1$ 的多项式 $f(x)$，用 $\omega(x)$ 除 $f(x)$，记商为 $P(x)$，余式为 $Q(x)$，$P(x), Q(x)$ 都是次数不超过 $n$ 的多项式：

$$
f(x) = P(x)\omega(x) + Q(x)
$$

- 利用正交关系 $\int_a^b P(x)\omega(x)\, \mathrm{d}x = 0$，可得

$$
\int_a^b f(x)\, \mathrm{d}x = \int_a^b Q(x)\, \mathrm{d}x 
$$

- 求积公式是插值型的，故有 $n$ 次代数精度，对 $Q(x)$ 准确成立（定理 4.1）：

$$
\int_a^b Q(x)\, \mathrm{d}x = \sum_{k=0}^n A_k Q(x_k)
$$

- 注意到 $\omega(x_k) = 0$，因此

$$
Q(x_k) = P(x_k)\omega(x_k) + Q(x_k) = f(x_k)
$$

- 从而

$$
\int_a^b f(x)\, \mathrm{d}x = \int_a^b Q(x)\, \mathrm{d}x = \sum_{k=0}^n A_k f(x_k)
$$

即式 (4.4.1) 对次数不超过 $2n + 1$ 的多项式均成立。

#### 5.3 Gauss-Legendre 公式

设 $a = -1, b = 1$，考察区间 $[-1, 1]$ 的 Gauss 公式：

$$
\int_{-1}^1 f(x)\, \mathrm{d}x \approx \sum_{k=0}^n A_k f(x_k) 
$$

**Legendre 多项式**（区间 $[-1, 1]$、权函数 $\rho(x) \equiv 1$，由 $\{1, x, x^2, \ldots, x^n\}$ 正交化得到）：

$$
P_0(x) = 1,\quad P_n(x) = \frac{1}{2^n n!}\frac{\mathrm{d}^n}{\mathrm{d}x^n}[(x^2 - 1)^n]\quad (n = 1, 2, \ldots)
$$

性质：
- $P_{n+1}(x)$ 与任一次数不超过 $n$ 的多项式正交
- $P_{n+1}(x)$ 在区间 $(-1, 1)$ 内有 $n + 1$ 个不同实零点

故 **Legendre 多项式 $P_{n+1}(x)$ 的零点就是求积公式 (4.4.4) 的 Gauss 点**，由此构造的求积公式称为 **Gauss-Legendre 公式**。

**$n = 0$ 的情况**：

取 $P_1(x) = x$ 的零点 $x_0 = 0$ 作节点：

$$
\int_{-1}^1 f(x)\, \mathrm{d}x \approx A_0 f(0)
$$

令上式对 $f(x) = 1$ 准确成立，得 $A_0 = 2$，即**中矩形公式**：

$$
\int_{-1}^1 f(x)\, \mathrm{d}x \approx 2 f(0)
$$

**$n = 1$ 的情况**：

取 $P_2(x) = \frac{1}{2}(3x^2 - 1)$ 的两个零点 $\pm \frac{1}{(3)^{1/2}}$ 构造求积公式：

$$
\int_{-1}^1 f(x)\, \mathrm{d}x \approx A_0 f\!\left(-\frac{1}{(3)^{1/2}}\right) + A_1 f\!\left(\frac{1}{(3)^{1/2}}\right)
$$

令上式对 $f(x) = 1, x$ 准确成立：

$$
\begin{aligned}
A_0 + A_1 &= 2 \\
-\frac{1}{(3)^{1/2}} A_0 + \frac{1}{(3)^{1/2}} A_1 &= 0
\end{aligned}
$$

解得 $A_0 = A_1 = 1$，得**两点 Gauss-Legendre 公式**：

$$
\int_{-1}^1 f(x)\, \mathrm{d}x \approx f\!\left(-\frac{1}{(3)^{1/2}}\right) + f\!\left(\frac{1}{(3)^{1/2}}\right)
$$

**$n = 2$ 的三点 Gauss-Legendre 公式**：

$$
\int_{-1}^1 f(x)\, \mathrm{d}x \approx \frac{5}{9} f\!\left(-\frac{(15)^{1/2}}{5}\right) + \frac{8}{9} f(0) + \frac{5}{9} f\!\left(\frac{(15)^{1/2}}{5}\right)
$$

**拓展到任意求积区间 $[a, b]$**：通过变换

$$
x = \frac{b - a}{2} t + \frac{a + b}{2}
$$

化到区间 $[-1, 1]$：

$$
\int_a^b f(x)\, \mathrm{d}x = \frac{b - a}{2}\int_{-1}^1 f\!\left(\frac{b - a}{2} t + \frac{a + b}{2}\right) \mathrm{d}t
$$

#### 5.4 Gauss 公式的余项

> **定理 4.5** 对于 Gauss 公式 (4.4.1)，其余项
>
> $$R[x] = \int_a^b f(x)\, \mathrm{d}x - \sum_{k=0}^n A_k f(x_k) = \frac{f^{(2n+2)}(\xi)}{(2n + 2)!}\int_a^b \omega^2(x)\, \mathrm{d}x$$
>
> 其中 $\omega(x) = (x - x_0)(x - x_1)\cdots(x - x_n)$。

**推导**：

- 以 $x_0, x_1, \ldots, x_n$ 为节点构造次数不大于 $2n + 1$ 的 Hermite 插值多项式 $H(x)$，满足

$$
H(x_i) = f(x_i),\quad H'(x_i) = f'(x_i)
$$

- 由于 Gauss 公式具 $2n + 1$ 次代数精度，对 $H(x)$ 准确成立：

$$
\int_a^b H(x)\, \mathrm{d}x = \sum_{k=0}^n A_k H(x_k) = \sum_{k=0}^n A_k f(x_k)
$$

- 故余项

$$
R[x] = \int_a^b [f(x) - H(x)]\, \mathrm{d}x
$$

- Hermite 插值余项 (2.6.6)：

$$
f(x) - H(x) = \frac{f^{(2n+2)}(\xi)}{(2n + 2)!}\omega^2(x)
$$

- 由于 $\omega^2(x)$ 在 $[a, b]$ 上保号，使用加权积分中值定理：

$$
R[x] = \frac{f^{(2n+2)}(\xi)}{(2n + 2)!}\int_a^b \omega^2(x)\, \mathrm{d}x
$$

#### 5.5 Gauss 公式的稳定性

Newton-Cotes 公式当 $n \geq 8$ 时 Cotes 系数有正有负，不稳定。**Gauss 公式不仅是高精度的，而且数值稳定**——求积系数具有非负性。

> **定理 4.6** Gauss 公式 (4.4.1) 求积系数 $A_k$（$k = 0, 1, \ldots, n$）全是正的。

**证明**：

- 研究 $n$ 次的 Lagrange 多项式基函数

$$
l_k(x) = \prod_{j = 0, j \neq k}^n \frac{x - x_j}{x_k - x_j}
$$

- $l_k^2(x)$ 是 $2n$ 次多项式，故 Gauss 公式对 $l_k^2(x)$ 准确成立：

$$
0 < \int_a^b l_k^2(x)\, \mathrm{d}x = \sum_{j=0}^n A_j l_k^2(x_j) = A_k
$$

**噪声鲁棒性**：实际计算时，数据 $f_k^*$ 含舍入误差，实际求得 $I_n^* = \sum_{k=0}^n A_k f_k^*$。则

$$
|I_n - I_n^*| \leq \sum_{k=0}^n A_k |f_k - f_k^*| \leq (b - a)\max_{0 \leq k \leq n}|f_k - f_k^*|
$$

（利用 $\sum A_k = b - a$ 及 $A_k > 0$）。

#### 5.6 带权 Gauss 公式

考察积分 $I = \int_a^b \rho(x) f(x)\, \mathrm{d}x$（$\rho(x) \geq 0$ 为权函数），仿照普通积分的处理方式，考察求积公式：

$$
\int_a^b \rho(x) f(x)\, \mathrm{d}x \approx \sum_{k=0}^n A_k f(x_k)
$$

若它对任意次数不超过 $2n + 1$ 的多项式均能准确成立，则称之为 **Gauss 型的**，节点 $x_k$ 仍称为 Gauss 点。

**充要条件**：$x_k$ 是 Gauss 点 $\Leftrightarrow$ $\omega(x) = \prod_{k=0}^n (x - x_k)$ 是区间 $[a, b]$ 带权 $\rho(x)$ 的正交多项式。

**Gauss-Chebyshev 公式**：若 $a = -1, b = 1$，取权函数 $\rho(x) = \frac{1}{(1 - x^2)^{1/2}}$，则：

$$
\int_{-1}^1 \frac{f(x)}{(1 - x^2)^{1/2}}\, \mathrm{d}x \approx \sum_{k=0}^n A_k f(x_k) 
$$

回顾：区间 $[-1, 1]$ 上关于权函数 $\frac{1}{(1 - x^2)^{1/2}}$ 的正交多项式是 **Chebyshev 多项式** $T_n(x) = \cos(n\arccos x)$。

求积公式的 Gauss 点是 $n + 1$ 次 Chebyshev 多项式的零点：

$$
x_k = \cos\frac{2k + 1}{2n + 2}\pi\quad (k = 0, 1, \ldots, n)
$$

#### 5.7 一般权函数的待定系数法

一般权函数的正交化很复杂。借鉴 §1 的待定系数法：求积公式具有 $m$ 次代数精度，只要令其对 $f(x) = 1, x, x^2, \ldots, x^m$ 都成立，得方程组 (4.1.4)，是一个确定参数 $x_k, A_k$ 的代数问题。

**举例**：构造形式

$$
\int_0^1 (x)^{1/2} f(x)\, \mathrm{d}x \approx A_0 f(x_0) + A_1 f(x_1) 
$$

令它对 $f(x) = 1, x, x^2, x^3$ 准确成立：

$$
\begin{aligned}
A_0 + A_1 &= \tfrac{2}{3} \\
A_0 x_0 + A_1 x_1 &= \tfrac{2}{5} \\
A_0 x_0^2 + A_1 x_1^2 &= \tfrac{2}{7} \\
A_0 x_0^3 + A_1 x_1^3 &= \tfrac{2}{9}
\end{aligned} 
$$

解得 $x_0 = 0.821162,\ x_1 = 0.289949,\ A_0 = 0.389111,\ A_1 = 0.277556$。

---

### 6. 数值微分

#### 6.1 中点方法

按照数学分析的定义，导数是差商的极限：

$$
f'(a) = \lim_{h \to 0}\frac{f(a + h) - f(a)}{h}
$$

精度要求不高时，可取差商作近似：

- **向前差商**：$f'(a) \approx \dfrac{f(a + h) - f(a)}{h}$
- **向后差商**：$f'(a) \approx \dfrac{f(a) - f(a - h)}{h}$
- **中心差商（中点方法）**：

$$
f'(a) \approx \frac{f(a + h) - f(a - h)}{2 h}
$$

三种近似值分别对应 $AB$、$AC$、$BC$ 的斜率。中点方法更为可取——这种把导数计算归结为函数值计算的方法称为**机械求导方法**。

#### 6.2 中点公式的误差分析

记

$$
G(h) = \frac{f(a + h) - f(a - h)}{2 h}
$$

将 $f(a \pm h)$ 在 $x = a$ 处作 Taylor 展开：

$$
f(a \pm h) = f(a) \pm h f'(a) + \frac{h^2}{2!}f''(a) \pm \frac{h^3}{3!}f'''(a) + \frac{h^4}{4!}f^{(4)}(a) \pm \cdots
$$

代入中点公式：

$$
G(h) = f'(a) + \frac{h^2}{3!}f'''(a) + \frac{h^4}{5!}f^{(5)}(a) + \cdots
$$

两种误差权衡：

- **截断误差**：步长 $h$ 越小越准
- **舍入误差**：$h$ 很小时 $f(a + h)$ 与 $f(a - h)$ 接近，直接相减会造成有效数字严重损失

**举例**：用中点公式求 $f(x) = (x)^{1/2}$ 在 $x = 2$ 处的一阶导数

$$
G(h) = \frac{(2 + h)^{1/2} - (2 - h)^{1/2}}{2 h}
$$

四位数字计算结果：

| $h$ | $G(h)$ | $h$ | $G(h)$ | $h$ | $G(h)$ |
|---|---|---|---|---|---|
| 1 | 0.3660 | 0.05 | 0.3530 | 0.001 | 0.3500 |
| 0.5 | 0.3564 | 0.01 | 0.3500 | 0.0005 | 0.3000 |
| 0.1 | 0.3535 | 0.005 | 0.3500 | 0.0001 | 0.3000 |

准确值 $f'(2) = 0.353553$。$h = 0.1$ 逼近效果最好——**进一步缩小步长，逼近效果反而越来越差**。

#### 6.3 插值型求导公式

对列表函数 $y = f(x)$，建立插值多项式 $y = P_n(x)$ 作近似，取 $P_n'(x)$ 作为 $f'(x)$ 的近似值：

$$
f'(x) \approx P_n'(x) 
$$

统称为**插值型求导公式**。

**注意**：即使 $f(x)$ 与 $P_n(x)$ 相差不多，导数近似值 $P_n'(x)$ 与真值 $f'(x)$ 仍可能差别很大，使用 (4.5.1) 时应特别注意误差分析。

#### 6.4 插值型求导公式的误差

插值余项 (2.2.14)：

$$
R_n(x) = f(x) - L_n(x) = \frac{f^{(n+1)}(\xi)}{(n + 1)!}\omega_{n+1}(x)
$$

求导得**插值型求导公式余项**：

$$
f'(x) - P_n'(x) = \frac{f^{(n+1)}(\xi)}{(n + 1)!}\omega_{n+1}'(x) + \frac{\omega_{n+1}(x)}{(n + 1)!}\frac{\mathrm{d}}{\mathrm{d}x}f^{(n+1)}(\xi)
$$

- $\xi$ 是 $x$ 的未知函数，无法对第二项化简
- 对任意点 $x$，误差 $f'(x) - P_n'(x)$ 无法预估

**若限定求节点 $x_i$ 的导数值**：$\omega_{n+1}(x_i) = 0$，第二项消失，节点处余项：

$$
f'(x_i) - P_n'(x_i) = \frac{f^{(n+1)}(\xi)}{(n + 1)!}\omega_{n+1}'(x_i)
$$

下面仅考察**节点处**的导数值，并假定节点等距。

#### 6.5 两点公式

已给两节点 $x_0, x_1$ 及函数值，作线性插值：

$$
P_1(x) = \frac{x - x_1}{x_0 - x_1}f(x_0) + \frac{x - x_0}{x_1 - x_0}f(x_1)
$$

求导，记 $x_1 - x_0 = h$：

$$
P_1'(x) = \frac{1}{h}[-f(x_0) + f(x_1)]
$$

得两点求导公式（带余项）：

$$
\begin{aligned}
f'(x_0) &= \frac{1}{h}[-f(x_0) + f(x_1)] - \frac{h}{2}f''(\xi) \\
f'(x_1) &= \frac{1}{h}[-f(x_0) + f(x_1)] + \frac{h}{2}f''(\xi)
\end{aligned}
$$

#### 6.6 三点公式

设节点 $x_0, x_1 = x_0 + h, x_2 = x_0 + 2h$，作二次插值：

$$
P_2(x) = \frac{(x - x_1)(x - x_2)}{(x_0 - x_1)(x_0 - x_2)}f(x_0) + \frac{(x - x_0)(x - x_2)}{(x_1 - x_0)(x_1 - x_2)}f(x_1) + \frac{(x - x_0)(x - x_1)}{(x_2 - x_0)(x_2 - x_1)}f(x_2)
$$

令 $x = x_0 + t h$：

$$
P_2(x_0 + t h) = \frac{1}{2}(t - 1)(t - 2)f(x_0) - t(t - 2)f(x_1) + \frac{1}{2}t(t - 1)f(x_2)
$$

两端对 $t$ 求导：

$$
P_2'(x_0 + t h) = \frac{1}{2 h}\bigl[(2t - 3)f(x_0) - (4t - 4)f(x_1) + (2t - 1)f(x_2)\bigr] 
$$

分别取 $t = 0, 1, 2$，得**三点公式在三个节点的导数值**：

$$
\begin{aligned}
P_2'(x_0) &= \frac{1}{2 h}[-3 f(x_0) + 4 f(x_1) - f(x_2)] \\
P_2'(x_1) &= \frac{1}{2 h}[-f(x_0) + f(x_2)] \\
P_2'(x_2) &= \frac{1}{2 h}[f(x_0) - 4 f(x_1) + 3 f(x_2)]
\end{aligned}
$$

带余项的三点求导公式：

$$
\begin{aligned}
f'(x_0) &= \frac{1}{2 h}[-3 f(x_0) + 4 f(x_1) - f(x_2)] + \frac{h^2}{3}f'''(\xi) \\
f'(x_1) &= \frac{1}{2 h}[-f(x_0) + f(x_2)] - \frac{h^2}{6}f'''(\xi) \\
f'(x_2) &= \frac{1}{2 h}[f(x_0) - 4 f(x_1) + 3 f(x_2)] + \frac{h^2}{3}f'''(\xi)
\end{aligned}
$$

式 (4.5.4) 即**中点公式**，少用了一个函数值（$f(x_1)$ 自身不出现）。

#### 6.7 高阶数值微分公式

用 $P_n(x)$ 的 $k$ 阶导数作为 $f^{(k)}(x)$ 的近似：

$$
f^{(k)}(x) \approx P_n^{(k)}(x)\quad (k = 0, 1, \ldots)
$$

**二阶三点公式**：将 (4.5.3) 再对 $t$ 求导：

$$
P_2''(x_0 + t h) = \frac{1}{h^2}[f(x_0) - 2 f(x_1) + f(x_2)]
$$

即

$$
P_2''(x_1) = \frac{1}{h^2}[f(x_1 - h) - 2 f(x_1) + f(x_1 + h)]
$$

**带余项的二阶三点公式**：

$$
f''(x_1) = \frac{1}{h^2}[f(x_1 - h) - 2 f(x_1) + f(x_1 + h)] - \frac{h^2}{12}f^{(4)}(\xi) 
$$

（用 Taylor 展开直接可得）

#### 6.8 五点公式

设 $x_i = x_0 + i h$（$i = 0, 1, 2, 3, 4$）上的函数值，**一阶五点求导公式**：

$$
\begin{aligned}
m_0 &= \frac{1}{12 h}[-25 f(x_0) + 48 f(x_1) - 36 f(x_2) + 16 f(x_3) - 3 f(x_4)] \\
m_1 &= \frac{1}{12 h}[-3 f(x_0) - 10 f(x_1) + 18 f(x_2) - 6 f(x_3) + f(x_4)] \\
m_2 &= \frac{1}{12 h}[f(x_0) - 8 f(x_1) + 8 f(x_3) - f(x_4)] \\
m_3 &= \frac{1}{12 h}[-f(x_0) + 6 f(x_1) - 18 f(x_2) + 10 f(x_3) + 3 f(x_4)] \\
m_4 &= \frac{1}{12 h}[3 f(x_0) - 16 f(x_1) + 36 f(x_2) - 48 f(x_3) + 25 f(x_4)]
\end{aligned}
$$

其中 $m_i$ 代表一阶导数 $f'(x_i)$ 的近似值。

**二阶五点公式**：

$$
\begin{aligned}
M_0 &= \frac{1}{12 h^2}[35 f(x_0) - 104 f(x_1) + 114 f(x_2) - 56 f(x_3) + 11 f(x_4)] \\
M_1 &= \frac{1}{12 h^2}[11 f(x_0) - 20 f(x_1) + 6 f(x_2) + 4 f(x_3) - f(x_4)] \\
M_2 &= \frac{1}{12 h^2}[-f(x_0) + 16 f(x_1) - 30 f(x_2) + 16 f(x_3) - f(x_4)] \\
M_3 &= \frac{1}{12 h^2}[-f(x_0) + 4 f(x_1) + 6 f(x_2) - 20 f(x_3) + 11 f(x_4)] \\
M_4 &= \frac{1}{12 h^2}[11 f(x_0) - 56 f(x_1) + 114 f(x_2) - 104 f(x_3) + 35 f(x_4)]
\end{aligned}
$$

$M_i$ 表示二阶导数 $f''(x_i)$ 的近似值。

**使用建议**：

- 对于给定数据表，用五点公式求节点上的导数往往可获满意结果
- 五个相邻节点的选择原则：在所考察节点的两侧各取两个邻近节点
- 若一侧不足两个，则用另一侧补足

#### 6.9 样条求导

采用样条函数 $S(x)$ 作 $f(x)$ 的近似函数，不仅函数值很接近，导数值也很接近。对三次样条 $S_3(x)$：

$$
|f^{(a)}(x) - S_3^{(a)}(x)| = O(h^{4 - a})\quad (a = 0, 1, 2, 3)
$$

用样条函数建立数值微分公式：

$$
f^{(a)}(x) \approx S_3^{(a)}(x)\quad (a = 0, 1, 2, 3) 
$$

**与 (4.5.1) 不同的优势**：样条微分公式 (4.5.6) 可用来计算**插值范围内任何一点 $x$**（不仅是节点 $x_i$）上的导数值。

**回顾三次样条插值** (2.8.9)：

$$
\lambda_j m_{j-1} + 2 m_j + \mu_j m_{j+1} = g_j\quad (j = 1, 2, \ldots, n - 1)
$$

对等距划分 $a = x_0 < x_1 < \cdots < x_n = b$（$x_{k+1} - x_k = h$），三次样条 $S_3(x)$ 在节点上的导数值 $S_3'(x_k) = m_k$ 满足**连续性方程**：

$$
m_{k-1} + 4 m_k + m_{k+1} = 3(y_{k+1} - y_{k-1})/h\quad (k = 0, 1, \ldots, n - 1) 
$$

设已给端点处一阶导数值 $m_0 = y_0', m_n = y_n'$，则求解方程组 (4.5.7) 得到的 $m_k$ 即可作为 $f'(x_k)$ 的近似值。

---

### 第四章 总结

**4.1 引言**

- 积分中值定理、梯形公式、矩形公式、机械求积、代数精度、插值型求积公式

**4.2 Newton-Cotes 公式**

- 定义、Cotes 系数、Newton-Cotes 公式的稳定性
- 偶阶求积公式的代数精度、低阶求积公式的余项
- 复化求积法、误差的渐近性

**4.3 Romberg 算法**

- 梯形法的递推化、误差的事后估计法
- Romberg 公式、Richardson 外推加速法

**4.4 Gauss 公式**

- 定义、Gauss 点、充分必要条件
- Gauss-Legendre 公式
- Gauss 公式的余项和稳定性、带权的 Gauss 公式
- 构造加权 Gauss 公式的一般方法

**4.5 数值微分**

- 中点方法、机械求导方法
- 插值型的求导公式、误差分析
- 样条求导

**作业**：第四章 习题 1、4、9、11

---

## 六.方程求根

### 1. 引言

许多数学物理问题可归结为解方程 $f(x) = 0$：

- $f(x)$ 可以是**代数多项式**，或**超越函数**（对数、三角函数等）
- 超越函数指变量之间的关系不能用有限次加、减、乘、除、乘方、开方表示
- 方程 $f(x) = 0$ 的解 $x^*$ 称为它的**根**，或称 $f(x)$ 的**零点**

**有根区间**：设 $f(x)$ 在 $[a, b]$ 上连续，且 $f(a) f(b) < 0$，由连续函数性质知 $f(x) = 0$ 在 $(a, b)$ 内至少有一实根，称 $[a, b]$ 为 $f(x) = 0$ 的**有根区间**。

#### 1.1 逐步搜索法

假定 $f(a) < 0, f(b) > 0$，从有根区间 $[a, b]$ 的左端 $x_0 = a$ 出发，按预定步长 $h$（例如 $h = \frac{b-a}{N}$）逐步向右搜索：

- 每跨一步检查节点 $x_k = a + kh$ 上 $f(x_k)$ 的符号
- 一旦 $f(x_k)$ 与 $f(a)$ 异号，则得到缩小后的有根区间 $[x_{k-1}, x_k]$，宽度为 $h$
- 若 $f(x_k) = 0$，则 $x_k$ 即为所求根

> **例 6.1**：考察 $f(x) = x^3 - x - 1 = 0$。$f(0) < 0, f(2) > 0$，故 $(0, 2)$ 内至少有一实根。从 $x = 0$ 出发以 $h = 0.5$ 搜索：
>
> | $x$ | $0$ | $0.5$ | $1.0$ | $1.5$ |
> |-----|-----|-------|-------|-------|
> | $f(x)$ 符号 | $-$ | $-$ | $-$ | $+$ |
>
> 知 $(1.0, 1.5)$ 内必有一根。

**步长 $h$ 的选择**是关键：

- $h$ 过大，计算量小，但不精确
- $h$ 过小，精度高，但计算量增大

### 2. 二分法

考察有根区间 $[a, b]$，取中点 $x_0 = \frac{a + b}{2}$ 将其分为两半，检查 $f(x_0)$ 与 $f(a)$ 是否同号：

- 若同号，则 $x^*$ 在 $x_0$ 右侧，令 $a_1 = x_0, b_1 = b$
- 否则 $x^*$ 在 $x_0$ 左侧，令 $a_1 = a, b_1 = x_0$

新有根区间 $[a_1, b_1]$ 的长度为 $[a, b]$ 的一半。对压缩了的区间重复此过程，得到一系列有根区间：

$$
[a, b] \supseteq [a_1, b_1] \supseteq \cdots \supseteq [a_k, b_k] \supseteq \cdots
$$

每个区间长度 $b_k - a_k = \frac{b - a}{2^k} \to 0$（$k \to \infty$），区间收缩于一点 $x^*$。

**近似根序列**：每次二分后取中点 $x_k = \frac{a_k + b_k}{2}$ 作为近似根，则

$$
|x_k - x^*| \le \frac{b_k - a_k}{2} = \frac{b - a}{2^{k+1}} 
$$

只要 $k$ 充分大，便有 $|x_k - x^*| < \varepsilon$。

> **例 6.2**：求 $f(x) = x^3 - x - 1 = 0$ 在 $(1.0, 1.5)$ 内的实根，精确到小数点后两位。
>
> $a_0 = 1.0, b_0 = 1.5$，按 (6.1.1) 只需二分 $k = 6$ 次即可达到精度 $|x_k - x^*| \le 0.005$。

| $k$ | $a_k$ | $b_k$ | $x_k$ | $f(x_k)$ 符号 |
|-----|-------|-------|-------|---------------|
| 0 | 1.00 | 1.5 | 1.25 | $-$ |
| 1 | 1.25 | 1.5 | 1.375 | $+$ |
| 2 | 1.25 | 1.375 | 1.3125 | $-$ |
| 3 | 1.3125 | 1.375 | 1.3438 | $+$ |
| 4 | 1.3125 | 1.3438 | 1.3281 | $+$ |
| 5 | 1.3125 | 1.3281 | 1.3203 | $-$ |
| 6 | 1.3203 | 1.3281 | 1.3242 | $-$ |

#### 二分法计算步骤

1. **准备**：计算端点处的值 $f(a), f(b)$
2. **二分**：计算中点 $f\!\left(\frac{a+b}{2}\right)$
3. **判断**：
   - 若 $f\!\left(\frac{a+b}{2}\right) = 0$ 则 $\frac{a+b}{2}$ 为根
   - 若与 $f(a)$ 异号，根在 $\left[a, \frac{a+b}{2}\right]$，以 $\frac{a+b}{2}$ 代替 $b$
   - 若与 $f(a)$ 同号，根在 $\left[\frac{a+b}{2}, b\right]$，以 $\frac{a+b}{2}$ 代替 $a$
4. **反复执行**二分与判断，直到区间长度缩到误差允许范围

### 3. 不动点迭代法

考察隐式方程 $x = \varphi(x)$ (6.2.1)。

**迭代法**：给猜测值 $x_0$，代入右端得 $x_1 = \varphi(x_0)$，继续 $x_2 = \varphi(x_1)$。一般地按公式

$$
x_{k+1} = \varphi(x_k),\quad k = 0, 1, \ldots 
$$

若 $\{x_k\}$ 有极限 $x^* = \lim\limits_{k \to \infty} x_k$，则称迭代过程**收敛**，$x^*$ 是方程的根。

**几何解释**：在 $Oxy$ 平面上即求曲线 $y = \varphi(x)$ 与直线 $y = x$ 的交点 $P^*$。从 $x_0$ 出发依次确定 $P_0, Q_1, P_1, Q_2, P_2, \ldots$，若点列 $\{P_k\}$ 趋于 $P^*$，则 $x_k$ 收敛到 $x^*$。

> **例 6.3**：求 $f(x) = x^3 - x - 1 = 0$ 在 $x_0 = 1.5$ 附近的根 $x^*$。
>
> 改写成 $x = \sqrt[3]{x + 1}$，迭代公式 $x_{k+1} = \sqrt[3]{x_k + 1}$，记录结果：

| $k$ | $x_k$ | $k$ | $x_k$ |
|---|---|---|---|
| 0 | 1.5 | 5 | 1.32476 |
| 1 | 1.35721 | 6 | 1.32473 |
| 2 | 1.33086 | 7 | 1.32472 |
| 3 | 1.32588 | 8 | 1.32472 |
| 4 | 1.32494 | | |

#### 3.1 迭代发散

迭代法并不总收敛。按 $x^3 = x + 1$ 的另一形式 $x = x^3 - 1$ 建立 $x_{k+1} = x_k^3 - 1$，取 $x_0 = 1.5$ 得 $x_1 = 2.375, x_2 = 12.39$，结果越来越大，**发散**。

#### 3.2 收敛条件

> **定理 6.1**（迭代收敛定理）：设 $\varphi(x)$ 满足
>
> 1. 对任意 $x \in [a, b]$，有 $a \le \varphi(x) \le b$ (6.2.5)
> 2. 存在 $0 < L < 1$，对任意 $x \in [a, b]$，有 $|\varphi'(x)| \le L < 1$ (6.2.6)
>
> 则迭代 $x_{k+1} = \varphi(x_k)$ 对任意初值 $x_0 \in [a, b]$ 收敛于方程 $x = \varphi(x)$ 的根 $x^*$，且
>
> $$
> |x_k - x^*| \le \frac{L^k}{1 - L} |x_1 - x_0| 
> $$

**推导**：由微分中值定理

$$
|x_{k+1} - x^*| = |\varphi(x_k) - \varphi(x^*)| = |\varphi'(\xi)| \cdot |x_k - x^*| \le L |x_k - x^*|
$$

进而 $|x_k - x^*| \le L^k |x_0 - x^*|$，当 $k \to \infty$ 时 $x_k \to x^*$。

由 (6.2.6) 还可得

$$
|x_{k+1} - x_k| \le L |x_k - x_{k-1}|,\quad |x_{k+1} - x_k| \le L^k |x_1 - x_0| 
$$

对任意正整数 $p$：

$$
\begin{aligned}
|x_{k+p} - x_k| &\le |x_{k+p} - x_{k+p-1}| + \cdots + |x_{k+1} - x_k| \\
&\le (L^{p-1} + L^{p-2} + \cdots + 1) L^k |x_1 - x_0| \le \frac{L^k}{1 - L} |x_1 - x_0|
\end{aligned}
$$

令 $p \to \infty$，注意 $\lim x_{k+p} = x^*$ 即得 (6.2.7)。

#### 3.3 误差估计与计算步骤

由 (6.2.8) 还可推出

$$
|x_k - x^*| \le \frac{1}{1 - L} |x_{k+1} - x_k|
$$

即只要相邻两次的偏差 $|x_{k+1} - x_k|$ 足够小，便保证 $x_k$ 有足够精度。

**计算步骤**：

1. **准备**：提供迭代初值 $x_0$
2. **迭代**：$x_1 = \varphi(x_0)$
3. **控制**：检查 $|x_1 - x_0|$
   - 若 $|x_1 - x_0| > \varepsilon$，以 $x_1$ 替换 $x_0$，转步骤 2
   - 若 $|x_1 - x_0| \le \varepsilon$，终止，取 $x_1$ 为所求

#### 3.4 局部收敛性

- **定义 6.1**：若存在 $x^*$ 的邻域 $R: |x - x^*| \le \delta$，使迭代 $x_{k+1} = \varphi(x_k)$ 对任意 $x_0 \in R$ 均收敛，则称该过程在 $x^*$ 邻近具有**局部收敛性**

> **定理 6.2**：设 $x^*$ 为 $x = \varphi(x)$ 的根，$\varphi'(x)$ 在 $x^*$ 邻近连续且 $|\varphi'(x^*)| < 1$，则迭代 $x_{k+1} = \varphi(x_k)$ 在 $x^*$ 邻近具有局部收敛性。

证明思路：

1. 由连续性，存在邻域 $R: |x - x^*| \le \delta$，对任意 $x \in R$ 有 $|\varphi'(x)| \le L < 1$
2. 对任意 $x \in R$，$\varphi(x) \in R$，因为 $|\varphi(x) - x^*| = |\varphi(x) - \varphi(x^*)| \le L |x - x^*| \le |x - x^*|$
3. 由定理 6.1 知迭代收敛

> **例 6.4**：求 $x = e^{-x}$ 在 $x = 0.5$ 附近的根，精度 $\varepsilon = 10^{-5}$。
>
> 以 $h = 0.1$ 搜索发现根在 $(0.5, 0.6)$ 内。由于根附近 $|(e^{-x})'| \approx 0.6 < 1$，故迭代 $x_{k+1} = e^{-x_k}$ 对初值 $x_0 = 0.5$ 收敛。需迭代 18 次得 $x \approx 0.56714$。

### 4. 迭代加速收敛

收敛的迭代过程只要次数足够多即可达任意精度，但有时收敛缓慢致使计算量很大，故加速很重要。

#### 4.1 加速公式的推导

设 $x_0$ 是根 $x^*$ 的预测值，校正一次得 $x_1 = \varphi(x_0)$。由中值定理 $x_1 - x^* = \varphi'(\xi)(x_0 - x^*)$，其中 $\xi$ 介于 $x_0$ 与 $x^*$ 之间。假定 $\varphi'(x)$ 改变不大，近似取常数 $L$：

$$
x_1 - x^* \approx L(x_0 - x^*) \Rightarrow x^* \approx \frac{1}{1 - L} x_1 - \frac{L}{1 - L} x_0 
$$

期望 $x_1^* = x_1 + \frac{L}{1 - L}(x_1 - x_0)$ 是比 $x_1$ 更好的近似。**加速迭代方案**：

1. **校正**：$\bar{x}_{k+1} = \varphi(x_k)$
2. **改进**：$x_{k+1} = \bar{x}_{k+1} + \dfrac{L}{1 - L}(\bar{x}_{k+1} - x_k)$ (6.2.10)

> **例 6.5**：求解 $x = e^{-x}$，在 $x_0 = 0.5$ 附近 $(e^{-x})' \approx -0.6$，故
>
> $$
> \bar{x}_{k+1} = e^{-x_k},\quad x_{k+1} = \bar{x}_{k+1} - \frac{0.6}{1.6}(\bar{x}_{k+1} - x_k)
> $$
>
> 仅需迭代 **3 次**即可得到例 6.4 中需 18 次的结果 0.56714，加速效果显著。

| $k$ | $\bar{x}_k$ | $x_k$ |
|---|---|---|
| 0 | | 0.5 |
| 1 | 0.60653 | 0.56658 |
| 2 | 0.56746 | 0.56713 |
| 3 | 0.56715 | 0.56714 |

#### 4.2 Aitken 加速方法

(6.2.10) 缺点是依赖导数信息 $L$。**解决思路**：每次迭代都与 $L$ 相关，可用两次迭代消去 $L$。

设 $x_0$ 为猜测值，$x_1 = \varphi(x_0), x_2 = \varphi(x_1)$，则

$$
\frac{x_1 - x^*}{x_2 - x^*} \approx L \approx \frac{x_0 - x^*}{x_1 - x^*}
$$

解出

$$
x^* \approx \frac{x_0 x_2 - x_1^2}{x_0 - 2 x_1 + x_2} = x_2 - \frac{(x_2 - x_1)^2}{x_0 - 2 x_1 + x_2}
$$

**Aitken 算法**：

- **校正**：$\tilde{x}_{k+1} = \varphi(x_k)$
- **再校正**：$\bar{x}_{k+1} = \varphi(\tilde{x}_{k+1})$
- **改进**：

$$
x_{k+1} = \bar{x}_{k+1} - \frac{(\bar{x}_{k+1} - \tilde{x}_{k+1})^2}{\bar{x}_{k+1} - 2 \tilde{x}_{k+1} + x_k}
$$

改进公式不再含导数信息，但需要两次迭代值加工。

> **例 6.6**：用 Aitken 法求解 $f(x) = x^3 - x - 1 = 0$。前面指出迭代 $x_{k+1} = x_k^3 - 1$ (6.2.12) **发散**，但以其为基础构造 Aitken 算法：
>
> $$
> \tilde{x}_{k+1} = x_k^3 - 1,\quad \bar{x}_{k+1} = \tilde{x}_{k+1}^3 - 1,\quad x_{k+1} = \bar{x}_{k+1} - \frac{(\bar{x}_{k+1} - \tilde{x}_{k+1})^2}{\bar{x}_{k+1} - 2 \tilde{x}_{k+1} + x_k}
> $$

| $k$ | $\tilde{x}_k$ | $\bar{x}_k$ | $x_k$ |
|---|---|---|---|
| 0 | | | 1.5 |
| 1 | 2.37500 | 12.3965 | 1.41629 |
| 2 | 1.84092 | 5.23888 | 1.35565 |
| 3 | 1.49140 | 2.31728 | 1.32895 |
| 4 | 1.34710 | 1.44435 | 1.32480 |
| 5 | 1.32518 | 1.32714 | 1.32472 |

发散的迭代 (6.2.12) 经 Aitken 处理后获得了相当好的收敛性。

### 5. Newton 法

对方程 $f(x) = 0$ 应用迭代法，需将其改写为 $x = \varphi(x)$ 的形式。$\varphi(x)$ 可以有多种取法，如 $\varphi(x) = x + f(x)$ 对应迭代

$$
x_{k+1} = x_k + f(x_k) 
$$

但一般不一定收敛或收敛缓慢。

#### 5.1 公式推导

对 (6.3.1) 叠加运用加速：

$$
\bar{x}_{k+1} = x_k + f(x_k),\quad x_{k+1} = \bar{x}_{k+1} + \frac{L}{1 - L}(\bar{x}_{k+1} - x_k)
$$

记 $M = L - 1$，合并

$$
x_{k+1} = x_k - \frac{f(x_k)}{M}
$$

这种**简化的 Newton 公式**对应迭代函数

$$
\varphi(x) = x - \frac{f(x)}{M} 
$$

注意到 $L$ 是 $\varphi'(x) = 1 + f'(x)$ 的估计，故 $M = L - 1$ 实际是 $f'(x)$ 的估计。用 $f'(x)$ 代替 (6.3.2) 中的 $M$，则得迭代函数 $\varphi(x) = x - \dfrac{f(x)}{f'(x)}$，对应的迭代公式即**Newton 公式**：

$$
\boxed{x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)}} 
$$

#### 5.2 线性化解释

Newton 法是一种**线性化方法**：将非线性方程 $f(x) = 0$ 逐步归结为线性方程。设近似根 $x_k$，将 $f(x)$ 在 $x_k$ 展开

$$
f(x) \approx f(x_k) + f'(x_k)(x - x_k)
$$

近似方程 $f(x_k) + f'(x_k)(x - x_k) = 0$ (6.3.4) 的根即为 $x_{k+1}$。

#### 5.3 几何解释（切线法）

$x^*$ 是 $y = f(x)$ 与 $x$ 轴交点的横坐标。过 $(x_k, f(x_k))$ 引切线 $y = f(x_k) + f'(x_k)(x - x_k)$，其与 $x$ 轴交点的横坐标 $x_{k+1}$ 即为 $x^*$ 的新近似值，故 Newton 法**又称切线法**。

#### 5.4 收敛速度

- **定义 6.2**：设迭代 $x_{k+1} = \varphi(x_k)$ 收敛于 $x^*$，若误差 $e_k = x_k - x^*$ 满足 $\displaystyle\lim_{k \to \infty} \frac{e_{k+1}}{e_k^p} = C\ (C \neq 0)$，则称该迭代是 **$p$ 阶收敛**的。
  - $p = 1$：线性收敛；$p > 1$：超线性收敛；$p = 2$：平方收敛

> **定理 6.3**：对迭代 $x_{k+1} = \varphi(x_k)$，若 $\varphi^{(p)}(x)$ 在 $x^*$ 邻近连续，且
>
> $$
> \varphi'(x^*) = \varphi''(x^*) = \cdots = \varphi^{(p-1)}(x^*) = 0,\quad \varphi^{(p)}(x^*) \neq 0 
> $$
>
> 则该迭代在 $x^*$ 邻近是 $p$ 阶收敛的。

**推导**：由 $\varphi'(x^*) = 0$ 据定理 6.2 局部收敛。将 $\varphi(x_k)$ 在 $x^*$ 展开

$$
\varphi(x_k) = \varphi(x^*) + \frac{\varphi^{(p)}(\zeta)}{p!}(x_k - x^*)^p
$$

注意 $\varphi(x_k) = x_{k+1}, \varphi(x^*) = x^*$，故

$$
x_{k+1} - x^* = \frac{\varphi^{(p)}(\zeta)}{p!}(x_k - x^*)^p,\quad \frac{e_{k+1}}{e_k^p} \to \frac{\varphi^{(p)}(x^*)}{p!}
$$

**Newton 公式的收敛阶**：迭代函数 $\varphi(x) = x - \dfrac{f(x)}{f'(x)}$，求导得

$$
\varphi'(x) = \frac{f(x) f''(x)}{[f'(x)]^2}
$$

设 $x^*$ 是 $f(x)$ 的**单根**（$f(x^*) = 0, f'(x^*) \neq 0$），则 $\varphi'(x^*) = 0$。由定理 6.3 知 Newton 法在 $x^*$ 邻近是**平方收敛**的（$p = 2$）。

> **例 6.7**：用 Newton 法解 $f(x) = x e^x - 1 = 0$ (6.3.6)。
>
> Newton 公式 $x_{k+1} = x_k - \dfrac{x_k e^{x_k} - 1}{(1 + x_k) e^{x_k}}$，取 $x_0 = 0.5$：

| $k$ | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| $x_k$ | 0.5 | 0.57102 | 0.56716 | 0.56714 |

(6.3.6) 实际上是 $x = e^{-x}$ 的等价形式，比较例 6.5（Aitken）与例 6.4（一般迭代）：Newton 法仅 3 次即达到精度。

#### 5.5 Newton 法计算步骤

1. **准备**：选定 $x_0$，计算 $f_0 = f(x_0), f_0' = f'(x_0)$
2. **迭代**：$x_1 = x_0 - \dfrac{f_0}{f_0'}$，计算 $f_1 = f(x_1), f_1' = f'(x_1)$
3. **控制**：若 $|\delta_1| < \varepsilon_1$ 或 $|f_1| < \varepsilon_2$ 则终止，$x_1$ 即为根；否则转步 4

$$
\delta_1 = \begin{cases} |x_1 - x_0|, & |x_1| < C \\ \dfrac{|x_1 - x_0|}{|x_1|}, & |x_1| \ge C \end{cases}
$$

其中 $C$ 是取绝对误差或相对误差的控制常数（一般 $C = 1$）。

4. **修改**：若迭代次数达预定 $N$ 或 $f_1' = 0$，方法失败；否则以 $(x_1, f_1, f_1')$ 代替 $(x_0, f_0, f_0')$ 转步 2

#### 5.6 应用举例：开方与除法

**开方**：对正数 $a$，解 $x^2 - a = 0$ 得

$$
x_{k+1} = \frac{1}{2}\left(x_k + \frac{a}{x_k}\right) 
$$

该公式对**任意** $x_0 > 0$ 都收敛（不仅在 $\sqrt{a}$ 邻近）。配方易得

$$
x_{k+1} - \sqrt{a}^{} = \frac{1}{2 x_k}(x_k - \sqrt{a}^{})^2,\quad x_{k+1} + \sqrt{a}^{} = \frac{1}{2 x_k}(x_k + \sqrt{a}^{})^2
$$

相除并反复递推：

$$
\frac{x_k - \sqrt{a}^{}}{x_k + \sqrt{a}^{}} = \left(\frac{x_0 - \sqrt{a}^{}}{x_0 + \sqrt{a}^{}}\right)^{2^k} 
$$

记 $q = \dfrac{x_0 - \sqrt{a}^{}}{x_0 + \sqrt{a}^{}}$，整理得

$$
x_k - \sqrt{a}^{} = 2 \sqrt{a}^{} \cdot \frac{q^{2^k}}{1 - q^{2^k}}
$$

对任意 $x_0 > 0$ 有 $|q| < 1$，故 $k \to \infty$ 时 $x_k \to \sqrt{a}^{}$，**恒收敛**。

> **例 6.8**：求 $\sqrt{115}^{}$。取 $x_0 = 10$，对 $a = 115$ 按 (6.3.7) 迭代 3 次即得精度 $10^{-6}$ 的结果。

| $k$ | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| $x_k$ | 10 | 10.750000 | 10.723837 | 10.723805 | 10.723805 |

由于 (6.3.7) 对任意 $x_0 > 0$ 均收敛且速度快，可写通用程序（如 $x_0 = 1$）：求 $\sqrt{115}^{}$ 只需 7 次迭代得同样结果。

**除法**：对正数 $a$，解 $\frac{1}{x} - a = 0$ 应用 Newton 法可导出**不用除法**计算 $\frac{1}{a}$ 的程序：

$$
x_{k+1} = x_k (2 - a x_k)
$$

早期电子计算机为节省硬件即采用此法。研究误差：

$$
x_{k+1} - \frac{1}{a} = x_k(2 - a x_k) - \frac{1}{a} = -a\left(x_k - \frac{1}{a}\right)^2
$$

对 $r_k = 1 - a x_k$，递推 $r_{k+1} = r_k^2$，反复 $r_k = r_0^{2^k}$。若初值 $0 < x_0 < \frac{2}{a}$，则 $|r_0| < 1$，$r_k \to 0$，迭代收敛。

#### 5.7 Newton 下山法

Newton 法的收敛性依赖于初值 $x_0$：若 $x_0$ 偏离 $x^*$ 较远，可能**发散**。

> **例**：求 $f(x) = x^3 - x - 1 = 0$ 在 $x_0 = 1.5$ 附近的根。Newton 公式 $x_{k+1} = x_k - \dfrac{x_k^3 - x_k - 1}{3 x_k^2 - 1}$ (6.3.10) 取 $x_0 = 1.5$ 时迭代得 $x_1 = 1.34783, x_2 = 1.32520, x_3 = 1.32472$。但取 $x_0 = 0.6$ 时一次迭代得 $x_1 = 17.9$，**反而更远离根** $x^* = 1.32472$。

**Newton 下山法**：为防止发散，附加**单调性**要求

$$
|f(x_{k+1})| < |f(x_k)| 
$$

满足���要求的算法称为**下山法**。将 Newton 法的结果 $\bar{x}_{k+1} = x_k - \dfrac{f(x_k)}{f'(x_k)}$ 与前一步 $x_k$ 加权平均：

$$
x_{k+1} = \lambda \bar{x}_{k+1} + (1 - \lambda) x_k 
$$

$\lambda \in (0, 1]$ 称**下山因子**。通过挑选 $\lambda$ 使单调性条件成立：

- 设从 $\lambda = 1$ 开始反复将 $\lambda$ 减半试算
- 若能找到使 (6.3.11) 成立的 $\lambda$，则称**"下山成功"**
- 否则称**"下山失败"**，需另选 $x_0$ 重算

### 6. 弦截法与抛物线法

#### 6.1 研究动机

Newton 公式 (6.3.3) 要求提供导数值 $f'(x_k)$，当 $f(x)$ 复杂时可能困难。**弦截法与抛物线法**设法利用迭代过程中的函数值"老信息" $f(x_k), f(x_{k-1}), \ldots, f(x_{k-r})$ 回避导数计算，其基础是**插值原理**。

设 $x_k, x_{k-1}, \ldots, x_{k-r}$ 是 $f(x) = 0$ 的一组近似根：

- 利用函数值 $f(x_k), f(x_{k-1}), \ldots, f(x_{k-r})$ 构造插值多项式 $P_r(x)$
- 取 $P_r(x) = 0$ 的根作为 $x_{k+1}$
- 迭代函数 $\varphi$：$x_{k+1} = \varphi(x_k, x_{k-1}, \ldots, x_{k-r})$

$r = 1$ 为**弦截法**，$r = 2$ 为**抛物线法**。

#### 6.2 弦截法

设 $x_k, x_{k-1}$ 是近似根，利用 $f(x_k), f(x_{k-1})$ 构造**一次插值**

$$
P_1(x) = f(x_k) + \frac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}(x - x_k) 
$$

以 $P_1(x) = 0$ 的根作为 $x_{k+1}$：

$$
\boxed{x_{k+1} = x_k - \frac{f(x_k)}{f(x_k) - f(x_{k-1})}(x_k - x_{k-1})} 
$$

可看作 Newton 公式中导数 $f'(x_k)$ 用**差商** $\dfrac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}$ 取代的结果。

**几何意义**：曲线 $y = f(x)$ 上横坐标 $x_k, x_{k-1}$ 的点记为 $P_k, P_{k-1}$，弦线 $P_k P_{k-1}$ 的斜率等于差商，方程

$$
f(x_k) + \frac{f(x_k) - f(x_{k-1})}{x_k - x_{k-1}}(x - x_k) = 0
$$

的解 $x_{k+1}$ 就是弦线 $P_k P_{k-1}$ 与 $x$ 轴交点的横坐标，故称**弦截法**。

**与 Newton 法对比**：

- Newton 法只用前一步 $x_k$；弦截法用 $x_k, x_{k-1}$ 两步，必须给两个开始值 $x_0, x_1$
- 二者都是线性化方法，但本质区别在于差商 vs 导数

> **定理 6.4**（弦截法收敛性）：假设 $f(x)$ 在根 $x^*$ 的邻域 $\Delta: |x - x^*| \le \delta$ 内具有二阶连续导数，且对任意 $x \in \Delta$ 有 $f'(x) \neq 0$，又设初值 $x_0, x_1 \in \Delta$。当邻域 $\Delta$ 充分小时，弦截法 (6.4.2) 按阶 $p = \dfrac{1 + \sqrt{5}^{}}{2} \approx 1.618$ 收敛到 $x^*$。

收敛阶比较：

- 弦截法：**超线性收敛** $p = 1.618$
- Newton 法：**平方收敛** $p = 2$

> **例 6.9**：用弦截法解 $f(x) = x e^x - 1 = 0$，取 $x_0 = 0.5, x_1 = 0.6$：

| $k$ | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| $x_k$ | 0.5 | 0.6 | 0.56532 | 0.56709 | 0.56714 |

与例 6.7 Newton 法相比（3 次达到精度），弦截法收敛速度也相当快。

##### 弦截法计算步骤

1. **准备**：选取初始值 $x_0, x_1$，计算 $f_0 = f(x_0), f_1 = f(x_1)$
2. **迭代**：按 $x_2 = x_1 - \dfrac{f_1(x_1 - x_0)}{f_1 - f_0}$ 得新近似 $x_2$，计算 $f_2 = f(x_2)$
3. **控制**：若 $|\delta_2| \le \varepsilon_1$ 或 $|f_2| \le \varepsilon_2$，则收敛，输出 $x_2$；否则转步 4

$$
\delta_2 = \begin{cases} |x_2 - x_1|, & |x_2| < C \\ \dfrac{|x_2 - x_1|}{|x_2|}, & |x_2| \ge C \end{cases}
$$

4. **修改**：若迭代次数达预定 $N$ 则方法失败；否则以 $(x_1, f_1), (x_2, f_2)$ 替代 $(x_0, f_0), (x_1, f_1)$ 转步 2

##### Aitken 加速公式：弦截法视角

用弦截法求解 $x = \varphi(x)$（构造 $f(x) = x - \varphi(x)$）：

- 设 $x_0$ 为近似根，依迭代 $x_1 = \varphi(x_0), x_2 = \varphi(x_1)$，在曲线 $y = \varphi(x)$ 上定出 $P_0, P_1$
- 引弦线 $P_0 P_1$，设与直线 $y = x$ 交于 $P_3$
- $P_3$ 的坐标 $x_3$ 满足

$$
\frac{x_3 - x_1}{x_3 - x_0} = \frac{x_2 - x_1}{x_1 - x_0}
$$

解出 **Aitken 加速公式**：

$$
x_3 = \frac{x_0 x_2 - x_1^2}{x_0 - 2 x_1 + x_2}
$$

#### 6.3 抛物线法

已知 $x_k, x_{k-1}, x_{k-2}$，以这三点为节点构造**二次插值** $P_2(x)$，适当选取 $P_2(x)$ 的一个零点作为新近似根 $x_{k+1}$，这样确定的迭代过程称**抛物线法**（亦称 **Muller 法**）。

几何上，用抛物线 $y = P_2(x)$ 与 $x$ 轴的交点作为根 $x^*$ 的近似。

##### 计算公式

根据 Newton 形式插值多项式

$$
P_2(x) = f(x_k) + f[x_k, x_{k-1}](x - x_k) + f[x_k, x_{k-1}, x_{k-2}](x - x_k)(x - x_{k-1})
$$

可得两零点

$$
x_{k+1} = x_k - \frac{2 f(x_k)}{\omega \pm \sqrt{\omega^2 - 4 f(x_k) f[x_k, x_{k-1}, x_{k-2}]}^{}} 
$$

其中

$$
\omega = f[x_k, x_{k-1}] + f[x_k, x_{k-1}, x_{k-2}](x_k - x_{k-1})
$$

**根式符号选取**：从 (6.4.3) 中确定唯一 $x_{k+1}$ 需讨论根式前符号。在 $x_k, x_{k-1}, x_{k-2}$ 三个近似根中，$x_k$ 更接近 $x^*$，故选接近 $x_k$ 的 $x_{k+1}$。**只要令根式前符号与 $\omega$ 同号**（分母绝对值更大）即可。

##### 收敛速率

迭代误差有渐近关系

$$
\frac{e_{k+1}}{e_k^{1.840}} \to \left|\frac{f'''(x^*)}{6 f'(x^*)}\right|^{0.42}
$$

抛物线法是**超线性收敛**的（$p = 1.840$），比弦截法更接近 Newton 法：

| 方法 | 收敛阶 $p$ |
|---|---|
| Newton 法 | 2 |
| **抛物线法** | **1.840** |
| 弦截法 | 1.618 |

> **例 6.10**：用抛物线法求解 $f(x) = x e^x - 1 = 0$。设用表 6.9 的前三值 $x_0 = 0.5, x_1 = 0.6, x_2 = 0.56532$：
>
> $$
> \begin{aligned}
> f(x_0) &= -0.175639,\quad f(x_1) = -0.093271,\quad f(x_2) = -0.005031 \\
> f[x_1, x_0] &= 2.68910,\quad f[x_2, x_1] = 2.83373,\quad f[x_2, x_1, x_0] = 2.21418
> \end{aligned}
> $$
>
> 故 $\omega = f[x_2, x_1] + f[x_2, x_1, x_0](x_2 - x_1) = 2.75694$。代入 (6.4.3) 得
>
> $$
> x_3 = x_2 - \frac{2 f(x_2)}{\omega + \sqrt{\omega^2 - 4 f(x_2) f[x_2, x_1, x_0]}^{}} = 0.56714
> $$

##### 抛物线法计算步骤

1. **准备**：选定 $x_0, x_1, x_2$，计算 $f_0, f_1, f_2$
2. **迭代**：取下面正负号让**分母最大**

$$
\begin{aligned}
\lambda_2 &= \frac{x_2 - x_1}{x_1 - x_0},\quad \delta_2 = 1 + \lambda_2 \\
a_2 &= f_0 \lambda_2^2 - f_1 \lambda_2 \delta_2 + f_2 \lambda_2,\quad b_2 = f_0 \lambda_2^2 - f_1 \delta_2^2 + f_2(\lambda_2 + \delta_2),\quad c_2 = f_2 \delta_2 \\
\lambda_3 &= \frac{-2 c_2}{b_2 \pm \sqrt{b_2^2 - 4 a_2 c_2}^{}}
\end{aligned}
$$

新近似 $x_3 = x_2 + \lambda_3(x_2 - x_1)$，再计算 $f_3 = f(x_3)$

3. **控制**：若 $|\delta_3| \le \varepsilon_1$ 或 $|f_3| \le \varepsilon_2$ 则终止；否则转步 4
4. **修改**：若迭代次数达 $N$ 则失败；否则 $(x_1, x_2, x_3, f_1, f_2, f_3) \to (x_0, x_1, x_2, f_0, f_1, f_2)$ 转步 2

### 7. 代数方程求根

若 $f(x)$ 是多项式，则 $f(x) = 0$ 特别地称为**代数方程**。前述求根法原则上也适用，但多项式的特殊性可提供更有效的算法：

- 多项式求值的**秦九韶算法**：快速求值、求导
- **代数方程的 Newton 法**：快速求根
- **劈因子法**：另一种求根思路

#### 7.1 多项式求值的秦九韶算法

设给定 $n$ 次多项式

$$
f(x) = a_0 x^n + a_1 x^{n-1} + \cdots + a_{n-1} x + a_n
$$

系数 $a_i$ 均为实数，如何快速计算函数值 $f(x_0)$ 及各阶导数？

**Taylor 展开**：

$$
f(x) = f(x_0) + f'(x_0)(x - x_0) + \frac{f''(x_0)}{2!}(x - x_0)^2 + \cdots + \frac{f^{(n)}(x_0)}{n!}(x - x_0)^n
$$

可写成

$$
f(x) = f(x_0) + (x - x_0) P(x) 
$$

其中 $P(x) = b_0 x^{n-1} + b_1 x^{n-2} + \cdots + b_{n-2} x + b_{n-1}$ 是 $n - 1$ 次多项式。

比较两端同次幂系数：

$$
\begin{cases}
a_0 = b_0 \\
a_i = b_i + x_0 b_{i-1},\quad 1 \le i \le n - 1 \\
a_n = f(x_0) - x_0 b_{n-1}
\end{cases}
$$

从而得到**秦九韶递推**：

$$
\boxed{\begin{cases} b_0 = a_0 \\ b_i = a_i + x_0 b_{i-1},\quad 1 \le i \le n \\ f(x_0) = b_n \end{cases}} 
$$

**算法特点**：

- 外国文献称 **Horner 算法**，实际比秦九韶晚了五六个世纪
- 计算量小，结构紧凑，容易编程
- 在计算 $f(x_0)$ 的同时还得到了 $P(x)$ 的系数 $b_i$

##### 导数计算

考察 Taylor 展开与 (6.5.1) 对比：

$$
P(x) = f'(x_0) + \frac{f''(x_0)}{2!}(x - x_0) + \cdots + \frac{f^{(n)}(x_0)}{n!}(x - x_0)^{n-1}
$$

可见 $f'(x_0)$ 是 **$P(x)$ 用 $(x - x_0)$ 相除得的余数**。即

$$
P(x) = f'(x_0) + (x - x_0) Q(x)
$$

其中 $Q(x) = c_0 x^{n-2} + c_1 x^{n-3} + \cdots + c_{n-3} x + c_{n-2}$ 是 $n - 2$ 次多项式。$P(x)$ 系数已在第一步得到，重复使用秦九韶算法：

$$
\boxed{\begin{cases} c_0 = b_0 \\ c_i = b_i + x_0 c_{i-1},\quad 1 \le i \le n - 1 \\ f'(x_0) = c_{n-1} \end{cases}} 
$$

继续这一过程，可依次求出 $f(x)$ 在 $x_0$ 处的**各阶导数**。

#### 7.2 代数方程的 Newton 法

对多项式方程 $f(x) = a_0 x^n + a_1 x^{n-1} + \cdots + a_n = 0$ 考察 Newton 公式

$$
x_{k+1} = x_k - \frac{f(x_k)}{f'(x_k)} 
$$

其中 $f(x_k), f'(x_k)$ 均可由秦九韶算法 (6.5.2)、(6.5.3) **方便求出**。

#### 7.3 劈因子法

用**二次式** $\omega(x) = x^2 + u x + v$ 除 $f(x)$，商为 $n - 2$ 次多项式 $P(x)$，余式为一次式 $r_0 x + r_1$：

$$
f(x) = (x^2 + u x + v) P(x) + r_0 x + r_1 
$$

其中 $r_0, r_1$ 均为 $(u, v)$ 的函数：$r_0 = r_0(u, v), r_1 = r_1(u, v)$。

**劈因子法的目的**：逐步修改 $u, v$，使余数 $r_0, r_1$ 变得很小，则可从 $f(x)$ 中分离出二次式 $\omega(x)$，$\omega(x)$ 的根即为 $f(x)$ 的根。

##### 线性化方程组

考察非线性方程组

$$
\begin{cases} r_0(u, v) = 0 \\ r_1(u, v) = 0 \end{cases} 
$$

设有解 $(u^*, v^*)$，将左端在 $(u, v)$ 展开到一阶项：

$$
\begin{aligned}
r_0 + \frac{\partial r_0}{\partial u}(u^* - u) + \frac{\partial r_0}{\partial v}(v^* - v) &\approx 0 \\
r_1 + \frac{\partial r_1}{\partial u}(u^* - u) + \frac{\partial r_1}{\partial v}(v^* - v) &\approx 0
\end{aligned}
$$

记 $\Delta u = u^* - u, \Delta v = v^* - v$，**Newton 化**线性方程组

$$
\begin{cases} r_0 + \dfrac{\partial r_0}{\partial u} \Delta u + \dfrac{\partial r_0}{\partial v} \Delta v = 0 \\ r_1 + \dfrac{\partial r_1}{\partial u} \Delta u + \dfrac{\partial r_1}{\partial v} \Delta v = 0 \end{cases} 
$$

解出 $\Delta u, \Delta v$ 即得改进后的二次因式 $\omega(x) = x^2 + (u + \Delta u) x + (v + \Delta v)$。

##### 步骤 1：计算 $r_0, r_1$

将 $P(x) = b_0 x^{n-2} + b_1 x^{n-3} + \cdots + b_{n-3} x + b_{n-2}$ 代入 (6.5.7)，比较 $f(x) = a_0 x^n + a_1 x^{n-1} + \cdots + a_n$ 各次幂系数：

$$
\begin{aligned}
a_0 &= b_0 \\
a_1 &= b_1 + u b_0 \\
a_i &= b_i + u b_{i-1} + v b_{i-2},\quad 2 \le i \le n - 2 \\
a_{n-1} &= u b_{n-2} + v b_{n-3} + r_0 \\
a_n &= v b_{n-2} + r_1
\end{aligned}
$$

得到 $r_0, r_1$ 的**计算公式**：

$$
\boxed{\begin{cases} b_0 = a_0 \\ b_1 = a_1 - u b_0 \\ b_i = a_i - u b_{i-1} - v b_{i-2},\quad 2 \le i \le n \\ r_0 = b_{n-1} \\ r_1 = b_n + u b_{n-1} \end{cases}} 
$$

计算 $r_0, r_1$ 的同时也得到 $P(x)$ 的系数 $b_i$。

##### 步骤 2：计算 $\dfrac{\partial r_0}{\partial v}, \dfrac{\partial r_1}{\partial v}$

对 (6.5.7) 关于 $v$ 求导：

$$
P(x) = -(x^2 + u x + v) \frac{\partial P}{\partial v} + s_0 x + s_1 
$$

其中

$$
s_0 = -\frac{\partial r_0}{\partial v},\quad s_1 = -\frac{\partial r_1}{\partial v} 
$$

由 (6.5.11) 可知用 $(x^2 + u x + v)$ 除 $P(x)$，余式为 $s_0 x + s_1$。$P(x)$ 是 $n - 2$ 次，商 $\dfrac{\partial P}{\partial v}$ 是 $n - 4$ 次多项式

$$
\frac{\partial P}{\partial v} = c_0 x^{n-4} + c_1 x^{n-5} + \cdots + c_{n-5} x + c_{n-4}
$$

仿照 (6.5.10) 的计算过程，得

$$
\boxed{\begin{cases} c_0 = b_0 \\ c_1 = b_1 - u b_0 \\ c_i = b_i - u c_{i-1} - v c_{i-2},\quad 2 \le i \le n - 2 \\ s_0 = c_{n-3} \\ s_1 = c_{n-2} + u c_{n-3} \end{cases}}
$$

即 $\dfrac{\partial r_0}{\partial v} = -s_0,\ \dfrac{\partial r_1}{\partial v} = -s_1$。

##### 步骤 3：计算 $\dfrac{\partial r_0}{\partial u}, \dfrac{\partial r_1}{\partial u}$

对 (6.5.7) 关于 $u$ 求导：

$$
x P(x) = -(x^2 + u x + v) \frac{\partial P}{\partial u} - \frac{\partial r_0}{\partial u} x - \frac{\partial r_1}{\partial u}
$$

另由 (6.5.11) 乘 $x$：

$$
x P(x) = -(x^2 + u x + v) x \frac{\partial P}{\partial v} + s_0 x^2 + s_1 x
$$

变形：

$$
x P(x) = -(x^2 + u x + v) x \frac{\partial P}{\partial v} + s_0(x^2 + u x + v) + (s_1 - u s_0) x - v s_0
$$

对比得

$$
\boxed{\frac{\partial r_0}{\partial u} = u s_0 - s_1,\quad \frac{\partial r_1}{\partial u} = v s_0}
$$

代入 (6.5.9) 解出 $\Delta u, \Delta v$，更新 $(u, v) \to (u + \Delta u, v + \Delta v)$，重复直到 $|r_0|, |r_1|$ 充分小。

### 第六章 总结

**6.1 根的搜索**

- 逐步搜索法、二分法、二分法的收敛性

**6.2 迭代法**

- 收敛条件、误差估计、局部收敛性
- 迭代公式的加工、Aitken 方法

**6.3 Newton 法**

- Newton 公式、几何解释
- 局部收敛性、Newton 下山法

**6.4 弦截法与抛物线法**

- 弦截法、几何意义、收敛性
- 抛物线法、几何意义、收敛性

**6.5 代数方程求根**

- 多项式求值的秦九韶算法
- 代数方程的 Newton 法
- 劈因子法

**作业**：第六章 第 1、7、12、14 题

---

## 七.解线性方程组的直接方法

### 1. 引言

很多自然科学与工程技术问题可归结为求解线性代数方程组：

- 三次样条函数构造
- 三维视觉中的相机姿态估计
- 最小二乘法曲线拟合
- 解非线性方程组（每次牛顿步要解一个线性子问题）

按系数矩阵的结构分两类：

- **低阶稠密矩阵**：阶数上界约 150，元素几乎全非零
- **大型稀疏矩阵**：阶数高，零元素多

求解方法分两大类：

| 方法 | 特点 |
| :--- | :--- |
| 直接法 | 经过有限步算术运算即可得到精确解；舍入误差使实际只能得近似解；适合低阶稠密矩阵；对大型稀疏矩阵亦有进展 |
| 迭代法 | 用极限过程逐步逼近精确解；存储少、程序简单、原矩阵不变；存在收敛性与收敛速度问题；适合大型稀疏矩阵 |

本章讨论直接法。

---

### 2. Gauss 消去法

Gauss 消去法是最基本的直接方法。我国早在公元前 250 年已掌握三元一次联立方程的解法；其改进、变形得到的主元素消去法、三角分解法仍是当前计算机上常用的有效方法。

#### 2.1 基本思想（Example 7.1）

设方程组

$$
\mathbf{A}\mathbf{x} = \mathbf{b},\quad
\mathbf{A} =
\begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & & \vdots \\
a_{n1} & a_{n2} & \cdots & a_{nn}
\end{bmatrix},\quad
\mathbf{x} = \begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{bmatrix},\quad
\mathbf{b} = \begin{bmatrix} b_1 \\ b_2 \\ \vdots \\ b_n \end{bmatrix} 
$$

**例 7.1**：解

$$
\begin{cases}
x_1 + x_2 + x_3 = 6 \\
4 x_2 - x_3 = 5 \\
2 x_1 - 2 x_2 + x_3 = 1
\end{cases}
$$

将式 1 乘 $-2$ 加到式 3，消去 $x_1$：$-4 x_2 - x_3 = -11$；再加上式 2 消去 $x_2$：$-2 x_3 = -6$。得到三角方程组

$$
\begin{cases}
x_1 + x_2 + x_3 = 6 \\
4 x_2 - x_3 = 5 \\
-2 x_3 = -6
\end{cases} 
$$

回代得 $\mathbf{x}^* = (1,2,3)^{\mathrm{T}}$。增广矩阵的初等行变换为

$$
[\mathbf{A}\mid\mathbf{b}] =
\begin{bmatrix} 1 & 1 & 1 & \mid & 6 \\ 0 & 4 & -1 & \mid & 5 \\ 2 & -2 & 1 & \mid & 1 \end{bmatrix}
\xrightarrow{-2 r_1 + r_3}
\begin{bmatrix} 1 & 1 & 1 & \mid & 6 \\ 0 & 4 & -1 & \mid & 5 \\ 0 & -4 & -1 & \mid & -11 \end{bmatrix}
\xrightarrow{r_2 + r_3}
\begin{bmatrix} 1 & 1 & 1 & \mid & 6 \\ 0 & 4 & -1 & \mid & 5 \\ 0 & 0 & -2 & \mid & -6 \end{bmatrix}
$$

#### 2.2 一般 $n$ 阶 Gauss 消去法

记 $\mathbf{A}^{(1)} = \mathbf{A}$，$\mathbf{b}^{(1)} = \mathbf{b}$。

**第 $k$ 次消元** $(1 \le k \le n-1)$：设第 $k-1$ 步已得 $\mathbf{A}^{(k)}\mathbf{x} = \mathbf{b}^{(k)}$，$\mathbf{A}^{(k)}$ 已消去 $x_1,\cdots,x_{k-1}$，且 $a_{kk}^{(k)} \ne 0$。计算乘数

$$
m_{ik} = a_{ik}^{(k)}/a_{kk}^{(k)},\quad i = k+1,\cdots,n
$$

用 $-m_{ik}$ 乘第 $k$ 行加到第 $i$ 行，消去 $x_k$，得 $\mathbf{A}^{(k+1)}\mathbf{x} = \mathbf{b}^{(k+1)}$，其中

$$
\boxed{\begin{aligned}
a_{ij}^{(k+1)} &= a_{ij}^{(k)} - m_{ik} a_{kj}^{(k)},\quad i,j = k+1,\cdots,n \\
b_i^{(k+1)} &= b_i^{(k)} - m_{ik} b_k^{(k)},\quad i = k+1,\cdots,n
\end{aligned}}
$$

经 $n-1$ 次消元，得 $\mathbf{A}^{(n)}\mathbf{x} = \mathbf{b}^{(n)}$，是上三角方程组（消元过程）。

#### 2.3 回代过程

设 $a_{ii}^{(i)} \ne 0$，则

$$
\boxed{\begin{aligned}
x_n &= b_n^{(n)}/a_{nn}^{(n)} \\
x_k &= \left( b_k^{(k)} - \sum_{j=k+1}^{n} a_{kj}^{(k)} x_j \right) \Big/ a_{kk}^{(k)},\quad k = n-1, \cdots, 1
\end{aligned}}
$$

#### 2.4 消元过程的注意事项

若 $a_{11}^{(1)} = 0$：因 $\mathbf{A}$ 非奇异，第 1 列必有 $a_{i_1,1}^{(1)} \ne 0$，先交换第 1 行与第 $i_1$ 行再消元。

> **定理 7.1**：若 $\mathbf{A}$ 为 $n$ 阶非奇异矩阵，则可通过 Gauss 消去法（必要时配合行交换）将 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 化为 $\mathbf{A}^{(n)}\mathbf{x} = \mathbf{b}^{(n)}$。

不需交换行的条件：

> **引理**：$a_{ii}^{(i)} \ne 0$ $(i = 1,\cdots,k)$ $\iff$ $\mathbf{A}$ 的顺序主子式 $D_i \ne 0$ $(i = 1,\cdots,k)$，其中
>
> $$ D_i = \det\big[(a_{rs})_{r,s=1}^{i}\big] $$

**证明思路**（充分性归纳）：注意 Gauss 消去法不改变行列式，故

$$
D_k = a_{11}^{(1)} a_{22}^{(2)} \cdots a_{kk}^{(k)} 
$$

由 $D_i \ne 0$ 即得 $a_{kk}^{(k)} \ne 0$。

> **推论**：若 $D_k \ne 0$（$k = 1,\cdots,n-1$），则 $a_{11}^{(1)} = D_1$，$a_{kk}^{(k)} = D_k/D_{k-1}$ $(k=2,\cdots,n)$。

> **定理 7.2**：若 $\mathbf{A}$ 的所有顺序主子式 $D_i \ne 0$ $(i=1,\cdots,n)$，则 Gauss 消去法不需行交换即可化方程组为三角形式。

#### 2.5 矩阵描述与 LU 分解

第 $k$ 步消元相当于左乘**初等下三角阵**

$$
\mathbf{L}_k =
\begin{bmatrix}
1 & & & & & \\
 & \ddots & & & & \\
 & & 1 & & & \\
 & & -m_{k+1,k} & 1 & & \\
 & & \vdots & & \ddots & \\
 & & -m_{nk} & & & 1
\end{bmatrix}
$$

满足 $\mathbf{L}_k \mathbf{A}^{(k)} = \mathbf{A}^{(k+1)}$，$\mathbf{L}_k \mathbf{b}^{(k)} = \mathbf{b}^{(k+1)}$。重复得

$$
\mathbf{L}_{n-1} \cdots \mathbf{L}_2 \mathbf{L}_1 \mathbf{A} = \mathbf{A}^{(n)} 
$$

记 $\mathbf{U} = \mathbf{A}^{(n)}$，则

$$
\mathbf{A} = \mathbf{L}_1^{-1} \mathbf{L}_2^{-1} \cdots \mathbf{L}_{n-1}^{-1} \mathbf{U} = \mathbf{L}\mathbf{U}
$$

其中

$$
\mathbf{L} =
\begin{bmatrix}
1 & & & & \\
m_{21} & 1 & & & \\
m_{31} & m_{32} & 1 & & \\
\vdots & \vdots & \ddots & \ddots & \\
m_{n1} & m_{n2} & \cdots & m_{n,n-1} & 1
\end{bmatrix}
$$

为单位下三角阵（对角元为 1，其余元素是消元乘数）。

> **定理 7.3（矩阵的 LU 分解）**：设 $\mathbf{A}$ 为 $n$ 阶矩阵。若顺序主子式 $D_i \ne 0$ $(i=1,\cdots,n-1)$，则存在唯一分解 $\mathbf{A} = \mathbf{L}\mathbf{U}$，$\mathbf{L}$ 为单位下三角阵，$\mathbf{U}$ 为上三角阵。

**唯一性证明**：设 $\mathbf{A} = \mathbf{L}\mathbf{U} = \mathbf{L}_1\mathbf{U}_1$，则 $\mathbf{U}\mathbf{U}_1^{-1} = \mathbf{L}^{-1}\mathbf{L}_1$。左侧上三角，右侧单位下三角，故两端必为 $\mathbf{I}$，得 $\mathbf{L} = \mathbf{L}_1, \mathbf{U} = \mathbf{U}_1$。

**例 7.2**：例 7.1 的系数矩阵

$$
\mathbf{A} =
\begin{bmatrix} 1 & 1 & 1 \\ 0 & 4 & -1 \\ 2 & -2 & 1 \end{bmatrix},\quad
m_{21} = 0,\ m_{31} = 2,\ m_{32} = -1
$$

$$
\mathbf{A} =
\begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \\ 2 & -1 & 1 \end{bmatrix}
\begin{bmatrix} 1 & 1 & 1 \\ 0 & 4 & -1 \\ 0 & 0 & -2 \end{bmatrix}
= \mathbf{L}\mathbf{U}
$$

#### 2.6 计算量

| 阶段 | 乘除法次数 | 加减法次数 |
| :--- | :--- | :--- |
| 消元（$\mathbf{A}$） | $n(n-1)(2n+5)/6$ 等 | $n(n-1)(2n-1)/6$ |
| 消元（$\mathbf{b}$） | $n(n-1)/2$ | $n(n-1)/2$ |
| 回代 | $n(n+1)/2$ | $n(n-1)/2$ |

> **定理 7.4**：用 Gauss 消去法解 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 总计算量
>
> $$ MD = \dfrac{n^3}{3} + n^2 - \dfrac{n}{3},\quad AS = \dfrac{n(n-1)(2n+5)}{6} $$
>
> 当 $n$ 大时主项约为 $n^3/3$。

---

### 3. Gauss 主元素消去法

#### 3.1 Gauss 消去法的局限性（Example 7.3）

消元过程中可能 $a_{kk}^{(k)} = 0$ 或绝对值很小。后者作为除数会导致其他元素数量级严重增长、舍入误差扩散，使解不可靠。

**例 7.3**：四位浮点数解

$$
\begin{bmatrix} 0.001 & 2.000 & 3.000 \\ -1.000 & 3.712 & 4.623 \\ -2.000 & 1.072 & 5.643 \end{bmatrix}
\begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix} =
\begin{bmatrix} 1.000 \\ 2.000 \\ 3.000 \end{bmatrix}
$$

精确解 $\mathbf{x}^* = (-0.4904, -0.05104, 0.3675)^{\mathrm{T}}$。

- **方法一（不换行）**：以 $0.001$ 为主元，得 $\hat{\mathbf{x}} = (-0.4000, -0.0998, 0.4000)^{\mathrm{T}}$ —— 解极差，原因是小主元放大了元素数量级。
- **方法二（先换行 $r_1 \leftrightarrow r_3$）**：以 $-2.000$ 为主元，得 $\hat{\mathbf{x}} = (-0.4900, -0.05113, 0.3678)^{\mathrm{T}} \approx \mathbf{x}^*$。

结论：避免使用绝对值小的主元 $a_{kk}^{(k)}$。

#### 3.2 完全主元素消去法

每一步选系数矩阵右下方块中绝对值最大的元素作主元，使数值稳定性最好。

设 $\mathbf{A}^{(k)}, \mathbf{b}^{(k)}$ 已消元 $k-1$ 步。第 $k$ 步：

1. **选主元**：在 $\mathbf{A}^{(k)}$ 右下 $(n-k+1)\times(n-k+1)$ 子矩阵中找

   $$ |a_{i_k, j_k}^{(k)}| = \max_{k \le i, j \le n} |a_{ij}^{(k)}| \ne 0 $$
2. **换行换列**：交换第 $k$ 行与第 $i_k$ 行；交换第 $k$ 列与第 $j_k$ 列（注意：换列要记录 $x$ 次序变化）
3. **消元**：照常进行

**算法 1**（用整型数组 $\mathrm{idx}(n)$ 记录未知数次序）：
1. $\mathrm{idx}(i) \leftarrow i$，$i = 1,\cdots,n$
2. For $k = 1,\cdots,n-1$：选主元；若主元 $= 0$ 停止（$\det \mathbf{A} = 0$）
3. 必要时换行 / 换列（同步交换 $\mathrm{idx}$）
4. 计算乘数、消元
5. 回代后调整未知数次序：$\mathbf{x}_{\mathrm{idx}(i)} \leftarrow b_i$

#### 3.3 列主元素消去法

只在第 $k$ 列里选主元：

$$ |a_{i_k, k}^{(k)}| = \max_{k \le i \le n} |a_{ik}^{(k)}| $$

仅交换行，不交换列，未知数次序不变。

**算法 2**：用 $\det\mathbf{A}$ 累乘，同时计算 $|m_{ik}| \le 1$。

> **定理 7.5（列主元素的三角分解定理）**：若 $\mathbf{A}$ 非奇异，则存在排列矩阵 $\mathbf{P}$，使 $\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U}$，其中 $\mathbf{L}$ 为单位下三角阵，$\mathbf{U}$ 为上三角阵。

注：不再要求顺序主子式非零。

矩阵描述（$n=4$）：

$$
\mathbf{U} = \tilde{\mathbf{L}}_3 \tilde{\mathbf{L}}_2 \tilde{\mathbf{L}}_1 \mathbf{P}\mathbf{A},\quad
\mathbf{P} = \mathbf{I}_{3,i_3} \mathbf{I}_{2,i_2} \mathbf{I}_{1,i_1}
$$

其中 $\tilde{\mathbf{L}}_k$ 仍是单位下三角阵且元素绝对值不大于 1。

#### 3.4 Gauss-Jordan 消去法

不仅消去对角线下方元素，也消去上方元素，将 $\mathbf{A}$ 约化为单位矩阵，常数项位置直接得到解，**不需回代**。

第 $k$ 步：
1. 按列选主元，必要时换行
2. 计算乘数：$m_{ik} = -a_{ik}/a_{kk}$ ($i\ne k$)，$m_{kk} = 1/a_{kk}$
3. 消元：$a_{ij} \leftarrow a_{ij} + m_{ik} a_{kj}$ ($i \ne k$)；$b_i \leftarrow b_i + m_{ik} b_k$
4. 计算主行：$a_{kj} \leftarrow a_{kj} \cdot m_{kk}$；$b_k \leftarrow b_k \cdot m_{kk}$

完成后 $\mathbf{A} \to \mathbf{I}$，$\mathbf{b} \to$ 解。

**计算量**：约 $n^3/2$ 次乘除法（比 Gauss 消去法的 $n^3/3$ 大），但**适合求逆矩阵**。

> **定理 7.6（Gauss-Jordan 求逆）**：设 $\mathbf{A}$ 非奇异，方程组 $\mathbf{A}\mathbf{X} = \mathbf{I}_n$ 的增广矩阵 $\mathbf{C} = (\mathbf{A}\mid\mathbf{I}_n)$。对 $\mathbf{C}$ 应用 Gauss-Jordan 消去得 $(\mathbf{I}_n\mid\mathbf{T})$，则 $\mathbf{A}^{-1} = \mathbf{T}$。

**例 7.4**：求

$$
\mathbf{A} = \begin{bmatrix} 1 & 2 & 3 \\ 2 & 4 & 5 \\ 3 & 5 & 6 \end{bmatrix} \quad\Longrightarrow\quad
\mathbf{A}^{-1} = \begin{bmatrix} 1 & -3 & 2 \\ -3 & 3 & -1 \\ 2 & -1 & 0 \end{bmatrix}
$$

按列选主元，三步消元（每步主元在小红框内）后得 $(\mathbf{I}\mid\mathbf{A}^{-1})$。

**节省存储**：每步把 $\mathbf{m}_k = (-a_{1k}/a_{kk},\cdots,1/a_{kk},\cdots,-a_{nk}/a_{kk})^{\mathrm{T}}$ 直接覆写在 $\mathbf{A}$ 的第 $k$ 列位置，不需另存单位阵。事实上，最后在 $\mathbf{A}$ 位置得到 $\mathbf{A}_1^{-1} = (\mathbf{P}\mathbf{A})^{-1}$，再交换列可得 $\mathbf{A}^{-1} = \mathbf{A}_1^{-1}\mathbf{P}$。

---

### 4. Gauss 消去法的变形

#### 4.1 直接三角分解法（Doolittle）

将 Gauss 消去法改写为紧凑形式：直接从 $\mathbf{A}$ 的元素推出 $\mathbf{L},\mathbf{U}$ 的元素，三步解方程：

1. $\mathbf{A} = \mathbf{L}\mathbf{U}$ 分解
2. $\mathbf{L}\mathbf{y} = \mathbf{b}$ 求 $\mathbf{y}$
3. $\mathbf{U}\mathbf{x} = \mathbf{y}$ 求 $\mathbf{x}$

设 $\mathbf{L}$ 单位下三角，$\mathbf{U}$ 上三角：

$$
\mathbf{A} =
\begin{bmatrix}
1 \\
l_{21} & 1 \\
\vdots & \ddots & \ddots \\
l_{n1} & \cdots & l_{n,n-1} & 1
\end{bmatrix}
\begin{bmatrix}
u_{11} & u_{12} & \cdots & u_{1n} \\
 & u_{22} & \cdots & u_{2n} \\
 & & \ddots & \vdots \\
 & & & u_{nn}
\end{bmatrix} 
$$

**第 $r$ 步**：已得 $\mathbf{U}$ 前 $r-1$ 行、$\mathbf{L}$ 前 $r-1$ 列。比较 $\mathbf{A}$ 第 $r$ 行：

$$ a_{ri} = \sum_{k=1}^{n} l_{rk} u_{ki} = \sum_{k=1}^{r-1} l_{rk} u_{ki} + u_{ri},\quad i \ge r $$

可得 $\mathbf{U}$ 第 $r$ 行：

$$
\boxed{u_{ri} = a_{ri} - \sum_{k=1}^{r-1} l_{rk} u_{ki},\quad i = r,r+1,\cdots,n} 
$$

比较 $\mathbf{A}$ 第 $r$ 列，得 $\mathbf{L}$ 第 $r$ 列：

$$
\boxed{l_{ir} = \left( a_{ir} - \sum_{k=1}^{r-1} l_{ik} u_{kr} \right)\Big/u_{rr},\quad i = r+1,\cdots,n} 
$$

**求解三角方程组**：

$$
\begin{aligned}
y_1 &= b_1,\quad y_i = b_i - \sum_{k=1}^{i-1} l_{ik} y_k\quad (i = 2,\cdots,n) \\
x_n &= y_n/u_{nn},\quad x_i = \left(y_i - \sum_{k=i+1}^{n} u_{ik} x_k\right)\!\Big/u_{ii}\quad (i = n-1,\cdots,1)
\end{aligned} 
$$

**例 7.5**：解

$$
\begin{bmatrix} 1 & 2 & 3 \\ 2 & 5 & 2 \\ 3 & 1 & 5 \end{bmatrix}
\begin{bmatrix} x_1 \\ x_2 \\ x_3 \end{bmatrix}
= \begin{bmatrix} 14 \\ 18 \\ 20 \end{bmatrix}
$$

分解：

$$
\mathbf{A} = \begin{bmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 3 & -5 & 1 \end{bmatrix}
\begin{bmatrix} 1 & 2 & 3 \\ 0 & 1 & -4 \\ 0 & 0 & -24 \end{bmatrix}
$$

$\mathbf{L}\mathbf{y} = (14,18,20)^{\mathrm{T}} \Rightarrow \mathbf{y} = (14,-10,-72)^{\mathrm{T}}$；$\mathbf{U}\mathbf{x} = \mathbf{y} \Rightarrow \mathbf{x} = (1,2,3)^{\mathrm{T}}$。

**讨论**：

- 计算好 $\mathbf{L},\mathbf{U}$ 后直接覆写在 $\mathbf{A}$ 位置以节省存储
- 总乘除约 $n^3/3$，与 Gauss 消去法相当
- 已分解的 $\mathbf{A}$ 可重复用于相同系数、多右端的方程组 $\mathbf{A}\mathbf{x} = \mathbf{b}_1, \mathbf{b}_2, \cdots$，每个右端只需额外 $n^2$ 次乘除

#### 4.2 选主元素的三角分解法

避免 $u_{rr}$ 为零或太小。引入量

$$ s_i = a_{ir} - \sum_{k=1}^{r-1} l_{ik} u_{kr},\quad i = r,\cdots,n $$

则 $u_{rr} = s_r$，$l_{ir} = s_i/s_r$。**选主元**：取

$$ |s_{i_r}| = \max_{r \le i \le n} |s_i| $$

用 $s_{i_r}$ 作为 $u_{rr}$，交换 $\mathbf{A}$ 的 $r$ 行与 $i_r$ 行，再进行第 $r$ 步分解。此时 $|l_{ir}| \le 1$。

可证：选列主元的三角分解法 ≡ 列主元素消去法，结果亦满足 $\mathbf{P}\mathbf{A} = \mathbf{L}\mathbf{U}$。

#### 4.3 平方根法（Cholesky）

**对称矩阵的三角分解**：将 $\mathbf{U} = \mathbf{D}\tilde{\mathbf{U}}$，$\mathbf{D} = \mathrm{diag}(u_{ii})$，$\tilde{\mathbf{U}}$ 单位上三角阵。则

$$ \mathbf{A} = \mathbf{L}\mathbf{D}\tilde{\mathbf{U}} $$

由 $\mathbf{A} = \mathbf{A}^{\mathrm{T}}$ 与 LU 分解唯一性，得 $\tilde{\mathbf{U}} = \mathbf{L}^{\mathrm{T}}$，即

> **定理 7.7（对称阵的三角分解）**：设 $\mathbf{A}$ 为对称、所有顺序主子式非零的矩阵，则唯一分解
>
> $$ \mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{L}^{\mathrm{T}} $$
>
> 其中 $\mathbf{L}$ 单位下三角，$\mathbf{D}$ 对角。

**对称正定矩阵**：顺序主子式 $D_k > 0$，故

$$ d_1 = D_1 > 0,\quad d_i = D_i/D_{i-1} > 0 $$

故可写 $\mathbf{D} = \mathbf{D}^{1/2}\mathbf{D}^{1/2}$，从而

$$ \mathbf{A} = \mathbf{L}\mathbf{D}^{1/2}\mathbf{D}^{1/2}\mathbf{L}^{\mathrm{T}} = \tilde{\mathbf{L}}\tilde{\mathbf{L}}^{\mathrm{T}} $$

> **定理 7.8（对称正定矩阵的 Cholesky 分解）**：若 $\mathbf{A}$ 为 $n$ 阶对称正定矩阵，则存在实非奇异下三角阵 $\mathbf{L}$ 使 $\mathbf{A} = \mathbf{L}\mathbf{L}^{\mathrm{T}}$；当限定 $l_{ii} > 0$ 时分解唯一。

**递推公式**：考虑下三角元素 $a_{ij}$ ($i \ge j$)：

$$ a_{ij} = \sum_{k=1}^{j} l_{ik} l_{jk} = \sum_{k=1}^{j-1} l_{ik} l_{jk} + l_{ii} l_{ji} \quad(\text{当 } k > i,\ l_{ik} = 0) $$

得**Cholesky 递推**（按列）：

$$
\boxed{\begin{aligned}
l_{jj} &= \left( a_{jj} - \sum_{k=1}^{j-1} l_{jk}^2 \right)^{\!1/2} \\
l_{ij} &= \left( a_{ij} - \sum_{k=1}^{j-1} l_{ik} l_{jk} \right)\!\Big/l_{jj},\quad i = j+1,\cdots,n
\end{aligned}} 
$$

接着分两步求解：

$$
\begin{aligned}
\mathbf{L}\mathbf{y} = \mathbf{b}:\quad & y_i = \left(b_i - \sum_{k=1}^{i-1} l_{ik} y_k\right)\!\Big/l_{ii} \\
\mathbf{L}^{\mathrm{T}}\mathbf{x} = \mathbf{y}:\quad & x_i = \left(y_i - \sum_{k=i+1}^{n} l_{ki} x_k\right)\!\Big/l_{ii}
\end{aligned}
$$

**数值稳定性**：由 $a_{jj} = \sum_{k=1}^j l_{jk}^2$，

$$ l_{jk}^2 \le a_{jj} \le \max_{1\le j\le n} a_{jj} \Rightarrow \max |l_{jk}| \le \sqrt{\max a_{jj}^{}}^{} $$

元素数量级不会增长，且对角元恒为正 ⇒ **不选主元的平方根法是数值稳定的**。

**时空复杂度**：约需 $n^3/6$ 次乘除（约为一般 LU 的一半）。只需存储 $\mathbf{A}$ 的下三角 $n(n+1)/2$ 个元素，$\mathbf{L}$ 覆写在 $\mathbf{A}$ 原位。

#### 4.4 改进的平方根法（避免开方）

直接用 $\mathbf{A} = \mathbf{L}\mathbf{D}\mathbf{L}^{\mathrm{T}}$ 分解：

$$ a_{ij} = \sum_{k=1}^{n} (\mathbf{L}\mathbf{D})_{ik} (\mathbf{L}^{\mathrm{T}})_{kj} = \sum_{k=1}^{j-1} l_{ik} d_k l_{jk} + l_{ij} d_j \quad (\text{对 } j \le i) $$

得（按行计算）：

$$
\boxed{\begin{aligned}
l_{ij} &= \left( a_{ij} - \sum_{k=1}^{j-1} l_{ik} d_k l_{jk} \right)\!\Big/d_j,\quad j = 1,\cdots,i-1 \\
d_i &= a_{ii} - \sum_{k=1}^{i-1} l_{ik}^2 d_k
\end{aligned}}
$$

**节省重复计算**：令 $t_{ij} = l_{ij} d_j$，按行计算：
1. $t_{ij} = a_{ij} - \sum_{k=1}^{j-1} t_{ik} l_{jk}$，$j = 1,\cdots,i-1$
2. $l_{ij} = t_{ij}/d_j$
3. $d_i = a_{ii} - \sum_{k=1}^{i-1} t_{ik} l_{ik}$

**节省空间**：$t_{ij}$ 先写在 $\mathbf{A}$ 第 $i$ 行；用完替换为 $l_{ij}$；$d_i$ 存 $a_{ii}$ 位置。

求解 $\mathbf{A}\mathbf{x} = \mathbf{b}$：

$$
\begin{aligned}
\mathbf{L}\mathbf{y} = \mathbf{b}:\quad & y_1 = b_1,\ y_i = b_i - \sum_{k=1}^{i-1} l_{ik} y_k \\
\mathbf{D}\mathbf{L}^{\mathrm{T}}\mathbf{x} = \mathbf{y}:\quad & x_n = y_n/d_n,\ x_i = y_i/d_i - \sum_{k=i+1}^{n} l_{ki} x_k
\end{aligned}
$$

$\mathbf{L}\mathbf{D}\mathbf{L}^{\mathrm{T}}$ 与 $\mathbf{L}\mathbf{L}^{\mathrm{T}}$ 计算量相当，但前者**无开方**。

#### 4.5 追赶法（对角占优三对角方程组）

样条插值等问题导出系数矩阵为对角占优的三对角矩阵：

$$
\begin{bmatrix}
b_1 & c_1 \\
a_2 & b_2 & c_2 \\
& \ddots & \ddots & \ddots \\
& & a_{n-1} & b_{n-1} & c_{n-1} \\
& & & a_n & b_n
\end{bmatrix}
\begin{bmatrix} x_1 \\ x_2 \\ \vdots \\ x_{n-1} \\ x_n \end{bmatrix}
= \begin{bmatrix} f_1 \\ f_2 \\ \vdots \\ f_{n-1} \\ f_n \end{bmatrix} 
$$

**对角占优条件**：

- $|b_1| > |c_1| > 0$
- $|b_i| \ge |a_i| + |c_i|,\ a_i c_i \ne 0\ (i = 2,\cdots,n-1)$
- $|b_n| > |a_n| > 0$

**三角分解** $\mathbf{A} = \mathbf{L}\mathbf{U}$，其中 $\mathbf{L}$ 下三角，$\mathbf{U}$ 单位上三角：

$$
\mathbf{L} = \begin{bmatrix} \alpha_1 \\ \gamma_2 & \alpha_2 \\ & \ddots & \ddots \\ & & \gamma_n & \alpha_n \end{bmatrix},\quad
\mathbf{U} = \begin{bmatrix} 1 & \beta_1 \\ & 1 & \beta_2 \\ & & \ddots & \ddots \\ & & & 1 & \beta_{n-1} \\ & & & & 1 \end{bmatrix}
$$

比较得

$$
\boxed{\begin{aligned}
\alpha_1 = b_1,\quad \beta_1 &= c_1/b_1 \\
\gamma_i = a_i,\quad \alpha_i &= b_i - a_i \beta_{i-1},\quad \beta_i = c_i/\alpha_i\quad (i = 2,\cdots,n)
\end{aligned}} 
$$

**稳定性分析**：由对角占优条件可归纳证 $|\beta_i| < 1$，且 $|b_i| - |a_i| \le \alpha_i \le |b_i| + |a_i|$，元素数量级不会暴涨。

**追赶法求解**：

$$
\begin{aligned}
\text{追}\quad y_1 = f_1/\alpha_1,\quad & y_i = (f_i - a_i y_{i-1})/\alpha_i\quad (i = 2,\cdots,n) \\
\text{赶}\quad x_n = y_n,\quad & x_i = y_i - \beta_i x_{i+1}\quad (i = n-1,\cdots,1)
\end{aligned}
$$

> **定理 7.9**：追赶法不会出现中间结果数量级暴增和舍入误差严重累积，是数值稳定的方法。

**计算量**：仅 $5n - 4$ 次乘除；对同一系数矩阵的新右端，每解一个方程组只需额外 $3n - 2$ 次乘除。只需三个一维数组存 $\{a_i\}, \{b_i\}, \{c_i\}$。

---

### 5. 向量和矩阵的范数

为了研究方程组近似解的误差估计和迭代法的收敛性，需对 $\mathbf{R}^n$ 向量、$\mathbf{R}^{n\times n}$ 矩阵的"大小"引入度量——范数。

#### 5.1 内积与 Euclid 范数

**定义 7.1**：设 $\mathbf{x},\mathbf{y} \in \mathbf{R}^n$，

$$ (\mathbf{x},\mathbf{y}) = \mathbf{y}^{\mathrm{T}}\mathbf{x} = \sum_{i=1}^{n} x_i y_i,\quad \|\mathbf{x}\|_2 = (\mathbf{x},\mathbf{x})^{1/2} = \left(\sum_{i=1}^{n} x_i^2\right)^{\!1/2} $$

> **定理 7.10**：对 $\mathbf{x},\mathbf{y} \in \mathbf{R}^n$：
>
> - $(\mathbf{x},\mathbf{x}) = 0 \iff \mathbf{x} = \mathbf{0}$
> - $(\alpha\mathbf{x},\mathbf{y}) = \alpha(\mathbf{x},\mathbf{y})$，$(\mathbf{x},\mathbf{y}) = (\mathbf{y},\mathbf{x})$，$(\mathbf{x}_1+\mathbf{x}_2,\mathbf{y}) = (\mathbf{x}_1,\mathbf{y})+(\mathbf{x}_2,\mathbf{y})$
> - **Cauchy-Schwarz**：$|(\mathbf{x},\mathbf{y})| \le \|\mathbf{x}\|_2 \|\mathbf{y}\|_2$
> - **三角不等式**：$\|\mathbf{x}+\mathbf{y}\|_2 \le \|\mathbf{x}\|_2 + \|\mathbf{y}\|_2$

#### 5.2 向量范数

**定义 7.2**：$\mathbf{R}^n$ 上实值函数 $N(\mathbf{x}) = \|\mathbf{x}\|$ 满足：

- **正定性**：$\|\mathbf{x}\| \ge 0$，$\|\mathbf{x}\| = 0 \iff \mathbf{x} = \mathbf{0}$
- **齐次性**：$\|\alpha\mathbf{x}\| = |\alpha|\|\mathbf{x}\|$
- **三角不等式**：$\|\mathbf{x}+\mathbf{y}\| \le \|\mathbf{x}\| + \|\mathbf{y}\|$

则称 $N(\mathbf{x})$ 为 $\mathbf{R}^n$ 上的**向量范数**。可推 $|\|\mathbf{x}\| - \|\mathbf{y}\|| \le \|\mathbf{x} - \mathbf{y}\|$。

**常用范数**：

$$
\|\mathbf{x}\|_\infty = \max_{1\le i\le n} |x_i|,\quad
\|\mathbf{x}\|_1 = \sum_i |x_i|,\quad
\|\mathbf{x}\|_2 = \left(\sum_i x_i^2\right)^{1/2},\quad
\|\mathbf{x}\|_p = \left(\sum_i |x_i|^p\right)^{1/p}
$$

#### 5.3 连续性与等价性

> **定理 7.11（连续性）**：$N(\mathbf{x}) = \|\mathbf{x}\|$ 是 $\mathbf{x}$ 各分量的连续函数。

> **定理 7.12（等价性）**：对 $\mathbf{R}^n$ 上任两种范数 $\|\cdot\|_s,\|\cdot\|_t$，存在 $c_1,c_2 > 0$ 使
>
> $$ c_1 \|\mathbf{x}\|_s \le \|\mathbf{x}\|_t \le c_2 \|\mathbf{x}\|_s,\quad \forall \mathbf{x} \in \mathbf{R}^n $$
>
> （无限维空间不成立。）

> **定理 7.13**：$\lim_{k\to\infty}\mathbf{x}^{(k)} = \mathbf{x}^* \iff \|\mathbf{x}^{(k)} - \mathbf{x}^*\| \to 0$（任一范数意义下）。

#### 5.4 矩阵范数

**Frobenius 范数**：

$$ \|\mathbf{A}\|_F = \left(\sum_{i,j=1}^{n} a_{ij}^2\right)^{1/2} $$

**定义 7.4**：$\mathbf{R}^{n\times n}$ 上实值函数 $\|\mathbf{A}\|$ 满足正定、齐次、三角不等式，且

- **相容性**：$\|\mathbf{A}\mathbf{B}\| \le \|\mathbf{A}\|\|\mathbf{B}\|$

则称为矩阵范数。

#### 5.5 算子范数

由向量范数诱导的矩阵范数（要求 $\|\mathbf{A}\mathbf{x}\| \le \|\mathbf{A}\|\|\mathbf{x}\|$）：

$$
\boxed{\|\mathbf{A}\|_v = \max_{\mathbf{x}\ne \mathbf{0}} \dfrac{\|\mathbf{A}\mathbf{x}\|_v}{\|\mathbf{x}\|_v}}
$$

> **定理 7.14**：$\|\mathbf{A}\|_v$ 是矩阵范数且满足 $\|\mathbf{A}\mathbf{x}\|_v \le \|\mathbf{A}\|_v \|\mathbf{x}\|_v$。

> **定理 7.15（常用算子范数）**：
>
> - **行范数**：$\|\mathbf{A}\|_\infty = \max_{1\le i\le n} \sum_{j=1}^n |a_{ij}|$
> - **列范数**：$\|\mathbf{A}\|_1 = \max_{1\le j\le n} \sum_{i=1}^n |a_{ij}|$
> - **2-范数**：$\|\mathbf{A}\|_2 = \sqrt{\lambda_{\max}(\mathbf{A}^{\mathrm{T}}\mathbf{A})^{}}^{}$（$\mathbf{A}^{\mathrm{T}}\mathbf{A}$ 的最大特征值开方）

#### 5.6 特征值与范数

**定义 7.6（谱半径）**：

$$ \rho(\mathbf{A}) = \max_{1\le i\le n} |\lambda_i| $$

> **定理 7.16**：$\rho(\mathbf{A}) \le \|\mathbf{A}\|$（任一算子范数，对 $\|\cdot\|_F$ 亦成立）。

> **定理 7.17**：若 $\mathbf{A}$ 对称，则 $\|\mathbf{A}\|_2 = \rho(\mathbf{A})$。

> **定理 7.18**：若 $\|\mathbf{B}\| < 1$（算子范数），则 $\mathbf{I} \pm \mathbf{B}$ 非奇异，且
>
> $$ \|(\mathbf{I}\pm\mathbf{B})^{-1}\| \le \dfrac{1}{1 - \|\mathbf{B}\|} $$

**证（反证）**：若 $\mathbf{I}\pm\mathbf{B}$ 奇异，则 $(\mathbf{I}\pm\mathbf{B})\mathbf{x}_0 = \mathbf{0}$ 有非零解，$\mathbf{B}\mathbf{x}_0 = \mp\mathbf{x}_0$，故 $\|\mathbf{B}\| \ge \|\mathbf{B}\mathbf{x}_0\|/\|\mathbf{x}_0\| = 1$，矛盾。
由 $(\mathbf{I}\pm\mathbf{B})(\mathbf{I}\pm\mathbf{B})^{-1} = \mathbf{I}$，移项 $\Rightarrow$ $(\mathbf{I}\pm\mathbf{B})^{-1} = \mathbf{I} \mp \mathbf{B}(\mathbf{I}\pm\mathbf{B})^{-1}$，取范数得不等式。

---

### 6. 误差分析

#### 6.1 微小误差对解的影响（Example 7.8）

**例 7.8**：

$$
\begin{bmatrix} 1 & 1 \\ 1 & 1.0001 \end{bmatrix}\!\begin{bmatrix} x_1 \\ x_2 \end{bmatrix} = \begin{bmatrix} 2 \\ 2 \end{bmatrix}\ \Rightarrow\ \mathbf{x} = (2,0)^{\mathrm{T}}
$$

将常数项第 2 分量改为 $2.0001$（相对变化 $10^{-4}$）：

$$ \mathbf{x}+\delta\mathbf{x} = (1,1)^{\mathrm{T}} $$

——解的变化极大。这种方程组称为**病态方程组**。

#### 6.2 病态方程组

**定义 7.7**：若 $\mathbf{A}$ 或 $\mathbf{b}$ 微小变化引起 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 解的巨大变化，则称为**病态方程组**，$\mathbf{A}$ 为**病态矩阵**。

#### 6.3 误差影响的定量分析

**情形 1**：$\mathbf{A}$ 精确，$\mathbf{b}$ 有扰动 $\delta\mathbf{b}$：

$$ \mathbf{A}(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b} + \delta\mathbf{b} \Rightarrow \delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b} $$

> **定理 7.19**：
>
> $$ \dfrac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \le \|\mathbf{A}^{-1}\|\,\|\mathbf{A}\| \cdot \dfrac{\|\delta\mathbf{b}\|}{\|\mathbf{b}\|} $$

**情形 2**：$\mathbf{b}$ 精确，$\mathbf{A}$ 有扰动 $\delta\mathbf{A}$：由 $(\mathbf{A}+\delta\mathbf{A})(\mathbf{x}+\delta\mathbf{x}) = \mathbf{b}$，得 $(\mathbf{A}+\delta\mathbf{A})\delta\mathbf{x} = -\delta\mathbf{A}\cdot\mathbf{x}$。注意 $\mathbf{A}+\delta\mathbf{A} = \mathbf{A}(\mathbf{I}+\mathbf{A}^{-1}\delta\mathbf{A})$，当 $\|\mathbf{A}^{-1}\delta\mathbf{A}\| < 1$ 时由定理 7.18 可逆。

> **定理 7.20**：若 $\|\mathbf{A}^{-1}\|\|\delta\mathbf{A}\| < 1$，则
>
> $$ \dfrac{\|\delta\mathbf{x}\|}{\|\mathbf{x}\|} \le \dfrac{\|\mathbf{A}^{-1}\|\|\mathbf{A}\|\cdot\|\delta\mathbf{A}\|/\|\mathbf{A}\|}{1 - \|\mathbf{A}^{-1}\|\|\mathbf{A}\|\cdot\|\delta\mathbf{A}\|/\|\mathbf{A}\|} $$

#### 6.4 条件数

**定义 7.8**：

$$ \boxed{\mathrm{cond}(\mathbf{A})_v = \|\mathbf{A}^{-1}\|_v\,\|\mathbf{A}\|_v,\quad v = 1,2,\infty} $$

刻画 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 的病态程度。

**常用**：

- $\mathrm{cond}(\mathbf{A})_\infty = \|\mathbf{A}^{-1}\|_\infty \|\mathbf{A}\|_\infty$
- **谱条件数**：$\mathrm{cond}(\mathbf{A})_2 = \sqrt{\lambda_{\max}(\mathbf{A}^{\mathrm{T}}\mathbf{A})/\lambda_{\min}(\mathbf{A}^{\mathrm{T}}\mathbf{A})^{}}^{}$
- 对称阵：$\mathrm{cond}(\mathbf{A})_2 = |\lambda_1|/|\lambda_n|$

**性质**：

- $\mathrm{cond}(\mathbf{A})_v \ge 1$（因 $\|\mathbf{A}^{-1}\|\|\mathbf{A}\| \ge \|\mathbf{A}^{-1}\mathbf{A}\| = 1$）
- $\mathrm{cond}(c\mathbf{A}) = \mathrm{cond}(\mathbf{A})$
- 正交阵 $\mathbf{A}$：$\mathrm{cond}(\mathbf{A})_2 = 1$
- 正交 $\mathbf{R}$：$\mathrm{cond}(\mathbf{R}\mathbf{A})_2 = \mathrm{cond}(\mathbf{A}\mathbf{R})_2 = \mathrm{cond}(\mathbf{A})_2$

#### 6.5 Hilbert 矩阵（Example 7.9）

**例 7.9**：

$$ \mathbf{H}_n = \left[\dfrac{1}{i+j-1}\right]_{i,j=1}^n $$

对 $\mathbf{H}_3$：

$$
\mathbf{H}_3 = \begin{bmatrix} 1 & 1/2 & 1/3 \\ 1/2 & 1/3 & 1/4 \\ 1/3 & 1/4 & 1/5 \end{bmatrix},\
\mathbf{H}_3^{-1} = \begin{bmatrix} 9 & -36 & 30 \\ -36 & 192 & -180 \\ 30 & -180 & 180 \end{bmatrix}
$$

$\|\mathbf{H}_3\|_\infty = 11/6$，$\|\mathbf{H}_3^{-1}\|_\infty = 408$，故 $\mathrm{cond}(\mathbf{H}_3)_\infty = 748$；$\mathrm{cond}(\mathbf{H}_6)_\infty \approx 2.9\times 10^7$，阶数越大越病态。

实例：$\mathbf{H}_3\mathbf{x} = (11/6, 13/12, 47/60)^{\mathrm{T}}$ 精确解 $\mathbf{x} = (1,1,1)^{\mathrm{T}}$；将 $\mathbf{H}_3,\mathbf{b}$ 取三位有效数字（相对误差 $< 0.2\%$）后解 $(1.090,0.488,1.491)^{\mathrm{T}}$，相对误差 $\approx 51.2\%$。

#### 6.6 病态矩阵的实用判别

直接算 $\mathrm{cond}(\mathbf{A})$ 难，常用启发式：

1. **小主元**：选主元三角分解中出现小主元，大多 $\mathbf{A}$ 是病态的
2. **特征值比**：$|\lambda_1|/|\lambda_n|$ 大时病态（因 $\mathrm{cond}(\mathbf{A})_2 \ge |\lambda_1|/|\lambda_n|$）
3. **行列式相对小**或某些行近似线性相关
4. **元素数量级悬殊** 且无规律

病态问题通常**不能**通过选主元素的消去法解决。

#### 6.7 病态问题的求解

- **高精度算术**（双倍字长）
- **预处理**：求解 $\mathbf{P}\mathbf{A}\mathbf{Q}\mathbf{y} = \mathbf{P}\mathbf{b}$，$\mathbf{y} = \mathbf{Q}^{-1}\mathbf{x}$，选 $\mathbf{P},\mathbf{Q}$ 使 $\mathrm{cond}(\mathbf{P}\mathbf{A}\mathbf{Q}) < \mathrm{cond}(\mathbf{A})$
- **行/列比例缩放**：当 $\mathbf{A}$ 元素大小不均时引入比例因子

**例 7.10**：

$$
\mathbf{A} = \begin{bmatrix} 1 & 10^9 \\ 1 & 1 \end{bmatrix},\quad \mathrm{cond}(\mathbf{A})_\infty \approx 10^9
$$

直接列主元消去（三位数字）得错解 $x_1 = 0,\ x_2 = 1$。给第 1 行除以 $s_1 = 10^9$：

$$
\mathbf{A}' = \begin{bmatrix} 10^{-9} & 1 \\ 1 & 1 \end{bmatrix},\quad \mathrm{cond}(\mathbf{A}')_\infty \approx 1
$$

列主元消去得 $\mathbf{x} = (1,1)^{\mathrm{T}}$（正确）。

#### 6.8 事后误差估计

> **定理 7.21**：设 $\mathbf{A}$ 非奇异，$\mathbf{A}\mathbf{x} = \mathbf{b}\ne\mathbf{0}$，$\tilde{\mathbf{x}}$ 为近似解，$\mathbf{r} = \mathbf{b} - \mathbf{A}\tilde{\mathbf{x}}$，则
>
> $$ \dfrac{\|\mathbf{x} - \tilde{\mathbf{x}}\|}{\|\mathbf{x}\|} \le \mathrm{cond}(\mathbf{A}) \cdot \dfrac{\|\mathbf{r}\|}{\|\mathbf{b}\|} $$

由 $\mathbf{A}(\mathbf{x} - \tilde{\mathbf{x}}) = \mathbf{r}$ 得 $\|\mathbf{x}-\tilde{\mathbf{x}}\| \le \|\mathbf{A}^{-1}\|\|\mathbf{r}\|$；又 $\|\mathbf{b}\| \le \|\mathbf{A}\|\|\mathbf{x}\|$，两式合并即得。

#### 6.9 舍入误差与向后误差分析

复杂计算中浮点舍入误差可能积累。Wilkinson 提出**向后误差分析**：把舍入误差对解的影响视作"原始数据扰动"。即 $\tilde{\mathbf{x}}$ 为扰动方程组 $(\mathbf{A}+\delta\mathbf{A})\tilde{\mathbf{x}} = \mathbf{b}$ 的精确解。可证 $\tilde{\mathbf{x}}$ 的相对误差限依赖于 $\mathrm{cond}(\mathbf{A})_\infty$、元素增长因子、阶数、机器字长等。

---

### 第七章 总结

**7.1 Gauss 消去法**：消元过程、回代过程、能成功的充分条件、矩阵描述、LU 分解、计算量

**7.2 Gauss 主元素消去法**：完全主元、列主元、列主元的三角分解定理、Gauss-Jordan、矩阵求逆

**7.3 Gauss 消去法的变形**：Doolittle、选主元的三角分解、平方根法、Cholesky、改进的 $\mathbf{L}\mathbf{D}\mathbf{L}^{\mathrm{T}}$、追赶法

**7.4 向量和矩阵的范数**：内积与 Euclid 范数、向量范数、连续性、等价性、矩阵范数、算子范数、谱半径

**7.5 误差分析**：病态方程组、误差分析、条件数、Hilbert 矩阵、舍入误差

**作业**：第七章 第 1、8、14、18 题

---

## 八.解线性方程组的迭代法

### 1. 引言

考虑线性方程组（$\mathbf{A}$ 非奇异）

$$ \mathbf{A}\mathbf{x} = \mathbf{b} $$

- 当 $\mathbf{A}$ 为**低阶稠密矩阵**时，第 7 章的主元素消去法是有效方法
- 对于工程中产生的**大型稀疏矩阵**方程组（$n$ 很大，零元素居多，如 $n \ge 10^5$），迭代法更合适
- 迭代法��充分利用 $\mathbf{A}$ 中大量零元素的特点，在内存与运算量上都受益

**操作思想**：将 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 改写为 $\mathbf{x} = f(\mathbf{A},\mathbf{b},\mathbf{x})$ 形式。

#### 1.1 迭代法引例

**例 8.1**：求解

$$
\begin{cases} 8x_1 - 3x_2 + 2x_3 = 20 \\ 4x_1 + 11x_2 - x_3 = 33 \\ 6x_1 + 3x_2 + 12x_3 = 36 \end{cases} 
$$

精确解 $\mathbf{x}^* = (3,2,1)^{\mathrm{T}}$。将每个方程对对角元归一并移项：

$$
\begin{cases} x_1 = (3x_2 - 2x_3 + 20)/8 \\ x_2 = (-4x_1 + x_3 + 33)/11 \\ x_3 = (-6x_1 - 3x_2 + 36)/12 \end{cases} 
$$

即 $\mathbf{x} = \mathbf{B}_0\mathbf{x} + \mathbf{f}$，其中

$$
\mathbf{B}_0 = \begin{bmatrix} 0 & 3/8 & -2/8 \\ -4/11 & 0 & 1/11 \\ -6/12 & -3/12 & 0 \end{bmatrix},\quad \mathbf{f} = \begin{bmatrix} 20/8 \\ 33/11 \\ 36/12 \end{bmatrix}
$$

取初值 $\mathbf{x}^{(0)} = (0,0,0)^{\mathrm{T}}$，建立迭代

$$
\begin{cases} x_1^{(k+1)} = (3x_2^{(k)} - 2x_3^{(k)} + 20)/8 \\ x_2^{(k+1)} = (-4x_1^{(k)} + x_3^{(k)} + 33)/11 \\ x_3^{(k+1)} = (-6x_1^{(k)} - 3x_2^{(k)} + 36)/12 \end{cases} 
$$

矩阵形式 $\mathbf{x}^{(k+1)} = \mathbf{B}_0\mathbf{x}^{(k)} + \mathbf{f}$，$k = 0,1,2,\ldots$。

迭代到第 10 次：$\mathbf{x}^{(10)} = (3.000032, 1.999838, 0.9998813)^{\mathrm{T}}$，$\|\boldsymbol\varepsilon^{(10)}\|_\infty = 0.000187$。

**关键问题**：迭代序列 $\{\mathbf{x}^{(k)}\}$ 是否一定收敛于 $\mathbf{x}^*$？答：不一定。反例：$x_1 = 2x_2 + 5,\ x_2 = 3x_1 + 5$ 迭代发散。

#### 1.2 迭代法的收敛性定义

> **定义 8.1**：对给定的方程组 $\mathbf{x} = \mathbf{B}\mathbf{x} + \mathbf{f}$，用
>
> $$ \mathbf{x}^{(k+1)} = \mathbf{B}\mathbf{x}^{(k)} + \mathbf{f},\quad k = 0,1,2,\ldots $$
>
> 逐步求近似解的方法称为**迭代法**（亦称一阶定常迭代法，$\mathbf{B}$ 与 $k$ 无关）。若 $\lim_{k\to\infty}\mathbf{x}^{(k)} = \mathbf{x}^*$ 存在，称此迭代法**收敛**；否则称**发散**。

引入误差向量 $\boldsymbol\varepsilon^{(k)} = \mathbf{x}^{(k)} - \mathbf{x}^*$。由

$$ \mathbf{x}^* = \mathbf{B}\mathbf{x}^* + \mathbf{f},\quad \mathbf{x}^{(k+1)} = \mathbf{B}\mathbf{x}^{(k)} + \mathbf{f} $$

两式相减：

$$ \boxed{\boldsymbol\varepsilon^{(k+1)} = \mathbf{B}\boldsymbol\varepsilon^{(k)} = \cdots = \mathbf{B}^{k+1}\boldsymbol\varepsilon^{(0)}} $$

故收敛性归结为：$\mathbf{B}^k \to \mathbf{O}$（$k\to\infty$）的条件。

---

### 2. Jacobi 迭代法

设方程组 $\mathbf{A}\mathbf{x} = \mathbf{b}$（$\mathbf{A}$ 非奇异，$a_{ii}\ne 0$）：

$$ \sum_{j=1}^n a_{ij}x_j = b_i,\quad i = 1,2,\ldots,n $$

将 $\mathbf{A}$ 分解为 $\mathbf{A} = \mathbf{D} - \mathbf{L} - \mathbf{U}$：

$$
\mathbf{D} = \begin{bmatrix} a_{11} \\ & a_{22} \\ & & \ddots \\ & & & a_{nn} \end{bmatrix},\
-\mathbf{L} = \begin{bmatrix} 0 & & & \\ a_{21} & 0 & & \\ \vdots & \ddots & \ddots & \\ a_{n1} & \cdots & a_{n,n-1} & 0 \end{bmatrix},\
-\mathbf{U} = \begin{bmatrix} 0 & a_{12} & \cdots & a_{1n} \\ & 0 & \cdots & a_{2n} \\ & & \ddots & \vdots \\ & & & 0 \end{bmatrix}
$$

第 $i$ 个方程用 $a_{ii}$ 除并移项：

$$ x_i = \dfrac{1}{a_{ii}}\bigg(b_i - \sum_{j=1,j\ne i}^n a_{ij}x_j\bigg),\quad i = 1,\ldots,n $$

即 $\mathbf{x} = \mathbf{B}_0\mathbf{x} + \mathbf{f}$，其中

$$ \mathbf{B}_0 = \mathbf{I} - \mathbf{D}^{-1}\mathbf{A} = \mathbf{D}^{-1}(\mathbf{L} + \mathbf{U}),\quad \mathbf{f} = \mathbf{D}^{-1}\mathbf{b} $$

#### Jacobi 迭代公式

$$
\begin{cases}
\mathbf{x}^{(0)} = (x_1^{(0)},x_2^{(0)},\ldots,x_n^{(0)})^{\mathrm{T}}\ (\text{初始向量}) \\
x_i^{(k+1)} = \dfrac{1}{a_{ii}}\bigg(b_i - \sum_{j=1,j\ne i}^n a_{ij}x_j^{(k)}\bigg)
\end{cases} 
$$

矩阵形式：

$$ \boxed{\mathbf{x}^{(k+1)} = \mathbf{B}_0\mathbf{x}^{(k)} + \mathbf{f}} $$

$\mathbf{B}_0$ 称为 **Jacobi 方法迭代矩阵**。

**讨论**：每步只需一次"矩阵-向量乘法"；用计算机实现时需要**两组工作单元**（保存 $\mathbf{x}^{(k)}$ 与 $\mathbf{x}^{(k+1)}$）。

---

### 3. Gauss-Seidel 迭代法

Jacobi 迭代中，计算 $x_i^{(k+1)}$ 时**仅用** $\mathbf{x}^{(k)}$ 的全部分量；但此时新值 $x_1^{(k+1)},\ldots,x_{i-1}^{(k+1)}$ 已经算出且更"新"。若立即采用新值，便得到 **Gauss-Seidel 迭代法**（简称 G-S）。

#### Gauss-Seidel 迭代公式

$$
\begin{cases}
\mathbf{x}^{(0)} = (x_1^{(0)},\ldots,x_n^{(0)})^{\mathrm{T}}\ (\text{初始向量}) \\
x_i^{(k+1)} = \dfrac{1}{a_{ii}}\bigg(b_i - \sum_{j=1}^{i-1} a_{ij}x_j^{(k+1)} - \sum_{j=i+1}^n a_{ij}x_j^{(k)}\bigg)
\end{cases} 
$$

也可写为"增量"形式 $x_i^{(k+1)} = x_i^{(k)} + \Delta x_i$，其中

$$ \Delta x_i = \dfrac{1}{a_{ii}}\bigg(b_i - \sum_{j=1}^{i-1}a_{ij}x_j^{(k+1)} - \sum_{j=i}^n a_{ij}x_j^{(k)}\bigg) $$

#### 矩阵形式

从 $\mathbf{D}\mathbf{x}^{(k+1)} = \mathbf{b} + \mathbf{L}\mathbf{x}^{(k+1)} + \mathbf{U}\mathbf{x}^{(k)}$ 出发：

$$ (\mathbf{D} - \mathbf{L})\mathbf{x}^{(k+1)} = \mathbf{b} + \mathbf{U}\mathbf{x}^{(k)} $$

设 $\mathbf{D} - \mathbf{L}$ 可逆：

$$ \boxed{\mathbf{x}^{(k+1)} = \mathbf{G}\mathbf{x}^{(k)} + \mathbf{f}} $$

其中

$$ \mathbf{G} = (\mathbf{D} - \mathbf{L})^{-1}\mathbf{U},\quad \mathbf{f} = (\mathbf{D} - \mathbf{L})^{-1}\mathbf{b} $$

$\mathbf{G}$ 称为 **Gauss-Seidel 迭代矩阵**。

**优点**：实现时只需**一组**工作单元；每步仍只需一次矩阵-向量乘。

#### 对比 Jacobi vs Gauss-Seidel

| 方法 | 更新规则 | 矩阵形式 | 工作单元 |
|---|---|---|---|
| Jacobi | $\mathbf{D}\mathbf{x}^{(k+1)} = (\mathbf{L}+\mathbf{U})\mathbf{x}^{(k)} + \mathbf{b}$ | $\mathbf{B}_0 = \mathbf{D}^{-1}(\mathbf{L}+\mathbf{U})$ | 两组 |
| Gauss-Seidel | $(\mathbf{D}-\mathbf{L})\mathbf{x}^{(k+1)} = \mathbf{U}\mathbf{x}^{(k)} + \mathbf{b}$ | $\mathbf{G} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$ | 一组 |

#### 例 8.2

对例 8.1 用 G-S，取 $\mathbf{x}^{(0)} = \mathbf{0}$：

$$
\begin{cases} x_1^{(k+1)} = (20 + 3x_2^{(k)} - 2x_3^{(k)})/8 \\ x_2^{(k+1)} = (33 - 4x_1^{(k+1)} + x_3^{(k)})/11 \\ x_3^{(k+1)} = (36 - 6x_1^{(k+1)} - 3x_2^{(k+1)})/12 \end{cases}
$$

第 5 次迭代：$\mathbf{x}^{(5)} = (2.999843, 2.000072, 1.000061)^{\mathrm{T}}$，$\|\boldsymbol\varepsilon^{(5)}\|_\infty = 0.00157$。

**注意**：一般情况 G-S 收敛比 Jacobi 快，但**不绝对**。例 8.3：

$$ \begin{cases} x_1 + 2x_2 - 2x_3 = 1 \\ x_1 + x_2 + x_3 = 1 \\ 2x_1 + 2x_2 + x_3 = 1 \end{cases} $$

此例 Jacobi 收敛而 G-S 发散。

---

### 4. 迭代法的收敛性

#### 4.1 矩阵收敛

> **定义 8.2**：设矩阵序列 $\mathbf{A}_k = (a_{ij}^{(k)})_{n\times n}$ 及 $\mathbf{A} = (a_{ij})_{n\times n}$。若
>
> $$ \lim_{k\to\infty} a_{ij}^{(k)} = a_{ij},\quad i,j = 1,\ldots,n $$
>
> 则称 $\{\mathbf{A}_k\}$ **收敛**于 $\mathbf{A}$，记 $\lim_{k\to\infty}\mathbf{A}_k = \mathbf{A}$。

**例 8.4**：

$$
\mathbf{A} = \begin{bmatrix} \lambda & 1 \\ 0 & \lambda \end{bmatrix},\
\mathbf{A}^k = \begin{bmatrix} \lambda^k & k\lambda^{k-1} \\ 0 & \lambda^k \end{bmatrix}
$$

当 $|\lambda| < 1$ 时 $\mathbf{A}^k \to \mathbf{O}$。

> **定理 8.1**：$\lim_{k\to\infty}\mathbf{A}_k = \mathbf{A}$ 的充要条件是 $\|\mathbf{A}_k - \mathbf{A}\| \to 0$（$k\to\infty$）。

> **定理 8.2**：$\mathbf{B}^k \to \mathbf{O}$（$k\to\infty$）的充要条件是 **谱半径** $\rho(\mathbf{B}) < 1$。

**证明思路**：由 Jordan 标准形 $\mathbf{P}^{-1}\mathbf{B}\mathbf{P} = \mathbf{J} = \mathrm{diag}(\mathbf{J}_1,\ldots,\mathbf{J}_r)$，

$$ \mathbf{B}^k = \mathbf{P}\mathbf{J}^k\mathbf{P}^{-1} $$

故 $\mathbf{B}^k \to \mathbf{O} \iff \mathbf{J}_i^k \to \mathbf{O}$。对每个 Jordan 块 $\mathbf{J}_i = \lambda_i\mathbf{I} + \mathbf{E}_{t_i}$（$\mathbf{E}_{t_i}$ 为上对角元为 1 的幂零阵，$\mathbf{E}_{t_i}^k = \mathbf{O}$ 当 $k \ge t_i$），用二项展开：

$$ \mathbf{J}_i^k = \sum_{j=0}^{t_i-1}\binom{k}{j}\lambda_i^{k-j}\mathbf{E}_{t_i}^j $$

而 $\binom{k}{j}\lambda_i^{k-j} \to 0$（$k\to\infty$）的充要条件是 $|\lambda_i| < 1$，即 $\rho(\mathbf{B}) < 1$。

#### 4.2 迭代法基本定理

> **定理 8.3**（基本定理）：对方程组 $\mathbf{x} = \mathbf{B}\mathbf{x} + \mathbf{f}$ 及任意初始向量 $\mathbf{x}^{(0)}$ 与任意 $\mathbf{f}$，迭代法 $\mathbf{x}^{(k+1)} = \mathbf{B}\mathbf{x}^{(k)} + \mathbf{f}$ **收敛的充要条件是 $\rho(\mathbf{B}) < 1$**。

**充分性**：若 $\rho(\mathbf{B}) < 1$，则 $\mathbf{I} - \mathbf{B}$ 非奇异（定理 7.18），故 $(\mathbf{I}-\mathbf{B})\mathbf{x} = \mathbf{f}$ 有唯一解 $\mathbf{x}^*$；$\boldsymbol\varepsilon^{(k)} = \mathbf{B}^k\boldsymbol\varepsilon^{(0)} \to \mathbf{0}$。

**必要性**：若对任意 $\mathbf{x}^{(0)},\mathbf{f}$ 序列收敛，则 $\boldsymbol\varepsilon^{(k)} = \mathbf{B}^k\boldsymbol\varepsilon^{(0)} \to \mathbf{0}$，由 $\boldsymbol\varepsilon^{(0)}$ 的任意性 $\mathbf{B}^k\to\mathbf{O}$，由定理 8.2 得 $\rho(\mathbf{B}) < 1$。

**例 8.5**：例 8.1 的 Jacobi 迭代矩阵 $\mathbf{B}_0$ 特征方程

$$ \lambda^3 + 0.034090909\lambda + 0.039772727 = 0 $$

三个根 $\lambda_1 = -0.3082,\ \lambda_{2,3} = 0.1541 \pm 0.3245\mathrm{i}$，$|\lambda_2| = |\lambda_3| = 0.3592 < 1$，故 Jacobi 收敛。

**例 8.6**：

$$ \mathbf{B} = \begin{bmatrix} 0 & 2 \\ 3 & 0 \end{bmatrix},\quad \lambda^2 - 6 = 0,\quad \lambda = \pm\sqrt{6}^{} $$

$\rho(\mathbf{B}) > 1$，发散。

#### 4.3 收敛速度

考察误差 $\boldsymbol\varepsilon^{(k)} = \mathbf{B}^k\boldsymbol\varepsilon^{(0)}$。设 $\mathbf{B}$ 有 $n$ 个线性无关特征向量 $\mathbf{u}_i$，$\boldsymbol\varepsilon^{(0)} = \sum a_i\mathbf{u}_i$，则

$$ \boldsymbol\varepsilon^{(k)} = \sum_{i=1}^n a_i\lambda_i^k\mathbf{u}_i $$

$\rho(\mathbf{B})$ 越小，$\boldsymbol\varepsilon^{(k)} \to \mathbf{0}$ 越快。要使 $[\rho(\mathbf{B})]^k \le 10^{-s}$，需

$$ k \ge \dfrac{s\ln 10}{-\ln \rho(\mathbf{B})} $$

> **定义 8.3**：$R(\mathbf{B}) = -\ln\rho(\mathbf{B})$ 称为迭代法的**收敛速度**。

#### 4.4 用范数判别收敛

谱半径计算难，常用 $\rho(\mathbf{B}) \le \|\mathbf{B}\|_v$（$v = 1,2,\infty$ 或 $F$）作上界估计。

> **定理 8.4**：若迭代矩阵的某一范数 $\|\mathbf{B}\|_v = q < 1$，则：
>
> 1. 迭代法**收敛**
> 2. $\|\mathbf{x}^* - \mathbf{x}^{(k)}\|_v \le \dfrac{q}{1-q}\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\|_v$
> 3. $\|\mathbf{x}^* - \mathbf{x}^{(k)}\|_v \le \dfrac{q^k}{1-q}\|\mathbf{x}^{(1)} - \mathbf{x}^{(0)}\|_v$

**证明要点**：由 $\mathbf{x}^* - \mathbf{x}^{(k+1)} = \mathbf{B}(\mathbf{x}^* - \mathbf{x}^{(k)})$ 得 $\|\mathbf{x}^* - \mathbf{x}^{(k+1)}\| \le q\|\mathbf{x}^* - \mathbf{x}^{(k)}\|$（8.3.6）；又 $\mathbf{x}^{(k+1)} - \mathbf{x}^{(k)} = \mathbf{B}(\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)})$（8.3.5）；并

$$ \|\mathbf{x}^{(k+1)} - \mathbf{x}^{(k)}\| \ge \|\mathbf{x}^* - \mathbf{x}^{(k)}\| - \|\mathbf{x}^* - \mathbf{x}^{(k+1)}\| \ge (1-q)\|\mathbf{x}^* - \mathbf{x}^{(k)}\| $$

合并得结论 2；递推得结论 3。

**例 8.7**：例 8.1 的 $\|\mathbf{B}_0\|_\infty = \max(5/8, 5/11, 9/12) = 9/12 < 1$，故 Jacobi 收敛。

**例 8.8**：

$$ \mathbf{B} = \begin{bmatrix} 0.9 & 0 \\ 0.3 & 0.8 \end{bmatrix} $$

$\|\mathbf{B}\|_\infty = 1.1,\ \|\mathbf{B}\|_1 = 1.2$ 均 $\ge 1$，但特征值 $\lambda_1 = 0.9,\ \lambda_2 = 0.8$，$\rho(\mathbf{B}) = 0.9 < 1$，仍收敛。**$\|\mathbf{B}\|_v < 1$ 是充分而非必要**。

#### 4.5 终止判据

实际计算用 $\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\|_v < \varepsilon_0$ 作终止条件：

$$ \|\mathbf{x}^* - \mathbf{x}^{(k)}\|_v \le \dfrac{q}{1-q}\|\mathbf{x}^{(k)} - \mathbf{x}^{(k-1)}\|_v \le \dfrac{q}{1-q}\varepsilon_0 $$

**警告**：当 $q \approx 1$ 时 $\dfrac{q}{1-q}$ 很大，即使相邻迭代差很小，真误差仍可能大。

#### 4.6 Gauss-Seidel 收敛性

> **定理 8.5**：解 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 的 Gauss-Seidel 法收敛的充要条件是 $\rho(\mathbf{G}) < 1$，$\mathbf{G} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$。

#### 4.7 特殊矩阵的判别

实际中常用矩阵结构性质代替谱半径计算。

> **定义 8.4**（对角占优阵）：$\mathbf{A} = (a_{ij}) \in \mathbb{R}^{n\times n}$。
>
> - **严格对角占优**：$|a_{ii}| > \sum_{j\ne i}|a_{ij}|$，$i = 1,\ldots,n$
> - **弱对角占优**：$|a_{ii}| \ge \sum_{j\ne i}|a_{ij}|$ 且至少一处严格成立

**例 8.9**：

$$ \mathbf{A} = \begin{bmatrix} -4 & 1 & 0 & 0 \\ 1 & -4 & 1 & 0 \\ 0 & 1 & -4 & 1 \\ 0 & 0 & 1 & -4 \end{bmatrix}\ \text{严格对角占优} $$

$$ \mathbf{B} = \begin{bmatrix} 1 & 1 & 0 \\ 1 & 1 & 0 \\ 0 & 1 & 2 \end{bmatrix}\ \text{弱对角占优} $$

> **定义 8.5**（可约 / 不可约）：当 $n \ge 2$，若存在 $n$ 阶置换阵 $\mathbf{P}$ 使
>
> $$ \mathbf{P}^{\mathrm{T}}\mathbf{A}\mathbf{P} = \begin{bmatrix} \mathbf{A}_{11} & \mathbf{A}_{12} \\ \mathbf{0} & \mathbf{A}_{22} \end{bmatrix} $$
>
> 其中 $\mathbf{A}_{11}$ 为 $r$ 阶子阵，$\mathbf{A}_{22}$ 为 $n-r$ 阶子阵（$1 \le r < n$），则 $\mathbf{A}$ **可约**；否则**不可约**。

可约意味着 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 可化为两个低阶方程组：

$$ \begin{cases} \mathbf{A}_{11}\mathbf{y}_1 + \mathbf{A}_{12}\mathbf{y}_2 = \mathbf{d}_1 \\ \mathbf{A}_{22}\mathbf{y}_2 = \mathbf{d}_2 \end{cases} $$

**例 8.10**：例 8.9 的 $\mathbf{B}$ 可约（取 $\mathbf{P} = \mathbf{I}_{13}$，把第 1、3 行列对换）：

$$ \mathbf{P}^{\mathrm{T}}\mathbf{B}\mathbf{P} = \begin{bmatrix} 2 & 1 & 0 \\ 0 & 1 & 1 \\ 0 & 1 & 1 \end{bmatrix} $$

> **定理 8.6**：若 $\mathbf{A}$ 为**严格对角占优阵**或**不可约弱对角占优阵**，则 $\mathbf{A}$ 非奇异。

**证明（严格对角占优情形）**：反证。设 $\det\mathbf{A} = 0$，则 $\mathbf{A}\mathbf{x} = \mathbf{0}$ 有非零解 $\mathbf{x}$。取 $|x_k| = \max_i|x_i| > 0$，由第 $k$ 个方程

$$ |a_{kk}||x_k| = \bigg|\sum_{j\ne k} a_{kj}x_j\bigg| \le |x_k|\sum_{j\ne k}|a_{kj}| $$

得 $|a_{kk}| \le \sum_{j\ne k}|a_{kj}|$，矛盾。

> **定理 8.7**：若 $\mathbf{A}$ 为严格对角占优阵或不可约弱对角占优阵，则对任意 $\mathbf{x}^{(0)}$，Jacobi 法与 Gauss-Seidel 法均收敛。

**G-S 收敛性证明大意**：迭代矩阵 $\mathbf{G} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$ 的特征值满足

$$ \det(\lambda(\mathbf{D}-\mathbf{L}) - \mathbf{U}) = 0 $$

记 $\mathbf{C} = \lambda(\mathbf{D}-\mathbf{L}) - \mathbf{U}$，反证当 $|\lambda| \ge 1$ 时 $\det\mathbf{C} \ne 0$：

$$ c_{ii} = \lambda a_{ii},\quad c_{ij} = \begin{cases} \lambda a_{ij}, & j < i \\ a_{ij}, & j > i \end{cases} $$

$$ |c_{ii}| = |\lambda||a_{ii}| \ge \sum_{j<i}|\lambda||a_{ij}| + \sum_{j>i}|a_{ij}| \ge \sum_{j\ne i}|c_{ij}| $$

且不等式至少一处严格（弱对角占优）。$\mathbf{A}$ 不可约 $\Rightarrow$ $\mathbf{C}$ 不可约。由定理 8.6，$\det\mathbf{C} \ne 0$，矛盾。

---

### 5. 解线性方程组的超松弛迭代法（SOR）

**逐次超松弛迭代法**（Successive Over Relaxation，SOR）：

- Gauss-Seidel 的加速版本
- 求解大型稀疏方程组的有效方法
- 计算公式简单、内存占用少
- **关键**：需选择好的松弛因子 $\omega$（**最佳松弛因子**）

#### 5.1 SOR 公式

设 $\mathbf{A}\mathbf{x} = \mathbf{b}$，$a_{ii}\ne 0$。先用 G-S 算辅助量

$$ \tilde{x}_i^{(k+1)} = \dfrac{1}{a_{ii}}\bigg(b_i - \sum_{j=1}^{i-1}a_{ij}x_j^{(k+1)} - \sum_{j=i+1}^n a_{ij}x_j^{(k)}\bigg) $$

再取 $x_i^{(k)}$ 与 $\tilde{x}_i^{(k+1)}$ 的加权平均：

$$ x_i^{(k+1)} = (1-\omega)x_i^{(k)} + \omega\tilde{x}_i^{(k+1)} = x_i^{(k)} + \omega(\tilde{x}_i^{(k+1)} - x_i^{(k)}) $$

合并得 **SOR 公式**：

$$ \boxed{x_i^{(k+1)} = x_i^{(k)} + \dfrac{\omega}{a_{ii}}\bigg(b_i - \sum_{j=1}^{i-1}a_{ij}x_j^{(k+1)} - \sum_{j=i}^n a_{ij}x_j^{(k)}\bigg)} $$

- $\omega = 1$：还原为 Gauss-Seidel
- $\omega < 1$：**低松弛法**（用于 G-S 发散时）
- $\omega > 1$：**超松弛法**（加速 G-S）

终止判据：$p_0 = \max_i|\Delta x_i| = \max_i|x_i^{(k+1)} - x_i^{(k)}| < \varepsilon$。

#### 5.2 SOR 例子

**例 8.11**：解（精确解 $\mathbf{x}^* = (-1,-1,-1,-1)^{\mathrm{T}}$）

$$ \begin{bmatrix} -4 & 1 & 1 & 1 \\ 1 & -4 & 1 & 1 \\ 1 & 1 & -4 & 1 \\ 1 & 1 & 1 & -4 \end{bmatrix}\mathbf{x} = \begin{bmatrix} 1 \\ 1 \\ 1 \\ 1 \end{bmatrix} $$

取 $\omega = 1.3$，第 11 次迭代

$$ \mathbf{x}^{(11)} = (-0.99999646, -1.00000310, -0.99999953, -0.99999912)^{\mathrm{T}} $$

$\|\boldsymbol\varepsilon^{(11)}\|_2 \le 0.46\times 10^{-5}$。

**不同 $\omega$ 误差 $< 10^{-5}$ 所需迭代次数**：

| $\omega$ | 迭代次数 |
|---|---|
| 1.0 | 22 |
| 1.1 | 17 |
| 1.2 | 12 |
| **1.3** | **11**（最少） |
| 1.4 | 14 |
| 1.5 | 17 |
| 1.6 | 23 |
| 1.7 | 33 |
| 1.8 | 53 |
| 1.9 | 109 |

本例 $\omega = 1.3$ 为**最佳松弛因子**。

#### 5.3 SOR 矩阵形式

SOR 公式 (8.4.5) 也可写为

$$ a_{ii}x_i^{(k+1)} = (1-\omega)a_{ii}x_i^{(k)} + \omega\bigg(b_i - \sum_{j=1}^{i-1}a_{ij}x_j^{(k+1)} - \sum_{j=i+1}^n a_{ij}x_j^{(k)}\bigg) $$

用 $\mathbf{A} = \mathbf{D} - \mathbf{L} - \mathbf{U}$：

$$ \mathbf{D}\mathbf{x}^{(k+1)} = (1-\omega)\mathbf{D}\mathbf{x}^{(k)} + \omega(\mathbf{b} + \mathbf{L}\mathbf{x}^{(k+1)} + \mathbf{U}\mathbf{x}^{(k)}) $$

$$ (\mathbf{D} - \omega\mathbf{L})\mathbf{x}^{(k+1)} = ((1-\omega)\mathbf{D} + \omega\mathbf{U})\mathbf{x}^{(k)} + \omega\mathbf{b} $$

由 $a_{ii}\ne 0$ 知 $\det(\mathbf{D} - \omega\mathbf{L}) \ne 0$，故

$$ \boxed{\mathbf{x}^{(k+1)} = \mathbf{L}_\omega\mathbf{x}^{(k)} + \mathbf{f}} $$

其中

$$ \mathbf{L}_\omega = (\mathbf{D} - \omega\mathbf{L})^{-1}((1-\omega)\mathbf{D} + \omega\mathbf{U}),\quad \mathbf{f} = \omega(\mathbf{D} - \omega\mathbf{L})^{-1}\mathbf{b} $$

$\mathbf{L}_\omega$ 称为 **SOR 迭代矩阵**。

#### 5.4 SOR 收敛性

> **定理 8.8**：设 $\mathbf{A}\mathbf{x} = \mathbf{b}$ 中 $a_{ii}\ne 0$，则 SOR 收敛的充要条件是 $\rho(\mathbf{L}_\omega) < 1$。

> **定理 8.9**（必要条件）：若 SOR 收敛，则 $0 < \omega < 2$。

**证明**：由 $\rho(\mathbf{L}_\omega) < 1$，设特征值 $\lambda_1,\ldots,\lambda_n$，则

$$ |\det\mathbf{L}_\omega| = |\lambda_1\cdots\lambda_n| \le \rho(\mathbf{L}_\omega)^n \Rightarrow |\det\mathbf{L}_\omega|^{1/n} \le \rho(\mathbf{L}_\omega) < 1 $$

又

$$ \det\mathbf{L}_\omega = \det(\mathbf{D}-\omega\mathbf{L})^{-1}\cdot\det((1-\omega)\mathbf{D} + \omega\mathbf{U}) = \dfrac{(1-\omega)^n\prod a_{ii}}{\prod a_{ii}} = (1-\omega)^n $$

故 $|1-\omega| < 1 \iff 0 < \omega < 2$。

> **定理 8.10**（充分条件）：若 $\mathbf{A}$ 为**对称正定矩阵**，且 $0 < \omega < 2$，则 SOR 收敛。

#### 5.5 最佳松弛因子

Young（1950）针对椭圆型 PDE 离散得到的代数方程组给出公式：

$$ \boxed{\omega_{\mathrm{opt}} = \dfrac{2}{1 + \sqrt{1 - \rho^2(\mathbf{B}_0)}^{}}} $$

$\rho(\mathbf{B}_0)$ 为 Jacobi 迭代矩阵的谱半径。实际中 $\rho(\mathbf{B}_0)$ 难算，常通过实验确定（近似）最佳松弛因子。

#### 5.6 SOR 算法流程

对对称正定 $\mathbf{A}$，用一组数组 $x_i$ 存放迭代结果，控制条件 $p_0 = \max_i|\Delta x_i| < \varepsilon$：

1. $k \leftarrow 0$
2. $x_i \leftarrow 0$，$i = 1,\ldots,n$
3. $k \leftarrow k + 1$
4. $p_0 \leftarrow 0$
5. 对 $i = 1,\ldots,n$：
   1. $p \leftarrow \Delta x_i = \dfrac{\omega}{a_{ii}}\Big(b_i - \sum_{j=1}^{i-1}a_{ij}x_j - \sum_{j=i+1}^n a_{ij}x_j\Big)$
   2. 若 $|p| > p_0$，$p_0 \leftarrow |p|$
   3. $x_i \leftarrow x_i + p$
6. 输出 $p_0$
7. 若 $p_0 > \varepsilon$，转步 3
8. 输出 $\mathbf{x}, k$

---

### 第八章 总结

**8.1 引言**：迭代法定义、收敛 / 发散，$\boldsymbol\varepsilon^{(k+1)} = \mathbf{B}\boldsymbol\varepsilon^{(k)}$

**8.2 Jacobi 迭代法**：$\mathbf{B}_0 = \mathbf{D}^{-1}(\mathbf{L}+\mathbf{U})$，两组工作单元

**8.3 Gauss-Seidel 迭代法**：$\mathbf{G} = (\mathbf{D}-\mathbf{L})^{-1}\mathbf{U}$，一组工作单元

**8.4 收敛性**：
- 基本定理：$\rho(\mathbf{B}) < 1$ 是收敛充要条件
- 范数判据：$\|\mathbf{B}\|_v < 1$ 充分
- 收敛速度 $R(\mathbf{B}) = -\ln\rho(\mathbf{B})$
- 对角占优判据：严格 / 不可约弱对角占优 $\Rightarrow$ Jacobi、G-S 均收敛

**8.5 SOR 迭代法**：
- $\mathbf{L}_\omega = (\mathbf{D}-\omega\mathbf{L})^{-1}((1-\omega)\mathbf{D}+\omega\mathbf{U})$
- 收敛充要条件 $\rho(\mathbf{L}_\omega) < 1$
- 收敛必要条件 $0 < \omega < 2$
- 充分条件 $\mathbf{A}$ 对称正定且 $0 < \omega < 2$
- 最佳松弛因子 $\omega_{\mathrm{opt}} = \dfrac{2}{1+\sqrt{1-\rho^2(\mathbf{B}_0)}^{}}$

**作业**：第八章 第 5、10、15、19 题

---

## 九.矩阵的特征值与特征向量计算

### 1. 引言

物理、力学和工程技术中，许多问题最终归结为求解矩阵的特征值问题：

- 振动问题（桥梁振动、机械振动、电磁振荡、地震引起的建筑物振动等）
- 物理学中某些临界值的确定
- 理论物理中的若干本征问题

#### 1.1 特征多项式与特征值

**定义**：设 $\mathbf{A} = (a_{ij})_{n\times n}$，称代数方程

$$\varphi(\lambda) = \det(\lambda\mathbf{I} - \mathbf{A}) = 0 $$

为 $\mathbf{A}$ 的**特征方程**，$\varphi(\lambda)$ 称为 $\mathbf{A}$ 的**特征多项式**。展开后

$$\varphi(\lambda) = \lambda^n + c_1\lambda^{n-1} + \cdots + c_n = 0$$

它有 $n$ 个零点，称为 $\mathbf{A}$ 的**特征值**。

#### 1.2 特征向量

设 $\lambda$ 为 $\mathbf{A}$ 的特征值，齐次方程组

$$(\lambda\mathbf{I} - \mathbf{A})\mathbf{x} = \mathbf{0}$$

的非零解 $\mathbf{x}$（即 $\mathbf{A}\mathbf{x} = \lambda\mathbf{x}$ 的非零解）称为对应于 $\lambda$ 的**特征向量**。

#### 1.3 特征值的性质

> **定理 9.1**：设 $\lambda_i\ (i=1,\cdots,n)$ 是 $\mathbf{A}$ 的特征值，则
> - 矩阵的迹：$\displaystyle\sum_{i=1}^n \lambda_i = \sum_{i=1}^n a_{ii} = \mathrm{tr}(\mathbf{A})$
> - 矩阵的行列式：$\det(\mathbf{A}) = \lambda_1\lambda_2\cdots\lambda_n$

> **定理 9.2**：设 $\mathbf{A}$ 与 $\mathbf{B}$ 相似（存在非奇异 $\mathbf{T}$ 使 $\mathbf{B} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T}$），则
> - $\mathbf{A}$ 与 $\mathbf{B}$ 有相同的特征值
> - 若 $\mathbf{x}$ 是 $\mathbf{B}$ 的一个特征向量，则 $\mathbf{T}\mathbf{x}$ 是 $\mathbf{A}$ 的特征向量

**圆盘定理（Gerschgorin）**：

> **定理 9.3（Gerschgorin 定理）**：设 $\mathbf{A} = (a_{ij})_{n\times n}$，则 $\mathbf{A}$ 的每个特征值必属于下述某个圆盘
>
> $$\boxed{\;|\lambda - a_{ii}| \le \sum_{j=1,j\ne i}^n |a_{ij}|\quad (i=1,2,\ldots,n)\;}$$

**证明**：设 $\lambda$ 为 $\mathbf{A}$ 任一特征值，对应特征向量 $\mathbf{x}=(x_1,\ldots,x_n)^{\mathrm{T}}\ne\mathbf{0}$。取 $|x_i|=\max_k|x_k|>0$，由 $(\lambda\mathbf{I}-\mathbf{A})\mathbf{x}=\mathbf{0}$ 第 $i$ 个方程

$$(\lambda - a_{ii})x_i = \sum_{j\ne i} a_{ij} x_j$$

两端除以 $x_i$，结合 $|x_j/x_i|\le 1$ 即得。这说明：**若一个特征向量的第 $i$ 分量最大，则对应特征值必落在第 $i$ 个圆盘中。**

★ Insight ─────────────────────────────────────
- Gerschgorin 圆盘提供了无需求解特征方程即可定位所有特征值粗略位置的工具，常用于快速判定矩阵是否非奇异（$0$ 不在任何圆盘内即可）
- 当某些圆盘相互分离时，每个孤立圆盘恰好包含一个特征值，这是高级版 Gerschgorin 定理
- 对角占优矩阵的圆盘都不会包住原点，因此天然非奇异——这把第 8 章的结论用几何语言重述
─────────────────────────────────────────────────

#### 1.4 Rayleigh 商

**定义 9.1**：设 $\mathbf{A}$ 为 $n$ 阶实对称矩阵，对任意非零向量 $\mathbf{x}$，

$$R(\mathbf{x}) = \frac{(\mathbf{A}\mathbf{x},\mathbf{x})}{(\mathbf{x},\mathbf{x})}$$

称为对应于 $\mathbf{x}$ 的 **Rayleigh 商**。

> **定理 9.4**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 对称，特征值 $\lambda_1\ge\lambda_2\ge\cdots\ge\lambda_n$，对应的标准正交特征向量为 $\mathbf{x}_1,\ldots,\mathbf{x}_n$，则
> 1. $\lambda_n \le \dfrac{(\mathbf{A}\mathbf{x},\mathbf{x})}{(\mathbf{x},\mathbf{x})} \le \lambda_1\quad(\forall \mathbf{x}\ne\mathbf{0})$
> 2. $\lambda_1 = \displaystyle\max_{\mathbf{x}\ne\mathbf{0}} \frac{(\mathbf{A}\mathbf{x},\mathbf{x})}{(\mathbf{x},\mathbf{x})},\quad \lambda_n = \min_{\mathbf{x}\ne\mathbf{0}} \frac{(\mathbf{A}\mathbf{x},\mathbf{x})}{(\mathbf{x},\mathbf{x})}$

**证明（结论 1）**：将 $\mathbf{x}\ne\mathbf{0}$ 按特征向量基展开 $\mathbf{x} = \sum_{i=1}^n a_i\mathbf{x}_i$，则 $(\mathbf{x},\mathbf{x}) = \sum a_i^2\ne 0$，由正交性

$$\frac{(\mathbf{A}\mathbf{x},\mathbf{x})}{(\mathbf{x},\mathbf{x})} = \frac{\sum_{i=1}^n a_i^2\lambda_i}{\sum_{i=1}^n a_i^2}$$

显然该加权平均介于 $\lambda_n$ 与 $\lambda_1$ 之间。

#### 1.5 数值算法概述

求 $\mathbf{A}$ 的特征值：
- $n=2,3$ 时可直接展开行列式求 $\varphi(\lambda)=0$ 的根
- $n$ 较大时展开 $\varphi(\lambda)$ 系数再求根工作量极大且不稳定
- 必须研究专门的**数值方法**

本章介绍两类常用方法：
- **迭代法**：幂法、反幂法（针对主特征值或按模最小特征值）
- **变换法**：基于正交相似变换（Householder + QR），求出全部特征值

### 2. 幂法

#### 2.1 研究动机

工程与物理中常常**只需求按模最大的特征值**（称 $\mathbf{A}$ 的**主特征值**）及其对应特征向量，幂法就是为此设计的迭代法：
- 优点：方法简单，对稀疏矩阵尤为合适
- 缺点：收敛速度有时较慢

#### 2.2 基本幂法

设实矩阵 $\mathbf{A}=(a_{ij})_{n\times n}$ 有完全的特征向量组，特征值 $\lambda_1,\lambda_2,\ldots,\lambda_n$，对应特征向量 $\mathbf{x}_1,\ldots,\mathbf{x}_n$。设主特征值是实根，且

$$|\lambda_1| > |\lambda_2| \ge |\lambda_3| \ge \cdots \ge |\lambda_n|$$

任取非零初始向量 $\mathbf{v}_0$，由

$$\boxed{\;\mathbf{v}_k = \mathbf{A}\mathbf{v}_{k-1} = \mathbf{A}^k\mathbf{v}_0\;}$$

构造迭代向量序列 $\{\mathbf{v}_k\}$。

将 $\mathbf{v}_0$ 按特征向量基展开 $\mathbf{v}_0 = a_1\mathbf{x}_1+a_2\mathbf{x}_2+\cdots+a_n\mathbf{x}_n$（设 $a_1\ne 0$），则

$$\begin{aligned}
\mathbf{v}_k &= \mathbf{A}^k\mathbf{v}_0 = a_1\lambda_1^k\mathbf{x}_1 + a_2\lambda_2^k\mathbf{x}_2 + \cdots + a_n\lambda_n^k\mathbf{x}_n \\
&= \lambda_1^k\Bigl(a_1\mathbf{x}_1 + \sum_{i=2}^n a_i\bigl(\tfrac{\lambda_i}{\lambda_1}\bigr)^k\mathbf{x}_i\Bigr) \\
&= \lambda_1^k(a_1\mathbf{x}_1 + \boldsymbol{\varepsilon}_k)
\end{aligned}$$

其中 $\boldsymbol{\varepsilon}_k = \sum_{i=2}^n a_i(\lambda_i/\lambda_1)^k\mathbf{x}_i$。由 $|\lambda_i/\lambda_1|<1\ (i\ge 2)$，得 $\boldsymbol{\varepsilon}_k\to\mathbf{0}\ (k\to\infty)$，因此

$$\frac{\mathbf{v}_k}{\lambda_1^k}\longrightarrow a_1\mathbf{x}_1\quad(k\to\infty)$$

即 $\mathbf{v}_k$ 越来越接近 $\mathbf{x}_1$ 方向，**当 $k$ 充分大时 $\mathbf{v}_k\approx a_1\lambda_1^k\mathbf{x}_1$**（除一个因子外即 $\mathbf{x}_1$ 的近似）。

**主特征值的计算**：用 $(\mathbf{v}_k)_i$ 表示 $\mathbf{v}_k$ 第 $i$ 个分量，则

$$\frac{(\mathbf{v}_{k+1})_i}{(\mathbf{v}_k)_i} = \lambda_1\cdot\frac{a_1\mathbf{x}_1+\boldsymbol{\varepsilon}_{k+1}}{a_1\mathbf{x}_1+\boldsymbol{\varepsilon}_k}\Bigg|_i \xrightarrow{k\to\infty} \lambda_1 $$

**两相邻迭代向量分量的比值收敛于主特征值。**

> **定理 9.5**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 有 $n$ 个线性无关特征向量，主特征值 $\lambda_1$ 满足 $|\lambda_1|>|\lambda_2|\ge\cdots\ge|\lambda_n|$，则对任何非零初始向量 $\mathbf{v}_0$（$a_1\ne 0$），
>
> $$\lim_{k\to\infty}\frac{\mathbf{v}_k}{\lambda_1^k} = a_1\mathbf{x}_1,\quad \lim_{k\to\infty}\frac{(\mathbf{v}_{k+1})_i}{(\mathbf{v}_k)_i} = \lambda_1$$

收敛速度由 $r=|\lambda_2/\lambda_1|$ 决定：$r$ 越小越快；$r\approx 1$ 时收敛缓慢。

**主特征值为实重根的情形**：若 $\lambda_1=\lambda_2=\cdots=\lambda_r$ 且 $|\lambda_1|>|\lambda_{r+1}|\ge\cdots$，定理结论仍正确，极限给出对应于 $\lambda_1$ 的特征子空间中某向量。

#### 2.3 规范化幂法

应用基本幂法时，若 $|\lambda_1|>1$（或 $<1$），$\mathbf{v}_k$ 的分量将随 $k$ 趋于无穷或趋于零，计算机会"溢出"。

**规范化策略**：将向量 $\mathbf{v}\ne\mathbf{0}$ 规范化为

$$\mathbf{u} = \frac{\mathbf{v}}{\max(\mathbf{v})}$$

其中 $\max(\mathbf{v})$ 表示 $\mathbf{v}$ 绝对值最大的分量。

**规范化幂法**：

$$\boxed{\;\begin{aligned}
\mathbf{u}_0 &= \mathbf{v}_0\ne\mathbf{0}\\
\mathbf{v}_k &= \mathbf{A}\mathbf{u}_{k-1}\\
\mathbf{u}_k &= \frac{\mathbf{v}_k}{\max(\mathbf{v}_k)}
\end{aligned}\;}\quad(k=1,2,\ldots) $$

可推出

$$\mathbf{u}_k = \frac{\mathbf{A}^k\mathbf{v}_0}{\max(\mathbf{A}^k\mathbf{v}_0)} = \frac{a_1\mathbf{x}_1+\sum_{i=2}^n a_i(\lambda_i/\lambda_1)^k\mathbf{x}_i}{\max\bigl(a_1\mathbf{x}_1+\sum_{i=2}^n a_i(\lambda_i/\lambda_1)^k\mathbf{x}_i\bigr)}$$

由 $|\lambda_i/\lambda_1|<1$ 得

$$\mathbf{u}_k\longrightarrow \frac{\mathbf{x}_1}{\max(\mathbf{x}_1)}\quad(k\to\infty)$$

同时

$$\max(\mathbf{v}_k)\longrightarrow \lambda_1\quad(k\to\infty)$$

> **定理 9.6**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 满足定理 9.5 条件，则规范化幂法（9.2.9）满足
>
> $$\lim_{k\to\infty}\mathbf{u}_k = \frac{\mathbf{x}_1}{\max(\mathbf{x}_1)},\quad \lim_{k\to\infty}\max(\mathbf{v}_k) = \lambda_1$$

**例 9.1**：用幂法计算

$$\mathbf{A} = \begin{pmatrix}1.0 & 1.0 & 0.5\\ 1.0 & 1.0 & 0.25\\ 0.5 & 0.25 & 2.0\end{pmatrix}$$

的主特征值与特征向量。真值（8 位）为 $\lambda_1 = 2.5365258$，$\mathbf{x}_1^{\mathrm{T}} = (0.74822116,\ 0.64966116,\ 1)$。

数值迭代结果：

| $k$ | $\mathbf{u}_k$（规范化向量） | $\max(\mathbf{v}_k)$ |
|---:|---|---:|
| 0  | $(1,1,1)$ | — |
| 1  | $(0.9091,\ 0.8182,\ 1)$ | $2.7500000$ |
| 5  | $(0.7651,\ 0.6674,\ 1)$ | $2.5587918$ |
| 10 | $(0.7494,\ 0.6508,\ 1)$ | $2.5380029$ |
| 15 | $(0.7483,\ 0.6497,\ 1)$ | $2.5366256$ |
| 16 | $(0.7483,\ 0.6497,\ 1)$ | $2.5365840$ |
| 17 | $(0.7482,\ 0.6497,\ 1)$ | $2.5365598$ |
| 18 | $(0.7482,\ 0.6497,\ 1)$ | $2.5365456$ |
| 19 | $(0.7482,\ 0.6497,\ 1)$ | $2.5365374$ |
| 20 | $(0.7482,\ 0.6497,\ 1)$ | $2.5365323$ |

迭代 20 次得 $\lambda_1\approx 2.5365323$，相应特征向量 $(0.7482,\ 0.6497,\ 1)$。

★ Insight ─────────────────────────────────────
- 规范化的核心是把"长度信息"剥离，每步保留 $\max(\mathbf{v}_k)$ 作为 $\lambda_1$ 的逼近值，等价于用 $\ell_\infty$ 单位球面上的迭代
- 当 $|\lambda_2/\lambda_1|$ 接近 $1$（如本例 $\approx 0.4/2.5\approx 0.16$ 已较快），迭代呈线性收敛；上表也能直观看到每 5 步精度大约提高一位
- 工业实现里，$\max(\cdot)$ 也可换成 2-范数归一化，对随机初始向量更稳健
─────────────────────────────────────────────────

#### 2.4 加速方法

幂法收敛速度依赖于 $r=|\lambda_2/\lambda_1|$。$r\approx 1$ 时收敛很慢，需要加速。

##### 2.4.1 原点平移法

引进 $\mathbf{B} = \mathbf{A} - p\mathbf{I}$，$p$ 为参数。设 $\mathbf{A}$ 特征值为 $\lambda_1,\ldots,\lambda_n$，则 $\mathbf{B}$ 特征值为 $\lambda_1-p,\ldots,\lambda_n-p$，且 $\mathbf{A}, \mathbf{B}$ 有相同特征向量。

若想计算 $\mathbf{A}$ 的主特征值 $\lambda_1$，应选 $p$ 使

$$|\lambda_1 - p| \text{ 仍是 }\mathbf{B}\text{ 主特征值，且 }\Bigl|\frac{\lambda_2-p}{\lambda_1-p}\Bigr|<\Bigl|\frac{\lambda_2}{\lambda_1}\Bigr|$$

对 $\mathbf{B}$ 应用幂法即得加速。

**例 9.2**：设 $\mathbf{A}=(a_{ij})_{4\times 4}$ 特征值 $\lambda_j=15-j\ (j=1,2,3,4)$，$r=\lambda_2/\lambda_1=14/15\approx 0.9$。取 $p=12$，则 $\mathbf{B}$ 特征值 $\mu_1=2,\mu_2=1,\mu_3=0,\mu_4=-1$，新比值

$$\Bigl|\frac{\mu_2}{\mu_1}\Bigr| = \Bigl|\frac{\lambda_2-p}{\lambda_1-p}\Bigr| = \frac{1}{2} \ll 0.9$$

**最优 $p$ 的选择**：当 $\mathbf{A}$ 特征值实数且满足 $\lambda_1>\lambda_2\ge\cdots\ge\lambda_{n-1}>\lambda_n$，希望计算 $\lambda_1$。$\mathbf{B} = \mathbf{A}-p\mathbf{I}$ 的次大特征值（按模）必为 $\lambda_2-p$ 或 $\lambda_n-p$ 之一，记

$$\omega = \max\Bigl\{\Bigl|\tfrac{\lambda_2-p}{\lambda_1-p}\Bigr|,\Bigl|\tfrac{\lambda_n-p}{\lambda_1-p}\Bigr|\Bigr\}$$

显然当 $\lambda_2-p = -(\lambda_n-p)$，即

$$\boxed{\;p^* = \frac{\lambda_2+\lambda_n}{2}\;}$$

时 $\omega$ 最小，此时

$$\omega^* = \frac{\lambda_2-\lambda_n}{2\lambda_1-\lambda_2-\lambda_n}$$

**计算 $\lambda_n$ 时**取 $p = \dfrac{\lambda_1+\lambda_{n-1}}{2}$。

**例 9.3**：仍用例 9.1 矩阵，作 $\mathbf{B} = \mathbf{A}-p\mathbf{I},\ p=0.75$：

$$\mathbf{B} = \begin{pmatrix}0.25 & 1 & 0.5\\ 1 & 0.25 & 0.25\\ 0.5 & 0.25 & 1.25\end{pmatrix}$$

对 $\mathbf{B}$ 用幂法，迭代 10 次得 $\mu_1\approx 1.7865914$，

$$\lambda_1\approx \mu_1 + 0.75 = 2.5365914$$

精度比例 9.1 迭代 15 次还要好。若再迭代 15 次，$\mu_1=1.7865258$，$\lambda_1=2.5365258$（所有数字均准确）：

| $k$ | $\mathbf{u}_k$ | $\max(\mathbf{v}_k)$ |
|---:|---|---:|
| 0  | $(1,1,1)$ | — |
| 5  | $(0.7516,\ 0.6522,\ 1)$ | $1.7914011$ |
| 6  | $(0.7491,\ 0.6511,\ 1)$ | $1.7888443$ |
| 7  | $(0.7488,\ 0.6501,\ 1)$ | $1.7873300$ |
| 8  | $(0.7484,\ 0.6499,\ 1)$ | $1.7869152$ |
| 9  | $(0.7483,\ 0.6497,\ 1)$ | $1.7866587$ |
| 10 | $(0.7482,\ 0.6497,\ 1)$ | $1.7865914$ |

**讨论**：
- 原点平移法是矩阵变换方法，容易实现，且不破坏 $\mathbf{A}$ 的稀疏性
- 但 $p$ 的选择依赖于对 $\mathbf{A}$ 特征值分布的大致了解
- 自动选取 $p$ 是困难的，常需结合先验知识或粗略估计

##### 2.4.2 Rayleigh 商加速法

定理 9.4 表明，对称矩阵的最大、最小特征值可用 Rayleigh 商极值表示。可将其应用到对称阵主特征值的幂法上：

> **定理 9.7**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 对称，特征值 $\lambda_1>\lambda_2\ge\cdots\ge\lambda_n$，对应规范正交特征向量 $\mathbf{x}_i$。应用规范化幂法（9.2.9），则
>
> $$\boxed{\;\frac{(\mathbf{A}\mathbf{u}_k,\mathbf{u}_k)}{(\mathbf{u}_k,\mathbf{u}_k)} = \lambda_1 + O\Bigl(\Bigl|\tfrac{\lambda_2}{\lambda_1}\Bigr|^{2k}\Bigr)\;}$$

**关键推导**：由 $\mathbf{u}_k = \mathbf{A}^k\mathbf{u}_0/\max(\mathbf{A}^k\mathbf{u}_0)$，

$$\frac{(\mathbf{A}\mathbf{u}_k,\mathbf{u}_k)}{(\mathbf{u}_k,\mathbf{u}_k)} = \frac{(\mathbf{A}^{2k+1}\mathbf{u}_0,\mathbf{u}_0)}{(\mathbf{A}^{2k}\mathbf{u}_0,\mathbf{u}_0)} = \frac{\sum_{j=1}^n \alpha_j^2\lambda_j^{2k+1}}{\sum_{j=1}^n \alpha_j^2\lambda_j^{2k}}$$

提取 $\lambda_1$ 后，余项以 $|\lambda_j/\lambda_1|^{2k}$ 衰减，由 $1/(1+x)$ 一阶展开即得误差量级 $O(|\lambda_2/\lambda_1|^{2k})$。

★ Insight ─────────────────────────────────────
- 把误差从 $O(r^k)$ 提升到 $O(r^{2k})$，迭代步数有效减半，这就是 Rayleigh 商加速的吸引力所在
- 此结论只对**对称矩阵**成立，因为推导关键用到 $\mathbf{x}_i$ 的正交性
- 实际算法常每步同时维护 $\mathbf{u}_k$ 与 $R(\mathbf{u}_k)$，避免独立的特征值估计开销
─────────────────────────────────────────────────

### 3. 反幂法

#### 3.1 基本思想

求 $\mathbf{A}$ 按模**最小**的特征值及对应特征向量。设 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 非奇异，特征值 $|\lambda_1|\ge|\lambda_2|\ge\cdots\ge|\lambda_n|>0$，对应特征向量 $\mathbf{x}_1,\ldots,\mathbf{x}_n$。

注意：$\mathbf{A}^{-1}$ 的特征值为 $1/\lambda_n\ge 1/\lambda_{n-1}\ge\cdots\ge 1/\lambda_1$，特征向量仍为 $\mathbf{x}_i$。**对 $\mathbf{A}^{-1}$ 应用幂法即得 $\mathbf{A}$ 的最小模特征值 $\lambda_n$**——这就是**反幂法**。

#### 3.2 反幂法迭代公式

任取 $\mathbf{v}_0=\mathbf{u}_0\ne\mathbf{0}$，构造

$$\boxed{\;\begin{aligned}
\mathbf{v}_k &= \mathbf{A}^{-1}\mathbf{u}_{k-1}\\
\mathbf{u}_k &= \frac{\mathbf{v}_k}{\max(\mathbf{v}_k)}
\end{aligned}\;}\quad(k=1,2,\ldots)$$

实际计算中，**$\mathbf{v}_k$ 通过解方程组 $\mathbf{A}\mathbf{v}_k = \mathbf{u}_{k-1}$ 求得**（不显式构造 $\mathbf{A}^{-1}$）。

> **定理 9.8**：设 $\mathbf{A}$ 有 $n$ 个线性无关特征向量，且非奇异，$|\lambda_1|\ge\cdots\ge|\lambda_{n-1}|>|\lambda_n|>0$。对任何非零初始向量 $\mathbf{u}_0=\mathbf{v}_0\ (a_n\ne 0)$，反幂法满足
>
> $$\lim_{k\to\infty}\mathbf{u}_k = \frac{\mathbf{x}_n}{\max(\mathbf{x}_n)},\quad \lim_{k\to\infty}\max(\mathbf{v}_k) = \frac{1}{\lambda_n}$$
>
> 收敛速度由 $|\lambda_n/\lambda_{n-1}|$ 决定。

#### 3.3 反幂法的加速：原点平移

为求 $\mathbf{A}$ 任一特征值 $\lambda_j$ 及其特征向量，可对 $(\mathbf{A}-p\mathbf{I})^{-1}$ 应用幂法。若 $p$ 是 $\lambda_j$ 的近似值且 $|\lambda_j-p|<|\lambda_i-p|\ (i\ne j)$，则 $\dfrac{1}{\lambda_j-p}$ 是 $(\mathbf{A}-p\mathbf{I})^{-1}$ 的主特征值。

**加速反幂法**：

$$\boxed{\;\begin{aligned}
\mathbf{v}_k &= (\mathbf{A}-p\mathbf{I})^{-1}\mathbf{u}_{k-1}\\
\mathbf{u}_k &= \frac{\mathbf{v}_k}{\max(\mathbf{v}_k)}
\end{aligned}\;}\quad(k=1,2,\ldots)$$

> **定理 9.9**：设
> - $\mathbf{A}\in\mathbf{R}^{n\times n}$ 有 $n$ 个线性无关特征向量
> - $p$ 是 $\mathbf{A}$ 的特征值 $\lambda_j$ 的近似值，$(\mathbf{A}-p\mathbf{I})^{-1}$ 存在，$|\lambda_j-p|<|\lambda_i-p|\ (i\ne j)$
> - $\mathbf{u}_0 = \sum_{i=1}^n a_i\mathbf{x}_i \ne \mathbf{0}\ (a_j\ne 0)$
>
> 则反幂法（9.2.12）满足
>
> $$\lim_{k\to\infty}\mathbf{u}_k = \frac{\mathbf{x}_j}{\max(\mathbf{x}_j)},\quad \lim_{k\to\infty}\max(\mathbf{v}_k) = \frac{1}{\lambda_j-p}$$
>
> 即 $p+\dfrac{1}{\max(\mathbf{v}_k)}\to\lambda_j\ (k\to\infty)$。收敛速度由 $r=\max_{i\ne j}\Bigl|\dfrac{\lambda_j-p}{\lambda_i-p}\Bigr|$ 确定。

**讨论**：若 $p$ 是 $\lambda_j$ 的较好近似且分离情况好，$r$ 很小，**通常迭代一两次即可计算出特征向量**。

#### 3.4 反幂法的计算实现：LU 分解加速

每步需解 $(\mathbf{A}-p\mathbf{I})\mathbf{v}_k = \mathbf{u}_{k-1}$。为节省工作量，**先做一次三角分解**

$$\mathbf{P}(\mathbf{A}-p\mathbf{I}) = \mathbf{L}\mathbf{U}$$

其后每步只需解两个三角方程组：

$$\boxed{\;\begin{aligned}
\mathbf{L}\mathbf{y}_k &= \mathbf{P}\mathbf{u}_{k-1}\\
\mathbf{U}\mathbf{v}_k &= \mathbf{y}_k\\
\mathbf{u}_k &= \frac{\mathbf{v}_k}{\max(\mathbf{v}_k)}
\end{aligned}\;}\quad(k=1,2,\ldots)$$

**初始化技巧**：实验表明取初值 $\mathbf{v}_0=\mathbf{u}_0$ 并使

$$\mathbf{U}\mathbf{v}_1 = \mathbf{y}_1 = \mathbf{L}^{-1}\mathbf{P}\mathbf{u}_0 = (1,1,\ldots,1)^{\mathrm{T}}$$

回代求 $\mathbf{v}_1$，然后按（9.2.13）迭代——这样**不需显式给出 $\mathbf{u}_0$**。

**例 9.4**：用反幂法求

$$\mathbf{A} = \begin{pmatrix}2 & 1 & 0\\ 1 & 3 & 1\\ 0 & 1 & 4\end{pmatrix}$$

对应近似特征值 $\lambda = 1.2679$（精确为 $\lambda = 3-\sqrt{3}^{}$）的特征向量（5 位浮点数）。

部分选主元三角分解 $\mathbf{P}(\mathbf{A}-p\mathbf{I})=\mathbf{L}\mathbf{U}$（$p=1.2679$）：

$$\mathbf{P}=\begin{pmatrix}0&1&0\\0&0&1\\1&0&0\end{pmatrix},\ \mathbf{L}=\begin{pmatrix}1&0&0\\0&1&0\\0.7321&-0.26807&1\end{pmatrix},\ \mathbf{U}=\begin{pmatrix}1&1.7321&1\\0&1&2.7321\\0&0&0.29405\times 10^{-3}\end{pmatrix}$$

由 $\mathbf{U}\mathbf{v}_1=(1,1,1)^{\mathrm{T}}$：

$$\mathbf{v}_1 = (12692,\ -9290.3,\ 3400.8)^{\mathrm{T}},\quad \mathbf{u}_1 = (1,\ -0.73198,\ 0.26795)^{\mathrm{T}}$$

由 $\mathbf{L}\mathbf{U}\mathbf{v}_2 = \mathbf{P}\mathbf{u}_1$：

$$\mathbf{v}_2 = (20404,\ -14937,\ 5467.4)^{\mathrm{T}},\quad \mathbf{u}_2 = (1,\ -0.73206,\ 0.26796)^{\mathrm{T}}$$

精确值为

$$\mathbf{x}_3 = (1,\ 1-\sqrt{3}^{},\ 2-\sqrt{3}^{})^{\mathrm{T}} \approx (1,\ -0.73205,\ 0.26795)^{\mathrm{T}}$$

**两步即收敛到 5 位精度**。

★ Insight ─────────────────────────────────────
- 反幂法等价于以 $1/(\lambda_j-p)$ 为主特征值的幂法——把目标特征值"提到无穷大"，自然地放大了它对迭代的贡献
- $p$ 越接近 $\lambda_j$，$|\lambda_j-p|$ 越小，$\dfrac{1}{|\lambda_j-p|}$ 越大，加速效果越显著；但太接近又会使 $\mathbf{A}-p\mathbf{I}$ 病态
- 用 LU 分解一次性付出 $O(n^3)$，之后每步 $O(n^2)$，结合定理 9.9 的"两三步即收敛"使总成本仍非常低——这是反幂法在实际中精算特征向量的主流套路
─────────────────────────────────────────────────

### 4. Householder 方法

幂法和反幂法只能给出**部分**特征值。要求**所有**特征值/特征向量，思路是：

> 通过**正交相似变换**把 $\mathbf{A}$ 化简为一个更易求特征值的矩阵。

- 一般实矩阵 $\to$ **上 Hessenberg 阵**
- 对称矩阵 $\to$ **对称三对角阵**

#### 4.1 正交相似变换的存在性

> **定理 9.10**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$，则存在正交阵 $\mathbf{R}$，使 $\mathbf{R}^{\mathrm{T}}\mathbf{A}\mathbf{R}$ 为分块上三角阵
>
> $$\mathbf{R}^{\mathrm{T}}\mathbf{A}\mathbf{R} = \begin{pmatrix}\mathbf{T}_{11} & \mathbf{T}_{12} & \cdots & \mathbf{T}_{1m}\\ & \mathbf{T}_{22} & \cdots & \mathbf{T}_{2m}\\ & & \ddots & \vdots\\ & & & \mathbf{T}_{mm}\end{pmatrix}$$
>
> 其中对角块为 1 阶或 2 阶矩阵：
> - 1 阶对角块即为 $\mathbf{A}$ 的实特征值
> - 2 阶对角块的特征值是 $\mathbf{A}$ 的一对共轭复特征值
>
> （证明参见 Golub & Loan《Matrix Computations》）

#### 4.2 上 Hessenberg 阵

**定义 9.2**：方阵 $\mathbf{B}$ 若当 $i>j+1$ 时 $b_{ij}=0$，则称 $\mathbf{B}$ 为**上 Hessenberg 阵**：

$$\mathbf{B} = \begin{pmatrix}b_{11} & b_{12} & \cdots & b_{1n}\\ b_{21} & b_{22} & \cdots & b_{2n}\\ & \ddots & \ddots & \vdots\\ & & b_{n,n-1} & b_{nn}\end{pmatrix}$$

即下次对角线以下全为零，"几乎"是上三角的。

#### 4.3 初等反射阵

**定义 9.3**：设向量 $\mathbf{w}$ 满足 $\|\mathbf{w}\|_2=1$，矩阵

$$\boxed{\;\mathbf{H} = \mathbf{I} - 2\mathbf{w}\mathbf{w}^{\mathrm{T}}\;}$$

称为**初等反射阵**（Householder 变换），记作 $H(\mathbf{w})$。

> **定理 9.11**：初等反射阵 $\mathbf{H}$ 是
> - 对称阵（$\mathbf{H}^{\mathrm{T}} = \mathbf{H}$）
> - 正交阵（$\mathbf{H}^{\mathrm{T}}\mathbf{H} = \mathbf{I}$）
> - 对合阵（$\mathbf{H}^2 = \mathbf{I}$）

**证明（正交性）**：

$$\begin{aligned}
\mathbf{H}^{\mathrm{T}}\mathbf{H} &= \mathbf{H}^2 = (\mathbf{I}-2\mathbf{w}\mathbf{w}^{\mathrm{T}})(\mathbf{I}-2\mathbf{w}\mathbf{w}^{\mathrm{T}})\\
&= \mathbf{I} - 4\mathbf{w}\mathbf{w}^{\mathrm{T}} + 4\mathbf{w}(\mathbf{w}^{\mathrm{T}}\mathbf{w})\mathbf{w}^{\mathrm{T}} = \mathbf{I}
\end{aligned}$$

（最后一步利用 $\|\mathbf{w}\|_2^2 = \mathbf{w}^{\mathrm{T}}\mathbf{w} = 1$。）

对任意非零 $\mathbf{u}$，$\mathbf{H} = \mathbf{I} - 2\dfrac{\mathbf{u}\mathbf{u}^{\mathrm{T}}}{\|\mathbf{u}\|_2^2}$ 也是初等反射阵。

**几何含义**：以 $\mathbf{w}$ 为法向量、过原点的超平面 $S:\mathbf{w}^{\mathrm{T}}\mathbf{x}=0$。任意 $\mathbf{v}\in\mathbf{R}^n$ 分解为 $\mathbf{v}=\mathbf{x}+\mathbf{y}$（$\mathbf{x}\in S$，$\mathbf{y}\in S^\perp$ 即 $\mathbf{y}$ 与 $\mathbf{w}$ 共线），则
- $\mathbf{H}\mathbf{x} = \mathbf{x}-2\mathbf{w}(\mathbf{w}^{\mathrm{T}}\mathbf{x}) = \mathbf{x}$
- $\mathbf{H}\mathbf{y} = \mathbf{y}-2\mathbf{y} = -\mathbf{y}$

所以 $\mathbf{H}\mathbf{v} = \mathbf{x}-\mathbf{y}$，即 $\mathbf{v}$ 关于平面 $S$ 的**镜面反射**。

#### 4.4 Householder 约化定理

> **定理 9.12**：设 $\mathbf{x},\mathbf{y}$ 为两个不相等的 $n$ 维向量，$\|\mathbf{x}\|_2=\|\mathbf{y}\|_2$，则存在初等反射阵 $\mathbf{H}$，使 $\mathbf{H}\mathbf{x}=\mathbf{y}$。

**构造**：令 $\mathbf{w}=\dfrac{\mathbf{x}-\mathbf{y}}{\|\mathbf{x}-\mathbf{y}\|_2}$，则

$$\mathbf{H} = \mathbf{I} - 2\frac{(\mathbf{x}-\mathbf{y})(\mathbf{x}-\mathbf{y})^{\mathrm{T}}}{\|\mathbf{x}-\mathbf{y}\|_2^2}$$

由 $\|\mathbf{x}-\mathbf{y}\|_2^2 = 2(\mathbf{x}^{\mathrm{T}}\mathbf{x}-\mathbf{y}^{\mathrm{T}}\mathbf{x})$（因 $\|\mathbf{x}\|_2=\|\mathbf{y}\|_2$），代入易得 $\mathbf{H}\mathbf{x}=\mathbf{y}$。

**推论（Householder 方法的核心）**：设 $\mathbf{x}\in\mathbf{R}^n\ (\mathbf{x}\ne\mathbf{0})$，$\sigma=\pm\|\mathbf{x}\|_2$，$\mathbf{x}\ne -\sigma\mathbf{e}_1$，则存在初等反射阵

$$\mathbf{H} = \mathbf{I} - 2\frac{\mathbf{u}\mathbf{u}^{\mathrm{T}}}{\|\mathbf{u}\|_2^2}\equiv \mathbf{I} - \rho^{-1}\mathbf{u}\mathbf{u}^{\mathrm{T}}$$

使 $\mathbf{H}\mathbf{x} = -\sigma\mathbf{e}_1$，其中 $\mathbf{u}=\mathbf{x}+\sigma\mathbf{e}_1$，$\rho=\|\mathbf{u}\|_2^2/2$。

**$\sigma$ 的符号选择**：设 $\mathbf{x}=(\alpha_1,\alpha_2,\ldots,\alpha_n)^{\mathrm{T}}$，则

$$\rho = \frac{\|\mathbf{u}\|_2^2}{2} = \sigma^2 + \alpha_1\sigma = \sigma(\sigma+\alpha_1)$$

若 $\sigma$ 与 $\alpha_1$ 异号，计算 $\sigma+\alpha_1$ 时**有效数字会损失**。故取

$$\boxed{\;\sigma = \mathrm{sgn}(\alpha_1)\|\mathbf{x}\|_2\;}$$

#### 4.5 Householder 算法

**算法 1**：已知 $\mathbf{x}=(\alpha_1,\ldots,\alpha_n)^{\mathrm{T}}\ne\mathbf{0}$，求 $\sigma,\rho,\mathbf{u}$ 使 $(\mathbf{I}-\rho^{-1}\mathbf{u}\mathbf{u}^{\mathrm{T}})\mathbf{x} = -\sigma\mathbf{e}_1$，$\mathbf{u}$ 分量冲掉 $\mathbf{x}$ 分量

1. $\sigma = \mathrm{sgn}(\alpha_1)\sqrt{\sum_{i=1}^n \alpha_i^2}^{}$
2. $\alpha_1 \leftarrow u_1 = \alpha_1 + \sigma$
3. $\rho = \sigma(\sigma+\alpha_1) = \sigma u_1$

为防溢出/下溢，将 $\mathbf{x}$ **规范化**（**算法 2**）：

1. $\eta = \max_i|\alpha_i|$
2. $\alpha_i \leftarrow u_i = \alpha_i/\eta\quad(i=1,2,\ldots,n)$
3. $\sigma = \mathrm{sgn}(u_1)\sqrt{\sum_{i=1}^n u_i^2}^{}$
4. $u_1 \leftarrow u_1 + \sigma$
5. $\rho = \sigma u_1$
6. $\sigma \leftarrow \eta\sigma$（恢复原 $\mathbf{x}$ 对应的 $\sigma$）

#### 4.6 矩阵计算 $\mathbf{H}\mathbf{A}$

$\mathbf{A}=(\mathbf{a}_1,\mathbf{a}_2,\ldots,\mathbf{a}_n)$，则

$$\mathbf{H}\mathbf{a}_i = \mathbf{a}_i - \rho^{-1}(\mathbf{u}^{\mathrm{T}}\mathbf{a}_i)\mathbf{u}\quad(i=1,2,\ldots,n)$$

每列只需做一次内积加一次向量加法。**计算 $\mathbf{H}\mathbf{A}$ 共需 $2n^2$ 次乘法**——比直接矩阵乘法的 $n^3$ 节省一个数量级。

#### 4.7 用正交相似变换约化矩阵

设

$$\mathbf{A}=\begin{pmatrix}a_{11} & \mathbf{A}_{12}^{(1)}\\ \mathbf{a}_{21}^{(1)} & \mathbf{A}_{22}^{(1)}\end{pmatrix}$$

**步 1**：设 $\mathbf{a}_{21}^{(1)}\ne\mathbf{0}$，选初等反射阵 $\mathbf{R}_1$ 使 $\mathbf{R}_1\mathbf{a}_{21}^{(1)} = -\sigma_1\mathbf{e}_1$，其中

$$\sigma_1 = \mathrm{sgn}(a_{21})\Bigl(\sum_{i=2}^n a_{i1}^2\Bigr)^{1/2},\quad \mathbf{u}_1 = \mathbf{a}_{21}^{(1)}+\sigma_1\mathbf{e}_1,\quad \rho_1=\frac{1}{2}\|\mathbf{u}_1\|_2^2$$

令 $\mathbf{U}_1=\begin{pmatrix}\mathbf{I} & \mathbf{O}\\ \mathbf{O} & \mathbf{R}_1\end{pmatrix}$，则

$$\mathbf{A}_2 = \mathbf{U}_1\mathbf{A}\mathbf{U}_1 = \begin{pmatrix}a_{11} & \mathbf{A}_{12}^{(1)}\mathbf{R}_1\\ \mathbf{R}_1\mathbf{a}_{21}^{(1)} & \mathbf{R}_1\mathbf{A}_{22}^{(1)}\mathbf{R}_1\end{pmatrix} = \begin{pmatrix}a_{11}^{(2)} & \mathbf{a}_{21}^{(2)} & \mathbf{A}_{12}^{(2)}\\ \mathbf{O} & * & \mathbf{A}_{22}^{(2)}\end{pmatrix}$$

第一列除 $a_{11},-\sigma_1$ 外全部置零。

**步 $k$**：设已完成第 $k-1$ 步约化，$\mathbf{A}_k$ 左上角 $k$ 阶为上 Hessenberg 阵，对右下方块继续选初等反射阵 $\mathbf{R}_k$ 满足 $\mathbf{R}_k\mathbf{a}_{22}^{(k)} = -\sigma_k\mathbf{e}_1$，其中

$$\sigma_k = \mathrm{sgn}(a_{k+1,k})\Bigl(\sum_{i=k+1}^n a_{ik}^2\Bigr)^{1/2}$$

令 $\mathbf{U}_k = \begin{pmatrix}\mathbf{I} & \mathbf{O}\\ \mathbf{O} & \mathbf{R}_k\end{pmatrix}$，得 $\mathbf{A}_{k+1} = \mathbf{U}_k\mathbf{A}_k\mathbf{U}_k$，左上角 $k+1$ 阶为上 Hessenberg 阵。

重复直至

$$\mathbf{A}_{n-1} = \mathbf{U}_{n-2}\cdots\mathbf{U}_1\mathbf{A}\mathbf{U}_1\cdots\mathbf{U}_{n-2} = \begin{pmatrix}a_{11} & * & * & \cdots & *\\ -\sigma_1 & a_{22}^{(2)} & * & \cdots & *\\ & -\sigma_2 & a_{33}^{(3)} & \ddots & \vdots\\ & & \ddots & \ddots & *\\ & & & -\sigma_{n-1} & a_{nn}^{(n-1)}\end{pmatrix}$$

> **定理 9.13**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$，则存在初等反射阵 $\mathbf{U}_1,\ldots,\mathbf{U}_{n-2}$ 使
>
> $$\mathbf{U}_{n-2}\cdots\mathbf{U}_1\mathbf{A}\mathbf{U}_1\cdots\mathbf{U}_{n-2} = \mathbf{C}\quad\text{（上 Hessenberg 阵）}$$

**计算量**：约化一般实矩阵为上 Hessenberg 阵，**约需 $\dfrac{5}{3}n^3$ 次乘法**。

#### 4.8 特征值的转化求解

$\mathbf{U}_k$ 都是正交阵，$\mathbf{A}\sim\mathbf{A}_2\sim\cdots\sim\mathbf{A}_{n-1}$，求 $\mathbf{A}$ 的特征值即求上 Hessenberg 阵 $\mathbf{C}$ 的特征值。

记 $\mathbf{P} = \mathbf{U}_{n-2}\cdots\mathbf{U}_1$，则 $\mathbf{P}\mathbf{A}\mathbf{P}^{\mathrm{T}} = \mathbf{C}$。若 $\mathbf{y}$ 是 $\mathbf{C}$ 对应 $\lambda$ 的特征向量，则 $\mathbf{P}^{\mathrm{T}}\mathbf{y}$ 是 $\mathbf{A}$ 对应 $\lambda$ 的特征向量

$$\mathbf{P}^{\mathrm{T}}\mathbf{y} = \mathbf{U}_1\mathbf{U}_2\cdots\mathbf{U}_{n-2}\mathbf{y}$$

#### 4.9 约化对称矩阵

> **定理 9.14**：设 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 对称，则存在初等反射阵 $\mathbf{U}_1,\ldots,\mathbf{U}_{n-2}$ 使
>
> $$\mathbf{A}_{n-1} = \mathbf{U}_{n-2}\cdots\mathbf{U}_1\mathbf{A}\mathbf{U}_1\cdots\mathbf{U}_{n-2} = \begin{pmatrix}c_1 & b_1\\ b_1 & c_2 & b_2\\ & \ddots & \ddots & \ddots\\ & & b_{n-2} & c_{n-1} & b_{n-1}\\ & & & b_{n-1} & c_n\end{pmatrix} \equiv \mathbf{C}$$
>
> （对称三对角阵）

由定理 9.13，$\mathbf{A}_{n-1}$ 为上 Hessenberg 阵，又因 $\mathbf{A}$ 对称，正交相似保持对称性，故 $\mathbf{A}_{n-1}$ 为对称三对角阵。

**对称约化的计算优化**：仅需计算 $\mathbf{R}_k\mathbf{A}_{22}^{(k)}\mathbf{R}_k$ 的对角线下方元素。利用

$$\mathbf{R}_k\mathbf{A}_{22}^{(k)}\mathbf{R}_k = \mathbf{A}_{22}^{(k)} - \mathbf{u}_k\mathbf{t}_k^{\mathrm{T}} - \mathbf{t}_k\mathbf{u}_k^{\mathrm{T}}$$

其中

$$\mathbf{r}_k = \rho_k^{-1}\mathbf{A}_{22}^{(k)}\mathbf{u}_k,\quad \mathbf{t}_k = \mathbf{r}_k - \frac{\rho_k^{-1}}{2}(\mathbf{u}_k^{\mathrm{T}}\mathbf{r}_k)\mathbf{u}_k$$

**计算量讨论**：
- 对称阵约化为对称三对角阵，约需 $\dfrac{2}{3}n^3$ 次乘法
- 一般实矩阵约化为上 Hessenberg 阵，约需 $\dfrac{5}{3}n^3$ 次乘法
- 用正交矩阵约化的优势：$\mathbf{U}_k$ 易求逆且元素数量级不大，**算法十分稳定**

#### 4.10 Householder 方法举例

**例 9.5**：用 Householder 方法将下述矩阵化为 Hessenberg 阵

$$\mathbf{A} = \mathbf{A}_1 = \begin{pmatrix}-4 & -3 & -7\\ 2 & 3 & 2\\ 4 & 2 & 7\end{pmatrix}$$

**第 1 步（$k=1$）**：构造

$$\mathbf{U}_1 = \begin{pmatrix}1 & 0 & 0\\ 0 & & \\ 0 & & \mathbf{R}_1\end{pmatrix},\quad \mathbf{a}_{21}^{(1)} = \begin{pmatrix}2\\ 4\end{pmatrix}$$

其中 $\mathbf{R}_1$ 满足 $\mathbf{R}_1\mathbf{a}_{21}^{(1)} = (-\sigma_1, 0)^{\mathrm{T}}$，

$$\sigma_1 = \|\mathbf{a}_{21}^{(1)}\|_2 = \sqrt{20}^{} \approx 4.472136$$

$$\mathbf{u}_1 = \mathbf{a}_{21}^{(1)} + \sigma_1\mathbf{e}_1 = \begin{pmatrix}2+\sqrt{20}^{}\\ 4\end{pmatrix} \approx \begin{pmatrix}6.472136\\ 4\end{pmatrix}$$

$$\rho_1 = \sigma_1(\sigma_1 + a_{21}) = \sqrt{20}^{}\cdot(\sqrt{20}^{}+2) \approx 28.94427$$

$\mathbf{R}_1 = \mathbf{I} - \rho_1^{-1}\mathbf{u}_1\mathbf{u}_1^{\mathrm{T}}$。

**第 2 步**：计算 $\mathbf{R}_1\mathbf{A}_{22}^{(1)}$。记

$$\mathbf{A}_{22}^{(1)} = \begin{pmatrix}3 & 2\\ 2 & 7\end{pmatrix} \equiv (\mathbf{a}_1, \mathbf{a}_2)$$

$$\mathbf{R}_1\mathbf{A}_{22}^{(1)} = (\mathbf{R}_1\mathbf{a}_1,\ \mathbf{R}_1\mathbf{a}_2) = \begin{pmatrix}-3.130496 & -7.155419\\ -1.788855 & 1.341640\end{pmatrix}$$

每列由 $\mathbf{R}_1\mathbf{a}_i = \mathbf{a}_i - \rho_1^{-1}(\mathbf{u}_1^{\mathrm{T}}\mathbf{a}_i)\mathbf{u}_1$ 算出。

**第 3 步**：计算 $\mathbf{A}_{12}^{(1)}\mathbf{R}_1$ 和 $\mathbf{R}_1\mathbf{A}_{22}^{(1)}\mathbf{R}_1$，即对每个行向量 $\mathbf{b}_i^{\mathrm{T}}$ 做

$$\mathbf{b}_i^{\mathrm{T}}\mathbf{R}_1 = \mathbf{b}_i^{\mathrm{T}} - \rho_1^{-1}(\mathbf{b}_i^{\mathrm{T}}\mathbf{u}_1)\mathbf{u}_1^{\mathrm{T}}\quad(i=1,2,3)$$

得到

$$\begin{pmatrix}\mathbf{A}_{12}^{(1)}\mathbf{R}_1\\ \mathbf{R}_1\mathbf{A}_{22}^{(1)}\mathbf{R}_1\end{pmatrix} = \begin{pmatrix}7.602634 & -0.447212\\ 7.800003 & -0.399999\\ -0.399999 & 2.200000\end{pmatrix}$$

**第 4 步**：得到

$$\mathbf{A}_2 = \mathbf{U}_1\mathbf{A}_1\mathbf{U}_1 = \begin{pmatrix}-4 & 7.602634 & -0.447212\\ -4.472136 & 7.800003 & -0.399999\\ 0 & -0.399999 & 2.200000\end{pmatrix}$$

**为上 Hessenberg 阵**。

★ Insight ─────────────────────────────────────
- Householder 反射的几何含义（关于超平面的镜像）使其几乎是把任意向量"摆正"到坐标轴的最简洁手段——比一系列 Givens 旋转用更少的存储和计算
- 关键技巧 $\sigma = \mathrm{sgn}(\alpha_1)\|\mathbf{x}\|_2$ 是为了让 $\alpha_1+\sigma$ 不会发生灾难性消去——这是数值稳定性而非数学正确性的考虑
- 把 $\mathbf{H}\mathbf{A}\mathbf{H}^{\mathrm{T}}$ 拆成 $\mathbf{H}$ 左乘和右乘两步，每步 $2n^2$ 乘法，全部约化 $O(n^3)$——这套"夹击"模式在 QR、SVD 中反复出现
─────────────────────────────────────────────────

### 5. QR 算法

`★ Insight ─────────────────────────────────────`
- Householder 把矩阵约化为 Hessenberg 阵，这只是"准备阶段"；真正逼近特征值的核心是 Francis 在 1961—1962 年提出的 **QR 迭代**
- QR 算法对一般矩阵都能用，但配合 Hessenberg/三对角阵作为初始形状会让每步迭代成本由 $O(n^3)$ 骤降到 $O(n^2)$
- QR 迭代用到的"正交相似变换"是 **Givens 平面旋转矩阵** —— 它可以一次性把向量的某个分量精准置零
`─────────────────────────────────────────────────`

Householder 方法可以把矩阵约化为上 Hessenberg 阵或对称三对角阵，但这一步并未真正解出特征值。QR 算法（Francis 1961, 1962）建立在矩阵 QR 分解之上，是中小型矩阵全部特征值问题最有效的方法之一，主要用于：

- 上 Hessenberg 阵全部特征值问题
- 对称三对角阵全部特征值问题

QR 方法具有 **收敛快、算法稳定** 的特点。注意 QR 方法本身可以直接处理任意矩阵 $\mathbf{A}$，但实际应用中通常先用 Householder 方法把 $\mathbf{A}$ 化为上 Hessenberg 阵（或对称三对角阵）$\mathbf{B}$，然后再用 QR 方法求 $\mathbf{B}$ 的全部特征值。

#### 5.1 平面旋转矩阵（Givens 变换）

平面旋转矩阵 $\mathbf{P}_{i,j}$ 在 $(i,i)$、$(i,j)$、$(j,i)$、$(j,j)$ 这四个位置上嵌入一个 $2\times 2$ 旋转块，其余对角元为 1，非对角元为 0：

$$\mathbf{P}_{i,j}=\begin{pmatrix}1\\&\ddots\\&&1\\&&&c&\cdots&s\\&&&\vdots&\ddots&\vdots\\&&&-s&\cdots&c\\&&&&&&1\\&&&&&&&\ddots\\&&&&&&&&1\end{pmatrix}$$

其中 $c=\cos\theta,\,s=\sin\theta$。$\mathbf{P}_{i,j}$ 是正交矩阵：$\mathbf{P}_{i,j}^{\mathrm{T}}\mathbf{P}_{i,j}=\mathbf{I}$。

> **引理 1**　设 $\mathbf{x}=(\alpha_1,\alpha_2,\cdots,\alpha_i,\cdots,\alpha_j,\cdots,\alpha_n)^{\mathrm{T}}$，其中 $\alpha_i,\alpha_j$ 不全为零。可以选取一个平面旋转矩阵 $\mathbf{P}_{i,j}$，使
> $$\mathbf{y}\equiv\mathbf{P}_{i,j}\mathbf{x}=(\alpha_1,\alpha_2,\cdots,\tilde{\alpha}_i,\cdots,\tilde{\alpha}_j,\cdots,\alpha_n)^{\mathrm{T}}$$
> 满足
> $$\tilde{\alpha}_i=\sqrt{\alpha_i^2+\alpha_j^2}^{},\qquad \tilde{\alpha}_j=0\qquad (9.4.2,9.4.3)$$
> 此时
> $$c=\frac{\alpha_i}{\sqrt{\alpha_i^2+\alpha_j^2}^{}},\qquad s=\frac{\alpha_j}{\sqrt{\alpha_i^2+\alpha_j^2}^{}}\qquad (9.4.4)$$

注意 $\mathbf{P}_{i,j}\mathbf{x}$ 只改变 $\mathbf{x}$ 的第 $i$ 个和第 $j$ 个元素，其他位置不变。这就是"一次旋转打掉一个分量"的精确含义。

##### 平面旋转：算法 1

设 $\mathbf{x}=\begin{pmatrix}\alpha\\\beta\end{pmatrix}$，要计算 $c,s$ 及 $v=\sqrt{\alpha^2+\beta^2}^{}$，使得
$$\mathbf{P}_{i,j}\mathbf{x}=\begin{pmatrix}c & s\\ -s & c\end{pmatrix}\begin{pmatrix}\alpha\\\beta\end{pmatrix}=\begin{pmatrix}v\\0\end{pmatrix}$$

为了避免溢出，先做规范化 $\eta=\max\{|\alpha|,|\beta|\}$，再在规范化后的向量上计算：

1. $\eta\leftarrow\max\{|\alpha|,|\beta|\}$
2. 如果 $\eta=0$，置 $c\leftarrow 1,\,s\leftarrow 0$，转步 8
3. $\tilde{\alpha}\leftarrow\alpha/\eta$
4. $\tilde{\beta}\leftarrow\beta/\eta$
5. $\tilde{v}\leftarrow\sqrt{\tilde{\alpha}^2+\tilde{\beta}^2}^{}$
6. $c\leftarrow\tilde{\alpha}/\tilde{v},\,s\leftarrow\tilde{\beta}/\tilde{v}$
7. $v\leftarrow\eta\tilde{v}$
8. 终止

#### 5.2 用平面旋转矩阵约化矩阵

> **定理 9.15**　如果 $\mathbf{A}$ 为非奇异矩阵，则存在正交矩阵 $\mathbf{P}_1,\mathbf{P}_2,\cdots,\mathbf{P}_{n-1}$（即一系列平面旋转矩阵）使
> $$\mathbf{P}_{n-1}\cdots\mathbf{P}_2\mathbf{P}_1\mathbf{A}=\begin{pmatrix}r_{11} & r_{12} & \cdots & r_{1n}\\ & r_{22} & \cdots & r_{2n}\\ & & \ddots & \vdots\\ & & & r_{nn}\end{pmatrix}\equiv\mathbf{R}\qquad (9.4.5)$$
> 且 $r_{ii}>0\,(i=1,2,\cdots,n-1)$。

**构造过程**：由于 $\mathbf{A}$ 非奇异，第 1 列必有 $a_{j1}\ne 0$ 中的某个，于是对每个 $a_{j1}\ne 0\,(j=2,3,\cdots,n)$，依算法 1 可得平面旋转矩阵 $\mathbf{P}_{12},\mathbf{P}_{13},\cdots,\mathbf{P}_{1n}$ 把第 1 列变成 $(r_{11},0,\cdots,0)^{\mathrm{T}}$：

$$\mathbf{P}_{1n}\cdots\mathbf{P}_{13}\mathbf{P}_{12}\mathbf{A}=\begin{pmatrix}r_{11} & a_{12}^{(2)} & \cdots & a_{1n}^{(2)}\\ 0 & a_{22}^{(2)} & \cdots & a_{2n}^{(2)}\\ \vdots & \vdots & & \vdots\\ 0 & a_{n2}^{(2)} & \cdots & a_{nn}^{(2)}\end{pmatrix}\equiv\mathbf{A}^{(2)}$$

记 $\mathbf{P}_{1n}\cdots\mathbf{P}_{13}\mathbf{P}_{12}=\mathbf{P}_1$，则 $\mathbf{P}_1\mathbf{A}=\mathbf{A}^{(2)}$。同理对 $\mathbf{A}^{(2)}$ 第 2 列从下方各非零元做平面旋转，得到 $\mathbf{P}_2=\mathbf{P}_{2n}\cdots\mathbf{P}_{23}$，把 $a_{j2}^{(2)}\,(j=3,\cdots,n)$ 全部清零：

$$\mathbf{P}_2\mathbf{P}_1\mathbf{A}=\begin{pmatrix}r_{11} & a_{12}^{(2)} & a_{13}^{(2)} & \cdots & a_{1n}^{(2)}\\ & r_{22} & a_{23}^{(3)} & \cdots & a_{2n}^{(3)}\\ & & a_{33}^{(3)} & \cdots & a_{3n}^{(3)}\\ & & \vdots & & \vdots\\ & & a_{n3}^{(3)} & \cdots & a_{nn}^{(3)}\end{pmatrix}$$

构造 $\mathbf{P}_2$ 用到的平面旋转矩阵数量比 $\mathbf{P}_1$ 少一个。重复上述过程，最后得到一系列正交阵 $\mathbf{P}_1,\mathbf{P}_2,\cdots,\mathbf{P}_{n-1}$，使式 (9.4.5) 成立。

#### 5.3 矩阵的 QR 分解

> **定理 9.16**　如果 $\mathbf{A}\in\mathbf{R}^{n\times n}$ 为非奇异矩阵，则 $\mathbf{A}$ 可分解为一正交阵 $\mathbf{Q}$ 与上三角阵 $\mathbf{R}$ 的乘积，即 $\mathbf{A}=\mathbf{Q}\mathbf{R}$，且当 $\mathbf{R}$ 对角元素都为正数时 **分解唯一**。

**存在性**：由定理 9.15，存在正交阵 $\mathbf{P}_1,\mathbf{P}_2,\cdots,\mathbf{P}_{n-1}$ 使
$$\mathbf{P}_{n-1}\cdots\mathbf{P}_2\mathbf{P}_1\mathbf{A}=\mathbf{R}\qquad (9.4.6)$$
为上三角阵。记 $\mathbf{Q}^{\mathrm{T}}=\mathbf{P}_{n-1}\cdots\mathbf{P}_2\mathbf{P}_1$，于是 $\mathbf{Q}^{\mathrm{T}}\mathbf{A}=\mathbf{R}$，即
$$\boxed{\mathbf{A}=\mathbf{Q}\mathbf{R},\quad \mathbf{Q}=\mathbf{P}_1^{\mathrm{T}}\mathbf{P}_2^{\mathrm{T}}\cdots\mathbf{P}_{n-1}^{\mathrm{T}}\text{ 为正交阵}}$$

**唯一性**：设有两个 QR 分解 $\mathbf{A}=\mathbf{Q}_1\mathbf{R}_1=\mathbf{Q}_2\mathbf{R}_2$，其中 $\mathbf{R}_1,\mathbf{R}_2$ 对角元都为正数（因而非奇异），$\mathbf{Q}_1,\mathbf{Q}_2$ 为正交阵。则
$$\mathbf{Q}_2^{\mathrm{T}}\mathbf{Q}_1=\mathbf{R}_2\mathbf{R}_1^{-1}\qquad (9.4.7)$$

左侧为正交阵，右侧 $\mathbf{R}_2\mathbf{R}_1^{-1}$ 为上三角阵，因此它必为对角阵：
$$\mathbf{R}_2\mathbf{R}_1^{-1}=\mathbf{D}=\mathrm{diag}(d_1,d_2,\cdots,d_n)$$

正交对角阵满足 $\mathbf{D}^2=\mathbf{I}$，故 $d_i=\pm 1$。又因 $\mathbf{R}_1,\mathbf{R}_2$ 对角元都为正数，故 $d_i>0$，即 $\mathbf{D}=\mathbf{I}$。于是 $\mathbf{R}_2=\mathbf{R}_1$，由 (9.4.7) 得 $\mathbf{Q}_2=\mathbf{Q}_1$。分解唯一。

#### 5.4 QR 迭代算法

设 $\mathbf{A}=(a_{ij})\in\mathbf{R}^{n\times n}$，对 $\mathbf{A}$ 进行 QR 分解 $\mathbf{A}=\mathbf{Q}\mathbf{R}$，其中 $\mathbf{R}$ 为上三角阵、$\mathbf{Q}$ 为正交阵，于是可构造新矩阵
$$\mathbf{B}=\mathbf{R}\mathbf{Q}=\mathbf{Q}^{\mathrm{T}}\mathbf{A}\mathbf{Q}\qquad (\text{因为 }\mathbf{R}=\mathbf{Q}^{\mathrm{T}}\mathbf{A})$$

可见 $\mathbf{B}$ 是 $\mathbf{A}$ 经过正交相似变换得到的，因此 $\mathbf{B}$ 与 $\mathbf{A}$ 特征值相同。再对 $\mathbf{B}$ 做 QR 分解又得新矩阵，反复迭代即得到矩阵序列。

> **定理 9.17（基本 QR 方法）**　设 $\mathbf{A}=\mathbf{A}_1\in\mathbf{R}^{n\times n}$，QR 算法为
> $$\begin{cases}\mathbf{A}_k=\mathbf{Q}_k\mathbf{R}_k,& \mathbf{Q}_k^{\mathrm{T}}\mathbf{Q}_k=\mathbf{I},\;\mathbf{R}_k\text{ 为上三角阵}\\ \mathbf{A}_{k+1}=\mathbf{R}_k\mathbf{Q}_k,& k=1,2,\ldots\end{cases}$$
> 记 $\tilde{\mathbf{Q}}_k\equiv\mathbf{Q}_1\mathbf{Q}_2\cdots\mathbf{Q}_k,\,\tilde{\mathbf{R}}_k\equiv\mathbf{R}_k\cdots\mathbf{R}_2\mathbf{R}_1$，则有
> 1. $\mathbf{A}_{k+1}$ 相似于 $\mathbf{A}_k$，即 $\mathbf{A}_{k+1}=\mathbf{Q}_k^{\mathrm{T}}\mathbf{A}_k\mathbf{Q}_k$
> 2. $\mathbf{A}_{k+1}=(\mathbf{Q}_1\mathbf{Q}_2\cdots\mathbf{Q}_k)^{\mathrm{T}}\mathbf{A}_1(\mathbf{Q}_1\mathbf{Q}_2\cdots\mathbf{Q}_k)=\tilde{\mathbf{Q}}_k^{\mathrm{T}}\mathbf{A}_1\tilde{\mathbf{Q}}_k$
> 3. $\mathbf{A}^k$ 的 QR 分解式为 $\mathbf{A}^k=\tilde{\mathbf{Q}}_k\tilde{\mathbf{R}}_k$

##### 为什么要迭代——收敛性

> **定理 9.18**　设 $\mathbf{A}=(a_{ij})\in\mathbf{R}^{n\times n}$。如果 $\mathbf{A}$ 的特征值满足
> $$|\lambda_1|>|\lambda_2|>\cdots>|\lambda_n|>0$$
> 且 $\mathbf{A}$ 可对角化 $\mathbf{A}=\mathbf{X}\mathbf{D}\mathbf{X}^{-1}$，其中 $\mathbf{D}=\mathrm{diag}(\lambda_1,\cdots,\lambda_n)$，则由 QR 算法产生的 $\{\mathbf{A}_k\}$ **本质上收敛于上三角阵**，即
> $$\mathbf{A}_k\xrightarrow{k\to\infty}\begin{pmatrix}\lambda_1 & \times & \cdots & \times\\ & \lambda_2 & \cdots & \vdots\\ & & \ddots & \times\\ & & & \lambda_n\end{pmatrix}$$

直接对一般稠密矩阵做 QR 迭代每步计算量为 $O(n^3)$，对大矩阵极不实用。

**实用方法**：

1. 先用 Householder 变换通过正交相似变换将 $\mathbf{A}$ 化为 **上 Hessenberg 阵 $\mathbf{H}$**，运算量 $O(n^3)$
2. 再对 $\mathbf{H}$ 做（带原点位移的）QR 迭代，**每步运算量 $O(n^2)$**

这样总体仍是 $O(n^3)$ 级别，但常数因子大大下降，适合中小型矩阵全部特征值的高精度计算。

#### 5.5 带原点位移的 QR 算法

分析 QR 方法收敛性时可以发现：$a_{nn}^{(k)}\to\lambda_n\,(k\to\infty)$ 的速度依赖于比值 $r_n=|\lambda_n/\lambda_{n-1}|$，当 $r_n$ 很小时收敛较快。

如果 $s$ 是 $\lambda_n$ 的一个估计，对 $\mathbf{A}-s\mathbf{I}$ 运用 QR 算法：

- $(n,n-1)$ 元素将以收敛因子 $|(\lambda_n-s)/(\lambda_{n-1}-s)|$ 线性收敛于零
- $(n,n)$ 元素将比在基本算法中收敛 **更快**

为了加速收敛，选择数列 $\{s_k\}$，按下述方法构造矩阵序列 $\{\mathbf{A}_k\}$，称为 **带原点位移的 QR 算法**：

**算法流程**　设 $\mathbf{A}=\mathbf{A}_1\in\mathbf{R}^{n\times n}$，对 $k=1,2,\cdots$：

1. 将 $\mathbf{A}_k-s_k\mathbf{I}$ 进行 QR 分解，即
$$\mathbf{A}_k-s_k\mathbf{I}=\mathbf{Q}_k\mathbf{R}_k$$
2. 构造新矩阵
$$\boxed{\mathbf{A}_{k+1}=\mathbf{R}_k\mathbf{Q}_k+s_k\mathbf{I}=\mathbf{Q}_k^{\mathrm{T}}\mathbf{A}_k\mathbf{Q}_k}\qquad (\text{与平移前相似})$$

记 $\tilde{\mathbf{Q}}_k\equiv\mathbf{Q}_1\mathbf{Q}_2\cdots\mathbf{Q}_k,\,\tilde{\mathbf{R}}_k\equiv\mathbf{R}_k\cdots\mathbf{R}_2\mathbf{R}_1$，则有：

1. $\mathbf{A}_{k+1}=\tilde{\mathbf{Q}}_k^{\mathrm{T}}\mathbf{A}\tilde{\mathbf{Q}}_k$
2. 矩阵 $(\mathbf{A}-s_1\mathbf{I})(\mathbf{A}-s_2\mathbf{I})\cdots(\mathbf{A}-s_k\mathbf{I})\equiv\varphi(\mathbf{A})$ 有 QR 分解式 $\varphi(\mathbf{A})=\tilde{\mathbf{Q}}_k\tilde{\mathbf{R}}_k$

##### 带位移 QR 方法变换一步的计算

**首先**用正交变换（左乘平面旋转矩阵）将 $\mathbf{A}_k-s_k\mathbf{I}$ 化为上三角阵：
$$\mathbf{Q}_k^{\mathrm{T}}(\mathbf{A}_k-s_k\mathbf{I})=\mathbf{R}_k$$
其中 $\mathbf{Q}_k^{\mathrm{T}}=\mathbf{P}_{n-1}\cdots\mathbf{P}_2\mathbf{P}_1$ 为一系列平面旋转矩阵的乘积。

**接着**进行右变换完成迭代：
$$\mathbf{A}_{k+1}=\mathbf{P}_{n-1}\cdots\mathbf{P}_2\mathbf{P}_1(\mathbf{A}_k-s_k\mathbf{I})\mathbf{P}_1^{\mathrm{T}}\mathbf{P}_2^{\mathrm{T}}\cdots\mathbf{P}_{n-1}^{\mathrm{T}}+s_k\mathbf{I}$$

选择适当的位移策略，**平均 2 到 3 步就能收敛到一个特征值**，因此总迭代步数约 $2n$ 到 $3n$；叠加 Householder 变换总共只需 $\boxed{O(n^3)}$ 运算量。

`★ Insight ─────────────────────────────────────`
- 带位移 QR 把 $r=\lambda_n/\lambda_{n-1}$ 替换为 $r'=(\lambda_n-s)/(\lambda_{n-1}-s)$，只要 $s$ 接近 $\lambda_n$，$r'$ 就接近 0，每步把一个特征值"挤出"右下角
- "约化到 Hessenberg 阵 + 带位移 QR"是几乎所有数值代数库（LAPACK 的 `xGEEV`、`xSYEV`）求全部特征值的实际算法，今日深度学习中的张量分解仍沿用该范式
- 隐式 QR（Implicit Q Theorem）使得带位移版本可以无须显式构造 $\mathbf{A}_k-s_k\mathbf{I}$，连续两步合并为一次 "double shift"，这是教科书外的实战写法
`─────────────────────────────────────────────────`

### 第九章 总结

**9.1 引言**

- 特征多项式、特征值、特征向量
- 特征值的性质（迹、行列式、相似不变性、Gerschgorin 圆盘定理、Rayleigh 商）

**9.2 幂法**

- 幂法的流程、幂法的收敛性
- 规范化幂法
- 原点平移法、Rayleigh 商加速法

**9.3 反幂法**

- 反幂法的流程、反幂法的收敛性、反幂法的加速（原点平移 + LU 分解）

**9.4 Householder 方法**

- 正交相似变换、上 Hessenberg 阵
- 初等反射阵、Householder 方法
- 用正交相似变换约化矩阵、约化对称矩阵为对称三对角阵

**9.5 QR 算法**

- 平面旋转矩阵、矩阵的 QR 分解
- 用平面旋转矩阵约化矩阵
- 基本 QR 方法、QR 方法的收敛性
- 带原点位移的 QR 方法

**作业**：第九章 习题 1、5、6、9

---

至此第 4—9 章全部完成。本套笔记完整覆盖：插值法、函数逼近与曲线拟合、数值积分与数值微分、解线性方程组的直接法与迭代法、矩阵特征值与特征向量计算。
