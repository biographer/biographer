# Collection of ideas for the js-libSBGN

# JS-XML parser library #

do we even need that or can JS do this natively?
answer: yes. if you don't want to spend useless time on browser compatiable   issues.

  * http://closure-library.googlecode.com/svn/docs/closure_goog_dom_xml.js.html 60KB(can be further compressed), with XML and JSON I/O as well as basic data structures like Map, Set, etc..
  * http://www.kawa.net/works/js/jkl/parsexml-e.html  26KB NO XML OUTPUT
  * http://jsxml.net/ does not have xml to object, I dont like it (Falko)  17KB
  * https://github.com/dscape/xml-simple
  * https://github.com/Leonidas-from-XIV/node-xml2js does it work outside of node?
  * https://github.com/Ciul/XML2Js-Converter/  5K NO XML OUTPUT
  * http://goessner.net/download/prj/jsonxml/ similar solutin described here http://stackoverflow.com/questions/3054108/how-to-convert-string-to-xml-object-in-javascript
  * http://www.kawa.net/works/js/xml/objtree-e.html
  * http://tawani.blogspot.de/2006/12/serialize-javascript-objects-to-xml-for.html
  * http://www.thomasfrank.se/downloadableJS/xml2json.js

Falko: so far I am not yet convinced why we would need 60KB compressed code when the conversion can be done in less (5K for xml2json 2K for json2xml), if the converters actually work. Will you use other features of the closure lib? Classes ...?

Lian: I wrote a simple demo of reading a sbgn file and output all glyphs and arcs using closure, http://chemhack.github.com/lib-sb/html/dummy_compiled.html Source code and building script here: https://github.com/chemhack/lib-sb The result js file is around 2.5KB. This is access DOM object directly instead of converting it to javascript objects. This should make you happy about size.



# Class Library #

just some links to look at
  * http://stackoverflow.com/questions/4526906/choosing-mootools-over-google-closure
  * http://jsperf.com/jquery-vs-dojo-vs-mootools-dom/61
  * http://www.asiantravelhotel.com/javascript/examples-of-good-javascript-code-in-open-source-web-apps.html
  * https://developer.mozilla.org/en/Introduction_to_Object-Oriented_JavaScript

examples of google closure oop
http://www.daveoncode.com/category/google-closure/

examples of mootools oop
http://mootools.net/docs/core/Class/Class

Pros and cons:
  * mootools seems more intuitive for writing oo
  * closure has a compiler that optimizes the code

# API vs integrated into Biographer #

Falko and Thomas are discussing what the best approach would be:

API pro:
  * can be reused in other software
  * interface can be kept stable
API con:
  * <strike>slower access speed due to function calls</strike>
Lian: You can ignore function call overhead, as it is around 1us/call. Actually I prefer using getter/setter instead of accessing variables directly. Javascript will never give you an error when you access non-exist variables.

integrated pro:
  * non-redundant Data Storage; changes in ui (e.g. Sitzes) would immediately be stored in jSBGN; no toJSON necessary
  * fast read write of all variables
integrated con:
  * hard to implement (rewrite of biographer core?)

What would be the difference in using the lib? Here is an example, correct me if I'm wrong

Lian: Not that different really. It only determines how tight the file I/O library will be coupled with biographer. If it is built into biographer, it can use the data models of biographer, but this prevent third-party from using it.

API

graph.getNode()\[0\].setWidth(500)

integrated

graph.node\[0\].width = 500

Is it possible to to eg override the width object in the example above that it has functions that e.g. check that the value is an integer???

Lian: google closure compiler can do this work automatically if you commented the typing correctly in JSDoc

# Questions to be discussed: #

1. Port. Currently treated as a special type of node. Should we add a class for it?

2. Node and arc types, see https://github.com/chemhack/libSBGN.js/blob/master/src/model/nodeType.js and https://github.com/chemhack/libSBGN.js/blob/master/src/model/arcType.js . Basically taken from libsbgn. Any comments?

3. Nested nodes, see https://github.com/chemhack/libSBGN.js/blob/master/src/model/node.js . methods: addChild, removeChild, children. Should multiple parent nodes be allowed? How do deal with cross compartment nodes?

Falko: Nodes should only have one parent, I cannot think of an example where nodes are eg. in multiple compartments. Cross compartment nodes should belong to either compartment or to a membrane compartment. But we can also discuss this question with the other biographer folk or the libSBGN mailinglist.

4. SBGN-ML format, see http://sourceforge.net/apps/mediawiki/libsbgn/index.php?title=SBGN-ML_Example_Files . The relationships between glyph and compartments in SBGN-ML is implicitly given. One possible solution is to check the coordinates.

Falko: yes not very great to check the coordinates but better than nothing, we however need this information for the layout algorithms.

5. The bbox in SBGN-ML uses top, left, height and width to define a box. But it seems that the common convention is to use top, left, bottom, right. Is there a special reason?

Falko: not sure this might be just a naiive implementation, biographer does the same (maybe this also has to do with SVG)

6. Observer pattern. Thomas mentioned that an observer pattern would be useful for biographer to keep an eye on data model changes. From what I learned from CDK(the Chemistry Development Kit), developers did implemented listeners to allow tracking on data model changes, but later they found no one is using it. Then they spent a lot of time making a faster 'slient' version of these data classes with listener support removed. It would be useful, and of course every feature is useful. And it's also very simple to implement an observer pattern. But when designing a library, we have to be very careful. As, this is a library for developers, and developers write code to change data models. Thus develops should keep an eye on their changes. For example, if they changed label text on a glyph, they should notify the renderer themselves.

7. Labels which has a bbox, see https://libsbgn.svn.sourceforge.net/svnroot/libsbgn/tags/milestone1/example-files/insulin-like_growth_factor_signaling.sbgn