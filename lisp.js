function tokenize(str) {
    return str.replace(/\(/g, " ( ").replace(/\)/g, " ) ").split(/\s+/g).filter(function(token) {
        return token.length
    })
}

var SYMBOL = {}
function parse(tokens) {
    var ast = []
    var token = tokens.shift()
    if (token != "(") throw new Error("Expected '('")
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
    throw new Error("Expected ')'")
}

function $eval(ast, env) {
    if (typeof ast == "number")
        return ast
    else if (ast.t == SYMBOL)
        return env.find(ast.n)[ast.n]
    
    var head = ast[0]
    if (head.n == "begin") {
        for (var i=1; i<ast.length; i++) 
            var ret = $eval(ast[i], env)
        return ret
    } else if (head.n == "quote") {
        return ast[1]
    } else if (head.n == "define") {
        return env.data[ast[1].n] = $eval(ast[2], env)
    } else if (head.n == "set!") {
        return env.find(ast[1].n)[ast[1].n] = $eval(ast[2], env)
    } else if (head.n == "lambda") {
        var args = ast.slice(1, -1), func = ast[ast.length-1]
        return env.data[ast[1].n] = function() { 
            var params = {}
            for (var i=0; i<args.length; i++)
                params[args[i].n] = arguments[i]
            return $eval(func, newEnv(env, params))
        }
    } else if (head.n == "if") {
    	var test = $eval(ast[1], env)
    	if (test)
    		return $eval(ast[2], env)
    	else
    		return ast[3] !== undefined ? $eval(ast[3], env) : false
    } else
        return env.find(head.n)[head.n].apply(this, ast.slice(1).map(function(ast) {
            return $eval(ast, env)
        }))
}

function newEnv(parent, values) {
    return {
        data: values || {},
        parent: parent,
        find: function(key) {
        	if (key in this.data) 
        		return this.data
        	else
        		return parent ? this.parent.find(key) : undefined
        }
    }
}

function infix(op) {
    return new Function(["a", "b"], "return a" + op + "b") 
}

global = {
    "+": infix("+"), "-": infix("-"), "*": infix("*"), "/": infix("/"),
	">": infix(">"), "<": infix("<"), ">=": infix(">="), "<=" : infix("<="),
	"=": infix("=="), "equal?": infix("==="), // "eq?": 
	"not": function(a) { return !a },	
	"length": function(a) { return a.length },
	"cons": function(a, b) {b.unshift(a); return b },
	"car": function(a) { return a[0] },
	"cdr": function(a) { return a.slice(1) },
	"append": function(a, b) { b.push(a); return b },
	"list": function() { return Array.prototype.slice.call(arguments) },
	"null?": function(a) { return a === null },
	"list?": isList, "symbol?" : isSymbol
}

exports.eval = function(program, env) {
    return $eval(parse(tokenize(program)), newEnv(null, global))
}

function isSymbol(obj) {
    return obj && obj.t == SYMBOL
}

function isList(obj) {
    return Object.prototype.toString.call(obj) == "[object Array]"
}

exports.stringify = function(ast) {
    if (typeof ast == "number")
        return ast+""
    else if (isSymbol(ast))
        return ast.n
    else if (isList(ast))
        return "(" + ast.map(exports.stringify).join(" ") + ")"
    else
        throw new Error("invalid AST")
}