var lisp = require("./lisp");

var tests = {
    "(begin (define r 3) (* 3.14  (* r r)))": (3.14 * (3 * 3)) + "",
    "(begin (define area (lambda r (* 3.14  (* r r)))) (area 3))": (3.14 * (3 * 3)) + "",
    "(quote a)": "a",
    "(quote (a b c))": "(a b c)",
    "(if (> 10 20) (+ 1 1) (+ 3 3))": "6",
    "(begin (define x 4) (set! x 12) x)": "12",
    "(+ 1 2)": "3",
    "(- 1 2)": "-1",
    "(* 2 3)": "6",
    "(/ 6 2)": "3",
    "(if (not (> 10 2)) 1 0)" : "0",
    "(if (< 10 2) 1 0)" : "0",
    "(if (>= 10 2) 1 0)" : "1",
    "(if (<= 10 2) 1 0)" : "0",
    "(if (= 10 2) 1 0)" : "0",
    "(if (= 10 10) 1 0)" : "1",
    "(length (quote (1 2 3)))": "3",
    "(cons 1 (quote (2 3)))": "(1 2 3)",
    "(car (quote (1 2 3)))": "1",
    "(cdr (quote (1 2 3)))": "(2 3)",
    "(append 3 (quote (1 2)))": "(1 2 3)", // TODO lookup
    "(list 1)": "(1)",
    "(list 1 2 3)": "(1 2 3)",
    "(if (list? 10) 1 0)" : "0",
    "(if (list? (list 10)) 1 0)" : "1",
    //"(null? ...)": "", // TODO
    "(if (symbol? 10) 1 0)" : "0",
    "(if (symbol? (quote x)) 1 0)" : "1"
}

for (var program in tests) {
    console.log("> " + program);
    var val = lisp.stringify(lisp.eval(program));
    console.log(val);
    var expected = tests[program];
    if (val != expected)
        console.log("Assertion Error: expected " + expected);
}