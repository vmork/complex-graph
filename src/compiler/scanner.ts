import { TT, Token, lexemeToToken, type LiteralValue } from "./token";
import { SyntaxErr } from './error'

const TABSIZE = 4;
const EOF = "\0";
const oneCharLexemes = new Set(['(', ')', '+', '*', '/', ',', '^', ';']); // can only be one char lexeme
const twoCharLexemes = new Set(['-', ':', '!', '=', '<', '>', '.']); // can be one or two char lexeme

function isDigit(c: string) {
    return /[0-9]/.test(c);
}
function isIdentifierStart(c: string) {
    return /[_a-zA-Z]/.test(c);
}
function isIdentifierChar(c: string) {
    return /[_a-zA-Z0-9]/.test(c)
}

export class Scanner {
    source: string;
    cur: number = 0;
    line: number = 1;
    lexemeStart: number = 0;
    tokens: Token[] = [];
	indentLevels = [];
    
    constructor(source: string) {
        this.source = source;
        this.indentLevels.push(this.getInitialIndent());
    }

	isAtEnd() {
		return this.cur >= this.source.length;
	}

    peek() {
		if (this.isAtEnd()) return EOF;
        return this.source[this.cur];
    }
    peek2() {
        if (this.cur+1 >= this.source.length) return EOF;
        return this.source[this.cur + 1];
    }

    advance() { // assumes were not at the end
        return this.source[this.cur++];
    }

    match(c: string) {
        if (this.peek() === c) {
			this.cur += 1;
			return true;
		}
		return false;
    }

    currentLexeme() {
        return this.source.substring(this.lexemeStart, this.cur)
    }

	addToken(type: TT, literal: LiteralValue = null) {
		this.tokens.push(new Token(type, this.currentLexeme(), this.line, literal))
	}

    scan() {
        while (this.cur < this.source.length) {
            this.lexemeStart = this.cur;
            this.scanToken();
        }
        return this.tokens;
    }
    
    scanToken() {
        const c = this.advance();

        if (oneCharLexemes.has(c)) {
			this.addToken(lexemeToToken.get(c))
            return;
		}
		if (twoCharLexemes.has(c)) {
			const c2 = this.peek();
			if (lexemeToToken.has(c + c2)) {
				this.cur += 1;
				this.addToken(lexemeToToken.get(c + c2))
                return;
			}
			if (lexemeToToken.has(c)) {
				this.addToken(lexemeToToken.get(c))
                return;
			}
		}
		if (c === "#")  { this.scanComment(); return; }
		if (c === "\n") { this.scanNewline(); return; }
        if (c === " " || c === "\r" || c === "\t") return;
        if (isDigit(c)) { this.scanNumber(); return; }
        if (isIdentifierStart(c)) { this.scanIdentifier(); return; } 

        throw new SyntaxErr("Unexcpected character: " + c, this.line)
    }

	scanComment() {
		while (this.peek() != "\n" && !this.isAtEnd()) this.cur += 1;
	}

    getInitialIndent() {
        let level = this.getIndentLevel();
        while (this.match("\n")) level = this.getIndentLevel();
        return level;
    }

    getIndentLevel() {
		let level = 0;
		while (!this.isAtEnd()) {
            const c = this.peek();
            if      (c === " ")  level += 1; 
            else if (c === "\t") level += TABSIZE
            else break;
            this.cur += 1;
        }
		return level;
	}

	scanNewline() {
        this.line += 1;
        const lastIndentLevel = this.indentLevels[this.indentLevels.length-1]
		const newIndentLevel = this.getIndentLevel();

        if (this.peek() === "#") { // skip lines that are only comments, to avoid adding double newlines
            this.scanComment();
            return;
        }
        if (this.peek() === "\n" || this.peek() === EOF) return; // skip double newlines and indent before EOF
        
        this.addToken(TT.NEWLINE);

        if (newIndentLevel > lastIndentLevel) {
            this.addToken(TT.INDENT);
            this.indentLevels.push(newIndentLevel);
        }
        else if (newIndentLevel < lastIndentLevel) {
            while (this.indentLevels.length > 0 && this.indentLevels[this.indentLevels.length-1] > newIndentLevel) {
                this.addToken(TT.DEDENT);
                this.indentLevels.pop();
            }
            if (this.indentLevels[this.indentLevels.length-1] !== newIndentLevel) {
                throw new SyntaxErr("Dedent level doesnt match previous indents", this.line)
            }
        }
	}

    consumeDigits() {
        while (isDigit(this.peek())) this.cur += 1;
    }
    scanNumber() {
        this.consumeDigits();
        if (this.peek() === "." && this.peek2() !== ".") { 
            this.cur += 1; this.consumeDigits(); 
        }
        
        const num = Number.parseFloat(this.currentLexeme())
        if (this.peek() === "i") {
            this.addToken(TT.LITERAL_IMAG, num); 
            this.cur += 1; 
        }
        else this.addToken(TT.LITERAL_REAL, num)
    }

    scanIdentifier() {
        while (isIdentifierChar(this.peek())) this.cur += 1;
        const name = this.currentLexeme();
        if (name === "i") this.addToken(TT.LITERAL_IMAG, 1); // imaginary number i
        else if (lexemeToToken.has(name)) this.addToken(lexemeToToken.get(name)) // keyword
        else this.addToken(TT.IDENTIFIER, name);
    }
}