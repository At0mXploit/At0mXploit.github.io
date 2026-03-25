---
tags:
  - Rust
---

![](/images/rust.png)

# Hello World

Install rust using:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Verify it works:

```bash
rustc --version
# rustc 1.xx.x (...)

cargo --version
# cargo 1.xx.x (...)
```

**`rustc`** is the Rust compiler. **`cargo`** is Rust's build tool and package manager, we'll use `cargo` for almost everything.

```bash
cargo new hello_world
cd hello_world
```

```bash
(base) ➜  hello_world git:(master) ✗ tree .
.
├── Cargo.toml ← project config (like package.json)
└── src
    └── main.rs
```

`src/main.rs`:

```rust
fn main() {
    println!("Hello, world!");
}
```

| Piece             | Meaning                                               |
| ----------------- | ----------------------------------------------------- |
| `fn main()`       | Entry point of every Rust program                     |
| `println!`        | A **macro** (note the `!`) that prints to the console |
| `"Hello, world!"` | A string literal                                      |

In Rust, macros end with `!`. They're different from regular functions `println!` is the most common one you'll see early on.

```bash
(base) ➜  hello_world git:(master) ✗ cargo run
   Compiling hello_world v0.1.0 (/home/at0m/rust/hello_world)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.01s
     Running `target/debug/hello_world`
Hello, world!
```
# Comments

Comments are ignored by the compiler they're notes for humans reading your code.
### Line Comments `//`

The most common type. Anything after `//` on a line is a comment.

```rust
fn main() {
    // This is a line comment
    println!("Hello, world!"); // can also go at the end of a line
}
```
### Block Comments `/* */`

Spans multiple lines. Useful for temporarily disabling a chunk of code.

```rust
fn main() {
    /*
      This whole block is commented out.
      Nothing here will run.
    */
    println!("Hello, world!");
}
```
### Doc Comments `///`

Doc comments generate **official documentation** for your code using `cargo doc`.

```rust
/// Greets a person by name.
/// 
/// # Examples
/// ```
/// greet("Ferris");
/// ```
fn greet(name: &str) {
    println!("Hello, {}!", name);
}
```

Run `cargo doc --open` and Rust builds a beautiful HTML docs site from these comments automatically. This is how all official Rust library docs are written!
# Variables

Declaring Variables with `let`

```rust
fn main() {
    let x = 5;
    println!("x is: {}", x);
}
```

Simple enough but in Rust, variables are immutable by default. Once set, you can't change them.

```rust
fn main() {
    let x = 5;
    x = 6; // cannot assign twice to immutable variable
}
```

This is intentional, Rust pushes you to write safer, more predictable code. If we _need_ to change a value, explicitly opt in with `mut`:

```rust
fn main() {
    let mut x = 5;
    println!("x is: {}", x);
    x = 6;
    println!("x is now: {}", x);
}
```

Both immutable and normal variable are stored in stack.

Constants are _always_ immutable, must have a type annotation, and are available for the entire lifetime of the program.

```rust
const MAX_SCORE: u32 = 100;

fn main() {
    println!("Max score is: {}", MAX_SCORE);
}
```
### Shadowing

Rust lets you re-declare a variable with the same name this is called **shadowing**:

```rust
fn main() {
    let x = 5;
    let x = x + 1; // shadows the previous x
    let x = x * 2; // shadows again

    println!("x is: {}", x); // prints 12
}
```

Shadowing is different from `mut` you're creating a _new_ variable, not mutating the old one. You can even change the type:

```rust
let spaces = "   ";       // &str (text)
let spaces = spaces.len(); // usize (number) 
```
# Data Types

Rust is a **statically typed** language every value has a type known at compile time. Rust can usually infer the type, but you can always annotate explicitly.

```c
let x: i32 = 5;  // explicit type annotation
let y = 5;       // Rust infers i32
```

Rust types fall into two categories: **Scalar** and **Compound**.
### Scalar Types

A scalar type represents a single value. Rust has four scalar types.
#### 1. Integers

Whole numbers, no decimal point. Pick by size and signed/unsigned:

|Length|Signed|Unsigned|
|---|---|---|
|8-bit|`i8`|`u8`|
|16-bit|`i16`|`u16`|
|32-bit|`i32`|`u32`|
|64-bit|`i64`|`u64`|
|128-bit|`i128`|`u128`|
|arch|`isize`|`usize`|

- **Signed** (`i`) can be negative or positive
- **Unsigned** (`u`) is positive only, but fits larger numbers
- Default is `i32`  is fastest on most systems

```rust
let age: u8 = 22;
let temperature: i32 = -5;
let big: i64 = 1_000_000; // underscores for readability
```
#### 2. Floats

Numbers with a decimal point. Two types: `f32` and `f64` (default).

```rust
let pi: f64 = 3.14159;
let small: f32 = 2.5;
```

Always use `f64` unless you have a specific reason for `f32`, it's more precise and just as fast on modern hardware.
#### 3. Booleans

Either `true` or `false`. Type is `bool`.

```rust
let is_learning: bool = true;
let done: bool = false;
```
#### 4. Characters

A single Unicode character. Type is `char`, uses **single quotes**.

```rust
let letter: char = 'A';
let emoji: char = '🦀'; // yes, Rust supports this!
```

`char` uses single quotes `'A'`. Double quotes `"A"` is a **string**, not a char.
### Compound Types

Compound types group multiple values into one type. Rust has two built-in compound types.
#### 1. Tuples

Group values of **different types** together. Fixed length, can't grow or shrink.

```rust
fn main() {
    let tup: (i32, f64, bool) = (42, 3.14, true);

    // destructure to access values
    let (x, y, z) = tup;
    println!("x={}, y={}, z={}", x, y, z);

    // or access by index
    println!("first: {}", tup.0);
    println!("second: {}", tup.1);
}
```
#### 2. Arrays

Group values of the **same type**. Fixed length, stored on the stack.

```rust
fn main() {
    let nums: [i32; 5] = [1, 2, 3, 4, 5];
    //       type  length

    println!("first: {}", nums[0]);
    println!("last:  {}", nums[4]);

    // fill with same value
    let zeros = [0; 3]; // [0, 0, 0]
}
```

If we need a collection that can grow or shrink? That's a `Vec` (vector). We'll cover that later!
# Conditional Statements

Conditionals let your program make decisions, run this code _if_ something is true, otherwise do something else.
### Basic `if` / `else`

```rust
fn main() {
    let score = 85;

    if score >= 90 {
        println!("Grade: A");
    } else if score >= 80 {
        println!("Grade: B");
    } else if score >= 70 {
        println!("Grade: C");
    } else {
        println!("Grade: F");
    }
}
```

Unlike many languages, Rust does **not** need parentheses around the condition.
### Conditions Must Be `bool`

Rust is strict, the condition **must** evaluate to a `bool`. No truthy/falsy like JavaScript or Python.

```rust
let x = 5;

