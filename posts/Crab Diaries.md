---
tags:
  - Rust
---

![](/images/rust.png)

> Code snippets for everything covered here are available at [github.com/At0mXploit/Crab-Diaries](https://github.com/At0mXploit/Crab-Diaries/)

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

    // direct index  crashes if out of bounds
    println!("{}", langs[0]); // Rust

    // .get()  returns Option<T>, safe
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

    // sorting  needs a mutable vector
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
} // s goes out of scope but nothing is dropped  it didn't own it

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
# Lifetimes

Every reference in Rust has a **lifetime**, the scope for which that reference is valid. Most of the time Rust figures this out automatically and you never think about it. But sometimes the compiler needs help, and that's when you write lifetime annotations explicitly.

Lifetimes exist to prevent **dangling references**, pointers to data that no longer exists:

```rust
fn main() {
    let r;
    {
        let x = 5;
        r = &x; // borrow x
    }           // x is dropped here
    
    println!("{}", r); // ERROR: x no longer exists, r is dangling
}
```

Rust catches this at compile time. Every reference is checked to ensure it never outlives the data it points to. Lifetimes are how the compiler reasons about this.
### Lifetime Annotations Syntax

Lifetime annotations use a tick `'` followed by a name, by convention short lowercase letters like `'a`, `'b`:

```rust
&i32        // a reference
&'a i32     // a reference with an explicit lifetime 'a
&'a mut i32 // a mutable reference with an explicit lifetime 'a
```

A single lifetime annotation means nothing on its own. They describe **relationships** between the lifetimes of multiple references, telling the compiler how the lifetimes of inputs and outputs relate to each other.

The borrow checker compares scopes to make sure all borrows are valid. When a function takes multiple references and returns one, the compiler can't tell on its own which input the output is borrowed from. You have to say so explicitly.

```rust
// which input does the return value borrow from? x or y?
// the compiler has no idea
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

This fails to compile. The fix is a lifetime annotation:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` here is saying: "the returned reference will be valid for as long as **both** `x` and `y` are valid",  i.e., the shorter of the two lifetimes. The compiler can now enforce that the caller doesn't use the return value after either input goes out of scope.

```rust
fn main() {
    let s1 = String::from("long string");
    let result;

    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("{}", result); // valid  both s1 and s2 alive here
    }

    // println!("{}", result); // ERROR: s2 is dropped, result might point to s2
}
```

This is the key thing to understand: **annotations describe lifetimes, they don't extend or change them.** You're not telling the compiler to make something live longer. You're telling it which things are connected so it can verify the code itself.

Think of it like labels. `'a` is just a label you put on references to say "these two are linked."
### Lifetime Elision

Rust has rules called **lifetime elision** that let the compiler fill in obvious lifetimes automatically, so you don't have to annotate everything. There are three rules:

**Rule 1**: Each reference parameter gets its own lifetime:

```rust
fn foo(x: &str) -> &str          // becomes:
fn foo<'a>(x: &'a str) -> &'a str
```

**Rule 2**: If there's exactly one input lifetime, it's assigned to all output lifetimes:

```rust
fn foo(x: &str) -> &str
// compiler infers: output borrows from x  no annotation needed
```

**Rule 3**: If one of the inputs is `&self` or `&mut self`, its lifetime is assigned to all outputs:

```rust
impl MyStruct {
    fn get(&self) -> &str // compiler infers output borrows from self
}
```

If after applying all three rules the compiler still can't figure out lifetimes, it will ask you to annotate. That's when you write `'a`.

```rust
// no annotation needed  rule 2 applies (one input reference)
fn first_word(s: &str) -> &str {
    &s[..5]
}

// annotation needed  two input references, compiler can't guess which the output borrows from
fn longer<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```
### Lifetime Subtyping

Sometimes one lifetime needs to outlive another. You express this with `'a: 'b`,  read as "`'a` outlives `'b`":

```rust
struct Context<'s>(&'s str);

struct Parser<'c, 's: 'c> {
    context: &'c Context<'s>,
    // 's must outlive 'c  the context must live at least as long as the parser
}

impl<'c, 's> Parser<'c, 's> {
    fn parse(&self) -> &'s str {
        self.context.0
    }
}
```

You won't write this often, but when you need it, it's the tool.
### Common Lifetime Mistakes

**Returning a reference to a local variable**, the most common mistake:

```rust
fn make_string<'a>() -> &'a str {
    let s = String::from("hello");
    &s // ERROR: s is dropped at end of function, reference would dangle
}
```

There's no annotation that fixes this. The solution is to return an owned value:

```rust
fn make_string() -> String {
    String::from("hello") // return ownership, not a reference
}
```

**Holding a borrow and a mutation simultaneously**:

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let first = &v[0];    // immutable borrow
    v.push(4);            // ERROR: mutable borrow while immutable borrow exists
    println!("{}", first);
}
```

The fix is to not hold `first` across the mutation:

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let first_val = v[0]; // copy the value instead of borrowing
    v.push(4);
    println!("{}", first_val); // fine
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

    rect.destroy(); // rect is consumed  can't use it after this
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
    // shout() not implemented  uses the default
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
// generated by the compiler  you never write this
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
use math::*; // brings in everything  use sparingly
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
# Threads

Modern computers have multiple cores. **Threads** let your program run multiple pieces of code at the same time, taking advantage of that hardware. Rust's ownership system makes concurrent programming far safer than in C, C++, or even Go a whole class of bugs simply won't compile.
## Spawning a Thread

Use `std::thread::spawn` to start a new thread. Pass it a closure with the code to run:

```rust
use std::thread;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("thread: {}", i);
        }
    });

    for i in 1..=5 {
        println!("main:   {}", i);
    }

    handle.join().unwrap(); // wait for the thread to finish
}
```

Output will be interleaved both loops run at the same time, so the order is non-deterministic. That's threading.
### `join()` Wait for a Thread

`spawn` returns a `JoinHandle`. Calling `.join()` on it blocks the current thread until the spawned thread finishes:

```rust
let handle = thread::spawn(|| {
    println!("doing work...");
});

handle.join().unwrap(); // main waits here until the thread is done
println!("thread finished");
```

Without `.join()`, the main thread might exit and kill all spawned threads before they finish their work.
## `move` Closures with Threads

Threads need to **own** the data they use. You can't borrow data from main and pass it to a thread the thread might outlive the scope where the data lives. Rust catches this:

```rust
use std::thread;

fn main() {
    let name = String::from("Ferris");

    let handle = thread::spawn(|| {
        println!("Hello, {}!", name); // ERROR: may outlive borrowed value
    });

    handle.join().unwrap();
}
```

The fix is `move`. It transfers ownership of captured variables into the thread:

```rust
use std::thread;

fn main() {
    let name = String::from("Ferris");

    let handle = thread::spawn(move || {
        println!("Hello, {}!", name); // name is owned by the thread now
    });

    handle.join().unwrap();
}
```
## Spawning Multiple Threads

```rust
use std::thread;

fn main() {
    let mut handles = vec![];

    for i in 0..5 {
        let handle = thread::spawn(move || {
            println!("Thread {} running", i);
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("All threads done");
}
```

Collect all handles, then join them all at the end.
## Sleeping a Thread

```rust
use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        println!("Starting work...");
        thread::sleep(Duration::from_millis(500));
        println!("Done after 500ms");
    });

    handle.join().unwrap();
}
```
## Communicating Between Threads: Channels

The recommended way for threads to talk to each other in Rust is **message passing** via channels. Think of it like a pipe one end sends, the other receives

"Do not communicate by sharing memory; share memory by communicating." - Go proverb, fully embraced by Rust too.

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel(); // tx = transmitter, rx = receiver

    thread::spawn(move || {
        tx.send(String::from("hello from thread")).unwrap();
    });

    let message = rx.recv().unwrap(); // blocks until a message arrives
    println!("Received: {}", message);
}
```

