#[derive(Debug, Clone, Copy)]
pub enum Operator {
    Eq,
    Neq,
    Gt,
    Lt,
    Gte,
    Lte,

    Add,
    Sub,
    Div,
    Mod,
}

#[derive(Debug, Clone)]
pub enum Token {
    Identifier(String),
    Number(i64),
    String(String),

    Is,
    Repeat,
    If,
    Print,
    Times,

    Operator(Operator),

    Plus,
    Minus,
    Divide,
    Mod,

    Dot,

    LeftBrace,
    RightBrace,
}

pub fn tokenize(line: String, is_long_notes: bool) -> (Vec<Token>, bool) {
    let line = line.trim().to_string();
    if is_long_notes {
        return if line == "}" {
            (Vec::new(), false)
        } else {
            (Vec::new(), true)
        };
    }

    let mut tokens: Vec<Token> = Vec::new();
    let characters: Vec<char> = line.chars().collect();
    let mut i = 0;

    while i < characters.len() {
        let char = characters[i];

        // skip space
        if char == ' ' {
            i += 1;
            continue;
        }

        if char == '"' {
            i += 1;
            let start = i;

            while i < characters.len() && characters[i] != '"' {
                i += 1;
            }
            let s: String = characters[start..i].iter().collect();
            tokens.push(Token::String(s));
            i += 1;
            continue;
        }

        if char == '[' {
            i += 1;
            let start = i;

            while i < characters.len() && characters[i] != ']' {
                i += 1;
            }
            let s: String = characters[start..i].iter().collect();
            tokens.push(Token::Operator(parse_operator(s)));
            i += 1;
            continue;
        }

        if char == '+' {
            i += 1;
            tokens.push(Token::Plus);
            continue;
        }

        if char == '-' {
            i += 1;
            tokens.push(Token::Minus);
            continue;
        }

        if char == '/' {
            i += 1;
            tokens.push(Token::Divide);
            continue;
        }

        if char == '.' {
            i += 1;
            tokens.push(Token::Dot);
            continue;
        }

        if char == '%' {
            i += 1;
            tokens.push(Token::Mod);
            continue;
        }

        if char == '{' {
            i += 1;
            tokens.push(Token::LeftBrace);
            continue;
        }

        if char == '}' {
            i += 1;
            tokens.push(Token::RightBrace);
            continue;
        }

        if char.is_ascii_digit() {
            let start = i;

            while i < characters.len() {
                if !characters[i].is_ascii_digit() {
                    break;
                }

                i += 1;
            }

            let num: String = characters[start..i].iter().collect();
            tokens.push(Token::Number(num.parse().unwrap()));
            continue;
        }

        let start = i;

        while i < characters.len() {
            let c = characters[i];

            if c != ' '
                && c != '+'
                && c != '-'
                && c != '.'
                && c != '/'
                && c != '%'
                && c != '{'
                && c != '}'
            {
                i += 1;
            } else {
                break;
            }
        }

        let word: String = characters[start..i].iter().collect();
        if word == "notes:" && !is_long_notes {
            let mut j = i;
            while j < characters.len() && characters[j] == ' ' {
                j += 1;
            }
            if j < characters.len() && characters[j] == '{' {
                j += 1;
                while j < characters.len() && characters[j] != '}' {
                    j += 1;
                }
                if j < characters.len() && characters[j] == '}' {
                    i = j + 1;
                    continue;
                } else {
                    return (tokens, true);
                }
            } else {
                return (tokens, false);
            }
        } else if word == "is" {
            tokens.push(Token::Is);
        } else if word == "if" {
            tokens.push(Token::If);
        } else if word == "print" {
            tokens.push(Token::Print);
        } else if word == "repeat" {
            tokens.push(Token::Repeat);
        } else if word == "times" {
            tokens.push(Token::Times);
        } else {
            tokens.push(Token::Identifier(word));
        }
    }

    if i > 0 {
        let last = characters[i - 1];
        if last == '{' || last == '}' || last == '.' {
            return (tokens, false);
        }
        tokens.push(Token::Dot);
    }
    (tokens, false)
}

fn parse_operator(operator: String) -> Operator {
    if operator == "is equal to" {
        Operator::Eq
    } else if operator == "is not equal to" {
        Operator::Neq
    } else if operator == "is greater than" {
        Operator::Gt
    } else if operator == "is lesser than" {
        Operator::Lt
    } else if operator == "is greater than equal to" {
        Operator::Gte
    } else if operator == "is lesser than equal to" {
        Operator::Lte
    } else {
        panic!("Unknown operator: {}", operator);
    }
}