if x {           // expected bool, found integer
    println!("yes");
}

if x != 0 {      // Passed: explicit bool check
    println!("yes");
}
```
### `if` as an Expression

`if` is an **expression**, meaning it returns a value. You can use it directly in a `let` statement:

```c
fn main() {
    let temperature = 30;

    let weather = if temperature > 25 {
        "hot"
    } else {
        "cold"
    };

    println!("It is {}", weather); // prints: It is hot
}
```

Notice no semicolons on `"hot"` and `"cold"`  the last expression in a block is its return value. Both arms must return the **same type**, or Rust won't compile.
### `match` 

`match` is like a `switch` statement but far more powerful. It checks a value against a series of **patterns**:

```rust
fn main() {
    let day = 3;

    match day {
        1 => println!("Monday"),
        2 => println!("Tuesday"),
        3 => println!("Wednesday"),
        4 => println!("Thursday"),
        5 => println!("Friday"),
        6 | 7 => println!("Weekend!"),   // multiple patterns with |
        _ => println!("Invalid day"),    // _ is the catch-all
    }
}
```

`match` is **exhaustive**, you must cover every possible case, or Rust won't compile. The `_` wildcard handles anything not explicitly listed.
#### `match` as an Expression

Just like `if`, `match` can return a value:

```rust
fn main() {
    let num = 7;

    let kind = match num % 2 {
        0 => "even",
        _ => "odd",
    };

    println!("{} is {}", num, kind); // 7 is odd
}
```
### `if let` Concise Matching

When you only care about **one** pattern and want to ignore the rest, `if let` is cleaner than a full `match`:

```rust
fn main() {
    let favourite: Option<&str> = Some("Rust");

    if let Some(lang) = favourite {
        println!("Favourite language: {}", lang);
    } else {
        println!("No favourite set");
    }
}
```

We'll cover `Option` properly when we get to enums for now just know `if let` is shorthand for a one-arm `match`.
# Enums

An **enum** (enumeration) lets you define a type that can be one of several possible variants. Rust's enums are far more powerful than enums in most other languages since each variant can carry data too.
### Basic Enum

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let go = Direction::North;

    match go {
        Direction::North => println!("Heading North!"),
        Direction::South => println!("Heading South!"),
        Direction::East  => println!("Heading East!"),
        Direction::West  => println!("Heading West!"),
    }
}
```

Use `::` to access a variant. `match` pairs perfectly with enums and since `match` is exhaustive, Rust forces you to handle every variant. 
### Enums with Data

Each variant can hold different types and amounts of data:

```rust
enum Message {
    Quit,                        // no data
    Move { x: i32, y: i32 },    // named fields (like a struct)
    Write(String),               // single String
    ChangeColor(u8, u8, u8),     // three u8 values (RGB)
}

fn main() {
    let msg = Message::Move { x: 10, y: 20 };

    match msg {
        Message::Quit => println!("Quit!"),
        Message::Move { x, y } => println!("Move to ({}, {})", x, y),
        Message::Write(text) => println!("Write: {}", text),
        Message::ChangeColor(r, g, b) => println!("Color: ({}, {}, {})", r, g, b),
    }
}
```

This is something most languages can't do, one enum type that carries completely different data per variant.
### `Option<T>` Rust's Null Safety

Rust has **no null**. Instead, it uses a built-in enum called `Option<T>` to represent a value that may or may not exist:

```rust
enum Option<T> {
    Some(T),   // contains a value
    None,      // no value
}
```

```rust
fn find_score(name: &str) -> Option<i32> {
    if name == "Ferris" {
        Some(100)
    } else {
        None
    }
}

fn main() {
    let result = find_score("Ferris");

    match result {
        Some(score) => println!("Score: {}", score),
        None        => println!("Not found"),
    }
}
```

`Option` is so common in Rust that `Some` and `None` are available without writing `Option::Some` or `Option::None`.

The beauty here: the compiler **forces** you to handle the `None` case. You can never accidentally use a null value and crash your program. A whole class of bugs eliminated at compile time.
### `Result<T, E>` Rust's Error Handling

Another crucial built-in enum is `Result<T, E>`, used whenever something can fail:

```rust
enum Result<T, E> {
    Ok(T),    // success, contains a value
    Err(E),   // failure, contains an error
}
```

```rust
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Cannot divide by zero!"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    match divide(10.0, 2.0) {
        Ok(result) => println!("Result: {}", result),
        Err(e)     => println!("Error: {}", e),
    }
}
```
# Loops

Rust has three kinds of loops: `loop`, `while`, and `for`. Each has its own use case.
### `loop` Loop Forever

`loop` runs forever until you explicitly `break` out of it.

```rust
fn main() {
    let mut count = 0;

    loop {
        count += 1;
        println!("count: {}", count);

        if count == 5 {
            break; // exit the loop
        }
    }
}
```
#### Returning a Value from `loop`