`mpsc` stands for **multiple producer, single consumer** multiple threads can send, but only one receives.
### Sending Multiple Messages

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec!["one", "two", "three", "four"];

        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(Duration::from_millis(200));
        }
    });

    for received in rx { // rx acts as an iterator  loops until sender drops
        println!("Got: {}", received);
    }
}
```

The `for received in rx` loop ends automatically when the sender (`tx`) is dropped. That signals "no more messages."
### Multiple Senders

Clone `tx` to give multiple threads their own sender:

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    for i in 0..3 {
        let tx_clone = tx.clone(); // each thread gets its own sender
        thread::spawn(move || {
            tx_clone.send(format!("message from thread {}", i)).unwrap();
        });
    }

    drop(tx); // drop the original so rx knows when all senders are gone

    for msg in rx {
        println!("{}", msg);
    }
}
```
## Shared State: `Arc` and `Mutex`

Channels are great for passing ownership of data. But sometimes multiple threads genuinely need to **share and mutate** the same data. For that you need:

- `Mutex<T>` = Mutual exclusion lock. Only one thread can access the data at a time.
- `Arc<T>` = Atomically Reference Counted. Like `Rc<T>` but safe to share across threads.

They always go together:

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0)); // shared, thread-safe counter
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter); // cheap clone of the pointer

        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap(); // lock - only one thread at a time
            *num += 1;
        }); // lock is released here automatically (dropped)

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", *counter.lock().unwrap()); // 10
}
```

| Piece        | Role                                                            |
| ------------ | --------------------------------------------------------------- |
| `Mutex<T>`   | Guards the data, only the thread holding the lock can access it |
| `.lock()`    | Acquires the lock, blocks if another thread holds it            |
| `Arc<T>`     | Lets multiple threads share ownership of the `Mutex`            |
| `Arc::clone` | Increments the reference count (not a deep copy)                |

When the `MutexGuard` (what `.lock()` returns) goes out of scope, the lock is released automatically. No manual unlocking.
### Deadlocks

A **deadlock** happens when two threads each hold a lock and are waiting for the other's lock, both freeze forever. Rust can't prevent deadlocks at compile time, but the rules around `Mutex` and `Arc` prevent _data races_ (two threads writing at the same time without synchronization). Those are different problems:

- **Data race** → Rust prevents at compile time 
- **Deadlock** → You still need to think about this 
## `Send` and `Sync` Traits

Rust uses two marker traits to enforce thread safety at compile time:

|Trait|Meaning|
|---|---|
|`Send`|Safe to **transfer ownership** to another thread|
|`Sync`|Safe to **share a reference** across threads|

Almost all types implement both automatically. The notable exceptions:

- `Rc<T>` is **not** `Send` . Use `Arc<T>` across threads instead
- `RefCell<T>` is **not** `Sync`. Use `Mutex<T>` across threads instead
- Raw pointers are neither
## Channels vs Shared State. When to Use What

|Situation|Reach for|
|---|---|
|One thread produces, another consumes|`mpsc::channel`|
|Passing ownership of data to another thread|`mpsc::channel`|
|Multiple threads need to read/write the same value|`Arc<Mutex<T>>`|
|Simple counter or flag shared across threads|`Arc<Mutex<T>>` or atomics|
# Async / Await

Threads are great for CPU-heavy work running in parallel. But a lot of real programs spend most of their time waiting, waiting for a network response, a file to load, a database query to return. Spawning a full OS thread just to sit and wait is wasteful.

**Async** is Rust's solution. It lets you write code that _looks_ synchronous but can pause at await points and let other tasks run in the meantime all on a small number of threads.

```
Threads  → great for CPU-bound work (heavy computation)
Async    → great for I/O-bound work (waiting on network, files, db)
```

With threads, blocking one thread means that thread is frozen, doing nothing, wasting resources. With async, a task that's waiting simply yields control, and the runtime runs something else until the result is ready.
## `async` and `await`

Mark a function with `async` to make it asynchronous. Inside it, use `.await` to pause until a value is ready:

```rust
async fn fetch_data() -> String {
    // imagine this hits a network or database
    String::from("data arrived")
}

async fn main_logic() {
    let result = fetch_data().await; // pause here until fetch_data finishes
    println!("{}", result);
}
```

An `async fn` doesn't run immediately when called it returns a **Future**. Nothing actually happens until you `.await` it or hand it to a runtime.
## Futures

A `Future` is Rust's representation of "a value that isn't ready yet." It's a trait:

```rust
// simplified version of what the standard library defines
trait Future {
    type Output;
    fn poll(&mut self) -> Poll<Self::Output>;
}
```

When you write `async fn`, the compiler transforms your function into a state machine that implements `Future` under the hood. You almost never implement `Future` manually `async`/`await` does it for you.

**A Future does nothing until polled**. Calling an async function just builds the state machine. Awaiting it (or giving it to a runtime) is what drives it forward.

Unlike threads (which the OS manages), async tasks need a **runtime** to schedule and drive them. Rust's standard library defines the `Future` trait but ships no runtime you pick one for your use case.

The most popular runtime by far is **Tokio**:

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

Use the `#[tokio::main]` macro to make `main` async:

```rust
#[tokio::main]
async fn main() {
    println!("Hello from async main!");
}
```

Under the hood this expands to roughly:

```rust
fn main() {
    tokio::runtime::Runtime::new()
        .unwrap()
        .block_on(async {
            println!("Hello from async main!");
        });
}
```
## Basic Example

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    println!("start");
    sleep(Duration::from_secs(1)).await; // pause for 1 second, yield to runtime
    println!("done after 1 second");
}
```

`tokio::time::sleep` is the async version of `thread::sleep`. The difference: `thread::sleep` _blocks_ the whole thread. `sleep(...).await` just pauses this task, the thread is free to run other tasks during that second.
## Running Tasks Concurrently: `tokio::spawn`

Spawning an async task is like spawning a thread but lightweight. Thousands of async tasks can run on just a few threads:

```rust
use tokio::time::{sleep, Duration};

async fn task(name: &str, delay_ms: u64) {
    sleep(Duration::from_millis(delay_ms)).await;
    println!("{} done", name);
}

#[tokio::main]
async fn main() {
    let a = tokio::spawn(task("A", 300));
    let b = tokio::spawn(task("B", 100));
    let c = tokio::spawn(task("C", 200));

    a.await.unwrap();
    b.await.unwrap();
    c.await.unwrap();

    println!("all done");
}
// Output:
// B done  (100ms)
// C done  (200ms)
// A done  (300ms)
// all done
```

All three tasks start at the same time and finish in order of their delay total time ~300ms, not 600ms. That's concurrency.
## `join!` Await Multiple Futures at Once

`tokio::join!` runs multiple futures concurrently and waits for **all** of them:

```rust
use tokio::time::{sleep, Duration};

async fn fetch_users() -> Vec<String> {
    sleep(Duration::from_millis(200)).await;
    vec!["Alice".into(), "Bob".into()]
}

async fn fetch_config() -> String {
    sleep(Duration::from_millis(150)).await;
    "config loaded".into()
}

