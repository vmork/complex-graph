import { Token, TT } from './token';
import { SyntaxErr } from './error';
import * as ast from './ast-nodes';
import { DataType as DT } from './types';

const EOF = new Token(TT.EOF, null, -1);

export class Parser {
    tokens: Token[];
    cur: number = 0;
    
    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    // Utility methods

    error(msg: string) {
        const tok = !this.isAtEnd() ? this.peek() : this.prev()
        throw new SyntaxErr(msg, tok.line, tok.lexeme);
    }

    isAtEnd() {
        return this.cur >= this.tokens.length;
    }

    peek() {
        if (this.isAtEnd()) return EOF;
        return this.tokens[this.cur]
    }

    prev() {
        return this.tokens[this.cur - 1];
    }

    backup() {
        this.cur -= 1;
    }

    advance() { // assumes were not at the end
        if (this.isAtEnd()) return EOF;
        return this.tokens[this.cur++]; 
    }

    match(types: TT[], consume = true) {
        const c = this.peek();
        if (types.some(t => c.type === t)) return (consume ? this.advance() : true);
        return false;
    }

    matchOrError(types: TT[], msg: string): Token {
        const tok = this.match(types);
        if (tok) return tok as Token;
        else this.error(msg);
    }

    // Recursive descent methods

    parse() {
        return this.stmtList();
    }

    stmtList(): ast.StmtList {
        let statements: ast.StmtNode[] = [];
        while (!this.isAtEnd() && (this.peek().type !== TT.DEDENT) ) {
            statements.push(this.statement());
        }
        return {nodeType: ast.NT.StmtList, statements: statements }
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
                this.advance(); stmt = this.breakStmt(); break;
            case TT.INDENT:
                this.error("Unexpected indent");
            default:
                this.error("Excpected statement");
        }
        if ([ast.NT.If, ast.NT.For, ast.NT.While].includes(stmt.nodeType)) return stmt; // newline has already been handled

        this.matchOrError([TT.NEWLINE, TT.EOF], "Unexcpected token " + this.peek().lexeme)

