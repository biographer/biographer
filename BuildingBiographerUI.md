# Building biographer-ui #

The biographer-ui subsystem uses a small custom made build system in the form of a Python and JavaScript (node.js) application. It's needed as the library itself is separated into various files, located in the _src/main/javascript_ directory in the visualization repository. This was done to improve read- and maintainability. The general recommendation is to follow an approach similar to Java, where each public interface, e.g. class, should have its own file.

## Prerequisites ##
In order to build the compound JavaScript file you need Python >= 2.6 installed. For additional tasks, like the compression, error checking and generation of documentation, you need additional software.

To enable compression or error checking, node.js has to be installed. I'm using version 0.4.8, which I checked out right from the [github repository](https://github.com/joyent/node). It probably also works with other versions as only a few simple node.js specific statements are used.

For the generation of the API documentation Java 6 needs to be on the path.

## The targets ##
Similar to the Ant build system, this build system has a few useful tasks that can be executed.

### clean ###
Removes the _target_ directory, i.e. all build products are deleted.

### build ###
Generate the actual compound JavaScript library. The generated file is located at _target/biographer-ui.js_.

### test ###
Generate the test environment. Please note that the tests are not executed. Please open the _target/test/test.html_ file in your browser to run the tests.

### jslint ###
The code quality is checked using jslint. Results are printed to the command line.

### jsdoc ###
Generation of the JavaScript API documentation. The result is a directory located at _target/jsdoc/_.

### compress ###
Compress the library using uglify-js. The compressed library is located in the _target_ directory and called _biographer-ui.min.js_. Uglify-js needs to be installed on your machine. Doing this is quite simple when you have NPM installed. Refer to the [installation section](https://github.com/mishoo/UglifyJS) for additional instructions.

### createDistribution ###
**Please note that the compress target must be executed before the createDistribution target. As a result all dependencies for the compress target must be fulfilled.**
Create a distributable version of the library which only includes files which are required for library usage. The output is the _target/distribution_ directory. Please note that the path to _visualization-svg.css_ will be updated in both versions of the library. You can change the path by manipulating the _newTextToBeInserted_ variable in the _src/build/python/settings.py_ file.

The _newTextToBeInserted_ variable should contain the path from the page which is showing the visualization to the _visualization-svg.css_ file. Example:<br />
The visualization will be rendered at: /foo/bar.html<br />
The _visualization-svg.css_ is located at: /static/css/visualization-svg.css<br />
The _newTextToBeInserted_ variable value should be: /static/css/visualization-svg.css or ../static/css/visualization-svg.css

## The actual building ##
Run the build process from the root directory of the visualization repository like this.
```
python src/build/python/manage.py clean build test jslint

// or like this to run all targets

python src/build/python/manage.py clean build test jslint jsdoc compress createDistribution
```

## Recommended development usage ##
During development you should use the targets _clean_, _build_, _test_ and _jslint_. Preferably in this order. The targets only require a few milliseconds and provide you with all necessary information.