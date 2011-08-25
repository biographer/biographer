var jsp = require("uglify-js").parser;
var pro = require("uglify-js").uglify;
var fs = require("fs");

var source = fs.readFileSync("target/biographer-ui.js", "utf8");
var ast = jsp.parse(source); // parse code and get the initial AST
ast = pro.ast_mangle(ast); // get a new AST with mangled names
ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
var final_code = pro.gen_code(ast); // compressed code here

fs.writeFile("target/biographer-ui.min.js", final_code, function(err) {
    if(err) {
        print(err)
    }
}); 