        return stmt;
    }

    assignmentOrDeclaration() {
        const name = this.advance().lexeme
        const op = this.matchOrError([TT.EQUAL, TT.COLON_EQUAL], "Excpected assignment or declaration");
        const value = this.expression();
        if (op.type === TT.EQUAL) return {nodeType: ast.NT.Assignment, name: name, value: value} as ast.Assignment
        else return {nodeType: ast.NT.Declaration, name: name, value: value} as ast.Declaration
    }

    indentedBlockOrStmt(): ast.StmtList {
        if (this.match([TT.NEWLINE])) {
            this.matchOrError([TT.INDENT], "Excpected indent");
            const block = this.stmtList();
            this.matchOrError([TT.DEDENT, TT.EOF], "Expected dedent");
            return block;
        }
        else {
            const block = {nodeType: ast.NT.StmtList, statements: [this.statement()]} as ast.StmtList;
            return block;
        }
    }

    ifStmt() {
        const condition = this.expression();
        this.matchOrError([TT.COLON], "Excpected ':' after if");
        const mainBranch = this.indentedBlockOrStmt();
        let elseBranch: ast.StmtList;

        if (this.match([TT.ELIF])) {
            elseBranch = {nodeType: ast.NT.StmtList, statements: [this.ifStmt()]} as ast.StmtList
        }
        else if (this.match([TT.ELSE])) {
            this.matchOrError([TT.COLON], "Expected ':' after else")
            elseBranch = this.indentedBlockOrStmt();
        }
        console.log("in ifStmt", this.peek().toString())
        return {nodeType: ast.NT.If, condition, mainBranch, elseBranch} as ast.If;
    }

    whileStmt() {
        const condition = this.expression();
        this.matchOrError([TT.COLON], "Excpected ':' in while-statement");
        const body = this.indentedBlockOrStmt();
        return {nodeType: ast.NT.While, condition, body} as ast.While
    }

    forStmt() {
        const loopvar = this.matchOrError([TT.IDENTIFIER], "Expected identifier in for-statement").literal as string;
        this.matchOrError([TT.EQUAL], "Expected '='");
        const start = this.expression();
        this.matchOrError([TT.DOUBLE_DOT], "Expected range (start..end..[step])");
        const end = this.expression();
        let step = {nodeType: ast.NT.Literal, value: 1, dataType: DT.Real} as ast.ExprNode;
        if (this.match([TT.DOUBLE_DOT])) {
            step = this.expression();
        }
        this.matchOrError([TT.COLON], "Excpected ':' in for-statement");
        const body = this.indentedBlockOrStmt(); 
        return {nodeType: ast.NT.For, loopvar, start, end, step, body} as ast.For
    }

    returnStmt() {
        const value = this.expression();
        return {nodeType: ast.NT.Return, value} as ast.Return
    }

    breakStmt() {
        return {nodeType: ast.NT.Break} as ast.Break
    }

    expression(): ast.ExprNode {
        return this.logical();
    }

    _binary(opTokens: TT[], nextFn: (_: void) => ast.ExprNode): ast.ExprNode {
        let left = nextFn()
        while (this.match(opTokens)) {
            const op = this.prev();
            const right = nextFn();
            left = {nodeType: ast.NT.Binary, left, op, right} as ast.Binary
        }
        return left
    }

    logical() {
        return this._binary([TT.AND, TT.OR], () => this.equality());
    }
    equality() {
        return this._binary([TT.EQUAL_EQUAL, TT.BANG_EQUAL], () => this.comparision());
    }
    comparision() {
        return this._binary([TT.LESS, TT.LESS_EQUAL, TT.GREATER, TT.GREATER_EQUAL], () => this.term());
    }
    term() {
        return this._binary([TT.PLUS, TT.MINUS], () => this.factor());
    }
    factor() {
        return this._binary([TT.STAR, TT.SLASH], () => this.unary());
    }
    unary() {
        if (this.match([TT.MINUS, TT.BANG])) {
            const op = this.prev();
            const expr = this.unary();
            return {nodeType: ast.NT.Unary, op, expr} as ast.Unary
        }
        return this.power();
    }
    power() {
        return this._binary([TT.CARET], () => this.implicitMultiplication());
    }

    implicitMultiplication() { // NUMBER? (IDENT|grouping)*
        if (this.match([TT.LITERAL_IMAG, TT.LITERAL_REAL, TT.LPAREN], false)) {
            let left = this.primary() as ast.ExprNode;
            while (this.match([TT.LPAREN, TT.IDENTIFIER], false)) {
                let right = this.primary();
                left = {nodeType: ast.NT.Binary, op: new Token(TT.STAR, "*", -1), left, right} as ast.Binary
            }
            return left;
        }
        return this.primary();
    }

    grouping() { // left paren assumed to already have been matched
        const expr = this.expression();
        this.matchOrError([TT.RPAREN], "Unmatched opening parenthesis");
        return {nodeType: ast.NT.Grouping, expr} as ast.Grouping
    }

    primary() {
        if (this.match([TT.TRUE])) return {nodeType: ast.NT.Literal, value: true, dataType: DT.Bool} as ast.Literal
        if (this.match([TT.FALSE])) return {nodeType: ast.NT.Literal, value: false, dataType: DT.Bool} as ast.Literal
        if (this.match([TT.LITERAL_REAL])) return {nodeType: ast.NT.Literal, value: this.prev().literal, dataType: DT.Real} as ast.Literal
        if (this.match([TT.LITERAL_IMAG])) return {nodeType: ast.NT.Literal, value: this.prev().literal, dataType: DT.Imag} as ast.Literal
        if (this.match([TT.IDENTIFIER])) return {nodeType: ast.NT.Variable, name: this.prev().literal} as ast.Variable
        if (this.match([TT.LPAREN])) return this.grouping();
        this.error("Expected expression")
    }
}