Like `if` and `match`, `loop` is an expression, you can return a value from it via `break`:

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;
        if counter == 10 {
            break counter * 2; // returns 20
        }
    };

    println!("Result: {}", result); // 20
}
```
### `while` Loop with a Condition

Runs as long as the condition is `true`:

```rust
fn main() {
    let mut n = 1;

    while n < 100 {
        n *= 2;
    }

    println!("First power of 2 over 100: {}", n); // 128
}
```
### `for` Loop Over a Collection

The most common loop in Rust. Use it to iterate over arrays, ranges, and any collection:

```rust
fn main() {
    let fruits = ["apple", "banana", "mango"];

    for fruit in fruits {
        println!("I like {}", fruit);
    }
}
```

Ranges with `for`:

```rust
fn main() {
    // 1 up to (not including) 6
    for i in 1..6 {
        println!("{}", i); // 1 2 3 4 5
    }

    // 1 up to and including 6
    for i in 1..=6 {
        println!("{}", i); // 1 2 3 4 5 6
    }
}
```

`enumerate()` Get Index and Value:

```rust
fn main() {
    let langs = ["Rust", "Python", "Go"];

    for (i, lang) in langs.iter().enumerate() {
        println!("{}: {}", i, lang);
    }
    // 0: Rust
    // 1: Python
    // 2: Go
}
```

`continue` Skip an Iteration:

```rust
fn main() {
    for i in 1..=10 {
        if i % 2 == 0 {
            continue; // skip even numbers
        }
        println!("{}", i); // prints only odd numbers
    }
}
```
### Loop Labels Breaking Nested Loops

When you have nested loops, `break` only exits the innermost one. Use **labels** to break out of an outer loop:

```rust
fn main() {
    'outer: for x in 0..5 {
        for y in 0..5 {
            if x + y == 6 {
                println!("Breaking at x={}, y={}", x, y);
                break 'outer; // exits the outer loop entirely
            }
        }
    }
}
```

Labels start with a single quote `'`.
# User Inputs

To read input from the terminal, Rust uses the `std::io` standard library module.
### Basic Input

```rust
use std::io;

fn main() {
    println!("Enter your name:");

    let mut input = String::new(); // mutable String to store input

    io::stdin()
        .read_line(&mut input)
        .expect("Failed to read line");

    println!("Hello, {}!", input.trim());
}
```

Let's break down what's happening:

| Piece                    | Meaning                                                    |
| ------------------------ | ---------------------------------------------------------- |
| `use std::io`            | Bring the I/O module into scope                            |
| `String::new()`          | Create an empty, growable string                           |
| `let mut input`          | Must be `mut`, `read_line` writes into it                  |
| `io::stdin()`            | Get a handle to standard input                             |
| `.read_line(&mut input)` | Read a line and append it to `input`                       |
| `.expect(...)`           | Crash with a message if reading fails                      |
| `.trim()`                | Remove the trailing newline `\n` that `read_line` includes |
### Parsing Input to a Number

`read_line` always gives you a `String`. To use it as a number, you need to **parse** it:

```rust
use std::io;

fn main() {
    println!("Enter your age:");

    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("Failed to read");

    let age: u32 = input.trim().parse().expect("Please enter a valid number");

    println!("You are {} years old.", age);
}
```
#### Handling Bad Input Gracefully with `match`

Using `.expect()` crashes if the user types something invalid. A better approach uses `Result`:

```rust
use std::io;

fn main() {
    println!("Enter a number:");

    let mut input = String::new();
    io::stdin().read_line(&mut input).expect("Failed to read");

    match input.trim().parse::<u32>() {
        Ok(n)  => println!("You entered: {}", n),
        Err(_) => println!("That's not a valid number!"),
    }
}
```
# Vectors

A **vector** (`Vec<T>`) is a growable, heap-allocated list of values of the same type. Flexible arrays.

```rust
fn main() {
    // empty vector with type annotation
    let mut nums: Vec<i32> = Vec::new();

    // or use the vec! macro with initial values
    let fruits = vec!["apple", "banana", "mango"];
}
```

The `vec!` macro is the most common way to create a vector with initial values.
### Adding and Removing Elements

```rust
fn main() {
    let mut nums = Vec::new();

    nums.push(1);   // add to the end
    nums.push(2);
    nums.push(3);

    println!("{:?}", nums); // [1, 2, 3]

    nums.pop();             // remove from the end
    println!("{:?}", nums); // [1, 2]
}
```

|Method|What it does|
|---|---|
|`.push(val)`|Add to the end|
|`.pop()`|Remove and return the last element|
|`.insert(i, val)`|Insert at index `i`|
|`.remove(i)`|Remove element at index `i`|
|`.len()`|Number of elements|
|`.is_empty()`|Returns `true` if empty|
### Accessing Elements

Two ways: direct index or `.get()`:

```rust
fn main() {
    let langs = vec!["Rust", "Go", "Python"];

    // direct index — crashes if out of bounds
    println!("{}", langs[0]); // Rust

    // .get() — returns Option<T>, safe
    match langs.get(5) {
        Some(val) => println!("Found: {}", val),
        None      => println!("Index out of bounds!"),
    }
}
```

Prefer `.get()` when the index might be out of range, it returns `None` instead of crashing your program.
### Iterating Over a Vector

```rust
fn main() {
    let scores = vec![85, 92, 78, 95, 88];

    // read-only iteration
    for score in &scores {
        println!("{}", score);
    }

    // mutable iteration = modify each element
    let mut prices = vec![10, 20, 30];
    for price in &mut prices {
        *price *= 2; // dereference with * to change the value
    }
    println!("{:?}", prices); // [20, 40, 60]
}
```

Use `&scores` to borrow the vector while iterating. Without `&`, the loop would consume (move) the vector and you couldn't use it afterwards. We'll cover this in the Ownership section.
### Useful Vector Methods

```rust
fn main() {
    let nums = vec![3, 1, 4, 1, 5, 9, 2, 6];

    println!("Length:   {}", nums.len());
    println!("Contains 5: {}", nums.contains(&5));

    // sorting — needs a mutable vector
    let mut sorted = nums.clone();
    sorted.sort();
    println!("Sorted: {:?}", sorted); // [1, 1, 2, 3, 4, 5, 6, 9]

    // sum and max using iterators
    let sum: i32 = nums.iter().sum();
    let max = nums.iter().max().unwrap();
    println!("Sum: {}, Max: {}", sum, max);
}
```
### Vector of Different Types with Enums

Vectors must hold the same type but you can get around this using an enum:

```rust
enum Cell {
    Int(i32),
    Float(f64),
    Text(String),
}

fn main() {
    let row = vec![
        Cell::Int(42),
        Cell::Float(3.14),
        Cell::Text(String::from("hello")),
    ];

    for cell in &row {
        match cell {
            Cell::Int(n)   => println!("Int: {}", n),
            Cell::Float(f) => println!("Float: {}", f),
            Cell::Text(s)  => println!("Text: {}", s),
        }
    }
}
```
# Ownership & Borrowing

