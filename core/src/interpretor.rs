use std::collections::HashMap;

use crate::parser::Expr;
use crate::parser::Stmt;
use crate::tokenizer::Operator;

#[derive(Clone, PartialEq)]
pub enum Value {
    Number(i64),
    String(String),
}

pub fn run(stmts: Vec<Stmt>) {
    let mut env = HashMap::new();

    for stmt in stmts {
        exec(stmt, &mut env);
    }
}

fn exec(stmt: Stmt, env: &mut HashMap<String, Value>) {
    match stmt {
        Stmt::Assign(name, expr) => {
            let val = eval(expr, env);

            env.insert(name, val);
        }

        Stmt::Print(s) => {
            println!("{}", interpolate(&s, env));
        }

        Stmt::If(cond, block) => {
            if eval(cond, env) == Value::Number(1) {
                for stmt in block {
                    exec(stmt, env);
                }
            }
        }

        Stmt::Repeat(n, block) => {
            for _ in 0..n {
                for stmt in &block {
                    exec(stmt.clone(), env);
                }
            }
        }
    }
}

fn eval(expr: Expr, env: &HashMap<String, Value>) -> Value {
    match expr {
        Expr::Number(n) => Value::Number(n),
        Expr::String(s) => Value::String(s),
        Expr::Variable(name) => match env.get(&name) {
            Some(v) => v.clone(),
            None => panic!("undefined variable: {}", name),
        },
        Expr::Operation(left, op, right) => {
            let l = eval(*left, env);
            let r = eval(*right, env);

            match (l, r) {
                (Value::Number(a), Value::Number(b)) => match op {
                    Operator::Add => Value::Number(a + b),
                    Operator::Sub => Value::Number(a - b),
                    Operator::Div => Value::Number(a / b),
                    Operator::Mod => Value::Number(a % b),

                    Operator::Eq => Value::Number((a == b) as i64),
                    Operator::Neq => Value::Number((a != b) as i64),
                    Operator::Gt => Value::Number((a > b) as i64),
                    Operator::Lt => Value::Number((a < b) as i64),
                    Operator::Gte => Value::Number((a >= b) as i64),
                    Operator::Lte => Value::Number((a <= b) as i64),
                },

                _ => panic!("Type error"),
            }
        }
    }
}

fn interpolate(s: &str, env: &HashMap<String, Value>) -> String {
    let mut result = s.to_string();

    for (k, v) in env {
        let val = match v {
            Value::Number(n) => n.to_string(),
            Value::String(s) => s.clone(),
        };

        result = result.replace(&format!("{{{}}}", k), &val);
    }

    return result;
}
