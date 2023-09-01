"use strict";

class FormulaError extends Error {
    constructor(message, formula, token) {
        super(message);
        this.name = this.constructor.name;
        this.formula = formula;
        this.token = token;
    }

    showErrorAlert(base_msg, property) {
        let msg = base_msg;
        if (this.formula) {
            msg += " '=" + this.formula.source_text + "'";
        }
        if (property) {
            const surface_index = app.design.surfaces.indexOf(property.host);
            if (surface_index != -1) {
                msg = "Field " + property.formula_var_name + (surface_index+1) + ": " + msg;
            }
        }
        msg += ": " + this.message;
        alert(msg);
    }
}

class FormulaToken {
    constructor(spelling, index, kind, operator_kind) {
        this.spelling = spelling;
        this.index = index; // start index of spelling in source string
        this.kind = kind; // operator or operand
        this.operator_kind = operator_kind; // unary, binary, paren (if present)
    }

    operatorBindingInfo() {
        let make_result = (prec, assoc) => ({ "prec": prec, "assoc": assoc });
        if (this.operator_kind == "unary") {
            if (this.spelling == '-') {
                return make_result(90,"right");
            }
        } else if (this.operator_kind == "binary") {
            switch (this.spelling) {
                case '^':
                    return make_result(80,"right");
                case '*':
                case '/':
                    return make_result(60,"left");
                case '+':
                case '-':
                    return make_result(40,"left");
            }
        }
        return null;
    }
}

class Formula {
    constructor(text) {
        this.source_text = text;
        this.prefix_tokens = this.parseInfixTokensToPrefix(this.tokenize(this.source_text));
    }

    // name_resolver: (string)->number
    evaluate(name_resolver) {
        let operands = [];
        for (let tok of this.prefix_tokens) {
            if (tok.operator_kind == "unary") {
                const a = operands.pop();
                operands.push({
                    "-": () => -a,
                }[tok.spelling]());
            } else if (tok.operator_kind == "binary") {
                if (operands.length < 2) {
                    throw new FormulaError("expected operand to binary operator", this, tok);
                }
                const b = operands.pop();
                const a = operands.pop();
                operands.push({
                    "+": () => a+b,
                    "-": () => a-b,
                    "*": () => a*b,
                    "/": () => a/b,
                    "^": () => a**b,
                }[tok.spelling]());
            } else if (tok.kind == "operand") {
                const num = Number(tok.spelling);
                if (!isNaN(num)) {
                    operands.push(num);
                } else {
                    let result = name_resolver(tok.spelling);
                    if (result === undefined) {
                        throw new FormulaError("unknown name", this, tok);
                    }
                    operands.push(result);
                }
            } else {
                throw new FormulaError("unable to evaluate token", this, tok);
            }
        }
        return operands.pop();
    }

    parseInfixTokensToPrefix(tokens) {
        // shunting yard algorithm
        let output = [];
        let operator_stack = [];
        for (let tok of tokens) {
            if (tok.kind == "operand") {
                output.push(tok);
            } else if (tok.kind == "operator" && tok.operator_kind != "paren") {
                while (operator_stack.length != 0) {
                    let top = operator_stack[operator_stack.length-1];
                    if (top.kind == "operator" && top.operator_kind != "paren") {
                        let top_info = top.operatorBindingInfo();
                        let tok_info = tok.operatorBindingInfo();
                        if (!top_info || !tok_info) {
                            throw new FormulaError("missing operator binding info", this, tok);
                        }
                        if (tok_info.assoc == "left") {
                            tok_info.prec -= 1;
                        }
                        if (top_info.prec > tok_info.prec) {
                            output.push(operator_stack.pop());
                            continue;
                        }
                    }
                    break;
                }
                operator_stack.push(tok);
            } else if (tok.operator_kind == "paren") {
                if (tok.spelling == "(") {
                    operator_stack.push(tok);
                } else if (tok.spelling == ")") {
                    if (operator_stack.length == 0) {
                        throw new FormulaError("unmatched right parenthesis", this, tok);
                    }
                    while (operator_stack[operator_stack.length-1].spelling != "(") {
                        output.push(operator_stack.pop());
                    }
                    operator_stack.pop();
                }
            }
        }
        while (operator_stack.length > 0) {
            let operator = operator_stack.pop();
            if (operator.spelling == "(") {
                throw new FormulaError("unmatched left parenthesis", this, operator);
            }
            output.push(operator);
        }
        return output;
    }

    tokenize(text) {
        let tokens = [];
        let i = 0;
        let parts = text.split(/(\s+|\(|\)|\+|-|\*|[/]|\^)/);
        for (let part of parts) {
            let kind = null;
            let operator_kind = null;

            if (part.trim().length == 0) {
                // ignore whitespace
            } else if ("+-*/^".includes(part)) {
                kind = "operator";
                if (tokens.length == 0 ||
                tokens[tokens.length - 1].operator_kind == "binary" ||
                tokens[tokens.length - 1].spelling == "(") {
                    operator_kind = "unary";
                } else {
                    operator_kind = "binary";
                }
            } else if ("()".includes(part)) {
                kind = "operator";
                operator_kind = "paren";
            } else {
                kind = "operand";
            }

            if (kind) {
                let token = new FormulaToken(part, i, kind, operator_kind);
                if (token.kind == "operand" && !/^[a-zA-Z_][a-zA-Z0-9_]*|[0-9]+(?:\.[0-9]+)?$/.test(token.spelling)) {
                    throw new FormulaError("operand must be an identifier or a number", this, token);
                }
                if (token.operator_kind == "unary" && token.spelling != "-") {
                    throw new FormulaError("invalid appearance of binary operator where an operand or a unary operator is required", this, token);
                }
                tokens.push(token);
            }

            i += part.length;
        }
        return tokens;
    }
}

class FormulaProperty {
    constructor(host, field_name, formula_var_name) {
        this.host = host;
        this.field_name = field_name;
        this.formula_var_name = formula_var_name;

        this.formula = null;
        this.is_updating = false;
        this.needs_update = true;
    }

    updateValue(v) {
        this.host[this.field_name] = v;
    }

    evaluate(name_resolver) {
        if (!this.needs_update) {
            return;
        }
        if (this.is_updating) {
            throw new FormulaError("recursive cycle in formula definitions", this.formula);
        }
        this.is_updating = true;
        let result = this.formula.evaluate(name_resolver);
        if (this.field_name == "aperture_radius") {
            // TODO refactor this validation to a higher layer
            if (result < 0 || !isFinite(result)) {
                result = 0;
            }
        }
        this.is_updating = false;
        this.needs_update = false;
        this.updateValue(result);
    }

    static find(properties, field_name) {
        for (let prop of properties) {
            if (prop.field_name == field_name) {
                return prop;
            }
        }
        return null;
    }
}