Ownership is Rust's most unique feature and the thing that makes it different from every other language. It's how Rust guarantees memory safety **without a garbage collector**.

Most languages handle memory one of two ways:

- **Garbage collector** (Python, Go, Java) = automatically frees memory, but adds runtime overhead
- **Manual management** (C, C++) = fast, but easy to cause crashes, leaks, or security bugs
### The Three Rules of Ownership

These are the rules. Everything else follows from them.

1. Every value in Rust has a single **owner**
2. There can only be **one owner at a time**
3. When the owner goes out of scope, the value is **dropped** (freed)

```rust
fn main() {
    let s = String::from("hello"); // s owns the String
} // s goes out of scope here and String is freed automatically
```

No `free()`, no garbage collector. Clean and automatic.
### Move Transferring Ownership

When you assign a value to another variable, ownership **moves**:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // ownership moves to s2

    println!("{}", s1); // ERROR: s1 no longer valid!
    println!("{}", s2); // works fine
}
```

`s1` is no longer valid after the move. Rust prevents you from accidentally using freed memory. This is called a **move**.

This only applies to heap data like `String`. Simple scalar types like integers are **copied** instead of moved because they're cheap to duplicate.

```rust
fn main() {
    let x = 5;
    let y = x; // x is copied, not moved

    println!("x={}, y={}", x, y); // both valid
}
```
### Clone Explicit Deep Copy

If you actually want two independent copies of heap data, use `.clone()`:

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone(); // deep copy both are valid

    println!("s1={}, s2={}", s1, s2); // both work
}
```

`.clone()` is explicit on purpose. Rust wants you to be aware that this is an expensive operation.
### Ownership and Functions

Passing a value to a function **moves** it same as assignment:

```rust
fn print_string(s: String) { // s comes into scope
    println!("{}", s);
} // s is dropped here

fn main() {
    let s = String::from("hello");
    print_string(s);            // ownership moves into the function

    println!("{}", s);          // ERROR: s was moved!
}
```

Returning a value moves ownership back out:

```rust
fn give_string() -> String {
    String::from("hello") // ownership moves to the caller
}

fn main() {
    let s = give_string(); // s now owns the String
    println!("{}", s);     // Valid shit
}
```
### Borrowing with References `&`

Moving ownership in and out of every function is tedious. Instead, you can **borrow** a value using references letting a function use it without taking ownership:

```rust
fn print_string(s: &String) { // borrows, does not own
    println!("{}", s);
} // s goes out of scope but nothing is dropped — it didn't own it

fn main() {
    let s = String::from("hello");
    print_string(&s);  // pass a reference
    println!("{}", s); // s still valid here
}
```

`&s` creates a reference. The function borrows `s` temporarily and gives it back automatically.
### Mutable References `&mut`

References are immutable by default. To allow changes, use `&mut`:

```rust
fn add_exclamation(s: &mut String) {
    s.push_str("!");
}

fn main() {
    let mut s = String::from("hello");
    add_exclamation(&mut s);
    println!("{}", s); // hello!
}
```
#### The Big Rule of Mutable References

You can have **either**:

- Any number of immutable references `&T`
- **OR** exactly one mutable reference `&mut T`

Never both at the same time.

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;
    let r2 = &s;     // multiple immutable refs fine
    let r3 = &mut s; // ERROR: can't borrow as mutable while immutable refs exist

    println!("{}, {}, {}", r1, r2, r3);
}
```

This rule prevents **data races**.
### The Slice Type

Slices let you reference a **portion** of a collection without owning it:

```rust
fn main() {
    let s = String::from("hello world");

    let hello = &s[0..5];  // "hello"
    let world = &s[6..11]; // "world"

    println!("{} {}", hello, world);
}
```

```rust
fn main() {
    let nums = vec![1, 2, 3, 4, 5];
    let middle = &nums[1..4]; // [2, 3, 4]
    println!("{:?}", middle);
}
```
# Closures

A **closure** is an anonymous function you can store in a variable, pass to other functions, or return from functions. What makes closures special is that they can **capture variables from their surrounding scope** regular functions can't do that.

```rust
fn main() {
    // regular function
    fn add(x: i32, y: i32) -> i32 {
        x + y
    }

    // same thing as a closure
    let add = |x, y| x + y;

    println!("{}", add(2, 3)); // 5
}
```

Closure syntax uses `|parameters|` instead of `fn name(parameters)`. Types are usually inferred so you don't need to annotate them.

```rust
// all of these are valid closure forms
let double = |x| x * 2;                    // single expression
let greet  = |name| { println!("Hi, {}!", name); }; // block body
let loud   = |x: i32| -> i32 { x * 2 };   // explicit types
```
### Capturing the Environment

This is the key difference from regular functions. Closures can grab variables from the scope around them:

```rust
fn main() {
    let base = 10;

    let add_base = |x| x + base; // captures `base` from outer scope

    println!("{}", add_base(5));  // 15
    println!("{}", add_base(20)); // 30
}
```

A regular `fn` would refuse to compile here, it can't see `base`. A closure can.
### Three Ways Closures Capture

Rust has three closure traits depending on how they capture variables:
#### `Fn`  Borrow immutably

```rust
fn main() {
    let name = String::from("Ferris");
    let greet = || println!("Hello, {}!", name); // borrows name

    greet(); // Hello, Ferris!
    greet(); // can call multiple times
    println!("{}", name); // name still valid
}
```
#### `FnMut` Borrow mutably

```rust
fn main() {
    let mut count = 0;
    let mut increment = || {
        count += 1;         // mutably borrows count
        println!("count: {}", count);
    };

    increment(); // count: 1
    increment(); // count: 2
}
```
#### `move` Take ownership

Use `move` to force the closure to take ownership of captured variables useful when passing closures to threads:

```rust
fn main() {
    let name = String::from("Ferris");

    let greet = move || println!("Hello, {}!", name); // owns name now

    greet();
    // println!("{}", name); // name was moved into the closure
}
```
### Closures as Function Parameters

Passing behaviour into functions:

```rust
fn apply(f: impl Fn(i32) -> i32, value: i32) -> i32 {
    f(value)
}