#[tokio::main]
async fn main() {
    let (users, config) = tokio::join!(fetch_users(), fetch_config());
    // both run concurrently total ~200ms, not 350ms

    println!("{:?}", users);
    println!("{}", config);
}
```

Compare to awaiting sequentially:

```rust
// sequential 200ms + 150ms = 350ms total
let users  = fetch_users().await;
let config = fetch_config().await;

// concurrent with join! max(200ms, 150ms) = 200ms total
let (users, config) = tokio::join!(fetch_users(), fetch_config());
```
## `select!` Race Futures, Take the First

`tokio::select!` runs multiple futures and proceeds with whichever finishes first, cancelling the rest:

```rust
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    tokio::select! {
        _ = sleep(Duration::from_millis(100)) => {
            println!("100ms elapsed first");
        }
        _ = sleep(Duration::from_millis(500)) => {
            println!("500ms elapsed first"); // never reached
        }
    }
}
```

Useful for timeouts:

```rust
use tokio::time::{sleep, Duration};

async fn slow_operation() -> String {
    sleep(Duration::from_secs(10)).await;
    "result".into()
}

#[tokio::main]
async fn main() {
    tokio::select! {
        result = slow_operation() => {
            println!("Got: {}", result);
        }
        _ = sleep(Duration::from_secs(2)) => {
            println!("Timed out after 2 seconds");
        }
    }
}
```
## Async Error Handling

Async functions return `Result` just like sync functions  combine with `?` as usual:

```rust
use tokio::fs;

async fn read_file(path: &str) -> Result<String, std::io::Error> {
    let content = fs::read_to_string(path).await?; // ? works inside async fn
    Ok(content)
}

#[tokio::main]
async fn main() {
    match read_file("data.txt").await {
        Ok(content) => println!("{}", content),
        Err(e)      => println!("Error: {}", e),
    }
}
```
## Async in Traits

Async functions in traits are not yet stable in all contexts (as of Rust 1.75, basic cases work but complex ones still need the `async-trait` crate). Using the crate:

```toml
[dependencies]
async-trait = "0.1"
```

```rust
use async_trait::async_trait;

#[async_trait]
trait Fetcher {
    async fn fetch(&self, url: &str) -> String;
}

struct HttpFetcher;

#[async_trait]
impl Fetcher for HttpFetcher {
    async fn fetch(&self, url: &str) -> String {
        format!("fetched from {}", url)
    }
}
```
## Blocking Code in Async Context

Never call blocking code (like `std::fs`, `thread::sleep`, heavy computation) directly inside an async function. It blocks the whole thread and freezes all other tasks on that thread.

Use `tokio::task::spawn_blocking` to run blocking code on a dedicated thread pool:

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let result = task::spawn_blocking(|| {
        // heavy CPU work or blocking I/O, safe to block here
        std::fs::read_to_string("big_file.txt").unwrap()
    })
    .await
    .unwrap();

    println!("File length: {}", result.len());
}
```

The rule: anything that blocks a thread for more than a few microseconds belongs in `spawn_blocking`.
# Macros

You've been using macros since day one `println!`, `vec!`, `panic!`. The `!` is the giveaway. But what _are_ they, and how do you write your own?

A **macro** is code that writes code. At compile time, the Rust compiler expands macros into regular Rust code before anything is compiled. This lets you do things that regular functions simply can't like take a variable number of arguments, or generate repetitive code automatically.

Regular functions in Rust have limitations:

- Fixed number of arguments, you can't write `fn println(...)` that takes 1, 2, or 10 args
- Can't generate new code or identifiers at compile time
- Can't work on syntax, only on values

Macros lift all of these restrictions. They operate on the **source code itself** before the compiler sees it.
## Two Kinds of Macros

|Kind|Syntax|Use case|
|---|---|---|
|Declarative macros|`macro_rules!`|Pattern matching on syntax, most common|
|Procedural macros|`#[derive(...)]`, `#[attr]`, `fn!(...)`|
## Declarative Macros: `macro_rules!`

Declarative macros work like a `match` expression but on **code patterns** instead of values.

```rust
macro_rules! say_hello {
    () => {
        println!("Hello!");
    };
}

fn main() {
    say_hello!(); // expands to: println!("Hello!");
}
```

The `()` on the left is the pattern matches when called with no arguments. The `=> { ... }` is what it expands to.
### Accepting arguments

Use **designators** to describe what kind of syntax you're capturing:

```rust
macro_rules! greet {
    ($name:expr) => {
        println!("Hello, {}!", $name);
    };
}

fn main() {
    greet!("Ferris");  // Hello, Ferris!
    greet!(42);        // Hello, 42!
}
```

`$name` is the captured variable. `:expr` means "any expression." Common designators:

| Designator | Matches                                                         |
| ---------- | --------------------------------------------------------------- |
| `expr`     | Any expression (`5 + 3`, `"hello"`, `foo()`)                    |
| `ident`    | An identifier (`x`, `my_func`, `Counter`)                       |
| `ty`       | A type (`i32`, `String`, `Vec<u8>`)                             |
| `stmt`     | A statement                                                     |
| `pat`      | A pattern (used in `match`)                                     |
| `block`    | A block `{ ... }`                                               |
| `literal`  | A literal value (`42`, `"hi"`, `true`)                          |
| `tt`       | A single token tree, the most flexible, matches almost anything |
### Multiple patterns

Like `match`, you can have multiple arms:

```rust
macro_rules! describe {
    (happy)  => { println!("😊 feeling happy"); };
    (sad)    => { println!("😢 feeling sad"); };
    ($other:expr) => { println!("feeling {:?}", $other); };
}

fn main() {
    describe!(happy);
    describe!(sad);
    describe!("confused");
}
```
## Variadic Macros: `+` and `*`

Accepting **any number of arguments**, something functions can't do.

- `$(...)*`  repeat zero or more times
- `$(...)+`  repeat one or more times

```rust
macro_rules! sum {
    ($($x:expr),+) => {
        {
            let mut total = 0;
            $(total += $x;)+
            total
        }
    };
}

fn main() {
    println!("{}", sum!(1, 2, 3));        // 6
    println!("{}", sum!(10, 20, 30, 40)); // 100
}
```

Breaking down `($($x:expr),+)`:

- `$x:expr` = capture each argument as an expression named `x`
- `,` = separated by commas
- `+` = one or more times

This is exactly how `vec!` is implemented in the standard library:

```rust
// simplified version of the real vec! macro
macro_rules! vec {
    ($($x:expr),*) => {
        {
            let mut v = Vec::new();
            $(v.push($x);)*
            v
        }
    };
}
```

The standard library has no `hashmap!` literal. Let's build one:

```rust
use std::collections::HashMap;

macro_rules! hashmap {
    ($($key:expr => $val:expr),* $(,)?) => {
        {
            let mut map = HashMap::new();
            $(map.insert($key, $val);)*
            map
        }
    };
}

fn main() {
    let scores = hashmap! {
        "Alice" => 95,
        "Bob"   => 87,
        "Carol" => 92,
    };

    println!("{:?}", scores);
}
```

The `$(,)?` at the end allows an optional trailing comma, a small ergonomic touch you'll see in well-designed macros.
## Exporting Macros

By default, macros are scoped to the module they're defined in. To use a macro across modules or crates:

```rust
// within the same crate, use #[macro_export]
#[macro_export]
macro_rules! my_macro {
    () => { println!("exported!"); };
}
```

With `#[macro_export]`, the macro is available at the crate root and can be imported with `use my_crate::my_macro`.
## Procedural Macros (Overview)

Procedural macros are more powerful but also more complex  they're essentially Rust programs that transform token streams. There are three kinds:
### `#[derive(...)]` auto-implement traits

