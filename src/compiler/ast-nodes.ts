import type { DataType } from './types'
import type { LiteralValue, Token } from "./token";

export enum NT {
    // Expressions
    Literal, Unary, Binary, Grouping, Variable, FunctionCall,
    // Statements
    StmtList, Declaration, Assignment, For, While, If, FunctionDefinition, Return, Break  
}

export type ExprNode = Literal | Unary | Binary | Grouping | Variable | FunctionCall 
export type StmtNode = StmtList | Declaration | Assignment | For | While | If | FunctionDefinition | Return | Break
export type Node = ExprNode | StmtNode

interface NodeInterface {
    nodeType: NT;
    dataType?: DataType;
}

export interface Literal extends NodeInterface {
    nodeType: NT.Literal
    value: LiteralValue
    dataType: DataType
}
export interface Unary extends NodeInterface {
    nodeType: NT.Unary
    op: Token
    expr: ExprNode
}
export interface Binary extends NodeInterface {
    nodeType: NT.Binary
    op: Token 
    left: ExprNode
    right: ExprNode 
}
export interface Grouping extends NodeInterface {
    nodeType: NT.Grouping
    expr: ExprNode
}
export interface Variable extends NodeInterface {
    nodeType: NT.Variable
    name: string
}
export interface FunctionCall extends NodeInterface {
    nodeType: NT.FunctionCall
    callee: Variable
    args: ExprNode[]
}
export interface StmtList extends NodeInterface {
    nodeType: NT.StmtList
    statements: StmtNode[]
}
export interface Declaration extends NodeInterface {
    nodeType: NT.Declaration
    name: string
    value: ExprNode
}
export interface Assignment extends NodeInterface {
    nodeType: NT.Assignment
    name: string
    value: ExprNode
}
export interface For extends NodeInterface {
    nodeType: NT.For
    loopvar: string
    start: ExprNode
    end: ExprNode
    step: ExprNode
    body: StmtList
}
export interface While extends NodeInterface {
    nodeType: NT.While
    condition: ExprNode
    body: StmtList
}
export interface If extends NodeInterface {
    nodeType: NT.If
    condition: ExprNode
    mainBranch: StmtList
    elseBranch: StmtList | null
}
export interface FunctionDefinition extends NodeInterface {
    nodeType: NT.FunctionDefinition
    name: string
    params: string[]
    body: StmtList
}
export interface Return extends NodeInterface {
    nodeType: NT.Return
    value: ExprNode
}
export interface Break extends NodeInterface {
    nodeType: NT.Break
}