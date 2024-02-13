import { Token, TT } from './token';
import { SyntaxErr } from './error';
import * as ast from './ast-nodes';

const EOF = new Token(TT.EOF, null, -1);

class Parser {
    tokens: Token[];
    cur: number = 0;
    
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    // Utility methods

    error(msg: string) {
        console.log(this.cur)
        throw new SyntaxErr(msg, this.peek().line, this.peek().lexeme);
    }

    isAtEnd() {
        return this.cur >= this.tokens.length;
    }

    peek() {
        if (this.isAtEnd()) return EOF;
        return this.tokens[this.cur]
    }

    advance() { // assumes were not at the end
        if (this.isAtEnd()) return EOF;
        return this.tokens[this.cur++]; 
    }

    match(types: TT[], consume = true) {
        const c = this.peek();
        if (types.some(t => c.type === t)) return this.advance();
        return false;
    }

    matchOrError(types: TT[], msg: string, consume = true) {
        const tok = this.match(types, consume);
        if (tok) return tok;
        else this.error(msg);
    }

    // Recursive descent methods

    parse() {
        return this.stmtList();
    }

    stmtList(): ast.StmtList {
        let statements: ast.StmtNode[] = [];
        while (!this.isAtEnd() && (this.peek().type !== TT.DEDENT) ) {
            let stmt = this.statement();
            console.log(stmt);
            statements.push();
        }
        return {type: ast.NT.StmtList, statements: statements }
    }

    statement(): ast.StmtNode {
        // TODO: funcdef
        let stmt: ast.StmtNode;
        switch (this.peek().type) {
            case TT.IDENTIFIER: 
                stmt = this.assignmentOrDeclaration(); break;
            case TT.IF:
                this.advance(); stmt = this.ifStmt(); break;
            case TT.FOR: 
                this.advance(); stmt = this.forStmt(); break;
            case TT.WHILE: 
                this.advance(); stmt = this.whileStmt(); break;
            case TT.RETURN: 
                this.advance(); stmt = this.returnStmt(); break;
            case TT.BREAK: 
                console.log("break", this.cur)
                this.advance(); stmt = this.breakStmt(); break;
            case TT.INDENT:
                this.error("Unexpected indent");
            default:
                this.error("Excpected statement");
        }
        console.log("stmt", nodeToStr(stmt), this.cur)
        this.matchOrError([TT.NEWLINE, TT.EOF], "Excpected newline at the end of statement")
        return stmt;
    }

    assignmentOrDeclaration() {
        const name = this.advance().lexeme
        const op = this.matchOrError([TT.EQUAL, TT.COLON_EQUAL], "Excpected assignment or declaration");
        const value = this.expression();
        if (op.type === TT.EQUAL) return {type: ast.NT.Assignment, name: name, value: value} as ast.Assignment
        else return {type: ast.NT.Declaration, name: name, value: value} as ast.Declaration
    }

    indentedBlockOrStmt() {
        if (this.match([TT.NEWLINE])) {
            this.matchOrError([TT.INDENT], "Excpected indent");
            return this.stmtList();
        }
        else {
            return this.statement();
        }
    }

    ifStmt() {
        const condition = this.expression();
        this.matchOrError([TT.COLON], "Excpected ':' in if-statement");
        const mainBranch = this.indentedBlockOrStmt();

        let elseBranch: ast.StmtNode | ast.StmtList;
        if (this.match([TT.ELIF])) {
            elseBranch = this.ifStmt();
        }
        else if (this.match([TT.ELSE])) {
            elseBranch = this.indentedBlockOrStmt();
        }
        return {type: ast.NT.If, condition, mainBranch, elseBranch} as ast.If;
    }

    whileStmt() {
        const condition = this.expression();
        this.matchOrError([TT.COLON], "Excpected ':' in while-statement");
        const body = this.indentedBlockOrStmt();
        return {type: ast.NT.While, condition, body} as ast.While
    }

    forStmt() {
        const loopvar = this.advance();

        return {type: ast.NT.For} as ast.For
    }

    returnStmt() {
        return {type: ast.NT.Break} as ast.Break
    }

    breakStmt() {
        return {type: ast.NT.Break} as ast.Break
    }

    expression() {
        this.advance();
        return {type: ast.NT.Break} as ast.Break
    }
}

function isNode(x: any) {
    if (!(typeof x === 'object' && 'type' in x)) return false
    return Object.values(ast.NT).filter(k => typeof k === "string").includes(ast.NT[x.type]);
}
function nodeToStr(node: any) {
    let out = new Object();
    if (isNode(node)) out['NT'] = ast.NT[node.type];
    for (let [key, value] of Object.entries(node)) {
        if (isNode(value)) out[key] = nodeToStr(value);
        else if (value instanceof Array) {
            return value.map(x => nodeToStr(x))
        }
    }
    return out;
}

import {Scanner} from './scanner'
let source = `
if 1: break
x = 1
`

let scanner = new Scanner(source);
let tokens = scanner.scan()
console.log(tokens.map(t => t.toString()))
let parser = new Parser(tokens)
try {
    let tree = parser.parse()
    console.log(nodeToStr(tree))
} catch (e) {
    if (e instanceof SyntaxErr) {
        console.log(`ERROR line ${e.line} at '${e.lexeme}': ${e.message}`)
        // console.log(e.stack)
    }
}