You've already used these:

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}
```

`derive` generates `impl Debug for Point`, `impl Clone for Point`, etc. automatically.

Built-in derives you'll use constantly:

|Derive|What it gives you|
|---|---|
|`Debug`|`{:?}` printing|
|`Clone`|`.clone()` method|
|`Copy`|Copy semantics instead of move|
|`PartialEq`|`==` and `!=` operators|
|`Eq`|Full equality (requires `PartialEq`)|
|`PartialOrd`|`<`, `>`, `<=`, `>=`|
|`Ord`|Total ordering, `.sort()` on collections|
|`Hash`|Use as `HashMap` key|
|`Default`|`.default()` constructor (zeros/empty)|
### Attribute macros `#[my_attr]`

Transform an entire item (function, struct, etc.):

```rust
// tokio's main macro is an attribute macro
#[tokio::main]
async fn main() { }
```
### Function-like macros `my_macro!(...)`

Look like `macro_rules!` but operate on token streams with full Rust logic. `sqlx::query!` is a famous example, it validates SQL at compile time.
# Debugging Macros

Rust has a rich set of built-in macros specifically for debugging, asserting, and handling unexpected states. Knowing these well saves hours of confusion.
## `println!` and `eprintln!`

You know `println!`. `eprintln!` does the same but writes to **stderr** instead of stdout better for debug output that shouldn't mix with real program output:

```rust
fn main() {
    println!("normal output → stdout");
    eprintln!("debug output → stderr");
}
```
## `dbg!` The Debug Macro

`dbg!` is the most useful debugging macro in Rust. It prints the **file, line number, expression, and value** then returns the value so you can drop it inline without restructuring your code:

```rust
fn main() {
    let x = 5;
    let y = dbg!(x * 2) + 1; // prints AND returns the value

    println!("y = {}", y);
}
```

Output:

```
[src/main.rs:3] x * 2 = 10
y = 11
```

Because `dbg!` returns its argument, you can wrap any expression without breaking the surrounding code:

```rust
// before debugging
let result = calculate(input) * scale_factor;

// after adding dbg!  works identically, just also prints
let result = dbg!(calculate(input)) * scale_factor;
```

`dbg!` requires the type to implement `Debug`. Remove it when you're done, it prints to **stderr** so it won't affect stdout output, but it still has a small runtime cost.
## `print!` and `eprint!`

Like `println!` and `eprintln!` but without the trailing newline. Useful for building output incrementally:

```rust
fn main() {
    for i in 1..=5 {
        print!("{} ", i); // no newline
    }
    println!(); // just a newline at the end
}
// Output: 1 2 3 4 5
```
## `assert!` Check a Condition

Panics with a message if the condition is false. Used heavily in tests and for invariants you're sure should hold:

```rust
fn divide(a: f64, b: f64) -> f64 {
    assert!(b != 0.0, "denominator must not be zero, got {}", b);
    a / b
}

fn main() {
    println!("{}", divide(10.0, 2.0)); // 5
    println!("{}", divide(10.0, 0.0)); // panics with message
}
```

The second argument is an optional format message always include it so panics are informative:

```rust
assert!(user.is_authenticated(), "expected authenticated user, got {:?}", user);
```
## `assert_eq!` and `assert_ne!`

Compare two values for equality. On failure, prints **both values** so you can see exactly what went wrong:

```rust
fn add(a: i32, b: i32) -> i32 { a + b }

fn main() {
    assert_eq!(add(2, 3), 5);  // passes
    assert_eq!(add(2, 3), 6);  // panics:
    // thread 'main' panicked at 'assertion failed: `(left == right)`
    //   left: `5`,
    //  right: `6`'
}
```

```rust
assert_ne!(result, 0, "result should not be zero");
```

Both accept an optional message as the third argument.
## `panic!` Crash Intentionally

Call `panic!` when your program reaches a state that should never happen:

```rust
fn get_day(n: u8) -> &'static str {
    match n {
        1 => "Monday",
        2 => "Tuesday",
        3 => "Wednesday",
        4 => "Thursday",
        5 => "Friday",
        6 => "Saturday",
        7 => "Sunday",
        _ => panic!("invalid day number: {}", n),
    }
}
```

A panic unwinds the stack, runs destructors, and prints a backtrace if `RUST_BACKTRACE=1` is set.
## `unreachable!` Mark Impossible Branches

Tell the compiler (and future readers) that a branch of code should never be reached. If it somehow is, it panics with a clear message:

```rust
fn classify(n: i32) -> &'static str {
    if n > 0 {
        "positive"
    } else if n < 0 {
        "negative"
    } else if n == 0 {
        "zero"
    } else {
        unreachable!("n can't be simultaneously not >, <, and == 0");
    }
}
```

Better than `panic!("should never happen")` because the intent is explicit.
## `todo!` and `unimplemented!`

Placeholders for code you haven't written yet. Both panic if reached at runtime.

```rust
fn calculate_tax(income: f64) -> f64 {
    todo!("implement tax brackets")
}

fn legacy_export() {
    unimplemented!("this feature was removed in v2")
}
```

The difference is semantic:

- `todo!` = I plan to implement this
- `unimplemented!` = this intentionally has no implementation

Both make your code compile with missing logic, so you can work on one piece at a time without fighting the compiler on incomplete branches.
## `compile_error!`  Fail at Compile Time

Force a compile error with a custom message. Most useful inside macros to give better error messages:

```rust
#[cfg(not(any(target_os = "linux", target_os = "macos")))]
compile_error!("this crate only supports Linux and macOS");
```
## Getting Better Backtraces

When a panic occurs, set the `RUST_BACKTRACE` environment variable to see the full call stack:

```bash
RUST_BACKTRACE=1 cargo run       # full backtrace
RUST_BACKTRACE=full cargo run    # even more detail
```

For async code with Tokio, backtraces can be sparse. Tokio has its own:

```bash
TOKIO_CONSOLE=1 cargo run        # requires tokio-console tool
```
# HTTP Requests

Rust's standard library has no built-in HTTP client. For making HTTP requests you reach for a crate. The most popular by far is **reqwest** ergonomic, async-first, and built on top of Tokio.
## Setup

```toml
# Cargo.toml
[dependencies]
reqwest = { version = "0.12", features = ["json"] }
tokio   = { version = "1",    features = ["full"] }
serde   = { version = "1",    features = ["derive"] }
serde_json = "1"
```

- `reqwest` = the HTTP client
- `json` feature = enables `.json()` for serializing/deserializing with serde
- `serde` = serialization/deserialization framework
- `tokio` = async runtime reqwest runs on
## GET Request

The simplest possible request fetch a URL and get the body as text:

```rust
#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let body = reqwest::get("https://httpbin.org/get")
        .await?
        .text()
        .await?;

    println!("{}", body);
    Ok(())
}
```

`.text()` reads the response body as a `String`. The `?` operator propagates any errors up network failure, DNS error, timeout, etc.
## Response as JSON

Use `.json::<T>()` to deserialize the response body directly into a Rust struct. The struct needs to derive `Deserialize`:

```rust
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Post {
    id:     u32,
    title:  String,
    body:   String,
    #[serde(rename = "userId")]
    user_id: u32,
}

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let post: Post = reqwest::get("https://jsonplaceholder.typicode.com/posts/1")
        .await?
        .json::<Post>()
        .await?;

    println!("Title: {}", post.title);
    println!("Body:  {}", post.body);
    Ok(())
}
```