fn main() {
    let double = |x| x * 2;
    let square = |x| x * x;

    println!("{}", apply(double, 5)); // 10
    println!("{}", apply(square, 5)); // 25
}
```
### Closures with Iterators

This is the most common place you'll use closures in real Rust code chaining iterator methods:

```rust
fn main() {
    let nums = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map = transform each element
    let doubled: Vec<i32> = nums.iter()
        .map(|x| x * 2)
        .collect();
    println!("{:?}", doubled); // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]

    // filter = keep only matching elements
    let evens: Vec<&i32> = nums.iter()
        .filter(|x| *x % 2 == 0)
        .collect();
    println!("{:?}", evens); // [2, 4, 6, 8, 10]

    // filter + map chained together
    let result: Vec<i32> = nums.iter()
        .filter(|x| *x % 2 == 0)
        .map(|x| x * 10)
        .collect();
    println!("{:?}", result); // [20, 40, 60, 80, 100]

    // fold = reduce to a single value (like reduce in JS)
    let sum = nums.iter().fold(0, |acc, x| acc + x);
    println!("Sum: {}", sum); // 55
}
```
### Returning Closures from Functions

Closures have anonymous types so you need `impl Fn` or `Box<dyn Fn>` to return them:

```rust
fn make_multiplier(factor: i32) -> impl Fn(i32) -> i32 {
    move |x| x * factor // must use move to capture factor
}

fn main() {
    let triple = make_multiplier(3);
    let times5 = make_multiplier(5);

    println!("{}", triple(4)); // 12
    println!("{}", times5(4)); // 20
}
```
### `iter()`, `into_iter()`, and `iter_mut()`

Every time you iterate over a collection in Rust, you have three choices. They differ in **ownership and mutability**:

```rust
fn main() {
    let langs = vec!["Rust", "Go", "Python"];

    // iter() = borrows immutably, collection still usable after
    for lang in langs.iter() {
        println!("{}", lang); // lang is &&str
    }
    println!("Still have: {:?}", langs); // langs still valid

    // into_iter() = consumes (moves) the collection
    for lang in langs.into_iter() {
        println!("{}", lang); // lang is &str
    }
    // println!("{:?}", langs); // langs was consumed!

    // iter_mut() = borrows mutably, allows modifying elements
    let mut scores = vec![70, 80, 90];
    for score in scores.iter_mut() {
        *score += 5; // dereference to modify
    }
    println!("{:?}", scores); // [75, 85, 95] scores still valid
}
```
# Structs

A **struct** lets you group related data together under one named type like a blueprint for creating objects. Rust has three kinds of structs.
### Named Struct

The most common kind, fields have names and types:

```rust
struct Player {
    name: String,
    health: u32,
    level: u8,
    is_alive: bool,
}

fn main() {
    let player = Player {
        name: String::from("Ferris"),
        health: 100,
        level: 1,
        is_alive: true,
    };

    println!("Player: {}", player.name);
    println!("Health: {}", player.health);
}
```
### Mutating a Struct

The entire struct must be `mut`, you can't mark individual fields as mutable:

```rust
fn main() {
    let mut player = Player {
        name: String::from("Ferris"),
        health: 100,
        level: 1,
        is_alive: true,
    };

    player.health -= 20; // whole struct is mut
    println!("Health: {}", player.health); // 80
}
```
### Struct Update Syntax

Create a new struct using values from an existing one with `..`:

```rust
fn main() {
    let player1 = Player {
        name: String::from("Ferris"),
        health: 100,
        level: 1,
        is_alive: true,
    };

    let player2 = Player {
        name: String::from("Crab"),
        ..player1 // copy remaining fields from player1
    };

    println!("{} is level {}", player2.name, player2.level); // Crab is level 1
}
```

`..player1` must come last. Also, fields that contain heap data (like `String`) are **moved** so `player1.name` would be invalid after this if not overridden.
### Tuple Struct

Like a tuple but with a named type fields have no names, only positions:

```rust
struct Color(u8, u8, u8);
struct Point(f64, f64);

fn main() {
    let red   = Color(255, 0, 0);
    let origin = Point(0.0, 0.0);

    println!("R={}, G={}, B={}", red.0, red.1, red.2);
    println!("x={}, y={}", origin.0, origin.1);
}
```

Useful when you want type safety without naming every field  `Color` and `Point` are different types even though both hold three numbers.
### Unit Struct

A struct with no fields at all. Useful for implementing traits with no data:

```rust
struct Marker;

fn main() {
    let _m = Marker; // valid, takes up no memory
}
```
### `impl` Adding Methods to Structs

Use `impl` to attach functions to your struct:

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // associated function (constructor) = no self
    fn new(width: f64, height: f64) -> Rectangle {
        Rectangle { width, height }
    }

    // method = takes &self (read only)
    fn area(&self) -> f64 {
        self.width * self.height
    }

    // method = takes &self
    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }

    // method = takes &mut self (modifies the struct)
    fn scale(&mut self, factor: f64) {
        self.width  *= factor;
        self.height *= factor;
    }

    // method = takes self (consumes the struct)
    fn destroy(self) {
        println!("Rectangle {}x{} destroyed!", self.width, self.height);
    }
}

fn main() {
    let mut rect = Rectangle::new(10.0, 5.0);

    println!("Area:      {}", rect.area());       // 50
    println!("Perimeter: {}", rect.perimeter());  // 30

    rect.scale(2.0);
    println!("After scale: {}x{}", rect.width, rect.height); // 20x10

    rect.destroy(); // rect is consumed — can't use it after this
}
```
#### The Three `self` Types in Methods

|Parameter|Meaning|Use when|
|---|---|---|
|`&self`|Immutable borrow|Reading data|
|`&mut self`|Mutable borrow|Modifying data|
|`self`|Takes ownership|Consuming/transforming|
#### Associated Functions = No `self`

Functions in `impl` without `self` are called **associated functions** called with `::` instead of `.`. Used for constructors:

```rust
let rect = Rectangle::new(10.0, 5.0); // :: not .
```
### Multiple `impl` Blocks

You can split methods across multiple `impl` blocks both are valid:

