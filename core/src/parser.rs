use crate::tokenizer::{Operator, Token};

#[derive(Debug, Clone)]
pub enum Expr {
    Number(i64),
    String(String),
    Variable(String),
    Operation(Box<Expr>, Operator, Box<Expr>),
}

#[derive(Debug, Clone)]
pub enum Stmt {
    Assign(String, Expr),
    Print(String),
    If(Expr, Vec<Stmt>),
    Repeat(i64, Vec<Stmt>),
}

pub fn parse(lines: &[Vec<Token>]) -> Vec<Stmt> {
    let mut index = 0;
    return parse_block(lines, &mut index);
}

fn parse_block(lines: &[Vec<Token>], index: &mut usize) -> Vec<Stmt> {
    let mut stmts = Vec::new();

    while *index < lines.len() {
        let line = &lines[*index];

        match &line[0] {
            Token::RightBrace => {
                break;
            }

            Token::Identifier(name) => {
                expect_dot(line);

                let expr = parse_expr(&line[2..line.len() - 1]);

                stmts.push(Stmt::Assign(name.clone(), expr));
                *index += 1;
            }

            Token::Print => {
                expect_dot(line);

                match &line[1] {
                    Token::String(s) => {
                        stmts.push(Stmt::Print(s.clone()));
                    }
                    _ => panic!("Expected string after print"),
                }
                *index += 1;
            }

            Token::If => {
                let condition = parse_expr(&line[1..line.len() - 1]);

                *index += 1;
                let block = parse_block(lines, index);
                *index += 1;
                stmts.push(Stmt::If(condition, block));
            }

            Token::Repeat => {
                let count = match &line[1] {
                    Token::Number(n) => *n,
                    _ => panic!("Expected number after repeat"),
                };

                *index += 1;
                let block = parse_block(lines, index);
                *index += 1;
                stmts.push(Stmt::Repeat(count, block));
            }

            _ => {
                panic!("Unknown statment");
            }
        }
    }

    return stmts;
}

fn parse_expr(tokens: &[Token]) -> Expr {
    let mut index = 0;

    let mut left = parse_primary(&tokens[index]);

    index += 1;

    while index < tokens.len() {
        let op = match &tokens[index] {
            Token::Plus => Operator::Add,
            Token::Minus => Operator::Sub,
            Token::Divide => Operator::Div,
            Token::Mod => Operator::Mod,
            Token::Operator(op) => *op,
            _ => break,
        };

        index += 1;
        let right = parse_primary(&tokens[index]);
        index += 1;
        left = Expr::Operation(Box::new(left), op, Box::new(right));
    }

    left
}

fn parse_primary(token: &Token) -> Expr {
    match token {
        Token::Number(n) => Expr::Number(*n),
        Token::String(s) => Expr::String(s.clone()),
        Token::Identifier(s) => Expr::Variable(s.clone()),

        _ => {
            panic!("Invalid expression");
        }
    }
}

fn expect_dot(tokens: &Vec<Token>) {
    match tokens.last() {
        Some(Token::Dot) => {}

        _ => {
            panic!("Statement must end with '.'");
        }
    }
}
