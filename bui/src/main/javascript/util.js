(function(bui) {

    /**
     * @namespace Namespace of utility functionality
     */
    bui.util = {};

    /**
     * @description
     * Utility function for the usage of Object.create as it requires some
     * meta data about the properties like configurable or writable.
     *
     * @param {Object} value The value to be included in a prototype value.
     * @return {Object} The property value
     */
    bui.util.createPrototypeValue = function(value) {
        return {
            value : value,
            enumerable : true,
            configurable : true,
            writable : true
        };
    };

    /**
     * @description
     * <p>We extend the prototype of all functions with the function
     * createDelegate. This method allows us to change the scope of a
     * function.</p>
     *
     * <p>This is useful when attaching listeners to jQuery events like click
     * or mousemove as jQuery normally uses this to reference the source
     * of the event. When using the createDelegate method, this will point to
     * the object that you want to reference with this.</p>
     *
     * <p>Source:
     * <a href="http://stackoverflow.com/questions/520019/controlling-the-value-of-this-in-a-jquery-event">
     *     Stackoverflow
     * </a></p>
     *
     * @param {Object} scope The scope which you want to apply.
     * @return {Function} function with maintained scope
     */
    Function.prototype.createDelegate = function(scope) {
        var fn = this;
        return function() {
            // Forward to the original function using 'scope' as 'this'.
            return fn.apply(scope, arguments);
        };
    };

    /**
     * @description
     * This function strips everything from a string that is not a number,
     *
     * @return {String} Only the numbers from the previous string.
     */
    String.prototype.removeNonNumbers = function() {
        return this.replace(/[^0-9]/g, '');
    };

    /**
     * Check whether a string has a specific suffix
     *
     * @param {String} suffix The suffix for which the string should be tested.
     * @return {Boolean} True when the string has the provided suffix,
     *   false otherwise.
     */
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    /**
     * Calculate word dimensions for given text using HTML elements.
     * Optionally classes can be added to calculate with
     * a specific style / layout.
     *
     * @param {String} text The word for which you would like to know the
     *   dimensions.
     * @param {String[]} [classes] An array of strings which represent
     *   css classes which should be applied to the DIV which is used for
     *   the calculation of word dimensions.
     * @param {Boolean} [escape] Whether or not the word should be escaped.
     *   Defaults to true.
     * @return {Object} An object with width and height properties.
     */
    bui.util.calculateWordDimensions = function(text, classes, escape, precalc) {
        if (classes === undefined) {
            classes = [];
        }
        if (escape === undefined) {
            escape = true;
        }
        //use fallback if it can't be calculated because we use node.js with jsdom that cannot calculate word sized automatically
        if (bui.settings.staticSVG || precalc !== undefined){
            var letter2width = bui.util.precalcLetterWidth();
            var text_length = 0;
            for(var i=0; i<text.length; i++){
                text_length += letter2width[text.charAt(i)];
            }
            if (text_length<=1) text_length=1;
            return { width : text_length, height : 16};
        }

        classes.push(
                bui.settings.css.classes.textDimensionCalculation.generic);

        var div = document.createElement('div');
        div.setAttribute('class', classes.join(' '));

        if (escape === true) {
            $(div).text(text);
        } else {
            div.innerHTML = text;
        }


        document.body.appendChild(div);

        var dimensions = {
            width : jQuery(div).outerWidth(),
            height : jQuery(div).outerHeight()
        };

        div.parentNode.removeChild(div);

        return dimensions;
    };

    /**
     * Use this function to calculate the text dimensions for a line of text.
     *
     * @param {String} text Line of text to be analysed
     * @param {String[]} [classes] An array of strings which represent
     *   css classes which should be applied to the DIV which is used for
     *   the calculation of word dimensions.
     * @return {Object[]} An object with word, width and height properties. For
     *   each word in the given text (text splitted at every whitespace
     *   character) the previously mentioned properties are returned.
     */
    bui.util.calculateTextDimensions = function(text, classes) {
        var words = text.split(/\s/);

        for(var i = 0; i < words.length; i++) {
            var word = words[i];
            var dimensions = bui.util.calculateWordDimensions(word, classes);
            dimensions.word = word;
            words[i] = dimensions;
        }

        return words;
    };

    /**
     * Calculate all the required information for the positioning of a label.
     *
     * @param {Number} width Available width for the positioning of the label
     * @param {String} label The label for which the positioning should
     *   be calculated.
     * @param {String[]} [classes] An array of strings which represent
     *   css classes which should be applied to the DIV which is used for
     *   the calculation of word dimensions.
     * @return {Object[]} An array of objects. Each object in this array
     *   represents one line. Each line object has a words property which
     *   itself is an array of all words of the label ans the respective
     *   dimensions of this word. Also, each line object has a maxHeight,
     *   totalWidth and horizontalIndention property.
     */
    bui.util.calculateLabelPositioning = function(width, label, classes) {
        var analyzedWords = bui.util.calculateTextDimensions(label, classes);
        var spaceWidth = bui.util.calculateWordDimensions('&nbsp;', classes,
                false).width;
        var lines = [];
        var currentLine = null;
        var maxHeight = 0;

        var addLine = function() {
            if (currentLine !== null) {
                currentLine.maxHeight = maxHeight;
            }
            maxHeight = 0;

            lines.push({
                words : [],
                availableWidth : width
            });
            currentLine = lines[lines.length - 1];
        };
        addLine();
        var addWord = function(word) {
            currentLine.words.push(word);
            currentLine.availableWidth -= word.width + spaceWidth;
            maxHeight = Math.max(maxHeight, word.height);
        };

        for(var i = 0; i < analyzedWords.length; i++) {
            var word = analyzedWords[i];

            if (word.width <= currentLine.availableWidth) {
                addWord(word);
            } else {
                if (currentLine.words.length !== 0) {
                    addLine();
                }

                addWord(word);
            }
        }

        currentLine.maxHeight = maxHeight;

        for(i = 0; i < lines.length; i++) {
            var line = lines[i];
            // we subtracted one space too much
            line.availableWidth += spaceWidth;
            line.horizontalIndention = line.availableWidth / 2;
            line.totalWidth = width - line.availableWidth;
            line.spaceWidth = spaceWidth;
            delete line.availableWidth;
        }

        return lines;
    };

    /**
     * Calculate the width for each letter, if this is not possible, used a default output
     **/
    var precalcHash=undefined;
    bui.util.precalcLetterWidth = function(){
        if (precalcHash) return precalcHash;
        var letters = 'abcdefghijklmnopqrstuvwzxz';
        var numbers = '1234567890_-@.:';
        var out = {};
        var elem = document.createElement('span');
        $(elem).html('A');
        //test if we can get the length of a char
        if( $(elem).width() > 1 ){
            for(var i = 0; i<letters.length; i++){
                $(elem).html(letters.charAt(i));
                out[letters.charAt(i)]=$(elem).width();
            }
            letters = letters.toUpperCase();
            for(var i = 0; i<letters.length; i++){
                $(elem).html(letters.charAt(i));
                out[letters.charAt(i)]=$(elem).width();
            }
            for(var i = 0; i<numbers.length; i++){
                $(elem).html(numbers.charAt(i));
                out[numbers.charAt(i)]=$(elem).width();
            }
            precalcHash=out;
            return out;
        }else{
            precalcHash={"0":8,"1":8,"2":8,"3":8,"4":8,"5":8,"6":8,"7":8,"8":8,"9":8,"a":8,"b":8,"c":7,"d":8,"e":8,"f":4,"g":8,"h":8,"i":3,"j":3,"k":7,"l":3,"m":13,"n":8,"o":8,"p":8,"q":8,"r":5,"s":7,"t":5,"u":8,"v":7,"w":9,"z":7,"x":7,"A":9,"B":9,"C":9,"D":10,"E":8,"F":7,"G":10,"H":10,"I":3,"J":3,"K":8,"L":7,"M":11,"N":10,"O":10,"P":8,"Q":10,"R":8,"S":9,"T":7,"U":10,"V":9,"W":11,"Z":10,"X":8};
            return precalcHash;
        }
    };
    /**
     * Set the super class for a given class. The provided class (first
     * parameter will have a superClazz property which can be used to
     * directly call the super class, e.g. the constructor.
     *
     * @param {Object} clazz The class which should inherit from the superClazz
     * @param {Object} superClazz The super class
     */
    bui.util.setSuperClass = function(clazz, superClazz) {
        var prototype = clazz.prototype;

        for(var i in prototype) {
            if (prototype.hasOwnProperty(i)) {
                var member = prototype[i];
                prototype[i] = bui.util.createPrototypeValue(member);
            }
        }

        for(var i in superClazz) {
            if (superClazz.hasOwnProperty(i) && !clazz.hasOwnProperty(i)) {
                clazz[i] = superClazz[i];
            }
        }

        clazz.prototype = Object.create(superClazz.prototype, clazz.prototype);
        clazz.superClazz = superClazz;
    };

    var listenerTypeCounter = 0;
    /**
     * All listener types must have a unique identifier. In the previous
     * version strings were used as an identifier with the drawback of
     * bad performance due to a fair amount of lookups. This function
     * just generates an integer which should be much faster for lookups.
     */
    bui.util.createListenerTypeId = function() {
        return listenerTypeCounter++;
    };

    /**
     * Create a marker's marker-end attribute value. To do this the element
     * id is required.
     *
     * @param {String} elementId The element's id which should be referenced
     * @return {String} The complete attribute value as needed for marker-end.
     */
    bui.util.createMarkerAttributeValue = function(elementId) {
        return ['url(#', elementId, ')'].join('');
    };

    /**
     * Retrieve the hover id..
     *
     * @param {String} id An element's id.
     * @return {String} The element's hover id..
     */
    bui.util.getHoverId = function(id) {
        return id + bui.settings.idSuffix.hover;
    };

    /**
     * Retrieve an objects value if it is set. If it's not set undefined will
     * be returned.
     *
     * @param {Object} obj An object whose properties should be checked
     * @param {Object} property1 One or more (var args function) property names
     *   that should be accessed and checked.
     * @return {Object} The properties value or undefined in case the property
     *   does not exist.
     */
    bui.util.retrieveValueIfSet = function(obj, property1) {
        obj = arguments[0];

        for(var i = 1; i < arguments.length && obj !== undefined; i++) {
            obj = obj[arguments[i]];
        }

        return obj;
    };

     /**
     * Verify that an object has a property with the given name and that this
     * property is not null.
     *
     * @param {Object} obj The object which should be checked for the property.
     * @param {String} property Property names which should be checked. This is
     *   a var args method.
     * @return {Boolean} True in case the property exists and is not null.
     *   False otherwise.
     */
    bui.util.propertySetAndNotNull = function() {
        var obj = arguments[0];

        for(var i = 1; i < arguments.length; i++) {

            var property = arguments[i];

            if (typeof(property) === 'string') {
                if ((obj.hasOwnProperty(property) === false ||
                    obj[property] === null)) {
                    return false;
                }
            } else {
                property.splice(0, 0, obj);

                var result = bui.util.retrieveValueIfSet.apply(window,
                        property);

                if (result === undefined || result === null) {
                    return false;
                }
            }
        }

        return true;
    };

    /**
     * Ensure that a value is a number. If it is not an exception will be thrown.
     * @param {Number|String} val The value which should be converted to a number.
     *   If you pass a string it will be converted to a number if possible.
     * @return {Number} The converted number.
     */
    bui.util.toNumber = function(val) {
        var type = typeof(val);

        if (type === 'number') {
            return val;
        } else if (type === 'string' && isNaN(val) === false) {
            return parseFloat(val);
        } else {
            throw 'It can\'t be ensured that the value: "' + val +
                    '" is a number.';
        }
    };

    /**
     * Ensure that the given value is a boolean value.  If it is not an exception
     *   will be thrown.
     * @param {Boolean|Number|String} val The value which should be converted to
     *   a boolean value. If you pass a boolean value it will simply be returned.
     *   A numeric value will be result in true in case the parameter equals '1'.
     *   All other numbers will result in false. A string will evaluate to true
     *   when it equals (case insensitive) 'true' or '1'.
     * @return {Boolean} The converted boolean value.
     */
    bui.util.toBoolean = function(val) {
        var type = typeof(val);

        if (type === 'boolean') {
            return val;
        } else if (type === 'string') {
            return val.toLowerCase() === 'true' || val === '1';
        } else if (type === 'number') {
            return val === 1;
        } else {
            throw 'The value: "' + val + 'can\'t be converted to boolean.';
        }
    };

    /**
     * Align the viewport to a node.
     *
     * @param {bui.Graph} graph The graph in which the node is located to
     *   the viewpoint should be aligned to.
     * @param {String} nodeJSONId The JSON identifier which was used in the
     *   import JSON data.
     * @param {jQueryHTMLElement} [canvas] Use this parameter and the viewport
     *   parameter in combination to change the viewport. Mostly this is
     *   required when you place the visualization in an HTMLElement with
     *   overflow: (scroll|auto). In such cases, pass the aforementioned
     *   HTMLElement as third and fourth parameter.
     * @param {jQueryHTMLElement} [viewport] Please refer to the documentation
     *   of the canvas parameter.
     */
    bui.util.alignCanvas = function(graph, nodeJSONId, canvas, viewport) {
        var drawables = graph.drawables(),
                node;

        for (var key in drawables) {
            if (drawables.hasOwnProperty(key)) {
                var drawable = drawables[key];

                if (drawable.json() !== null &&
                        drawable.json().id === nodeJSONId) {
                    node = drawable;
                }
            }
        }

        if (node === undefined) {
            log('Node with id ' + nodeJSONId +
                    ' could not be found in the graph.');
            return;
        }

        var position = node.absolutePosition(),
                size = node.size(),
                scale = graph.scale(),
                graphOffset = graph.htmlTopLeft();

        if (canvas === undefined || viewport === undefined) {
            canvas = jQuery('body');
            viewport = jQuery(window);
        }

        var scrollLeft = position.x * scale - ((
                viewport.width() - size.width * scale) / 2) + graphOffset.x;
        var scrollTop = position.y * scale - ((
                viewport.height() - size.height * scale) / 2) + graphOffset.y;
        canvas.animate({
            scrollLeft : scrollLeft,
            scrollTop : scrollTop
        });
    };

    /**
     * Make all coordinates 0 thus removing negative positions.
     * @param {Object} json The JSON data object. The coordinates will be
     *   transformed in place.
     */
    bui.util.transformJSONCoordinates = function(json) {
        var nodes = json.nodes,
                minX = Number.MAX_VALUE,
                minY = Number.MAX_VALUE,
                node,
                i;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];

            if (bui.util.propertySetAndNotNull(node,
                ['data', 'x'], ['data', 'y'])) {
                node.data.x = bui.util.toNumber(node.data.x);
                node.data.y = bui.util.toNumber(node.data.y);
                minX = Math.min(minX, node.data.x);
                minY = Math.min(minY, node.data.y);
            }
        }

        if (minX > 0) {
            minX = 0;
        } else {
            minX = Math.abs(minX);
        }
        if (minY > 0) {
            minY = 0;
        } else {
            minY = Math.abs(minY);
        }

        if (minX !== 0 && minY !== 0) {
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];

                if (bui.util.propertySetAndNotNull(node,
                    ['data', 'x'], ['data', 'y'])) {
                    node.data.x += minX;
                    node.data.y += minY;
                }
            }
        }
    };
})(bui);

