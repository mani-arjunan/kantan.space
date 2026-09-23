# Kantan (簡単)

A simple programming language for kids. Kantan means **"simple"** in Japanese. 

The goal of creating kantan is to help kids(LEARN MYSELF RUST :) to get into the programming world concepts.

# Why Kantan for kids?

- simple syntax
- common english words
- readable

# Features

- Simple English-like syntax
- Variables
- Arithmetic operations
- Conditional statements(if alone right now)
- Loop
- Period as delimeter unlike typical semicolon (optional)
- String interpolation
- Nested Loops
- Comments (single-line and multi-line)
- Written completely from scratch in Rust(NO AI were harmed)

# Simple Example Program based on kantan

```kantan
notes: period is optional in end of the line
name is "Manikandan"
age is 27

notes: {
  you can do arithmetic and print variables using {var}
}

a is 10
b is 20
c is a + b

print "Value of A => {a}"
print "Value of B => {b}"
print "Value of C => {c}"

if c [is equal to] 30 {
    print "C is 30"
}

repeat 3 times {
    print "Outer Loop"
    repeat 2 times {
        print "Inner Loop"
    }
}
```


# Supported Syntax

## Variable Assignment

```kantan
name is "Kantan" # string
age is 10 # number
```

## Print

```kantan
print "Hello World" # Normal
print "Name => {name}" # String interpolation
```

## Arithmetic Operations

```kantan
a is 10.
b is 20.

c is a + b. # add
d is c - 5. # sub
e is d / 5. # division
f is e % 2. # modulos
```

## Conditional(if)

```kantan
if age [is greater than] 18 {
    print "Adult".
}
```

### Operators

- `[is equal to]`
- `[is not equal to]`
- `[is greater than]`
- `[is less than]`
- `[is greater than equal to]`
- `[is less than equal to]`

## Loops

```kantan
repeat 5 times {
    print "Hello".
}
```

## Comments

```kantan
notes: this is a single line comment

notes: {
  this is a
  multi-line comment
}
```

Inline block comment (any spaces allowed between `:` and `{`):

```kantan
notes:   { this is hidden } x is 10

if age [is greater than] 18 { notes: check adult
    print "Adult"
}
```


# Implementation Details

## How It Works

Kantan works in 3 stages:

### 1. Tokenizer

Converts the input program(.kn) into tokens like 
`[identifier(a), Is, Number(10), Dot]`.

Example:

```kantan
a is 10.
```

## 2. Parser

Parser converts the tokens into an AST (Abstract syntax tree), this is available in every language(you can check in your IDE's).

Example:

```text
Assign("a", Number(10))
```

## 3. Interpreter

This step is the core, basically executes the AST using `rust` eval.

# Running Kantan

Checkout the bin folder to run the binary directly
```bash
./bin/{YOUR_OS_ARCHITECTURE} ./example.kn(or any other files)
```

# Phase2(if am interested)

- Proper error messages with line numbers
- variable scoping
- functions
- LSP
- Formatter
