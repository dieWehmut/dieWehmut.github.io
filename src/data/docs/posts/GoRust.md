---
title: Go Rust
date: 2026/08/24
tags: [Rust,Code]
codeRunner: true
---

>严肃学习Rust圣经

## 2026-08-24 | Monday

>无gc 安全 "用Rust重写"

Cargo.toml 描述文件

Cargo.lock 依赖

```rust
fn main(){
    let s = "Hello,world aaa!";
    println!("{}",s);
}
```

## 2026-08-25 | Tuesday

### 变量绑定

```rust
fn main() {
    let mut x = 5;//可变
    let _y = 10;//不使用
    println!("The value of x is: {}", x);
    x = 6;
    const MAX_POINTS: u32 = 100_000;
    println!("The value of x is: {}", x);
    let x = x + 1;//变量遮蔽
    {
        let x = x * 2;
        println!("The value of x in the inner scope is: {}", x);
    }
    println!("The value of x is: {}", x);
}
```

struct Struct {
    e: i32
}

```rust
fn main() {
    let (a, b, c, d, e);

    (a, b) = (1, 2);
    // _ 代表匹配一个值，不关心具体的值是什么，用_
    [c, .., d, _] = [1, 2, 3, 4, 5];
    Struct { e, .. } = Struct { e: 5 };

    assert_eq!([1, 2, 1, 4, 5], [a, b, c, d, e]);
}
```

### 基本类型

#### 数值类型

- 有符号整数：i8、i16、i32(默认)、i64、i128、isize、
- 无符号整数：u8、u16、u32、u64、u128、usize
- 浮点类：f32、f64(默认)
- 布尔类型：bool
- 字符类型：char
- 布尔类型：bool
- 字符串切片:&str
- 单元类型：()

- 数字字面量书写:
  - 十进制: 123_456
  - 十六进制: 0xFF
  - 八进制: 0o777
  - 二进制: 0b1111_0000
  - 字节: b'A'

- 整型溢出
  - 使用 --release 参数进行 release 模式构建时，Rust 不检测溢出
  - 补码循环溢出

```rust
fn main() {
  // 断言0.1 + 0.2与0.3相等
  assert!(0.1 + 0.2 == 0.3);
    let abc: (f32, f32, f32) = (0.1, 0.2, 0.3);
    let xyz: (f64, f64, f64) = (0.1, 0.2, 0.3);

    println!("abc (f32)");
    println!("   0.1 + 0.2: {:x}", (abc.0 + abc.1).to_bits());
    println!("         0.3: {:x}", (abc.2).to_bits());
    println!();

    println!("xyz (f64)");
    println!("   0.1 + 0.2: {:x}", (xyz.0 + xyz.1).to_bits());
    println!("         0.3: {:x}", (xyz.2).to_bits());
    println!();

    assert!(abc.0 + abc.1 == abc.2);
    assert!(xyz.0 + xyz.1 == xyz.2);
}
```

```rust
fn main() {
  // 编译器会进行自动推导，给予twenty i32的类型
    let twenty = 20;
    // 类型标注
    let twenty_one: i32 = 21;
    // 通过类型后缀的方式进行类型标注：22是i32类型
    let twenty_two = 22i32;

    // 只有同样类型，才能运算
    let addition = twenty + twenty_one + twenty_two;
    println!("{} + {} + {} = {}", twenty, twenty_one, twenty_two, addition);

    // 对于较长的数字，可以用_进行分割，提升可读性
    let one_million: i64 = 1_000_000;
    println!("{},{:08b}", one_million.pow(2), one_million.pow(2));//左高右低输出二进制01，不足8位则高位补0
    for i in 1..=5 {
        println!("{}",i);
    }
    for i in 'a'..='z' {
        println!("{}",i);
    }
  // 定义一个f32数组，其中42.0会自动被推导为f32类型
    let forty_twos = [
        42.0,
        42f32,
        42.0_f32,
    ];

    // 打印数组中第一个值，并控制小数位为2位
    println!("{:.2}", forty_twos[0]);
}
```

```函数
fn add(i: i32, j: i32) -> i32 {
    i + j
}
```

### 所有权

>内存三种流派:
- GC:go,java
- 手动管理:C,C++
- 所有权:Rust

#### 复杂类型

- String

