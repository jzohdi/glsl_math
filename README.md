# GLSL Math

Common calculus/math functions include symbols such as ^ (to denote raising to
the power). However, this symbol is not supported in glsl. This repository
contains code that takes common expressions and **compiles to a glsl compatible
string**.

## TODO

- rewrite in rust

## Supported Math Functionality for Transpilation

### Primitives

- variables (x)
- numbers (2)
- floating point decimals (2.1)
- PI/Pi/pi (3.14159265359)
- E/e (2.71828182846)

### Arithmetic Operators

- addition `+`: `a + b`
- subtraction `-`: `a - b`
- Multiplication `*`: `a * b`
- Division `/`: `a / b`
- Exponentiation `^`: `x^y` (converted to pow(x, y) in GLSL)

### Grouping and Precedence:

- Parentheses `(( ))`: to define operation precedence and group expressions

### Common Mathematical Functions

– `sin(x)` 
– `cos(x)` 
– `tan(x)`
- `asin(x)`
- `acos(x)`
- `atan(x)`
- `log(x)` : natural logarithm; note that GLSL’s log is the natural log
– `log2(x)`: if supporting logarithms base‑2
- `sqrt(x)`
- `abs(x)`
- `floor(x)`: rounds down to the nearest integer:
- `ceil(x)`: rounds up to the nearest integer
- `round(x)`: rounds to the nearest integer

### Derivative Approximation

- `dFdx(x)` – Approximate derivative with respect to x.

## Publish to npm

https://github.com/denoland/dnt/

```shell
deno run -A scripts/build_npm.ts 0.1.0
```
