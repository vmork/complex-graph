import { compile } from "./main"
import chalk  from "chalk";
import { treeAsJson } from "./utils";

const LS = "-".repeat(20)
const LS2 = "-".repeat(20)

function runSnippet(id: string, src: string, skipTypeCheck=false, logAst=false, logTokens=false) {
    let cOut = compile(src, new Map(), skipTypeCheck) 
    let outStr = cOut.errors.length > 0 ? cOut.errors[0].toString() : cOut.glslString

    if (logAst) console.log(treeAsJson(cOut.astTree))
    if (logTokens) console.log(cOut.tokens.map(x => x.toString()));

    let expectedError = id.startsWith("bad")
    let hadError = cOut.errors.length > 0
    let passed = expectedError === hadError
    let line1: string;
    if (passed) line1 = chalk.green(`${LS} ${id} ${LS} PASSED`)
    else line1 = chalk.red(`${LS} ${id} ${LS} FAILED (Expected ${expectedError ? '' : 'no '}error)`)

    console.log(`${line1}\n${src.trim()}\n${LS2}\n${outStr}\n`)

    return passed
}

function runAllSnippets(snippets: { [id: string]: string }, skipTypeCheck=false, logAst=false) {
    const ids = Object.keys(snippets);
    let failedIds = [];
    ids.forEach(id => {
        let passed = runSnippet(id, snippets[id], skipTypeCheck, logAst)
        if (!passed) failedIds.push(id)
    })
    console.log(`Passed ${ids.length-failedIds.length}/${ids.length} tests`)
    console.log(`Failed tests: ${failedIds.join(", ")}`)
}

const parsingSnippets = { // no typecheck, only tests parsing
declaration1: `x := 4.20`,
assignment1: `x = 1; y = 2`,

operation1: `x := 1 + 2^3 * 4 - 7i`,
operation2: `x := -5 + --7^2`,
operation3: `x := 2(3 + 1)^2(4 + 2)f(1)`,
operation4: `x := a b c`,
operation5: `x := 2a b c`,

for1: `for j = -2^3..10..2: break`,

indents1: `
if true:
    if true:
        break
    x := 1
y := 2`,
indents2: `
if true:
    if true:
        if true: break
    break`,

if1: `if true: x = 1`,
if2: `if true: x = 1; else: x = 2`,
if3: `if true: x = 1; elif false: x = 2`,
if4: `if true: x = 1; elif false: x = 2; else: x = 3`,
if5: `if true:\n\tx = 1\n\ty = 2`,
badIf1: `if true: `,

funcdef1: `f() := 1`,
funcdef2: `f(x) := x`,
funcdef3: `f(x, y, z) := x + y + z`,
funcdef4: `
f(x, y) :=
    x = y
    break`,
funcdef5: `
f(x) := 
    return 2x
g(x) := 
    return 3x`,
funcdef6: `f(x) := 2x; g(x) := 3x`,
funcdef7: `
f(x) := 2x
g(x) := 3x`,
funcdef8: `
f(x) := 
    if true:
        return 1
    return 2

g(x) := x`,

badFuncdef1: `f(x,) := 1`,
badFuncdef2: `f() = 12`,
badFuncdef3: `f(,) := 1`,
badFuncdef4: `f(x, y := 1`,
badFuncdef5: `f() := return 1`,

funcCall1: `x := f()`,
funcCall2: `x := f(1, 2)x g(1);`,
}

const typecheckSnippets = {
scope1: `x := 1; y := 2; x = 1; y = 3`,
scope2: `if true: x := 1; elif true: x := 2; else: x := 3`,
scope3: `
y := 1
if true: 
    x := 2
    if true: y = 2`,

badScope1: `pi := 1`,
badScope2: `x := 1; x := 2`,
badScope3: `x = 1`,
badScope4: `if true: x := 1; else: x = 2`,

if1: `if 1 < 2: break`,
badIf1: `if 1: break`,

for1: `for j = 1..10: x := 2j`,
for2: `for j = 1..10: x := 2j; break`,
badFor1: `for j = 1..10: x := 2j; break; x := 2j`,

while1: `while true: x := 1`,
badWhile1: `while 1: x := 1`,

funcdef1: `f() := 1`,
funcdef2: `f(x) := 2x`,
funcdef3: `f(x, y) := x y`,
funcdef4: `
f(x) := 
    x = 1 + i
    if true: return x + 1
    else: return x`,

badFuncdef1: `f(x, x) := x`,
badFuncdef2: `
f() := 
    x := 2`,
badFuncdef3: `
f(x) := 
    x = 1 + i
    if true: return x
    else: return 1`,
badFuncdef4: `sin(x) := cos(x)`,

funcCall1: `f(x) := tan(arctan(x) + i)`,
funcCall2: `x := conj(abs(sin(cos(arctan(re(im(i)))))))`,
funcCall3: `f(x) := 2x; x := f(i)`,
funcCall4: `x := cos(i); a := x*2sin(x)^2`,

badFuncCall1: `x := g(1)`,
badFuncCall2: `x := sin(true)`,
badFuncCall3: `f(x, y) := x y; z := f(i, 1 < 2)`
}
    
// runSnippet('for2', parsingSnippets['for2'], true, false, true)
runAllSnippets(parsingSnippets, true);
// runAllSnippets(typecheckSnippets, false, false)