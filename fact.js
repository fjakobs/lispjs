var lisp = require("./lisp");

var program = "(begin (define fact (lambda n (if (<= n 1) 1 (* n (fact (- n 1)))))) (fact 100))";
//console.log(lisp.stringify(lisp.eval(program)));

var start = Date.now();
var res = lisp.stringify(lisp.eval(program));
var duration = Date.now() - start;

console.log(res)
console.log(duration + "ms");