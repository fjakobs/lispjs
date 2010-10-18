function tokenize(str) {
    return str.replace(/\(/g, " ( ").replace(/\)/g, " ) ").split(/\s+/g).filter(function(token) {
        return token.length;
    })
}

var SYMBOL = {}
function parse(tokens) {
    var ast = [];
    var token = tokens.shift()
    if (token != "(")
        throw new Error("Expected '('")
        
    while(tokens.length) {
        if (tokens[0] == "(") {
            ast.push(parse(tokens))
        } else {
            var token = tokens.shift()
            if (token == ")")
                return ast
            else if (token.match(/^0[xX][0-9a-fA-F]+$/))
                ast.push(parseInt(token))
            else if (token.match(/[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/))
                ast.push(parseFloat(token))
            else
                ast.push({t: SYMBOL, n: token})
        }
    }
    throw new Error("Expected ')'");
}

function infix(op) {
    return new Function(["a", "b"], "return a" + op + "b"); 
};

global = {
	"+": infix("+"),
	"-": infix("-"),
	"*": infix("*"),
	"/": infix("/"),
	"not": function(a) { return !a },
	">": infix(">"),
	"<": infix("<"),
	">=": infix(">="),
	"<=" : infix("<="),
	"=": infix("=="),
	"equal?": infix("==="),
	// "eq?": 
	"length": function(a) { return a.length },
	"cons": function(a, b) {b.unshift(a); return b },
	"car": function(a) { return a[0] },
	"cdr": function(a) { return a.slice(1) },
	"append": function(a, b) { b.push(a); return b },
	"list": function() { return Array.prototype.slice.call(arguments) },
	"list?": isList,
	"null?": function(a) { return a === null },
	"symbol?" : isSymbol
}

function $eval(ast, env) {
    if (typeof ast == "number") {
        return ast;
    } else if (ast.t == SYMBOL) {
        return env.get(ast.n);
    }
    
    var head = ast[0];
    if (head.n == "begin") {
        for (var i=1; i<ast.length; i++) 
            var ret = $eval(ast[i], env)
        return ret;
    } else if (head.n == "quote") {
        return ast[1];
    } else if (head.n == "define") {
        return env.define(ast[1].n, $eval(ast[2], env))
    } else if (head.n == "set!") {
        return env.set(ast[1].n, $eval(ast[2], env))
    } else if (head.n == "lambda") {
        var args = ast.slice(1, -1)
        var func = ast[ast.length-1]
        return env.define(ast[1].n, function() { 
            var params = {}
            for (var i=0; i<args.length; i++)
                params[args[i].n] = arguments[i]
            return $eval(func, newEnv(env, params))
        });
    } else if (head.n == "if") {
    	var test = $eval(ast[1], env);
    	if (test)
    		return $eval(ast[2], env)
    	else
    		return ast[3] !== undefined ? $eval(ast[3], env) : false;
    } else {
        return env.get(head.n).apply(this, ast.slice(1).map(function(ast) {
            return $eval(ast, env);
        }));
    }
}

function newEnv(parent, values) {
    return {
        data: values || {},
        parent: parent,
        
        find: function(key) {
        	if (key in this.data) 
        		return this.data;
        	else
        		return parent ? this.parent.find(key) : undefined;
        },
        
        get: function(key) {
			return this.find(key)[key];
        },
        
        define: function(key, value) {
            return this.data[key] = value;
        },
        
        set: function(key, value) {
        	this.find(key)[key] = value;
        }
    }
}

function eval(program) {
    return $eval(parse(tokenize(program)), newEnv(null, global))
}

function isNumber(obj) {
    return typeof obj == "number"
}

function isSymbol(obj) {
    return obj && obj.t == SYMBOL;
}

function isList(obj) {
    return Object.prototype.toString.call(obj) == "[object Array]";
}

function stringify(ast) {
    if (isNumber(ast))
        return ast+""
    else if (isSymbol(ast))
        return ast.n
    else if (isList(ast))
        return "(" + ast.map(stringify).join(" ") + ")";
    else
        throw new Error("invalid AST");
}

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
    var val = stringify(eval(program));
    console.log(val);
    var expected = tests[program];
    if (val != expected)
        console.log("Assertion Error: expected " + expected);
}