var print = require("sys").print;
var JSLINT = require("../lib/jslint").JSLINT;
var source = require("fs").readFileSync("target/biographer-ui.js", "utf8");

JSLINT(source);

var analysisData = JSLINT.data();
var errors = analysisData.errors;

if (errors !== undefined) {
    for (var i = 0; i < errors.length; i++) {
        var error = errors[i];

        if (error) {
            print(['Problem at ', error.line, ':', error.character, ' -- ',
                   error.reason, '\n', 'Evidence: ', error.evidence, '\n\n']
                    .join(''));
        }
    }
}