/**
 * A secure function call to the console.log function which makes sure that a
 * console object and its log function exists before continuing. Use this
 * function the way console.log would be used.
 * @param {Object} object The object which you want to log.
 */
var log = function(object) {
    if (console !== undefined && console.log !== undefined) {
        console.log(object);
    }
};


/**
 * Update a JSON object.
 *
 * @param {Object} json The object which should be updated.
 * @param {String|String[]} path The property name which should be
 *   updated. Pass a string array to handle property chains.
 * @param {Object} value The property's value.
 */
var updateJson = function(json, path, value) {
    if (typeof(path) === 'string') {
        json[path] = value;
    } else if (path !== undefined){
        var lastProperty = json;
        for(var i = 0; i < path.length - 1; i++) {
            var propertyName = path[i];
            lastProperty[propertyName] =
                    lastProperty[propertyName] || {};
            lastProperty = lastProperty[propertyName];
        }
        lastProperty[path[path.length-1]] = value;
    }
};

/*
 * ###########################################################################
 * The following variables and functions are required for the SBO mappings
 * which are located in sboMappings.js.
 *
 */

/**
 * Add mappings to the mappings object.
 *
 * @param {Object} mapping The mappings object
 * @param {Number[]} keys The keys which should be mapped
 * @param {Function} klass A classes' constructor
 * @param {Function} [generator] Generator funtion which should be used
 *   instead of the constructor.
 */