`#[serde(rename = "userId")]` maps the JSON field `userId` to Rust's `user_id`. Rust convention is snake_case, JSON often uses camelCase.
### Deserializing a list

```rust
#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let posts: Vec<Post> = reqwest::get("https://jsonplaceholder.typicode.com/posts")
        .await?
        .json::<Vec<Post>>()
        .await?;

    println!("Got {} posts", posts.len());
    for post in &posts[..3] {
        println!("- {}", post.title);
    }
    Ok(())
}
```
## The Client Reusing Connections

Calling `reqwest::get(...)` creates a new client each time. In real applications, create a `Client` once and reuse it, it manages a connection pool internally:

```rust
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = Client::new();

    let res = client
        .get("https://jsonplaceholder.typicode.com/posts/1")
        .send()
        .await?;

    println!("Status: {}", res.status());
    println!("Body:   {}", res.text().await?);
    Ok(())
}
```

Always prefer a shared `Client` in long-running programs, it reuses TCP connections and is significantly faster than creating a new one per request.
## Checking Status Codes

```rust
use reqwest::Client;

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = Client::new();

    let res = client
        .get("https://jsonplaceholder.typicode.com/posts/999")
        .send()
        .await?;

    println!("Status: {}", res.status());       // 404 Not Found
    println!("Is success: {}", res.status().is_success()); // false

    if res.status().is_success() {
        let body = res.text().await?;
        println!("{}", body);
    } else {
        println!("Request failed: {}", res.status());
    }

    Ok(())
}
```

Useful status check methods:

| Method               | Returns true for |
| -------------------- | ---------------- |
| `.is_success()`      | 200–299          |
| `.is_redirection()`  | 300–399          |
| `.is_client_error()` | 400–499          |
| `.is_server_error()` | 500–599          |
### `error_for_status()`

Automatically turn non-2xx responses into errors:

```rust
let res = client
    .get("https://jsonplaceholder.typicode.com/posts/999")
    .send()
    .await?
    .error_for_status()?; // returns Err if status is 4xx or 5xx

let body = res.text().await?;
```
## POST Request Sending JSON

Use `.json(&body)` to serialize a struct and send it as the request body. The struct needs `Serialize`:

```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct NewPost {
    title:   String,
    body:    String,
    user_id: u32,
}

#[derive(Debug, Deserialize)]
struct CreatedPost {
    id:      u32,
    title:   String,
}

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = Client::new();

    let new_post = NewPost {
        title:   "Hello Rust".to_string(),
        body:    "Rust is great for HTTP".to_string(),
        user_id: 1,
    };

    let created: CreatedPost = client
        .post("https://jsonplaceholder.typicode.com/posts")
        .json(&new_post)          // serialize struct → JSON body
        .send()
        .await?
        .json::<CreatedPost>()    // deserialize response
        .await?;

    println!("Created post with id: {}", created.id);
    Ok(())
}
```

`.json(&new_post)` automatically sets the `Content-Type: application/json` header.
## POST Sending a Form

```rust
use std::collections::HashMap;

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = Client::new();

    let mut params = HashMap::new();
    params.insert("username", "ferris");
    params.insert("password", "hunter2");

    let res = client
        .post("https://httpbin.org/post")
        .form(&params)            // sends as application/x-www-form-urlencoded
        .send()
        .await?;

    println!("{}", res.text().await?);
    Ok(())
}
```
## PUT and DELETE

```rust
// PUT  update a resource
let res = client
    .put("https://jsonplaceholder.typicode.com/posts/1")
    .json(&updated_post)
    .send()
    .await?;

// PATCH  partial update
let res = client
    .patch("https://jsonplaceholder.typicode.com/posts/1")
    .json(&partial_update)
    .send()
    .await?;

// DELETE
let res = client
    .delete("https://jsonplaceholder.typicode.com/posts/1")
    .send()
    .await?;

println!("DELETE status: {}", res.status()); // 200
```
## Headers

### Setting request headers

```rust
use reqwest::header;

let res = client
    .get("https://httpbin.org/headers")
    .header(header::AUTHORIZATION, "Bearer my_token_here")
    .header(header::ACCEPT, "application/json")
    .header("X-Custom-Header", "my-value")
    .send()
    .await?;
```
### Reading response headers

```rust
let res = client
    .get("https://httpbin.org/get")
    .send()
    .await?;

println!("Content-Type: {:?}", res.headers().get("content-type"));

for (name, value) in res.headers() {
    println!("{}: {:?}", name, value);
}
```
### Default headers on a Client

Set headers that apply to every request from a client:

```rust
use reqwest::{Client, header};

let mut headers = header::HeaderMap::new();
headers.insert(header::AUTHORIZATION, "Bearer my_api_token".parse().unwrap());
headers.insert(header::ACCEPT, "application/json".parse().unwrap());

let client = Client::builder()
    .default_headers(headers)
    .build()?;

// every request from this client will include those headers
let res = client.get("https://api.example.com/data").send().await?;
```
## Query Parameters

```rust
let res = client
    .get("https://httpbin.org/get")
    .query(&[("page", "2"), ("limit", "10")])
    .send()
    .await?;

// builds: https://httpbin.org/get?page=2&limit=10
```

Or with a struct:

```rust
#[derive(Serialize)]
struct SearchParams {
    query:  String,
    page:   u32,
    limit:  u32,
}

let params = SearchParams { query: "rust".into(), page: 1, limit: 20 };

let res = client
    .get("https://api.example.com/search")
    .query(&params)
    .send()
    .await?;
```
## Timeouts

Always set timeouts in production without them a hung server will stall your program forever:

```rust
use std::time::Duration;

let client = Client::builder()
    .timeout(Duration::from_secs(10))       // total request timeout
    .connect_timeout(Duration::from_secs(5)) // connection timeout only
    .build()?;
```
## Concurrent Requests

Use `tokio::join!` or `futures::future::join_all` to fire multiple requests at the same time:

```rust
use tokio;

#[tokio::main]
async fn main() -> Result<(), reqwest::Error> {
    let client = Client::new();

    // fire all three at once
    let (post1, post2, post3) = tokio::join!(
        client.get("https://jsonplaceholder.typicode.com/posts/1").send(),
        client.get("https://jsonplaceholder.typicode.com/posts/2").send(),
        client.get("https://jsonplaceholder.typicode.com/posts/3").send(),
    );

    println!("Post 1: {}", post1?.status());
    println!("Post 2: {}", post2?.status());
    println!("Post 3: {}", post3?.status());

    Ok(())
}
```

For a dynamic number of requests:

```rust
use futures::future::join_all;

let urls = vec![
    "https://jsonplaceholder.typicode.com/posts/1",
    "https://jsonplaceholder.typicode.com/posts/2",
    "https://jsonplaceholder.typicode.com/posts/3",
];

let futures = urls.iter().map(|url| {
    let client = client.clone();
    async move {
        client.get(*url).send().await
    }
});

let results = join_all(futures).await;

for res in results {
    println!("{}", res?.status());
}
```

Add `futures = "0.3"` to `Cargo.toml` for `join_all`.
## Error Handling

`reqwest::Error` covers network errors, timeouts, and JSON parse failures. Handle them properly in production:

```rust
use reqwest::Client;

async fn fetch_post(id: u32) -> Result<Post, reqwest::Error> {
    let url = format!("https://jsonplaceholder.typicode.com/posts/{}", id);

    Client::new()
        .get(&url)
        .send()
        .await?
        .error_for_status()?   // turn 4xx/5xx into errors
        .json::<Post>()
        .await
}

#[tokio::main]
async fn main() {
    match fetch_post(1).await {
        Ok(post)  => println!("Got: {}", post.title),
        Err(e) if e.is_timeout()      => println!("Request timed out"),
        Err(e) if e.is_connect()      => println!("Connection failed"),
        Err(e) if e.status().is_some() => println!("Server error: {}", e.status().unwrap()),
        Err(e)    => println!("Unknown error: {}", e),
    }
}
```
## Synchronous Requests (No Async)

