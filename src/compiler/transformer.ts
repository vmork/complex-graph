import * as ast from "./ast-nodes";
import { DT } from "./types";
import { allCombinations } from "./utils";
import { typeToGlslType } from "./types";
import { builtinVars } from "./builtins";

const TAB_STR = " ".repeat(4);

// Takes a type-inferred syntax tree and outputs a glsl string
// Probably didnt need to be a class but fits with scanner -> parser -> typechecker being classes
export class Transformer {
    tree: ast.Node;
    indentLevel: number = 0;

    constructor(tree: ast.Node) {
        this.tree = tree;
    }

    _indentStr() {
        return TAB_STR.repeat(this.indentLevel);
    }

    _bracedBlock(node: ast.StmtList) {
        this.indentLevel += 1;
        const body = this.stmtList(node);
        this.indentLevel -= 1;
        return `{\n${body}\n${this._indentStr()}}`;
    }

    _number(x: number) {
        let out = x.toString();
        return out.includes(".") ? out : out + ".0";
    }

    transform(node: ast.Node = this.tree): string {
        switch (node.nodeType) {
            case ast.NT.StmtList:
                return this.stmtList(node);
            case ast.NT.Declaration:
                return this.declaration(node);
            case ast.NT.Assignment:
                return this.assignment(node);
            case ast.NT.If:
                return this.if(node);
            case ast.NT.For:
                return this.for(node);
            case ast.NT.While:
                return this.while(node);
            case ast.NT.FuncDef:
                return this.funcDef(node);
            case ast.NT.Break:
                return this.break(node);
            case ast.NT.Return:
                return this.return(node);
            case ast.NT.Grouping:
                return this.grouping(node);
            case ast.NT.Binary:
                return this.binary(node);
            case ast.NT.Unary:
                return this.unary(node);
            case ast.NT.Literal:
                return this.literal(node);
            case ast.NT.Variable:
                return this.variable(node)
            case ast.NT.FuncCall:
                return this.funcCall(node);

            default:
                const _exhaustiveCheck: never = node;
        }
    }

    stmtList(node: ast.StmtList) {
        let strs = [];
        for (let stmt of node.statements) {
            let s = this.transform(stmt);
            if (!s.endsWith("}")) s += ";";
            strs.push(s);
        }
        return this._indentStr() + strs.join("\n" + this._indentStr());
    }

    declaration(node: ast.Declaration) {
        const glslType = typeToGlslType.get(node.value.dataType);
        return `${glslType} ${node.name} = ${this.transform(node.value)}`;
    }

    assignment(node: ast.Assignment) {
        return `${node.name} = ${this.transform(node.value)}`;
    }

    if(node: ast.If) {
        let out = `if (${this.transform(node.condition)}) ${this._bracedBlock(
            node.mainBranch
        )}`;
        if (node.elseBranch)
            out += ` else ${this._bracedBlock(node.elseBranch)}`;
        return out;
    }

    for(node: ast.For) {
        let { loopvar, start, end, step, body } = node;
        let startStr = this.transform(start),
            endStr = this.transform(end),
            stepStr = this.transform(step);
        return `for (float ${loopvar} = ${startStr}; ${loopvar} <= ${endStr}; ${loopvar} += ${stepStr}) ${this._bracedBlock(
            body
        )}`;
    }

    while(node: ast.While) {
        return `while (${this.transform(node.condition)}) ${this._bracedBlock(
            node.body
        )}`;
    }

    funcDef(node: ast.FunctionDefinition) {
        let { name, params, body, dataType } = node;
        let returnTypeStr = typeToGlslType.get(dataType);
        let overloads = [];
        for (let paramTypes of allCombinations(["vec2"], params.length)) {
            let func = `${returnTypeStr} ${name}(${params
                .map((p, i) => paramTypes[i] + " " + p)
                .join(", ")}) ${this._bracedBlock(body)}`;
            overloads.push(func);
        }
        return overloads.join("\n");
    }

    break(node: ast.Break) {
        return "break";
    }

    return(node: ast.Return) {
        return `return ${this.transform(node.value)}`;
    }

    grouping(node: ast.Grouping) {
        return `(${this.transform(node.expr)})`;
    }

    binary(node: ast.Binary) {
        const leftStr = this.transform(node.left),
            rightStr = this.transform(node.right);
        const leftType = node.left.dataType,
            rightType = node.right.dataType;
        const opStr = node.op.lexeme;
        const defaultOut = `${leftStr} ${opStr} ${rightStr}`;

        // Code would be simpler if we just implemented all overloads in complex.glsl
        // But we try to avoid function calls when normal glsl binary ops do the right thing, for performance
        // Dont know if it actually makes a difference but cant hurt
        switch (opStr) {
            case "-":
            case "+":
                if (leftType === DT.Real && rightType === DT.Imag)
                    return `vec2(${leftStr}, 0.0) ${opStr} ${rightStr}`;
                if (leftType === DT.Imag && rightType === DT.Real)
                    return `${leftStr} ${opStr} vec2(${rightStr}, 0.0)`;
                return defaultOut;
            case "*":
                if (leftType === DT.Imag && rightType === DT.Imag)
                    return `Mul(${leftStr}, ${rightStr})`;
                return defaultOut;
            case "/":
                if (rightType === DT.Real) return defaultOut;
                return `Div(${leftStr}, ${rightStr})`;
            case "^":
                if (leftStr === "e") return `Exp(${rightStr})`;
                return `Pow(${leftStr}, ${rightStr})`;
            case "<":
            case ">":
            case "<=":
            case ">=":
                return defaultOut;
        }
    }

    unary(node: ast.Unary) {
        return `${node.op.lexeme}${this.transform(node.expr)}`;
    }

    variable(node: ast.Variable) {
        if (builtinVars.has(node.name)) {
            return builtinVars.get(node.name).value
        }
        return node.name
    }

    funcCall(node: ast.FunctionCall) {
        // console.log(node)
        
        const argStrs = node.args.map((x) => this.transform(x));
        return `${node.callee.name}(${argStrs.join(", ")})`;
    }

    literal(node: ast.Literal) {
        const { dataType: type, value } = node;
        switch (type) {
            case DT.Bool:
                return value === true ? "true" : "false";
            case DT.Real:
                return this._number(value as number);
            case DT.Imag:
                return `vec2(0.0, ${this._number(value as number)})`;
            case DT.Color: 
                throw new Error("literal color makes no sense")
            default:
                const _exhaustiveCheck: never = type;
        }
    }
}
