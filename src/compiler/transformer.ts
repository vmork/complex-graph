import * as ast from "./ast-nodes"
import { DataType as DT } from "./types";

const typeToGlslType = new Map<DT, string>([
    [DT.Real, "float"], [DT.Imag, "vec2"], [DT.Bool, "bool"]
])

const TAB_STR = " ".repeat(4);

export class Transformer {
    tree: Node;
    indentLevel: number = 0;
    
    constructor(tree: Node) {
        this.tree = tree;
    }

    transform(node: ast.Node = this.tree): string {
        switch (node.nodeType) {
            case ast.NT.StmtList: return this.stmtList(node);
            case ast.NT.Declaration: return this.declaration(node);
            case ast.NT.Assignment: return this.assignment(node);
            case ast.NT.If: return this.if(node);
            case ast.NT.For: return this.for(node);
            case ast.NT.While: return this.while(node);
            case ast.NT.FunctionDefinition: return this.functionDefinition(node);
            case ast.NT.Break: return this.break(node);
            case ast.NT.Return: return this.return(node);
            case ast.NT.Grouping: return this.grouping(node);
            case ast.NT.Binary: return this.binary(node);
            case ast.NT.Unary: return this.unary(node);
            case ast.NT.Literal: return this.literal(node);
            case ast.NT.Variable: return node.name;
            case ast.NT.FunctionCall: return this.functionCall(node);

            default: const _exhaustiveCheck: never = node;
                // return `[unknown node: ${ast.NT[node.nodeType]}]`
        }
    }

    _indentStr() {
        return TAB_STR.repeat(this.indentLevel);
    }
    
    stmtList(node: ast.StmtList) {
        let strs = []
        for (let stmt of node.statements) {
            let s = this.transform(stmt);
            if (!s.endsWith("}")) s += ";";
            strs.push(s);
        }
        return this._indentStr() + strs.join("\n" + this._indentStr())
    }

    _bracedBlock(node: ast.StmtList) {
        this.indentLevel += 1; const body = this.stmtList(node); this.indentLevel -= 1;
        return `{\n${body}\n${this._indentStr()}}`
    }

    declaration(node: ast.Declaration) {
        const modifier = "float"; // TODO: type analysis of rhs expr
        return `${modifier} ${node.name} = ${this.transform(node.value)}`;
    }

    assignment(node: ast.Assignment) {
        return `${node.name} = ${this.transform(node.value)}`;
    }

    if(node: ast.If) {
        let out = `if (${this.transform(node.condition)}) ${this._bracedBlock(node.mainBranch)}`;
        if (node.elseBranch) out += ` else ${this._bracedBlock(node.elseBranch)}`;
        return out;
    }

    for(node: ast.For) {
        return "";
    }

    while(node: ast.While) {
        return "";
    }

    functionDefinition(node: ast.FunctionDefinition) {
        return "";
    }

    break(node: ast.Break) { 
        return "break"; 
    }

    return(node: ast.Return) { 
        return `return ${this.transform(node.value)}`; 
    }

    grouping(node: ast.Grouping) {
        return `(${this.transform(node.expr)})`
    }

    binary(node: ast.Binary) {
        // TODO: check types and 
        // 1. promote real to vec2(x, 0) when necessary (only for real+-imag)
        // 2. call lib-funcs when necessary (imag*imag, real/imag, imag/imag)
        return "";
    }

    unary(node: ast.Unary) {
        return `${node.op}${this.transform(node.expr)}` 
    }

    functionCall(node: ast.FunctionCall) {
        return `${node.callee.name}(${node.args.join(', ')})`
    }

    _number(x: number) {
        let out = x.toString();
        return out.includes(".") ? out : out + ".0";
    }

    literal(node: ast.Literal) {
        const {dataType: type, value} = node;
        switch (type) {
            case DT.Real: return this._number(value as number);
            case DT.Imag: return `vec2(0.0, ${this._number(value as number)})`;
            case DT.Bool: return value === true ? 'true' : 'false';
        }
    }
}