var addMapping = function(mapping, keys, klass, generator) {
    var val = { klass : klass };

    if (generator !== undefined) {
        val.generator = generator;
    }

    for (var i = 0; i < keys.length; i++) {
        mapping[keys[i]] = val;
    }
};

/**
 * @private
 * Mapping between SBO terms and biographer-ui classes.
 */
var nodeMapping = {}, processNodeMapping = {}, edgeMarkerMapping = {},
        modificationMapping = {};

(function(bui){
   bui.nodeMapping = nodeMapping;
   bui.processNodeMapping = processNodeMapping;
   bui.modificationMapping = modificationMapping;
   bui.edgeMarkerMapping = edgeMarkerMapping;
})(bui);


/**
 * Add mappings to the mappings object.
 *
 * @param {Number[]} keys The keys which should be mapped
 * @param {String} long Long name of the SBO term
 * @param {String} short Short name (abbreviation of the SBO term
 */
var addModificationMapping = function(keys, long, short) {
    var val = {
        long : long,
        short : short
    };

    for (var i = 0; i < keys.length; i++) {
        if (modificationMapping.hasOwnProperty(keys[i])) {
            log('Warning: The mapping of modification keys has' +
                    ' already a mapping for key: ' + keys[i]);
        } else {
            modificationMapping[keys[i]] = val;
        }
    }
};