If you're not using async, enable the `blocking` feature:

```toml
reqwest = { version = "0.12", features = ["blocking", "json"] }
```

rust

```rust
fn main() -> Result<(), reqwest::Error> {
    let body = reqwest::blocking::get("https://httpbin.org/get")?
        .text()?;

    println!("{}", body);
    Ok(())
}
```

The blocking API mirrors the async one exactly same methods, no `.await`. Use it for CLI tools, scripts, or anywhere you don't need async.
## Quick Reference

```rust
// GET text
reqwest::get(url).await?.text().await?

// GET JSON
client.get(url).send().await?.json::<MyStruct>().await?

// POST JSON
client.post(url).json(&body).send().await?

// POST form
client.post(url).form(&params).send().await?

// With headers
client.get(url).header(header::AUTHORIZATION, "Bearer token").send().await?

// With query params
client.get(url).query(&[("key", "value")]).send().await?

// With timeout
Client::builder().timeout(Duration::from_secs(10)).build()?

// Check status
res.status().is_success()
res.error_for_status()?   // auto-error on 4xx/5xx

// Concurrent
tokio::join!(req_a, req_b, req_c)
```
# Operator Overloading

Rust lets you define custom behavior for operators like `+`, `-`, `*`, `==`, `<`, and more. This is done by implementing traits from `std::ops` and `std::cmp`. It's not magic, just trait implementations.
### Why Operator Overloading?

Without it, adding two `Vector2D` structs looks like this:

```rust
let result = v1.add(v2);
```

With it:

```rust
let result = v1 + v2;
```

Same code underneath, just nicer to read.
### `Add` Implementing `+`

Implement `std::ops::Add` to define what `+` means for your type:

```rust
use std::ops::Add;

#[derive(Debug, Clone, Copy)]
struct Vector2D {
    x: f64,
    y: f64,
}

impl Add for Vector2D {
    type Output = Vector2D; // the type returned by +

    fn add(self, other: Vector2D) -> Vector2D {
        Vector2D {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

fn main() {
    let v1 = Vector2D { x: 1.0, y: 2.0 };
    let v2 = Vector2D { x: 3.0, y: 4.0 };

    let v3 = v1 + v2;
    println!("{:?}", v3); // Vector2D { x: 4.0, y: 6.0 }
}
```

`type Output = Vector2D` is an **associated type** it tells the trait what type the operation produces.
### `Sub`, `Mul`, `Div`, `Neg`

All arithmetic operators have corresponding traits:

```rust
use std::ops::{Sub, Mul, Neg};

impl Sub for Vector2D {
    type Output = Vector2D;
    fn sub(self, other: Vector2D) -> Vector2D {
        Vector2D { x: self.x - other.x, y: self.y - other.y }
    }
}

impl Mul<f64> for Vector2D { // multiply Vector2D by a scalar f64
    type Output = Vector2D;
    fn mul(self, scalar: f64) -> Vector2D {
        Vector2D { x: self.x * scalar, y: self.y * scalar }
    }
}

impl Neg for Vector2D { // unary minus: -v
    type Output = Vector2D;
    fn neg(self) -> Vector2D {
        Vector2D { x: -self.x, y: -self.y }
    }
}

fn main() {
    let v1 = Vector2D { x: 5.0, y: 3.0 };
    let v2 = Vector2D { x: 1.0, y: 1.0 };

    println!("{:?}", v1 - v2);   // Vector2D { x: 4.0, y: 2.0 }
    println!("{:?}", v1 * 2.0);  // Vector2D { x: 10.0, y: 6.0 }
    println!("{:?}", -v1);       // Vector2D { x: -5.0, y: -3.0 }
}
```
### Operator Overloading Traits Quick Reference

| Operator    | Trait        | Method        |
| ----------- | ------------ | ------------- |
| `+`         | `Add`        | `add`         |
| `-`         | `Sub`        | `sub`         |
| `*`         | `Mul`        | `mul`         |
| `/`         | `Div`        | `div`         |
| `%`         | `Rem`        | `rem`         |
| `-` (unary) | `Neg`        | `neg`         |
| `+=`        | `AddAssign`  | `add_assign`  |
| `-=`        | `SubAssign`  | `sub_assign`  |
| `*=`        | `MulAssign`  | `mul_assign`  |
| `/=`        | `DivAssign`  | `div_assign`  |
| `==` `!=`   | `PartialEq`  | `eq`          |
| `<` `>` etc | `PartialOrd` | `partial_cmp` |
| `[]`        | `Index`      | `index`       |
| `[]=`       | `IndexMut`   | `index_mut`   |
| `{}`        | `Display`    | `fmt`         |
| `{:?}`      | `Debug`      | `fmt`         |
# Smart Pointers

A **smart pointer** is a data structure that acts like a pointer but also has additional metadata and capabilities. In Rust, smart pointers manage memory automatically, enforce ownership rules, or enable patterns that plain references can't.

You've already used two smart pointers without thinking about it: `String` and `Vec<T>` both own heap-allocated memory and clean it up automatically. The ones below are more explicit about their purpose.

Smart pointers implement two traits:

- `Deref` = lets them be used like a regular reference (`*ptr`)
- `Drop` = defines cleanup logic when they go out of scope
### `Box<T>` Heap Allocation

`Box<T>` puts a value on the **heap** instead of the stack, and gives you a pointer to it. The stack holds only the pointer (8 bytes). The actual data lives on the heap.

```rust
fn main() {
    let x = Box::new(5); // 5 is now on the heap
    println!("x = {}", x); // dereferences automatically
    println!("x = {}", *x); // explicit dereference
} // x goes out of scope, heap memory is freed automatically
```

When do you actually need this?

**1. Recursive types** = types that contain themselves. The compiler can't know their size without `Box`:

```rust
// this won't compile  infinite size
enum List {
    Cons(i32, List),
    Nil,
}

// this works  Box is a fixed size (pointer)
enum List {
    Cons(i32, Box<List>),
    Nil,
}

fn main() {
    let list = List::Cons(1,
        Box::new(List::Cons(2,
            Box::new(List::Cons(3,
                Box::new(List::Nil))))));
}
```

**2. Trait objects** = storing values of different types that implement the same trait:

```rust
trait Animal {
    fn speak(&self);
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn speak(&self) { println!("Woof!"); }
}
impl Animal for Cat {
    fn speak(&self) { println!("Meow!"); }
}

fn main() {
    // Box<dyn Animal> = any type that implements Animal
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog),
        Box::new(Cat),
        Box::new(Dog),
    ];

    for animal in &animals {
        animal.speak();
    }
}
```

`dyn Animal` means "any type that implements `Animal`" decided at runtime (dynamic dispatch).

**3. Large data**  moving large values by putting them in a `Box` so only the pointer moves, not the data.
### `Deref` How Smart Pointers Act Like References

`Box<T>` implements `Deref`, which lets you use `*` to get at the inner value:

```rust
fn main() {
    let x = 5;
    let y = Box::new(x);

    assert_eq!(5, x);
    assert_eq!(5, *y); // dereference Box just like a reference
}
```

**Deref coercion** is the automatic conversion Rust does when types don't quite match but a `Deref` implementation bridges the gap:

