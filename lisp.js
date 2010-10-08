function tokenize(str) {
    return str.replace(/\(/g, " ( ").replace(/\)/g, " ) ").split(/\s+/g).filter(function(token) {
        return token.length;
    })
}

var SYMBOL = {}

function parse(tokens) {
    //console.log(tokens);
    var ast = [];
    var token = tokens.shift()
    if (token != "(")
        throw new Error("Expcetect '('")
        
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

var global = {};
var ops = "*/+-";
ops.split("").map(function(op) {
    global[op] = new Function(["a", "b"], "return a" + op + "b"); 
})


function $eval(ast, env) {
    if (typeof ast == "number") {
        return ast;
    } else if (ast.t == SYMBOL) {
        return env.get(ast.n);
    }
    
    var head = ast[0];
    if (head.n == "begin") {
        for (var i=0; i<ast.length; i++) 
            var ret = $eval(ast[i], env)
        return ret;
    } else if (head.n == "quote") {
        return ast[1];
    } else if (head.n == "define") {
        return env.set(ast[1].n, $eval(ast[2], env))
    } else if (head.n == "lambda") {
        var args = ast.slice(1, -1)
        var func = ast[ast.length-1]
        return env.set(ast[1].n, function() { 
            var params = {}
            for (var i=0; i<args.length; i++)
                params[args[i].n] = arguments[i]
            return $eval(func, newEnv(env, params))
        });
    } else {
        return env.get(head.n).apply(this, ast.slice(1).map(function(ast) {
            return $eval(ast, env);
        }));
    }
}

function newEnv(parent, values) {
    return {
        data: values || {},
        parent: parent || {data: global},
        get: function(key) {
            var v;
            var obj = this;
            while(obj) {
                var v = obj.data[key];
                if (v !== undefined)
                    return v;
                obj = obj.parent;
            }
        },
        
        set: function(key, value) {
            return this.data[key] = value;
        } 
    }
}

function eval(program) {
    return $eval(parse(tokenize(program)), newEnv())
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
    "(quote a)": "a"
}

for (var program in tests) {
    console.log("> " + program);
    var val = stringify(eval(program));
    console.log(val);
    var expected = tests[program];
    if (val != expected)
        console.log("Assertion Error: expected " + expected);
}