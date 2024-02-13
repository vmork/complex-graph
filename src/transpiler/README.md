## Notes 
- add & sub are special cases out of (add,sub,mul,div) since
    - a + bi + 1 = (a+1) + bi, not (a+1) + (b+1)i
    - so normal glsl addition does the wrong thing when one operand is real and other is complex
    - one approach is to convert every real x to vec2(x,0)
    - but should really keep track of all types and switch behavior depending on operand types, since we kind of need to do that anyway probably
- Arguments in function definitions are assumed to be complex (?)
- glsl doesnt allow nested function declarations, so easiest not to do so either
- If a function body has branching in it, require that all branches return the same type and raise error if not

## Examples

| lslg | glsl | notes
|------|------|------ |
| `2 + 3i`            | `vec2(2., 0) + vec2(0, 3.)` | real+complex
| `1 + 1`             |  `1. + 1.` | real+real
| `2i + i`            |  `vec2(0, 2.) + vec2(0, 1.)`
| `Abs(z) + g(z)`     | `` | ? + ?
| `z := 2i`           | `vec2 z = vec2(0, 2.)` 
| `z = f(w)`          | `???? z = f(w)`
| `x := 1 + 1`        | `float x = 1. + 1.` 
| `x = 1 + 1`         | `x = 1. + 1.` | check that old type matches
| `5z + 2i`           | `5.*z + vec2(0., 2.)`  
| `ln(2i) + e^4z`     | `Log(vec2(0, 2.)) + Exp(4.*z)` 
| `ln(2) + e^x`       | `log(2.) + exp(x)` | if `x` is real
| `2(z + 1)(z - 1)/w` | `Div(2.*Mul(z+1., z-1.), w)` 
| `f(z) := sin(z)`    | `vec2 f(vec2 z) { return Sin(z); }`
| `f(z) := { x = 1\n sin(z + x) }` | `vec2 f(vec2 z) { float x = 1.; return Sin(z + x); }`

## Control flow
| lslg | glsl | notes
|------|------|------ |
| `for i = 1..10: stmt`  | `for (int i = 1; i <= 10; i+=1) ...`
| `for i = 1..10..2: { stmt-list }` | `for (int i = 1; i <= 10; i+=2) ...`
| `if abs(z) < 1: ...; elif: ... else: ...` | `if (Abs(z) < 1) ...`
| `while cond: {stmt-list} \| stmt` | `while (cond) {stmt}`

## Misc
```
f(z) := iterate(w -> w^2 + c, 1+i, w -> abs(w) > 2, 100)
``` 

compiles to 
```
vec2 anon1(vec2 z) { return Pow(z, 2.) + c; }
boolean anon2(vec2 z) { return Abs(z) < 2.; }
vec2 f(vec2 z) {
    z = vec2(1., 1.);
    for (int i = 0; i < 100; i+= 1) {
        if (anon2(z)) break;
        z = anon1(z);
    }
    return z;
}
```
(same as)  
```
f(z) :=
    z = 1 + i
    for _ = 1..100:
        if abs(z) > 2: break
        z = z^2 + c
    return z
```