```rust
fn main(){
    let s1 = String::from("hello");
    let s2 = s1;

    println!("{}, world!", s1);//error
}

- 不会自动创建数据的深拷贝

```rust
fn main(){
    let s1 = String::from("hello");
    let s2 = s1.clone();

    println!("s1 = {}, s2 = {}", s1, s2);
}
```

>&str：借来的/固定的字符串视图；String = 自己拥有、可以修改和扩展的字符串

### 引用与借用

- 可变引用同时只能存在一个
- 可变引用与不可变引用不能同时存在
- 
```rust
fn main(){
    let mut s = String::from("hello");
    let r1 = &mut s;
    let r2 = &mut s;
    println!("{}, {}", r1, r2);
}
```

```rust
fn main(){
    let mut s = String::from("hello");

    let r1 = &s; // 没问题
    let r2 = &s; // 没问题
    let r3 = &mut s; // 有问题

    println!("{}, {}, and {}", r1, r2, r3);
}
```

## 2026-08-26 | Wednesday

### 复合类型

#### 切片

```rust
fn main(){
    let s = String::from("hello world");
    let hello = &s[0..5];//[0,5)
    let world = &s[6..11];
    say_hello(&s);
    say_hello(&s[..]);
    say_hello(s.as_str());
    println!("s = {}", s);
    println!("hello = {}", hello);
    println!("world = {}", world);
}
fn say_hello(s: &str) {
    println!("{}",s);
}
```

## 2026-08-27 | Thursday

### 字符串索引

```rust
fn main(){
    let s1 = String::from("hello");
    let h = s1[0];//error
}
```

## 2026-08-28 | Friday

### 元组

```rust
fn main() {
    let tup: (i32, f64, u8) = (500, 6.4, 1);
}
```

```rust
fn main() {
    let tup = (500, 6.4, 1);

    let (x, y, z) = tup;

    println!("The value of y is: {}", y);
    let x: (i32, f64, u8) = (500, 6.4, 1);

    let five_hundred = x.0;

    let six_point_four = x.1;

    let one = x.2;
    println!("The value of five_hundred is: {}", five_hundred);
    println!("The value of six_point_four is: {}", six_point_four);
    println!("The value of one is: {}", one);
    let s1 = String::from("hello");

    let (s2, len) = calculate_length(s1);

    println!("The length of '{}' is {}.", s2, len);
}
fn calculate_length(s: String) -> (String, usize) {
    let length = s.len(); // len() 返回字符串的长度

    (s, length)
}
```

### 结构体

```rust
fn main() {
    let mut user1 = User {
        email: String::from("someone@example.com"),
        username: String::from("someusername123"),
        active: true,
        sign_in_count: 1,
    };
    let user2 = User {
        email: String::from("another@example.com"),
        ..user1
    };
    user1.email = String::from("anotheremail@example.com");
    println!("user1.email = {}", user1.email);
    println!("user2.email = {}", user2.email);
}
```

#### 元组结构体

>没有名称

```rust
fn main() {
    struct Color(i32, i32, i32);
    struct Point(i32, i32, i32);

    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
}
```

#### 单元结构体

```rust
fn main() {
    struct AlwaysEqual;

    let subject = AlwaysEqual;

    // 我们不关心 AlwaysEqual 的字段数据，只关心它的行为，因此将它声明为单元结构体，然后再为它实现某个特征
    impl SomeTrait for AlwaysEqual {

    }
}
```

## 2026-08-30 | Sunday

### 枚举

```rust
enum PokerSuit {
  Clubs,
  Spades,
  Diamonds,
  Hearts,
}
struct PokerCard {
    suit: PokerSuit,
    value: u8
}
fn main() {
    let heart = PokerSuit::Hearts;
    let diamond = PokerSuit::Diamonds;
    let c1 = PokerCard {
        suit: PokerSuit::Clubs,
        value: 1,
    };
    let c2 = PokerCard {
        suit: PokerSuit::Diamonds,
        value: 12,
    };
    print_suit(heart);
    print_suit(diamond);
    print_card(c1);
    print_card(c2);
}

fn print_suit(card: PokerSuit) {
    // 需要在定义 enum PokerSuit 的上面添加上 #[derive(Debug)]，否则会报 card 没有实现 Debug
    println!("{:?}",card);
}
```

### 数组

```rust
fn main(){
    let a: [i32; 5] = [1, 2, 3, 4, 5];

    let slice: &[i32] = &a[1..3];

    assert_eq!(slice, &[2, 3]);
}
```

### 流程控制

```rust
fn main() {
    let n = 6;

    if n % 4 == 0 {
        println!("number is divisible by 4");
    } else if n % 3 == 0 {
        println!("number is divisible by 3");
    } else if n % 2 == 0 {
        println!("number is divisible by 2");
    } else {
        println!("number is not divisible by 4, 3, or 2");
    }
    for i in 1..=5 {
        println!("{}", i);
    }
    let a = [4, 3, 2, 1];
    // `.iter()` 方法把 `a` 数组变成一个迭代器
    for (i, v) in a.iter().enumerate() {
        println!("第{}个元素是{}", i + 1, v);
    }

    let mut counter = 0;

    let result = loop {
        counter += 1;

        if counter == 10 {
            break counter * 2;
        }
    };
    println!("The result is {}", result);
}   
```

## 2026-09-02 | Wednesday

### 模式匹配

```rust
enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter,
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny =>  {
            println!("Lucky penny!");
            1
        },
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter => 25,
    }
}
enum MyEnum {
    Foo,
    Bar
}
fn main() {
    let v = Some(3u8);
    match v {
        Some(3) => println!("three"),
        _ => (),
    }

    let s = vec![MyEnum::Foo,MyEnum::Bar,MyEnum::Foo];
    
    for item in s {
        match item {
            MyEnum::Foo => println!("Found a Foo"),
            MyEnum::Bar => println!("Found a Bar"),
        }
    }

    let coin = Coin::Penny;
    let value = value_in_cents(coin);
    println!("The value of the coin is {} cents.", value);
}
```