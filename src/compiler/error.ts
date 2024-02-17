export class CompileError extends Error {
    message: string; line: number; lexeme: string

    constructor(message: string, line: number = null, lexeme: string = null) {
        super(message);
        this.message = message; this.line = line; this.lexeme = lexeme;
        Object.setPrototypeOf(this, CompileError.prototype) // TODO
    }
    toString() {
        return "oije"
    }
}
export class SyntaxErr extends CompileError {
    constructor(message: string, line: number = null, lexeme: string = null) {
        super(message);
        this.message = message; this.line = line; this.lexeme = lexeme;
        Object.setPrototypeOf(this, SyntaxErr.prototype) // TODO
    }
    toString() {
        return `SYNTAX ERROR: line ${this.line} at '${this.lexeme}': ${this.message}`
    }
}
export class TypeErr extends CompileError {
    constructor(message: string, line: number = null, lexeme: string = null) {
        super(message);
        this.message = message; this.line = line; this.lexeme = lexeme;
        Object.setPrototypeOf(this, TypeErr.prototype) // TODO
    }
    toString() {
        return `TYPE ERROR: ${this.message}` // TODO: fix so that we have more info left at typecheck time
    }
}