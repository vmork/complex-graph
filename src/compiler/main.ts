import {Scanner} from './scanner'
import { Parser } from './parser'
import { Transformer } from './transformer'
import { treeAsJson } from './utils'
import { SyntaxErr } from './error'

let source = `
if true: x = 1
elif false: y = 2
elif false: z = 3
else: q = 4
k := 7
`
try {
    let scanner = new Scanner(source);
    let tokens = scanner.scan();
    console.log(tokens.map(t => t.toString()));

    let parser = new Parser(tokens);
    let tree = parser.parse() as any;
    // console.log(treeAsJson(tree));

    let transformer = new Transformer(tree);
    let glsl = transformer.transform();
    console.log("output:\n" + glsl);

} catch (e) {
    if (e instanceof SyntaxErr) {
        console.error(`ERROR line ${e.line} at '${e.lexeme}': ${e.message}`);
        // console.log(e.stack)
    }
    else {
        console.error(e);
    }
}