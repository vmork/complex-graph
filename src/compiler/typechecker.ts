import * as ast from "./ast-nodes"
import { DT } from "./types";
import { builtinVars, builtinFuncs, BuiltinFunctionInfo } from "./builtins";
import { TypeErr } from "./error";
import { functionSignature } from "./types";
import { arrayEqual, treeAsJson } from "./utils";
import { settings } from "./main";

export type VariableInfo = { type: DT }
export type VariableEnv = Map<string, VariableInfo>
type VariableScope = { env: VariableEnv, parent: VariableScope }

export type FunctionInfo = { signatures: functionSignature[] }
export type FunctionEnv = Map<string, FunctionInfo>

type CurrentFunction = {
    name: string 
    returnType: DT
}

export class TypeChecker {
    declaredFunctions: FunctionEnv
    currentScope: VariableScope
    insideFuncDef: boolean = false
    currentFunction: CurrentFunction
    tree: ast.Node

    constructor(tree: ast.Node, predeclaredVars: VariableEnv) {
        this.tree = tree;
        this.currentScope = { env: predeclaredVars || new Map(), parent: null };
        this.declaredFunctions = new Map();
    }

    withNewScope(callback: () => any) {
        const prevScope = this.currentScope;
        this.currentScope = { env: new Map(), parent: prevScope };
        const out = callback();
        this.currentScope = prevScope;
        return out;
    }

    lookupVar(name: string) {
        let scope = this.currentScope
        while (scope) {
            const v = scope.env.get(name); if (v) return v;
            scope = scope.parent;
        }
        return builtinVars.get(name);
    }
    
    declareVar(name: string, type: DT) {
        if (builtinVars.has(name) || this.currentScope.env.has(name)) this.error(`Cannot redeclare variable ${name}`);
        this.currentScope.env.set(name, { type });
    }

    error(msg: string): never {
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

    typecheckTree() {
        this.typecheck(this.tree)
        let mainFunc = this.declaredFunctions.get(settings.mainFunctionName)
        if (!mainFunc) this.error(`Must declare a main function f(z)`);
        const requiredSignature = {in: [DT.Imag], out: DT.Imag} as functionSignature
        console.log(mainFunc.signatures, [requiredSignature])
        if (!arrayEqual(mainFunc.signatures, [requiredSignature])) {
            this.error(`Main function must be of type Imag -> Imag`)
        }
    }

    typecheck(node: ast.Node): DT {
        let type: any;
        switch (node.nodeType) {
            case ast.NT.StmtList: type = this.stmtList(node); break
            case ast.NT.Declaration: type = this.declaration(node); break
            case ast.NT.Assignment: type = this.assignment(node); break
            case ast.NT.If: type = this.if(node); break
            case ast.NT.For: type = this.for(node); break
            case ast.NT.While: type = this.while(node); break
            case ast.NT.FuncDef: type = this.funcDef(node); break
            case ast.NT.Break: return;
            case ast.NT.Return: type = this.return(node); break
            case ast.NT.Grouping: type = this.grouping(node); break
            case ast.NT.Binary: type = this.binary(node); break
            case ast.NT.Unary: type = this.unary(node); break
            case ast.NT.Literal: type = this.literal(node); break
            case ast.NT.Variable: type = this.variable(node); break
            case ast.NT.FuncCall: type = this.funcCall(node); break
            default: const _exhaustiveCheck: never = node;
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
        this.assertType([this.typecheck(node.condition)], [DT.Bool], "Condition in if-statement is not of type Bool");
        this.withNewScope(() => this.typecheck(node.mainBranch));
        if (node.elseBranch) this.withNewScope(() => this.typecheck(node.elseBranch));
    }

    for(node: ast.For) {
        const [startType, endType, stepType] = [node.start, node.end, node.step].map(x => this.typecheck(x));
        this.assertType([startType, endType, stepType], [DT.Real], "For-loop bounds are not of type Real");
        this.withNewScope(() => {
            this.declareVar(node.loopvar, DT.Real);
            this.typecheck(node.body)
        });
    }

    while(node: ast.While) {
        this.assertType([this.typecheck(node.condition)], [DT.Bool], "Condition in while-loop is not of type Bool");
        this.withNewScope(() => this.typecheck(node.body));
    }

    funcDef(node: ast.FunctionDefinition) {
        if (this.declaredFunctions.has(node.name) || builtinFuncs.has(node.name)) {
            this.error(`Cannot redeclare function ${node.name}`);
        }
        this.insideFuncDef = true;
        this.currentFunction = {name: node.name, returnType: null}
        const inputTypes = node.params.map(x => DT.Imag) // only allowing imaginary params in user defined functions for now
        
        this.withNewScope(() => {
            node.params.forEach((x, i) => this.declareVar(x, inputTypes[i]))
            this.typecheck(node.body)
        });

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
            this.assertType([leftType, rightType], [DT.Real], `Wrong operand types for ${op.lexeme}: ${DT[leftType]}, ${DT[rightType]}`);
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

    funcCall(node: ast.FunctionCall) {
        let name = node.callee.name;
        let f = builtinFuncs.get(name);
        if (f) node.callee.name = f.glslName;
        else f = this.declaredFunctions.get(name)
        if (!f) this.error(`Undeclared function ${name}`);
        
        const inputTypes = node.args.map(expr => this.typecheck(expr));
        for (let sig of f.signatures) {
            if (arrayEqual(sig.in, inputTypes)) return sig.out;
        }
        this.error(`Wrong argument types for ${name}: [${inputTypes.map(t => DT[t]).join(', ')}]`)
    }
}