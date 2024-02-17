import {Scanner} from './scanner'
import { Parser } from './parser'
import { Transformer } from './transformer'
import { TypeChecker } from './typechecker'
import { treeAsJson } from './utils'
import { CompileError, SyntaxErr } from './error'
import * as ast from './ast-nodes'
import { Token } from './token'

export const settings = {
    maxFunctionParams: 5,
    mainFunctionName: "f",
}

export type compilerOutput = {
    tokens: Token[], 
    astTree: ast.Node,
    glslString: string,
    errors: CompileError[]
}

export function compile(src: string, skipTypeCheck: boolean = false): compilerOutput {
    let tokens: Token[], astTree: ast.Node, glslString: string, errors: CompileError[] = [];

    try {
        let scanner = new Scanner(src);
        tokens = scanner.scan();
        // console.log(tokens.map(t => t.toString()));
    
        let parser = new Parser(tokens);
        astTree = parser.parse();
        // console.log(treeAsJson(tree));

        let typechecker = new TypeChecker(astTree);
        if (!skipTypeCheck) typechecker.typecheck();
    
        let transformer = new Transformer(astTree);
        glslString = transformer.transform();
        // console.log("output:\n" + glsl);

    } catch (err) {
        if (err instanceof CompileError) {
            errors.push(err);
        }
        else {
            console.error("Internal compiler error");
            throw err
        }
    }

    return {tokens, astTree, glslString, errors}
}

// let output = compile("x := 1; x := 2")
// if (output.errors.length > 0) console.log(output.errors.map(e => e.toString()))
// // console.log(treeAsJson(output.astTree))
// console.log(output.glslString)