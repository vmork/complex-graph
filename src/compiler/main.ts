import { Scanner } from "./scanner";
import { Parser } from "./parser";
import { Transformer } from "./transformer";
import { TypeChecker, VariableEnv } from "./typechecker";
import { treeAsJson } from "./utils";
import { CompileError, SyntaxErr } from "./error";
import * as ast from "./ast-nodes";
import { Token } from "./token";
import { DT, functionSignature, glslType, glslTypeToDT } from "./types";

export { VariableEnv };

export const settings = {
    maxFunctionParams: 5,
    mainFunctionName: "f",
    mainFunctionSignature: {in: [DT.Imag], out: DT.Imag} as functionSignature,

    coloringFunctionName: "col",
    coloringFunctionSignature: {in: [DT.Imag], out: DT.Color} as functionSignature
};

export type compilerOutput = {
    tokens: Token[];
    astTree: ast.Node;
    glslString: string;
    errors: CompileError[];
};

export type CompilationContext = "mainFunc" | "coloring" | "testing"

export function compile(
    src: string, 
    userVariables: Map<string, glslType>, 
    skipTypeCheck = false, 
    context: CompilationContext = "mainFunc"): compilerOutput {

    let tokens: Token[],
        astTree: ast.Node,
        glslString: string,
        errors: CompileError[] = [];

    try {

        let scanner = new Scanner(src);
        tokens = scanner.scan();

        let parser = new Parser(tokens);
        astTree = parser.parse();

        const varEnv: VariableEnv = new Map();
        for (const [name, type] of userVariables.entries()) {
            varEnv.set(name, { type: glslTypeToDT.get(type) });
        }

        if (!skipTypeCheck) {
            let typechecker = new TypeChecker(astTree, varEnv);
            if (context === "mainFunc") {
                typechecker.typecheckTree(true, settings.mainFunctionName, settings.mainFunctionSignature)
            }
            else if (context === "coloring") {
                typechecker.typecheckTree(true, settings.coloringFunctionName, settings.coloringFunctionSignature)
            }
            else if (context === "testing") {
                typechecker.typecheckTree(false)
            }
        }

        let transformer = new Transformer(astTree);
        glslString = transformer.transform();

    } catch (err) {
        if (err instanceof CompileError) {
            errors.push(err);
        } else {
            console.error("Internal compiler error");
            throw err;
        }
    }

    return { tokens, astTree, glslString, errors };
}

// let output = compile("x := 1; x := 2")
// if (output.errors.length > 0) console.log(output.errors.map(e => e.toString()))
// // console.log(treeAsJson(output.astTree))
// console.log(output.glslString)
