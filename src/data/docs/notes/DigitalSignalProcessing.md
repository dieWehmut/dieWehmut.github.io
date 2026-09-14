---
title: Digital Signal Processing
date: 2026-08-27
tags: [DigitalSignalProcessing, Notes]
---
> or 数字信号处理 信号与系统

## 导论

### 信号

> 反映信息的物理量,系统直接进行加工、变换以实现通信的对象，一般是随时间变化的有限的实值函数
> 连续->模拟 离散->数字
> 确定信号 随机信号

> ![alt text](DigitalSignalProcessing/image.png)
> 时域:以时间为自变量描述信号和系统
> 频域:以频率为自变量描述信号和系统

## 信号的时域分析

### 信号的分类

#### 周期信号

- 连续周期信号: $\forall t \in \mathbb{R}, \exists T>0, x(t) = x(t+T), $
- 离散周期信号: $\forall n \in \mathbb{N}, \exists N>0, x[n] = x[n+N], $
- 最小的正T,正N称为基波周期
- $\frac{T_1}{T_2}$为有理数,周期为$T_1和T_2$的最小公倍数
**连续正弦信号一定是周期信号，而正弦序列不一定是周期序列**
**两连续周期信号之和不一定是周期信号，而两周期序列之和一定是周期序列**

#### 能量信号与功率信号


![alt text](DigitalSignalProcessing/image-2.png)
 **能量信号**：$0 < W < \infty, \ P = 0$。
 **功率信号**：$W \to \infty, \ 0 < P < \infty$。
 **直流信号与周期信号都是功率信号**
>信号x(t)可以既非功率信号也非能量信号，不能同时是
>周期信号都是功率信号
>非周期信号可能是能量信号(t→∞,x(t)=0)也可能是功率信号(t→∞,x(t)≠0)

**因果信号**:t≥0时，x(t)≠0; t<0时，x(t)=0
**非因果信号**:在时间零点之前有非零值
>一维 多维 连续 离散 确定 随机

### 信号的运算

#### 信号的尺度变换

- 尺度变换:x(t) → x(at), a>0,
  - 0＜a<1时信号被拉伸，x(at)是x(t)的扩展
  - a>1时信号被压缩,x(at)是x(t)的压缩
- 翻转

#### 信号的时移

- 时移:x(t) → x(t-t_0), 左加右减
![alt text](DigitalSignalProcessing/image-3.png)
#### 信号的加和乘

### 基本连续信号

> 直流信号 正弦信号 实指数信号

- 虚指数信号:$x(t)=e^{jω_0t}$
  - $w_0越大,信号震荡速率越高$
  - $x(t)=Ae^{αt},α为纯虚数$
  - $A=1,x(t) = e^{jω_0t} = cos(ω_0t) + jsin(ω_0t)$
- 虚指数序列:
  - $不随w_0增加而增加震荡速率$
  - $x[n] = Ae^{jω_0n} = A[cos(ω_0n)+jsin(ω_0n)$
- 复指数信号:
   - $x(t)=Ae^{st}$
   - A用极坐标:$A=|A|e^{jθ}$,
   - s用笛卡尔坐标:$s=r+jω_0$,
   - $x(t)=|A|e^{jθ}e^{r+jω_0t}$
       - $=|A|e^{rt}e^{j(ω_0t+θ)}$
       - $=|A|e^{rt}[cos(ω_0t+θ)+jsin(ω_0t+θ)]$
- 复指数序列:$x[n] = Az^n=|A|e^{jθ}(|z|e^{jω_0})^n = |A||z|^{n}[cos(ω_0n+θ)+j|A||z|^{n}sin(ω_0n+θ)]$
>阻尼正弦震荡:有指数衰减振幅的正弦信号

- 抽样信号:
    - $Sa(t) = \frac{\sin(t)}{t}$
    - $Sa(0)=\lim_{t→0} \frac{\sin(t)}{t} = 1$
    - $\int_{-\infty}^{\infty}Sa(kπ) = 0, k为非零整数$
    - $\int_{-\infty}^{\infty}Sa(t)dt=π;\int_{-\infty}^{\infty}Sa(t)dt=\frac{π}{2}$
    - $sinc(t) = \frac{\sin(πt)}{πt}$
- 实指数序列:
  - $x[n] = Ar^{n},n\in\mathbb{Z}$
  - $r=e^β,x[n] = e^{\beta n}$

### 虚指数序列关于时间的周期性

* 虚指数序列：$x[n] = e^{j\omega_0 n}$
* (<span style="color:red;">时间单位$n$的</span>) 周期性 (要求$x[n+N]=x[n]$) ，若
  $e^{j\color{red}{(n+N)}\omega_0} = e^{j\omega_0 n}e^{jN\omega_0} = e^{j\omega_0 n}$

则要求
$e^{j\omega_0 N} = 1$

即 $\omega_0 N$ 需为 $2\pi$ 的整数倍：$\omega_0 N = m2\pi$，$m =$ 正整数时，信号是周期信号

| 连续信号 $e^{j\omega_0 t}$ | 离散时间序列信号 $e^{j\omega_0 n}$ |
| :--- | :--- |
| $\omega_0$ 不同，信号不同 | $\omega_0$ 相差 $2\pi$ 整数倍，信号相同 |
| 任何 $\omega_0$ 信号均为周期信号 | 满足 $\omega_0 N = m2\pi$ 才是周期信号 |
| 基波周期：$\begin{cases} \omega_0 = 0, \text{无定义} \\ \omega_0 ≠ 0, T_0 = 2\pi/\omega_0 \end{cases}$ | 基波周期：$\begin{cases} \omega_0 = 0, \text{无定义} \\ \omega_0 ≠ 0, N = 2\pi m/\omega_0 \end{cases}$ |

### 离散时间单位脉冲与单位阶跃

![alt text](DigitalSignalProcessing/image-5.png)

![alt text](DigitalSignalProcessing/image-6.png)

>相互表示
![alt text](DigitalSignalProcessing/image-7.png)> 

### 其他基本离散时间序列

![alt text](DigitalSignalProcessing/image-8.png)

### 离散信号的差分和求和

![alt text](DigitalSignalProcessing/image-9.png)

### 奇异信号

![alt text](DigitalSignalProcessing/image-10.png)

### 单位阶跃信号

![alt text](DigitalSignalProcessing/image-11.png)

### 冲激信号

![alt text](DigitalSignalProcessing/image-12.png)

![alt text](DigitalSignalProcessing/image-13.png)

![alt text](DigitalSignalProcessing/image-14.png)

![alt text](DigitalSignalProcessing/image-15.png)

### 信号的微分