```rust
impl Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }
}

impl Rectangle {
    fn is_square(&self) -> bool {
        self.width == self.height
    }
}
```
### Printing Structs with `#[derive(Debug)]`

By default structs can't be printed with `println!`. Add `#[derive(Debug)]` to enable it:

```rust
#[derive(Debug)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let p = Point { x: 3.0, y: 4.0 };

    println!("{:?}", p);  // Point { x: 3.0, y: 4.0 }
    println!("{:#?}", p); // pretty-printed, great for nested structs
}
```
# Trait

A **trait** defines shared behaviour it's a way of saying "any type that implements this trait can do these things." Think of traits as Rust's version of interfaces from other languages, but more powerful.
### Defining a Trait

```rust
trait Greet {
    fn hello(&self) -> String;
}
```

This says: any type that implements `Greet` must have a `hello` method that returns a `String`.
### Implementing a Trait

```rust
struct Human {
    name: String,
}

struct Robot {
    model: String,
}

impl Greet for Human {
    fn hello(&self) -> String {
        format!("Hi, my name is {}!", self.name)
    }
}

impl Greet for Robot {
    fn hello(&self) -> String {
        format!("BEEP BOOP. I AM {}.", self.model)
    }
}

fn main() {
    let human = Human { name: String::from("Ferris") };
    let robot = Robot { model: String::from("RX-7") };

    println!("{}", human.hello()); // Hi, my name is Ferris!
    println!("{}", robot.hello()); // BEEP BOOP. I AM RX-7.
}
```
### Default Method Implementations

Traits can provide a default implementation that types can use or override:

```rust
trait Describe {
    fn describe(&self) -> String; // must implement

    fn shout(&self) -> String {   // default = can override or use as is
        self.describe().to_uppercase()
    }
}

struct Car {
    brand: String,
}

impl Describe for Car {
    fn describe(&self) -> String {
        format!("A {} car", self.brand)
    }
    // shout() not implemented — uses the default
}

fn main() {
    let car = Car { brand: String::from("Toyota") };
    println!("{}", car.describe()); // A Toyota car
    println!("{}", car.shout());    // A TOYOTA CAR
}
```
### Traits as Parameters `impl Trait`

Accept any type that implements a trait using `impl Trait` syntax:

```rust
trait Summary {
    fn summarize(&self) -> String;
}

struct Article {
    title: String,
    content: String,
}

struct Tweet {
    username: String,
    message: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}...", self.title, &self.content[..50.min(self.content.len())])
    }
}

impl Summary for Tweet {
    fn summarize(&self) -> String {
        format!("@{}: {}", self.username, self.message)
    }
}

// accepts ANY type that implements Summary
fn print_summary(item: &impl Summary) {
    println!("{}", item.summarize());
}

fn main() {
    let article = Article {
        title: String::from("Rust is Amazing"),
        content: String::from("Rust delivers memory safety without GC..."),
    };
    let tweet = Tweet {
        username: String::from("ferris"),
        message: String::from("I love Rust! 🦀"),
    };

    print_summary(&article);
    print_summary(&tweet); // same function, different types 
}
```
# Generics

**Generics** let you write code that works for multiple types without repeating yourself. Instead of writing the same function for `i32`, then again for `f64`, then again for `String` you write it once with a generic type parameter.
### The Problem Generics Solve

Without generics, you'd need separate functions for every type:

```rust
fn largest_i32(list: &[i32]) -> i32 {
    let mut largest = list[0];
    for &item in list {
        if item > largest { largest = item; }
    }
    largest
}

fn largest_f64(list: &[f64]) -> f64 {
    let mut largest = list[0];
    for &item in list {
        if item > largest { largest = item; }
    }
    largest
}
```
### Generic Functions

Use `<T>` to define a generic type parameter `T` is just a convention, you can use any name:

```rust
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

This won't compile yet Rust doesn't know if `T` supports `>` comparison. We'll fix that with trait bounds below.
### Generic Structs

Structs can hold values of any type using generics:

```rust
struct Pair<T> {
    first: T,
    second: T,
}

fn main() {
    let ints   = Pair { first: 1,     second: 2     };
    let floats = Pair { first: 3.14,  second: 2.71  };
    let words  = Pair { first: "hello", second: "world" };

    println!("{} {}", ints.first, ints.second);
    println!("{} {}", words.first, words.second);
}
```
#### Multiple Generic Parameters

```rust
struct KeyValue<K, V> {
    key: K,
    value: V,
}

fn main() {
    let entry = KeyValue {
        key: String::from("language"),
        value: 42,
    };
    println!("{}: {}", entry.key, entry.value);
}
```
### Generic Enums

You've already used these  `Option<T>` and `Result<T, E>` are generic enums built into Rust:

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```
### Generic `impl` Blocks

Add methods to a generic struct using `impl<T>`:

```rust
struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Stack<T> {
        Stack { items: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    fn peek(&self) -> Option<&T> {
        self.items.last()
    }
}

fn main() {
    let mut stack: Stack<i32> = Stack::new();
    stack.push(1);
    stack.push(2);
    stack.push(3);

    println!("Top: {:?}", stack.peek());  // Some(3)
    println!("Pop: {:?}", stack.pop());   // Some(3)
    println!("Pop: {:?}", stack.pop());   // Some(2)
}
```
### Trait Bounds with Generics

Here's where generics and traits combine. Right now `largest<T>` won't compile because Rust doesn't know if `T` supports `>`. You need to **constrain** `T` to only types that support comparison using a **trait bound**:

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {  // works now = T is guaranteed to support >
            largest = item;
        }
    }
    largest
}

fn main() {
    let nums = vec![34, 50, 25, 100, 65];
    println!("Largest: {}", largest(&nums)); // 100

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("Largest: {}", largest(&chars)); // y
}
```

`T: PartialOrd` means that "T can be any type, **as long as** it implements `PartialOrd`." The `PartialOrd` trait in Rust is used for types that form a [partial order](https://en.wikipedia.org/wiki/Partially_ordered_set), allowing for value comparisons using the standard comparison operators (`<`, `<=`, `>`, `>=`).
### Multiple Trait Bounds

Require `T` to implement more than one trait using `+`:

```rust
use std::fmt::Display;

