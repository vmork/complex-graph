import type { DataType } from './types'
import type { LiteralValue, Token } from "./token";

export enum NT {
    // Expressions
    Literal, Unary, Binary, Grouping, Variable, FunctionCall,
    // Statements
    StmtList, Declaration, Assignment, For, While, If, FunctionDefinition, Return, Break  
}

export interface Literal {
    type: NT.Literal
    value: LiteralValue
    dataType: DataType
}
export interface Unary {
    type: NT.Unary
    operator: Token
    expression: Node
}
export interface Binary {
    type: NT.Binary
    operator: Token 
    left: Node
    right: Node 
}
export interface Grouping {
    type: NT.Grouping
    expression: Node
}
export interface Variable {
    type: NT.Variable
    name: string
}
export interface FunctionCall {
    type: NT.FunctionCall
    callee: Variable
    args: Node[]
}
export interface StmtList {
    type: NT.StmtList
    statements: Node[]
}
export interface Declaration {
    type: NT.Declaration
    name: string
    value: Node
}
export interface Assignment {
    type: NT.Assignment
    name: string
    value: Node
}
export interface For {
    type: NT.For
    loopvar: string
    start: number
    end: number
    step: number
    body: Node
}
export interface While {
    type: NT.While
    condition: Node
    body: Node
}
export interface If {
    type: NT.If
    condition: Node
    mainBranch: Node
    elseBranch: Node | null
}
export interface FunctionDefinition {
    type: NT.FunctionDefinition
    name: string
    params: string[]
    body: Node
}
export interface Return {
    type: NT.Return
    value: Node
}
export interface Break {
    type: NT.Break
}

export type ExprNode = Literal | Unary | Binary | Grouping | Variable | FunctionCall 
export type StmtNode = StmtList | Declaration | Assignment | For | While | If | FunctionDefinition | Return | Break
export type Node = ExprNode | StmtNode

console.log()



