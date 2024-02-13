enum TT {
    // literals
    IDENTIFIER, LITERAL_REAL, LITERAL_IMAG, TRUE, FALSE,
    // one char tokens
    LPAREN, RPAREN, PLUS, MINUS, STAR, SLASH, COMMA, BANG, EQUAL, LESS, GREATER, HASH, COLON, CARET,
    // two-char tokens
    BANG_EQUAL, EQUAL_EQUAL, COLON_EQUAL, LESS_EQUAL, GREATER_EQUAL, DOUBLE_BAR, DOUBLE_AMPERSAND, ARROW, DOUBLE_DOT,
    // keywords
    AND, OR, IF, ELSE, ELIF, RETURN, BREAK, FOR, WHILE,
    // other
    NEWLINE, INDENT, DEDENT, EOF
}

const lexemeToToken = new Map(Object.entries({
    '(': TT.LPAREN,
    ')': TT.RPAREN,
    '+': TT.PLUS,
    '-': TT.MINUS,
    '*': TT.STAR,
    '/': TT.SLASH,
    '^': TT.CARET,
    ',': TT.COMMA,
    '!': TT.BANG,
    ':': TT.COLON,
    '=': TT.EQUAL,
    '<': TT.LESS,
    '>': TT.GREATER,
    '#': TT.HASH,
    '&&': TT.DOUBLE_AMPERSAND,
    '||': TT.DOUBLE_BAR,
    '==': TT.EQUAL_EQUAL,
    '!=': TT.BANG_EQUAL,
    '<=': TT.LESS_EQUAL,
    '>=': TT.GREATER_EQUAL,
    ':=': TT.COLON_EQUAL,
    '..': TT.DOUBLE_DOT,
    '->': TT.ARROW,
    'and': TT.AND,
    'or': TT.OR,
    'if': TT.IF,
    'else': TT.ELSE,
    'elif': TT.ELIF,
    'return': TT.RETURN,
    'break': TT.BREAK,
    'for': TT.FOR,
    'while': TT.WHILE,
    'true': TT.TRUE,
    'false': TT.FALSE,
}))

type LiteralValue = string | number | boolean

class Token {
    type: TT
    lexeme: string
    line: number
    literal: LiteralValue

    constructor(type: TT, lexeme: string, line: number, literal: LiteralValue = null) {
        this.type = type; this.lexeme = lexeme, this.line = line; this.literal = literal;
    }

    toString() { // get the name of the token instead of the enum value
        return {type: TT[this.type], lexeme: this.lexeme, line: this.line, literal: this.literal}
    }
}

export { TT, Token, lexemeToToken, type LiteralValue }