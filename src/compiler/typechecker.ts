import * as ast from "./ast-nodes"
import { DT } from "./types";
import { builtinVars, builtinFuncs } from "./builtins";
import { TypeErr } from "./error";
import { functionSignature } from "./types";
import { treeAsJson } from "./utils";

type VariableInfo = { type: DT }
type VariableEnv = Map<string, VariableInfo>
type VariableScope = { env: VariableEnv, parent: VariableScope }

type FunctionInfo = { signatures: functionSignature[] }
type FunctionEnv = Map<string, FunctionInfo>

type CurrentFunction = {
    name: string 
    varScope: VariableEnv
    returnType: DT
}

export class TypeChecker {
    declaredFunctions: FunctionEnv
    globalVarScope: VariableEnv
    insideFuncDef: boolean = false
    currentFunction: CurrentFunction
    tree: ast.Node

    constructor(tree: ast.Node) {
        this.tree = tree;
        this.globalVarScope = new Map();
        this.declaredFunctions = new Map();
    }

    lookupVar(name: string) {
        let v: VariableInfo;
        if (this.insideFuncDef) {
            v = this.currentFunction.varScope.get(name); if (v) return v;
        }
        v = this.globalVarScope.get(name); if (v) return v;
        return builtinVars.get(name);
    }
    
    declareVar(name: string, type: DT) {
        console.log("in declareVar: ", name, this.globalVarScope)
        if (this.insideFuncDef) {
            if (this.currentFunction.varScope.has(name)) this.error(`Cannot redeclare variable ${name}`);
            this.currentFunction.varScope.set(name, { type });
        }
        else {
            if (this.globalVarScope.has(name) || builtinVars.has(name)) this.error(`Cannot redeclare variable ${name}`);
            this.globalVarScope.set(name, { type });
        }
    }

    error(msg: string) {
        throw new TypeErr(msg);
    }

    assertType(types: DT[], validTypes: DT[], msg: string) {
        types.forEach(type => { if (!validTypes.includes(type)) this.error(msg) });
    }
    assertNumeric(types: DT[], msg: string) {
        this.assertType(types, [DT.Real, DT.Imag], msg);
    }
    assertBool(types: DT[], msg: string) {
        this.assertType(types, [DT.Bool], msg);
    }

    typecheck(node: ast.Node = this.tree): DT {
        console.log("in typecheck: ", treeAsJson(node))
        let type: any;
        switch (node.nodeType) {
            case ast.NT.StmtList: type = this.stmtList(node); break
            case ast.NT.Declaration: type = this.declaration(node); break
            case ast.NT.Assignment: type = this.assignment(node); break
            case ast.NT.If: type = this.if(node); break
            case ast.NT.For: type = this.for(node); break
            case ast.NT.While: type = this.while(node); break
            case ast.NT.FuncDef: type = this.funcDef(node); break
            case ast.NT.Break: return; break
            case ast.NT.Return: type = this.return(node); break
            case ast.NT.Grouping: type = this.grouping(node); break
            case ast.NT.Binary: type = this.binary(node); break
            case ast.NT.Unary: type = this.unary(node); break
            case ast.NT.Literal: type = this.literal(node); break
            case ast.NT.Variable: type = this.variable(node); break
            // case ast.NT.FuncCall: type = this.funcCall(node);
            default: this.error("Unsupported node: " + ast.NT[node.nodeType])
        }
        node.dataType = type;
        return type;
    }

    // Statements

    stmtList(node: ast.StmtList) {
        node.statements.forEach(this.typecheck.bind(this));
    }

    declaration(node: ast.Declaration) {
        const rhsType = this.typecheck(node.value);
        this.declareVar(node.name, rhsType);
    }