fn print_largest<T: PartialOrd + Display>(list: &[T]) {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    println!("The largest is: {}", largest); // needs Display to print
}
```
### `where` Clause for Cleaner Syntax

When bounds get long, move them to a `where` clause for readability:

```rust
// hard to read
fn compare<T: PartialOrd + Display + Clone, U: Display>(t: &T, u: &U) -> String {
    format!("{} vs {}", t, u)
}

// much cleaner with where
fn compare<T, U>(t: &T, u: &U) -> String
where
    T: PartialOrd + Display + Clone,
    U: Display,
{
    format!("{} vs {}", t, u)
}
```
### Trait Bounds on `impl` Blocks

You can implement methods only for specific types using trait bounds on `impl`:

```rust
use std::fmt::Display;

struct Wrapper<T> {
    value: T,
}

impl<T: Display> Wrapper<T> {
    fn show(&self) {
        println!("Value: {}", self.value); // only works if T implements Display
    }
}

fn main() {
    let w = Wrapper { value: 42 };
    w.show(); // i32 implements Display

    // Wrapper { value: vec![1,2,3] }.show(); // Vec doesn't implement Display
}
```
### Blanket Implementations

Implement a trait for **any type** that satisfies a bound this is called a blanket implementation:

```rust
trait Printable {
    fn print(&self);
}

// implement Printable for ANY type that implements Display
impl<T: std::fmt::Display> Printable for T {
    fn print(&self) {
        println!("{}", self);
    }
}

fn main() {
    42.print();             
    "hello".print();      
}
```
### Zero Cost Abstraction

Generics in Rust are **monomorphized** at compile time, the compiler generates a specific version of the code for each concrete type used. This means when you write a generic function like this:

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

You're writing one function, but the compiler **generates multiple concrete versions**  one for each type you actually use:

```rust
fn main() {
    let nums  = vec![34, 50, 25, 100];
    let chars = vec!['y', 'm', 'a'];

    largest(&nums);  // compiler generates: largest::<i32>
    largest(&chars); // compiler generates: largest::<char>
}
```

After compilation, the binary contains something equivalent to:

```rust
// generated by the compiler — you never write this
fn largest_i32(list: &[i32]) -> &i32 { /* ... */ }
fn largest_char(list: &[char]) -> &char { /* ... */ }
```

This process is called **monomorphization** "mono" (one) + "morph" (form). The generic, polymorphic code becomes single-type, concrete code.

**No runtime overhead whatsoever.** You get the flexibility of generics with the performance of hand-written specific code. This is what Rust means by _zero cost abstractions_.
# File Handling

Rust's standard library provides everything you need to read and write files through `std::fs` and `std::io`.
## Reading a File
### Read entire file to a String

```rust
use std::fs;

fn main() {
    let content = fs::read_to_string("hello.txt")
        .expect("Could not read file");

    println!("{}", content);
}
```

`fs::read_to_string` is the most convenient option when the file is small enough to fit in memory and you know it contains valid UTF-8 text.
### Read file as raw bytes

```rust
use std::fs;

fn main() {
    let bytes = fs::read("image.png")
        .expect("Could not read file");

    println!("File is {} bytes", bytes.len());
}
```

Use this for binary files (images, executables, etc.) where UTF-8 is not guaranteed.
## Writing a File
### Write a string to a file

```rust
use std::fs;

fn main() {
    fs::write("output.txt", "Hello from Rust!\n")
        .expect("Could not write file");
}
```

`fs::write` creates the file if it doesn't exist, or **overwrites** it entirely if it does.
### Append to an existing file

```rust
use std::fs::OpenOptions;
use std::io::Write;

fn main() {
    let mut file = OpenOptions::new()
        .append(true)
        .create(true)       // create if it doesn't exist
        .open("log.txt")
        .expect("Could not open file");

    writeln!(file, "New log entry").expect("Could not write");
}
```
## Buffered Reading Line by Line

For large files, reading line by line with a `BufReader` is far more memory-efficient than loading the whole file at once:

```rust
use std::fs::File;
use std::io::{self, BufRead};

fn main() {
    let file = File::open("data.txt").expect("Could not open file");
    let reader = io::BufReader::new(file);

    for line in reader.lines() {
        let line = line.expect("Could not read line");
        println!("{}", line);
    }
}
```

`BufReader` wraps the file and reads it in chunks internally, your program only uses a small, fixed amount of memory regardless of file size.
## Buffered Writing

Similarly, `BufWriter` batches small writes together before flushing to disk much faster than writing byte by byte:

```rust
use std::fs::File;
use std::io::{BufWriter, Write};

fn main() {
    let file = File::create("output.txt").expect("Could not create file");
    let mut writer = BufWriter::new(file);

    for i in 0..1000 {
        writeln!(writer, "Line {}", i).expect("Could not write");
    }
    // BufWriter flushes automatically when it goes out of scope
}
```
## Handling Errors Properly

In real programs, `.expect()` crashes on failure. Use `Result` propagation instead:

```rust
use std::fs;
use std::io;

fn read_username() -> Result<String, io::Error> {
    let username = fs::read_to_string("username.txt")?;
    Ok(username.trim().to_string())
}

fn main() {
    match read_username() {
        Ok(name)  => println!("Welcome, {}!", name),
        Err(e)    => println!("Error reading file: {}", e),
    }
}
```

The `?` operator is shorthand for "if this is `Err`, return it immediately from the current function." It propagates errors up the call stack cleanly.
## Working with Paths

Use `std::path::Path` and `PathBuf` rather than raw strings, they handle OS differences (Windows uses `\`, Unix uses `/`) automatically:

```rust
use std::path::Path;

fn main() {
    let path = Path::new("files/data.txt");

    println!("Exists:    {}", path.exists());
    println!("Is file:   {}", path.is_file());
    println!("Is dir:    {}", path.is_dir());
    println!("Extension: {:?}", path.extension());
    println!("Stem:      {:?}", path.file_stem());
}
```

`PathBuf` is the owned, mutable version (like `String` vs `&str`):

```rust
use std::path::PathBuf;

fn main() {
    let mut path = PathBuf::from("project");
    path.push("src");
    path.push("main.rs");

    println!("{}", path.display()); // project/src/main.rs
}
```
## Common File System Operations

```rust
use std::fs;

