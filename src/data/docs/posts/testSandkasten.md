---
title: Sandkasten 测试
date: 2026-06-13
tags: [sandkasten]
---

## Sandkasten 测试

本文测试 <a href="https://github.com/dieWehmut/sandkasten" target="_blank" rel="noopener noreferrer">Sandkasten</a>后端支持的全部语言 / 运行时。

## 系统 / 底层

### Go

```go
package main

import "fmt"

func main() {
	fmt.Println("hello from Go")
}
```

### Assembly (GAS x86-64)

```asm
.section .rodata
msg: .string "hello from Assembly\n"
len = . - msg

.section .text
.globl main
main:
    movq $1, %rax
    movq $1, %rdi
    leaq msg(%rip), %rsi
    movq $len, %rdx
    syscall
    xorl %eax, %eax
    ret
```

### C

```c
#include <stdio.h>

int main() {
    printf("hello from C\n");
    return 0;
}
```

### C++

```cpp
#include <iostream>

int main() {
    std::cout << "hello from C++" << std::endl;
    return 0;
}
```

### Rust

```rust
fn main() {
    println!("hello from Rust");
}
```

### Zig

```zig
extern fn write(fd: i32, buf: [*]const u8, count: usize) isize;

pub fn main() void {
    const msg = "hello from Zig\n";
    _ = write(1, msg.ptr, msg.len);
}
```

### V

```v
fn main() {
    println("hello from V")
}
```

### Nim

```nim
echo "hello from Nim"
```

### Pascal (Free Pascal)

```pascal
program Hello;
begin
  writeln('hello from Pascal');
end.
```

### Fortran

```fortran
program hello
  print *, "hello from Fortran"
end program hello
```

## 脚本语言

### Python

```python
print("hello from Python")
```

### JavaScript

```javascript
console.log("hello from JavaScript");
```

### TypeScript

```typescript
const msg: string = "hello from TypeScript";
console.log(msg);
```

### Ruby

```ruby
puts "hello from Ruby"
```

### Perl

```perl
print "hello from Perl\n";
```

### PHP

```php
<?php
echo "hello from PHP\n";
```

### Lua

```lua
print("hello from Lua")
```

### R

```r
cat("hello from R\n")
```

### Julia

```julia
println("hello from Julia")
```

### Dart

```dart
void main() {
  print("hello from Dart");
}
```

### Crystal

```crystal
puts "hello from Crystal"
```

### Bash

```bash
echo "hello from Bash"
```

## JVM / 函数式

### Java

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("hello from Java");
    }
}
```

### Kotlin

```kotlin
fun main() {
    println("hello from Kotlin")
}
```

### Scala

```scala
object Main {
  def main(args: Array[String]): Unit = {
    println("hello from Scala")
  }
}
```

### Clojure

```clojure
(println "hello from Clojure")
```

### Gleam

```gleam
import gleam/io

pub fn main() {
  io.println("hello from Gleam")
}
```

## .NET

### C#

```csharp
using System;

class Program {
    static void Main() {
        Console.WriteLine("hello from C#");
    }
}
```

### F#

```fsharp
printfn "hello from F#"
```

## 函数式 / 证明助手

### Haskell

```haskell
main :: IO ()
main = putStrLn "hello from Haskell"
```

### OCaml

```ocaml
print_endline "hello from OCaml"
```

### Elixir

```elixir
IO.puts("hello from Elixir")
```

### Erlang

```erlang
-module(main).
-export([main/0]).

main() ->
    io:format("hello from Erlang~n"),
    erlang:halt(0).
```

### Racket

```racket
#lang racket
(displayln "hello from Racket")
```

### Lean 4

```lean4
def main : IO Unit :=
  IO.println "hello from Lean 4"

#eval main
```

### Coq

```coq
Definition hello_from_coq : True := I.
```

### Prolog

```prolog
main :-
    write('hello from Prolog'),
    nl,
    halt.

:- main.
```

## 前端 / 标记语言

### HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello</title>
</head>
<body>
  <h1>hello from HTML</h1>
</body>
</html>
```

### CSS

```css
.greeting {
  font: 700 2rem/1.2 system-ui, sans-serif;
  color: #0f766e;
}
```

```file style-preview.html lang=html
<main class="greeting">hello from CSS</main>
```

### SCSS

```scss
$accent: #7c2d12;

.greeting {
  font-family: system-ui, sans-serif;
  color: $accent;

  strong {
    color: #0f766e;
  }
}
```

```file style-preview.html lang=html
<main class="greeting">hello from <strong>SCSS</strong></main>
```

### TailwindCSS

```tailwindcss
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .greeting {
    @apply p-8 text-2xl font-bold text-teal-700;
  }
}
```

```file style-preview.html lang=html
<main class="greeting">hello from TailwindCSS</main>
```

### TSX (React)

```tsx
export default function Home() {
  return <h1>hello from TSX</h1>;
}
```

### Vue 3

```vue
<template>
  <h1>hello from Vue 3</h1>
</template>

<script setup>
const msg = "hello from Vue 3";
</script>
```

### QML

```qml
import QtQml 2.15

QtObject {
    Component.onCompleted: {
        console.log("hello from QML")
        Qt.quit()
    }
}
```

### Next.js

```nextjs
export default function Page() {
  return <h1>hello from Next.js</h1>;
}
```

## 标记语言 / 文档

### Markdown

```markdown
# hello from Markdown

This is a **Markdown** document.
```

### MDX

```mdx
# hello from MDX

<strong>hello from MDX</strong>
```

### LaTeX

```latex
\documentclass{article}
\begin{document}
hello from LaTeX
\end{document}
```

### Typst

```typst
#set page(width: auto, height: auto)
hello from Typst
```

### Graphviz (DOT)

```dot
digraph G {
    rankdir=LR;
    hello [label="hello from Graphviz", shape=box, style=filled, fillcolor=lightblue];
}
```

## 科学计算 / 数学

### Octave

```octave
disp("hello from GNU Octave");
```

### MATLAB (Octave compatible)

```octave
fprintf("hello from MATLAB\n");
```

## 数据库

### SQL (SQLite)

```sql
SELECT 'hello from SQL' AS greeting;
```

## 领域特定语言

### GDScript (Godot)

```gdscript
extends SceneTree

func _init():
    print("hello from GDScript")
    quit()
```

### Nextflow

```nextflow
workflow {
  println "hello from Nextflow"
}
```

### WDL

```wdl
version 1.0

workflow hello_wf {
  output {
    String message = "hello from WDL"
  }
}
```

## 新兴语言

### Mojo

```mojo
def main():
    print("hello from Mojo")
```

### 仓颉 (Cangjie)

```cangjie
main(): Int64 {
    println("hello from 仓颉")
    return 0
}
```

### Swift

```swift
print("hello from Swift")
```
