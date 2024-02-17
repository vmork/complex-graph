import type { DT } from './types'
import type { LiteralValue, Token, } from "./token";

export enum NT {
    // Expressions
    Literal, Unary, Binary, Grouping, Variable, FuncCall,
    // Statements
    StmtList, Declaration, Assignment, For, While, If, FuncDef, Return, Break  
}

export type ExprNode = Literal | Unary | Binary | Grouping | Variable | FunctionCall 
export type StmtNode = StmtList | Declaration | Assignment | For | While | If | FunctionDefinition | Return | Break
export type Node = ExprNode | StmtNode

interface AnyNode {
    nodeType: NT;
    dataType?: DT;
}
export interface TypedNode {
    nodeType: NT;
    dataType: DT;
}

export interface Literal extends AnyNode {
    nodeType: NT.Literal
    value: LiteralValue
    dataType: DT
}
export interface Unary extends TypedNode {
    nodeType: NT.Unary
    op: Token
    expr: ExprNode
}
export interface Binary extends AnyNode {
    nodeType: NT.Binary
    op: Token 
    left: ExprNode
    right: ExprNode 
}
export interface Grouping extends AnyNode {
    nodeType: NT.Grouping
    expr: ExprNode
}
export interface Variable extends AnyNode {
    nodeType: NT.Variable
    name: string
}
export interface FunctionCall extends AnyNode {
    nodeType: NT.FuncCall
    callee: Variable
    args: ExprNode[]
}
export interface StmtList extends AnyNode {
    nodeType: NT.StmtList
    statements: StmtNode[]
}
export interface Declaration extends AnyNode {
    nodeType: NT.Declaration
    name: string
    value: ExprNode
}
export interface Assignment extends AnyNode {
    nodeType: NT.Assignment
    name: string
    value: ExprNode
}
export interface For extends AnyNode {
    nodeType: NT.For
    loopvar: string
    start: ExprNode
    end: ExprNode
    step: ExprNode
    body: StmtList
}
export interface While extends AnyNode {
    nodeType: NT.While
    condition: ExprNode
    body: StmtList
}
export interface If extends AnyNode {
    nodeType: NT.If
    condition: ExprNode
    mainBranch: StmtList
    elseBranch?: StmtList
}
export interface FunctionDefinition extends AnyNode {
    nodeType: NT.FuncDef
    name: string
    params: string[]
    body: StmtList
}
export interface Return extends AnyNode {
    nodeType: NT.Return
    value: ExprNode
}
export interface Break extends AnyNode {
    nodeType: NT.Break
}