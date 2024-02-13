export class SyntaxErr extends Error {
    message: string; line: number; lexeme: string

    constructor(message: string, line: number, lexeme: string = null) {
        super(message);
        this.message = message; this.line = line; this.lexeme = lexeme;
        Object.setPrototypeOf(this, SyntaxErr.prototype)
    }
}