/**
 * Retrieve the class and generator from a mapping object. When the mapping
 * object does not have an appropriate class or generator object an
 * exception will be thrown.
 *
 * @param {Object} mapping A mapping object, i.e. an object with SBO ids
 *   as keys. The values should be objects will at least a 'klass'
 *   property.
 * @param {Number} sbo The SBO id.
 * @return {Object} An object with a 'klass' and an optional 'generator'
 *   property.
 */
var retrieveFrom = function(mapping, sbo) {
    if (mapping.hasOwnProperty(sbo)) {
        return mapping[sbo];
    } else {
        throw('Warning: SBO id "' + sbo + '" could not be found.');
    }
};

/**
 * Retrieve the SBO key for an instance of class.
 *
 * @param {Object} mapping A mapping object for SBO mapping. Most commonly the
 *   nodeMapping object will be used for this.
 * @param {Object} instance An object which is an instance of one of the mapped
 *   classes.
 * @return {Number} The found SBO id or null in case no mapping could be found.
 */
var getSBOForInstance = function(mapping, instance) {
    for (var sbo in mapping) {
        if (mapping.hasOwnProperty(sbo)) {
            var klass = mapping[sbo].klass;

            if (instance instanceof klass) {
                return bui.util.toNumber(sbo);
            }
        }
    }

    return null;
};

/**
 * Determine the SBO ID for a modification label using the
 * modificationsMapping, both labels, i.e. short and long, will be matched
 * against the first parameter.
 *
 * @param {String} label The label for which the SBO ID should be determined.
 * @return {Number} SBO id or null in case no SBO could be found.
 */
var getModificationSBOForLabel = function(label) {
    label = label.toLowerCase();

    for (var sbo in modificationMapping) {
        if (modificationMapping.hasOwnProperty(sbo)) {
            var mapping = modificationMapping[sbo];

            if (label === mapping.short.toLowerCase() ||
                    label === mapping.long.toLowerCase()) {
                return bui.util.toNumber(sbo);
            }
        }
    }

    return null;
};

/**
 * Determine the SBO ID for an edge marker id using the
 * edgeMarkerMapping.
 *
 * @param {String} id The connecting arcs (marker) id.
 * @return {Number} SBO id or null in case no SBO could be found.
 */
var getSBOForMarkerId = function(id) {
    for (var sbo in edgeMarkerMapping) {
        if (edgeMarkerMapping.hasOwnProperty(sbo)) {
            var mapping = edgeMarkerMapping[sbo];

            if (mapping.klass === id) {
                return bui.util.toNumber(sbo);
            }
        }
    }

    return null;
};
