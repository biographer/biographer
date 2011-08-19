#biographer-ui

This proect is part of the biographer project. Please refer to the
[Wiki](http://code.google.com/p/biographer/) for more information. Alternative,
if you don't have access to the internet, you can also find the most important
information in this document. Still, always refer to the wiki for the most
up-to-date version.

## Building
Make sure that you have the following dependencies installed and, if
applicable, on the path.

 * Python 2.6 <= version < 3
 * Node.js (tested with version 0.4.8)
 * Uglify-JS

When installed you can continue by executing the following command in the
project's root directory, i.e. where this file is located.

    python src/build/python/manage.py clean build test jslint jsdoc compress createDistribution

This will aggregate all the JavaScript files and combine them into
biographer-ui.js which is located under target. In this directory you will
also find a minified version and various other artefacts, e.g. tests, JsDoc
API documentation and a distribution for the integration with the Biographer
system. For testing purposes open one of the various files which are located
in target/test, e.g. target/test/showcase.html.

For further assisstance and detailed instructions refer to the
[project's website](http://code.google.com/p/biographer/).