```rust
fn print_str(s: &str) {
    println!("{}", s);
}

fn main() {
    let s = String::from("hello");
    print_str(&s);        // &String automatically coerces to &str
    
    let boxed = Box::new(String::from("world"));
    print_str(&boxed);    // &Box<String> → &String → &str (chained!)
}
```

Rust follows deref coercions automatically until types match. You almost never need to think about this  it just works.

You can implement `Deref` on your own types:

```rust
use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> {
        MyBox(x)
    }
}

impl<T> Deref for MyBox<T> {
    type Target = T;

    fn deref(&self) -> &T {
        &self.0
    }
}

fn main() {
    let x = MyBox::new(42);
    println!("{}", *x); // 42  works because of our Deref impl
}
```
### `Drop` Running Code on Cleanup

`Drop` lets you define what happens when a value goes out of scope = like a destructor in C++. Rust calls `drop` automatically:

```rust
struct Resource {
    name: String,
}

impl Drop for Resource {
    fn drop(&mut self) {
        println!("Dropping resource: {}", self.name);
    }
}

fn main() {
    let r1 = Resource { name: String::from("database connection") };
    let r2 = Resource { name: String::from("file handle") };
    println!("Resources created");
} // r2 is dropped first, then r1 (reverse order of creation)

// Output:
// Resources created
// Dropping resource: file handle
// Dropping resource: database connection
```

Values are always dropped in **reverse order** of creation = innermost scope first.

**Dropping early** = use `std::mem::drop` (or just `drop(value)`) if you need to free something before scope ends:

```rust
fn main() {
    let r = Resource { name: String::from("lock") };
    println!("Holding the lock");
    drop(r); // explicitly drop here  can't call r.drop() directly
    println!("Lock released, doing other work");
}
```

You can't call `.drop()` directly  Rust prevents double-free. Use the `drop` function instead.
### `Rc<T>` Reference Counting Multiple Owners

Rust's ownership rules say one value, one owner. But sometimes you need **multiple parts of your program to share ownership** of the same data. `Rc<T>` (Reference Counted) tracks how many references exist and frees the data when the count hits zero.

```rust
use std::rc::Rc;

fn main() {
    let shared = Rc::new(String::from("shared data"));

    let clone1 = Rc::clone(&shared); // increments reference count
    let clone2 = Rc::clone(&shared);

    println!("Count: {}", Rc::strong_count(&shared)); // 3

    println!("{}", shared);
    println!("{}", clone1);
    println!("{}", clone2);
} // count drops to 0, String is freed
```

`Rc::clone` does **not** copy the data  it just copies the pointer and increments the reference count. It's cheap.

A classic use case, shared ownership in a graph or tree:

```rust
use std::rc::Rc;

#[derive(Debug)]
enum List {
    Cons(i32, Rc<List>),
    Nil,
}

fn main() {
    let shared_tail = Rc::new(List::Cons(10, Rc::new(List::Nil)));

    // two lists share the same tail  no cloning of data
    let list_a = List::Cons(5,  Rc::clone(&shared_tail));
    let list_b = List::Cons(99, Rc::clone(&shared_tail));
}
```

**Important**: `Rc<T>` is single-threaded only. For multithreaded code, use `Arc<T>` (covered in the Threads chapter).
### `RefCell<T>` Interior Mutability

`Rc<T>` gives you multiple owners, but those owners can't mutate the data. Rust's borrow rules still apply at compile time. `RefCell<T>` breaks this restriction by **moving borrow checking to runtime**.

With `RefCell<T>`:

- `.borrow()` → gives an immutable `Ref<T>` (like `&T`)
- `.borrow_mut()` → gives a mutable `RefMut<T>` (like `&mut T`)

If you violate the rules at runtime (two mutable borrows at once), it **panics** instead of failing to compile.

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(vec![1, 2, 3]);

    // immutable borrow
    {
        let v = data.borrow();
        println!("{:?}", v);
    } // borrow released here

    // mutable borrow
    {
        let mut v = data.borrow_mut();
        v.push(4);
    } // mutable borrow released here

    println!("{:?}", data.borrow()); // [1, 2, 3, 4]
}
```

`RefCell` is useful when you need mutability inside something that's otherwise immutable, the classic case is `Rc<RefCell<T>>`:

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    // multiple owners, all can mutate
    let shared = Rc::new(RefCell::new(0));

    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);

    *a.borrow_mut() += 10;
    *b.borrow_mut() += 20;

    println!("{}", shared.borrow()); // 30
}
```

|Type|Owners|Mutable?|Thread Safe?|
|---|---|---|---|
|`Box<T>`|One|Yes (if `mut`)|Yes|
|`Rc<T>`|Many|No|No|
|`Rc<RefCell<T>>`|Many|Yes (runtime check)|No|
|`Arc<T>`|Many|No|Yes|
|`Arc<Mutex<T>>`|Many|Yes (locked)|Yes|
### `Cow<T>` Clone on Write

`Cow<'a, B>` (Clone on Write) is a smart pointer that can hold either a **borrowed reference** or an **owned value**, and only clones when mutation is needed. It's a memory optimization for cases where you usually don't need to modify data.

```rust
use std::borrow::Cow;

fn make_greeting(name: &str) -> Cow<str> {
    if name.is_empty() {
        Cow::Owned(String::from("Hello, stranger!")) // need to allocate
    } else {
        Cow::Borrowed(name) // no allocation needed
    }
}

fn main() {
    let g1 = make_greeting("Ferris");
    let g2 = make_greeting("");

    println!("{}", g1); // Ferris  no allocation
    println!("{}", g2); // Hello, stranger!  allocated
}
```

Useful in parsers, formatters, and APIs where you want to avoid unnecessary allocations when data doesn't need to change.
### `Cell<T>` Interior Mutability for Copy Types

`Cell<T>` is a simpler version of `RefCell<T>` for types that implement `Copy`. Instead of borrowing, it copies values in and out:

```rust
use std::cell::Cell;

fn main() {
    let x = Cell::new(5); // x itself doesn't need to be mut!

    println!("{}", x.get()); // 5
    x.set(10);
    println!("{}", x.get()); // 10
}
```

`Cell<T>` has zero runtime overhead (unlike `RefCell`'s borrow tracking) and is great for simple counters or flags inside otherwise-immutable structs:

```rust
use std::cell::Cell;

struct Counter {
    count: Cell<u32>,
}

impl Counter {
    fn new() -> Counter {
        Counter { count: Cell::new(0) }
    }

    fn increment(&self) { // note: &self, not &mut self
        self.count.set(self.count.get() + 1);
    }

    fn get(&self) -> u32 {
        self.count.get()
    }
}

fn main() {
    let c = Counter::new();
    c.increment();
    c.increment();
    c.increment();
    println!("{}", c.get()); // 3
}
```
### Weak References Avoiding Reference Cycles

`Rc<T>` has a problem: **reference cycles** cause memory leaks. If `A` holds an `Rc` to `B`, and `B` holds an `Rc` to `A`, neither count ever reaches zero and the memory is never freed.

`Weak<T>` breaks cycles, it's a non-owning reference that doesn't increment the strong count:

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,      // weak reference to parent
    children: RefCell<Vec<Rc<Node>>>, // strong references to children
}

