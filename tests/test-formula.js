"use strict";

function evaluateFormula(input, name_resolver) {
    let formula = new Formula(input);
    return formula.evaluate(name_resolver);
}
function exampleNameResolver(x) {
    switch (x) {
        case 'a': return 5;
        case 'b': return 100;
        case 'd': return 1;
    }
    return undefined;
}

function runFormulaTests(t) {
    t.group_name = "formula";
    t(() => evaluateFormula("1+2+3"), 6);
    t(() => evaluateFormula("3 +   2 +\t1"), 6);
    t(() => evaluateFormula("3 - 1"), 2);
    t(() => evaluateFormula("1 - 3"), -2);
    t(() => evaluateFormula("20 + 3 * 5 + 500"), 535);
    t(() => evaluateFormula("20 * 3 + 5 * 500"), 2560);
    t(() => evaluateFormula("(20 + 3) * 5 + 500"), 615);
    t(() => evaluateFormula("((20 + 3) * 5) + 500"), 615);
    t(() => evaluateFormula("(20 + (3) * 5) + 500"), 535);
    t(() => evaluateFormula("2^3^2"), 512);
    t(() => evaluateFormula("-5 - -1"), -4);
    t(() => evaluateFormula("-5--1"), -4);
    t(() => evaluateFormula("0.5 * 5"), 2.5);
    t(() => evaluateFormula("0.5 * 5"), 2.5);
    t(() => evaluateFormula(")"), new ExpectedError("FormulaError",/right paren/));
    t(() => evaluateFormula("("), new ExpectedError("FormulaError",/left paren/));
    t(() => evaluateFormula("5 * / 7"), new ExpectedError("FormulaError"));
    t(() => evaluateFormula("1+"), new ExpectedError("FormulaError"));
    t(() => evaluateFormula("(1+)5"), new ExpectedError("FormulaError"));
    t(() => evaluateFormula("a + b", exampleNameResolver), 105);
    t(() => evaluateFormula("a + b + d", exampleNameResolver), 106);
    t(() => evaluateFormula("a + b + c + d", exampleNameResolver), new ExpectedError("FormulaError"));
    t(() => evaluateFormula("a * 2 + 3 * b", exampleNameResolver), 310);
}