    assignment(node: ast.Assignment) {
        if (builtinVars.has(node.name)) this.error(`Cannot reassign builtin variable ${node.name}`);
        let v = this.lookupVar(node.name);
        if (!v) this.error(`Cannot assign to undeclared variable ${node.name}`);
        const rhsType = this.typecheck(node.value);
        if (v.type !== rhsType) {
            this.error(`Cannot reassign ${node.name} from type ${DT[v.type]} to ${DT[rhsType]}`);
        }
    }

    if(node: ast.If) {
        console.log("in if: ", node.elseBranch)
        this.assertType([this.typecheck(node.condition)], [DT.Bool], "Condition in if-statement is not of type Bool");

        // prevScope = this.varScope 
        // this.varScope = { vars: {}, parent: prevScope }
        this.typecheck(node.mainBranch);
        // this.varScope = prevScope

        if (node.elseBranch) this.typecheck(node.elseBranch);
    }

    for(node: ast.For) {
        const [startType, endType, stepType] = [node.start, node.end, node.step].map(x => this.typecheck(x));
        this.assertType([startType, endType, stepType], [DT.Real], "For-loop bounds are not of type Real");
        this.typecheck(node.body);
    }

    while(node: ast.While) {
        this.assertType([this.typecheck(node.condition)], [DT.Bool], "Condition in while-loop is not of type Bool");
        this.typecheck(node.body);
    }

    funcDef(node: ast.FunctionDefinition) {
        if (this.declaredFunctions.has(node.name) || builtinFuncs.has(node.name)) {
            this.error(`Cannot redeclare function ${node.name}`);
        }
        this.insideFuncDef = true;
        this.currentFunction = {name: node.name, varScope: new Map(), returnType: null}
        const inputTypes = node.params.map(x => DT.Imag) // only allowing imaginary params in user defined functions for now

        node.params.forEach((x, i) => this.declareVar(x, inputTypes[i]))

        this.typecheck(node.body);
        const returnType = this.currentFunction.returnType; // should be set when typechecking body and encountering return
        if (!returnType) this.error(`Function ${node.name} doesnt return a value`)

        const signature = {in: inputTypes, out: returnType} as functionSignature;
        this.declaredFunctions.set(node.name, { signatures: [signature] });

        this.insideFuncDef = false;
        return returnType;
    }

    return(node: ast.Return) {
        const type = this.typecheck(node.value);
        if (this.currentFunction.returnType && this.currentFunction.returnType !== type) {
            this.error(`Function ${this.currentFunction.name} has multiple possible return types`);
        }
        this.currentFunction.returnType = type;
    }

    // Expressions

    grouping(node: ast.Grouping) {
        return this.typecheck(node.expr);
    }

    binary(node: ast.Binary) {
        const {left, right, op} = node;
        const leftType = this.typecheck(left), rightType = this.typecheck(right);
        if (["+", "-", "*", "/", "^"].includes(op.lexeme)) {
            this.assertNumeric([leftType, rightType], `Wrong operand types for ${op.lexeme}: ${DT[leftType]}, ${DT[rightType]}`);
            if (leftType === DT.Real && rightType === DT.Real) return DT.Real;
            return DT.Imag;
        }
        if (["<", ">", "<=", ">="].includes(op.lexeme)) {
            this.assertNumeric([leftType, rightType], `Wrong operand types for ${op.lexeme}: ${DT[leftType]}, ${DT[rightType]}`);
            return DT.Bool;
        }
    }

    unary(node: ast.Unary) {
        const operandType = this.typecheck(node.expr)
        const opStr = node.op.lexeme;
        const errMsg = `Wrong operand type for unary ${opStr}: ${DT[operandType]}`
        if (opStr === "-") this.assertNumeric([operandType], errMsg)
        if (opStr === "!") this.assertBool([operandType], errMsg);
        return operandType;
    }

    literal(node: ast.Literal) {
        console.assert(node.dataType !== undefined); // should have been set in parsing
        return node.dataType;
    }

    variable(node: ast.Variable) {
        let v = this.lookupVar(node.name);
        if (!v) this.error(`Undeclared variable ${node.name}`);
        return v.type;
    }
}