fn main() {
    // Create a directory
    fs::create_dir("new_folder").expect("Could not create dir");

    // Create nested directories (like mkdir -p)
    fs::create_dir_all("a/b/c").expect("Could not create dirs");

    // Copy a file
    fs::copy("source.txt", "destination.txt").expect("Copy failed");

    // Rename / move a file
    fs::rename("old_name.txt", "new_name.txt").expect("Rename failed");

    // Delete a file
    fs::remove_file("unwanted.txt").expect("Delete failed");

    // Delete an empty directory
    fs::remove_dir("empty_folder").expect("Could not remove dir");

    // Delete a directory and all its contents
    fs::remove_dir_all("full_folder").expect("Could not remove dir");
}
```
## Reading Directory Contents

```rust
use std::fs;

fn main() {
    for entry in fs::read_dir(".").expect("Could not read directory") {
        let entry = entry.expect("Could not read entry");
        let path  = entry.path();

        if path.is_file() {
            println!("File: {}", path.display());
        } else {
            println!("Dir:  {}", path.display());
        }
    }
}
```
# Modules

As your Rust programs grow, dumping everything into one `main.rs` becomes a mess. **Modules** let you split code into logical namespaces, control what's public or private, and organize your project into separate files.
## Defining a Module with `mod`

The simplest module lives inline in the same file:

```rust
mod math {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    pub fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }
}

fn main() {
    let result = math::add(10, 5);
    println!("{}", result); // 15
}
```

Use `::` to access items inside a module just like we've been doing with `Vec::new()` or `String::from()`. Those are module paths too.
## Privacy: `pub` vs Private

By default, **everything in Rust is private**. Nothing inside a module is visible from outside unless you explicitly mark it `pub`.

```rust
mod secret {
    pub fn visible() {
        println!("You can see me!");
    }

    fn hidden() {
        println!("You can't call this from outside.");
    }
}

fn main() {
    secret::visible(); // works
    secret::hidden();  // ERROR: function `hidden` is private
}
```
### Privacy on Structs

For structs, `pub` on the struct makes the type public, but **fields are still private by default**. You need `pub` on each field individually:

```rust
mod user {
    pub struct User {
        pub username: String,  // public
        pub email: String,     // public
        password: String,      // private - callers can't read or set this
    }

    impl User {
        pub fn new(username: &str, email: &str, password: &str) -> User {
            User {
                username: username.to_string(),
                email: email.to_string(),
                password: password.to_string(), // only this module can set it
            }
        }

        pub fn check_password(&self, attempt: &str) -> bool {
            self.password == attempt
        }
    }
}

fn main() {
    let u = user::User::new("ferris", "ferris@rust.dev", "hunter2");
    println!("{}", u.username);              // works - public field
    println!("{}", u.check_password("hunter2")); // works public method
    // println!("{}", u.password);           // ERROR: private field
}
```
### Privacy on Enums

Enums are different if the enum is `pub`, all its variants are automatically public too:

```rust
mod direction {
    pub enum Direction {
        North, // automatically public
        South,
        East,
        West,
    }
}
```
## Nested Modules

Modules can be nested as deep as you like:

```rust
mod engine {
    pub mod fuel {
        pub fn inject() {
            println!("Injecting fuel");
        }
    }

    pub mod ignition {
        pub fn spark() {
            println!("Spark!");
        }
    }
}

fn main() {
    engine::fuel::inject();
    engine::ignition::spark();
}
```
## `use` Bringing Paths into Scope

Typing full paths every time gets tedious. `use` creates a shortcut:

```rust
mod math {
    pub fn square(x: i32) -> i32 { x * x }
    pub fn cube(x: i32)   -> i32 { x * x * x }
}

use math::square;
use math::cube;

fn main() {
    println!("{}", square(4)); // 16 no need for math::square
    println!("{}", cube(3));   // 27
}
```
### Importing Multiple Items

```rust
use math::{square, cube}; // import both in one line
```
### Glob Import

Import everything public from a module with `*`:

```rust
use math::*; // brings in everything — use sparingly
```

Glob imports are convenient but can cause name collisions and make it unclear where something came from. Prefer explicit imports in most cases.
### `as` Rename on Import

```rust
use std::collections::HashMap as Map; // renamed to Map

fn main() {
    let mut m = Map::new();
    m.insert("key", 42);
}
```
## `super` and `self`

Inside a module, you sometimes need to refer to the parent module or the current one.
### `self` current module

```rust
mod greetings {
    pub fn hello() { println!("Hello!"); }

    pub fn hello_and_bye() {
        self::hello(); // explicitly call from this module
        println!("Goodbye!");
    }
}
```
### `super` parent module

```rust
fn top_level() {
    println!("I'm at the top level");
}

mod child {
    pub fn call_parent() {
        super::top_level(); // go up one level
    }
}

fn main() {
    child::call_parent();
}
```
## Splitting Modules into Separate Files

Inline modules are fine for small things, but real projects spread code across files. Rust's module system maps directly to the file system.
### Single-file module

Create a file with the module name:

```
src/
├── main.rs
└── math.rs       ← this becomes the `math` module
```

`src/math.rs`:

```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn subtract(a: i32, b: i32) -> i32 {
    a - b
}
```

`src/main.rs`:

```rust
mod math; // tells Rust: load the `math` module from math.rs

fn main() {
    println!("{}", math::add(3, 4)); // 7
}
```

Just `mod math;` with a semicolon instead of braces. Rust finds `math.rs` automatically.
## `pub use` Re-exporting

Sometimes you want users of your module to access things without knowing the internal structure. `pub use` re-exports an item at a higher level:

```rust
mod engine {
    mod internal {
        pub fn start() {
            println!("Engine started");
        }
    }

    pub use internal::start; // re-export - callers don't need to know about `internal`
}

fn main() {
    engine::start(); // works - internal path is hidden
}
```
## The `crate` Keyword

`crate` refers to the root of the current project. Useful for absolute paths that don't depend on where you are in the module tree:

```rust
mod utils {
    pub fn helper() { println!("helping"); }
}

mod app {
    pub fn run() {
        crate::utils::helper(); // absolute path from the crate root
    }
}
```

---