fn main() {
    let parent = Rc::new(Node {
        value: 1,
        parent: RefCell::new(Weak::new()),
        children: RefCell::new(vec![]),
    });

    let child = Rc::new(Node {
        value: 2,
        parent: RefCell::new(Rc::downgrade(&parent)), // weak ref to parent
        children: RefCell::new(vec![]),
    });

    parent.children.borrow_mut().push(Rc::clone(&child));

    // check if parent still exists
    println!("Child's parent value: {:?}",
        child.parent.borrow().upgrade().map(|p| p.value)
    ); // Some(1)
}
```

- `Rc::downgrade(&rc)` = creates a `Weak<T>` from an `Rc<T>`
- `weak.upgrade()` = returns `Option<Rc<T>>`, `None` if the data was dropped

Use `Weak` when you need a reference but don't want to prevent cleanup, parent-child trees, caches, observers.
### Smart Pointer Quick Reference

```rust
// Box<T>  heap allocation, single owner
let b = Box::new(5);

// Rc<T>  multiple owners, single thread
let rc = Rc::new(data);
let rc2 = Rc::clone(&rc);
Rc::strong_count(&rc); // check count

// Rc<RefCell<T>>  multiple owners + interior mutability
let shared = Rc::new(RefCell::new(vec![]));
shared.borrow_mut().push(1);

// Weak<T>  non-owning reference (break cycles)
let weak = Rc::downgrade(&rc);
weak.upgrade(); // → Option<Rc<T>>

// Box<dyn Trait>  trait object (dynamic dispatch)
let obj: Box<dyn MyTrait> = Box::new(MyStruct);

// Cow<T>  clone only when needed
Cow::Borrowed(existing_ref)
Cow::Owned(new_value)

// Cell<T>  interior mutability for Copy types
let c = Cell::new(0);
c.set(5);
c.get(); // 5

// RefCell<T>  interior mutability, runtime borrow checking
let r = RefCell::new(data);
r.borrow();      // &T
r.borrow_mut();  // &mut T
```
# Unit Testing

Rust has testing built right into the language, no external framework needed. You write tests in the same file as your code, and `cargo test` runs them all.

Mark any function with `#[test]` to make it a test. Put tests inside a `mod tests` block annotated with `#[cfg(test)]`:

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[cfg(test)]
mod tests {
    use super::*; // bring everything from the parent module into scope

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }
}
```

Run with:

```bash
cargo test
```

Output:

```
running 1 test
test tests::test_add ... ok

test result: ok. 1 passed; 0 failed
```

`#[cfg(test)]` means the test module is only compiled when running tests, it doesn't end up in your release binary.
## The Assert Macros

```rust
#[test]
fn test_assertions() {
    // assert a condition is true
    assert!(2 + 2 == 4);

    // assert two values are equal  prints both on failure
    assert_eq!(add(3, 4), 7);

    // assert two values are NOT equal
    assert_ne!(add(2, 2), 5);

    // all three accept an optional message
    assert_eq!(add(1, 1), 2, "1 + 1 should be 2, got {}", add(1, 1));
}
```

Always prefer `assert_eq!` over `assert!(a == b)`,on failure it shows you what both sides actually were, which saves you from adding debug prints.
## Testing for Panics

Use `#[should_panic]` to assert a function panics:

```rust
fn divide(a: f64, b: f64) -> f64 {
    if b == 0.0 {
        panic!("division by zero");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn test_divide_by_zero_panics() {
        divide(10.0, 0.0);
    }

    // be more specific  check the panic message
    #[test]
    #[should_panic(expected = "division by zero")]
    fn test_divide_by_zero_message() {
        divide(10.0, 0.0);
    }
}
```

Always use `expected =` when you can, a test that passes because _something_ panicked (but not what you intended) is a false positive.
## Testing with Result

Instead of panicking, tests can return `Result<(), E>`. Use `?` to propagate errors, a test fails if it returns `Err`:

```rust
use std::fs;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_read() -> Result<(), std::io::Error> {
        let content = fs::read_to_string("Cargo.toml")?; // fails test if file missing
        assert!(content.contains("[package]"));
        Ok(())
    }
}
```

This is cleaner than wrapping everything in `.unwrap()`, failures show the actual error message instead of a generic panic.
## Ignoring Tests

Mark slow or unfinished tests with `#[ignore]`, they're skipped by default:

```rust
#[test]
#[ignore]
fn slow_integration_test() {
    // takes 30 seconds, don't run on every cargo test
}
```

Run ignored tests explicitly:

```bash
cargo test -- --ignored          # only ignored tests
cargo test -- --include-ignored  # all tests including ignored
```
## Controlling Test Output

By default `cargo test` captures stdout, `println!` inside tests doesn't show unless the test fails. To always show output:

```bash
cargo test -- --nocapture
```

Filter to run specific tests by name:

```bash
cargo test test_add        # run tests whose name contains "test_add"
cargo test tests::         # run everything in the tests module
```

Run tests one at a time (no parallelism):

```bash
cargo test -- --test-threads=1
```
## Testing Structs and Methods

```rust
struct Rectangle {
    width:  f64,
    height: f64,
}

impl Rectangle {
    fn new(width: f64, height: f64) -> Self {
        Rectangle { width, height }
    }

    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn is_square(&self) -> bool {
        self.width == self.height
    }

    fn scale(&mut self, factor: f64) {
        self.width  *= factor;
        self.height *= factor;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_area() {
        let rect = Rectangle::new(4.0, 5.0);
        assert_eq!(rect.area(), 20.0);
    }

    #[test]
    fn test_is_square_true() {
        let rect = Rectangle::new(5.0, 5.0);
        assert!(rect.is_square());
    }

    #[test]
    fn test_is_square_false() {
        let rect = Rectangle::new(4.0, 5.0);
        assert!(!rect.is_square());
    }

    #[test]
    fn test_scale() {
        let mut rect = Rectangle::new(3.0, 4.0);
        rect.scale(2.0);
        assert_eq!(rect.width,  6.0);
        assert_eq!(rect.height, 8.0);
    }
}
```
## Testing Enums and Option / Result

```rust
fn find_user(id: u32) -> Option<String> {
    match id {
        1 => Some("Alice".to_string()),
        2 => Some("Bob".to_string()),
        _ => None,
    }
}

fn parse_age(s: &str) -> Result<u32, String> {
    s.parse::<u32>().map_err(|_| format!("'{}' is not a valid age", s))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_existing_user() {
        assert_eq!(find_user(1), Some("Alice".to_string()));
    }

    #[test]
    fn test_find_missing_user() {
        assert_eq!(find_user(99), None);
    }

    #[test]
    fn test_parse_valid_age() {
        assert_eq!(parse_age("25"), Ok(25));
    }

    #[test]
    fn test_parse_invalid_age() {
        assert!(parse_age("abc").is_err());
    }

    #[test]
    fn test_parse_invalid_age_message() {
        let err = parse_age("abc").unwrap_err();
        assert!(err.contains("not a valid age"));
    }
}
```
## Quick Reference

```bash
cargo test                         # run all tests
cargo test test_add                # run tests matching "test_add"
cargo test -- --nocapture          # show println! output
cargo test -- --test-threads=1     # run sequentially
cargo test -- --ignored            # run ignored tests
cargo test -- --include-ignored    # all tests including ignored
cargo test --test integration_test # specific integration test file
cargo test --doc                   # doc tests only
```

```rust
#[test]                            // mark as a test function
#[cfg(test)]                       // only compile in test mode
#[should_panic]                    // test passes if function panics
#[should_panic(expected = "msg")]  // test passes if panic contains message
#[ignore]                          // skip unless explicitly run

assert!(condition)
assert_eq!(left, right)
assert_ne!(left, right)
assert_eq!(left, right, "message {}", value)
```



---

That's all for now. See y'all in the next one.
