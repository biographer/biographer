/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(window) {

// Use the correct document accordingly with window argument (sandbox)
var document = window.document,
	navigator = window.navigator,
	location = window.location;
// can't make this variable private because of the JsDoc toolkit.
/**
 * @namespace The whole biographer-ui library can be accessed through this var.
 */
bui = {};

/**
 * @namespace SVG namespace definition
 */
bui.svgns = "http://www.w3.org/2000/svg";

/**
 * @namespace Settings are stored within this variable
 */
bui.settings = {
    /**
     * @field
     * Whether or not the bui.Graph will be initialised in high or low
     * performance mode. True for high performance.
     */
    initialHighPerformance : true,

    /**
     * @field
     * Set to true to enable modification support. Please note though that this
     * can have a strong impact on the initial load time as described in the
     * following issue.
     * http://code.google.com/p/biographer/issues/detail?id=6
     */
    enableModificationSupport : true,

    /**
     * @field
     * How many frames per second (FPS) should be used for animations.
     */
    animationFPS : 30,

    /**
     * @field
     * Prefixes for various ids
     */
    idPrefix : {
        graph : 'graph',
        node : 'node',
        edge : 'edge',
        connectingArc : 'connectingArc'
    },

    /**
     * @field
     * Id suffixes
     */
    idSuffix : {
        hover : 'hover'
    },

    /**
     * @field
     * The data exchange format
     */
    dataFormat : {
        nodes : 'nodes',
        edges : 'edges',
        drawable : {
            id : 'id',
            visible : 'visible',
            sbo : 'sbo',
            cssClasses : ['data', 'cssClasses']
        },
        node : {
            label : ['data', 'label'],
            x : ['data', 'x'],
            y : ['data', 'y'],
            width : ['data', 'width'],
            height : ['data', 'height'],
            subNodes : ['data', 'subnodes'],
            modifications : ['data', 'modifications']
        },
        edge : {
            source : 'source',
            target : 'target',
            style : ['data', 'style'],
            type : ['data', 'type'],
            handles : ['data', 'handles']
        }

    },

    /**
     * @field
     * The url from which the CSS file should be imported and CSS classes
     */
    css : {
        stylesheetUrl : 'resources/css/visualization-svg.css',
        classes : {
            invisible : 'hidden',
            selected : 'selected',
            placeholder : 'placeholder',
            rectangle : 'rect',
            complex : 'complex',
            compartment : 'compartment',
            process : 'process',
            smallText : 'small',
            textDimensionCalculation : {
                generic : 'textDimensionCalculation',
                standard : 'defaultText',
                small : 'smallText'
            },
            line : 'line',
            lineStyle : {
                solid : 'solid',
                dotted : 'dotted',
                dashed : 'dashed'
            },
            lineHover : 'lineHover',
            connectingArcs : {
                stimulation : 'stimulation',
                catalysis : 'catalysis',
                modulation : 'modulation',
                necessaryStimulation : 'necessaryStimulation'
            },
            splineEdgeHandle : 'splineEdgeHandle',
            splineAutoEdgeHandle : 'autoAlign',
            hideBorder : 'hideBorder'
        }
    },
    /**
     * @field
     * Various styles that can not be realized using CSS
     */
    style : {
        /**
         * @field Correction of the placeholder positioning and size
         */
        placeholderCorrection : {
            position : {
                x : -1,
                y : -1
            },
            size : {
                width : -2,
                height : -2
            }
        },
        graphReduceCanvasPadding : 30,
        edgeHandleRadius : 4,
        nodeCornerRadius : 15,
        adaptToLabelNodePadding : {
            top : 5,
            right : 5,
            bottom : 5,
            left : 5
        },
        complexCornerRadius : 15,
        complexTableLayout : {
            padding : 10,
            restrictNumberOfColumns : false,
            showBorder : true
        },
        compartmentCornerRadius : {
            x : 25,
            y : 15
        },
        processNodeMinSize : {
            width : 26,
            height : 26
        },
        edgeToNodePadding : {
            topBottom : 5,
            leftRight : 5
        },
        importer : {
            standardNodeSize : {
                width : 70,
                height : 70
            },
            sizeBasedOnLabelPassing : {
                horizontal : 20,
                vertical : 20
            },
            modificationLabel : 'short' // either 'long' or 'short'
        },
        // x/y coordinates as % of a node's size (1 = 100%)
        // T = top, L = left, R = right, B = bottom, CX = Center X,
        // CY = center y
        automaticAuxiliaryUnitPositioning : [[0, 0], // T-L
                [1, 1], // B-R
                [1, 0], // T-R
                [0, 1], // B-L
                [0.5, 0], // T-CX
                [1, 0.5], // CY-R
                [0.5, 1], // B-CX
                [0, 0.5] // CY-L
        ],
        markerWidthCorrection : 0.25 // (1 / .lineHover#stroke-width) (see CSS)
    }
};
(function(bui) {

    var readyFunctions = [];

    /**
     * @description
     * Use this function to add functions (callbacks) which are to be
     * executed when the whole document is done loading.
     *
     * @param {Function} callback Function to be executed when the document is
     *   ready
     */
    bui.ready = function(callback) {
        readyFunctions.push(callback);
    };

    // executing the ready functions
    $(function() {
        for(var i = 0; i < readyFunctions.length; i++) {
            readyFunctions[i]();
        }
    });

    /**
     * @class
     * Base class for all the biographer-ui classes
     */
    bui.Object = function() {
        this.__private = {};
    };

    /**
     * Retrieve the private members for a given class
     *
     * @param {Object} identifier This identifies for which class the private
     *   members shall be retrieved.
     * @return {Object} An object from which the private members could be
     *   retrieved
     */
    bui.Object.prototype._getPrivateMembers = function(identifier) {
        var privates = this.__private[identifier];

        if (privates === undefined) {
            privates = {};
            this.__private[identifier] = privates;
        }

        return privates;
    };

    /**
     * Retrieve the private members for a given class
     *
     * @param {Object} identifier This identifies for which class the private
     *   members shall be retrieved.
     * @return {Object} An object from which the private members could be
     *   retrieved
     */
    bui.Object.prototype._privates = function(identifier) {
        return this._getPrivateMembers(identifier);
    };
})(bui);

/**
 * @private
 * @see bui.Node._calculationHook
 */
var _circularShapeLineEndCalculationHook =
        function(adjacent, hitAngle, padding) {
    var radius = this.size().width / 2;

    radius += Math.sqrt(Math.pow(padding.topBottom, 2) +
            Math.pow(padding.leftRight, 2));

    return {
        opposite : Math.sin(hitAngle) * radius,
        adjacent : Math.cos(hitAngle) * radius
    };
};

/**
 * @private
 * @see bui.Node._calculationHook
 */
var circularShapeLineEndCalculationHook = function(adjacent, hitAngle) {
    return _circularShapeLineEndCalculationHook.call(this, adjacent,
            hitAngle,
            bui.settings.style.edgeToNodePadding);
};

/**
 * @private
 * @see bui.Node._calculationHook
 */
var circularShapeLineEndCalculationHookWithoutPadding =
        function(adjacent, hitAngle) {
    return _circularShapeLineEndCalculationHook.call(this, adjacent,
            hitAngle,
            {
                topBottom : 0,
                leftRight : 0
            });
};
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
    bui.util.calculateWordDimensions = function(text, classes, escape) {
        if (classes === undefined) {
            classes = [];
        }
        if (escape === undefined) {
            escape = true;
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
    } else {
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
(function(bui) {
    var identifier = 'bui.Observable';

    /**
     * @class
     * By inheriting from this class you can allow observers. Please note
     * that you have to add types using the {@link bui.Observable#addType}
     * function before listener can be added.
     *
     * @extends bui.Object
     */
    bui.Observable = function() {
        bui.Observable.superClazz.call(this);
        this._getPrivateMembers(identifier).listener = {};
    };

    bui.Observable.prototype = {
        /**
         * @description
         * Add a listener type to this observable object. An added listener
         * type allows to register listeners and fire events specific to
         * this type.
         *
         * @param {String|Object} type The new type - a string which describes
         *   it or an object (map) for which all values
         *   (please note it's values - not keys) are used and added as types.
         * @return {bui.Observable} Fluent interface
         */
        _addType : function(type) {
            var listener = this._getPrivateMembers(identifier).listener;

            if (typeof(type) === 'string') {
                listener[type] = {};
            } else {
                for (var i in type) {
                    if (type.hasOwnProperty(i)) {
                        listener[type[i]] = {};
                    }
                }
            }

            return this;
        },

        /**
         * @description
         * Bind listener to a specific type
         *
         * @param {String} type The type of event that should be observed
         * @param {Function} callback Method to be called
         * @param {Object} [identification] An identifier used to identify the
         *   listener in the list of all over listeners. Should be unique for
         *   the listener type. When ommited the callback will be used for
         *   identification purposes.
         * @return {bui.Observable} Fluent interface
         */
        bind : function(type, callback, identification) {
            var listener = this._getPrivateMembers(identifier).listener[type];

            // type not registered, fail silently
            if (listener === undefined) {
                return this;
            }

            if (identification === undefined || identification === null) {
                identification = callback;
            }

            listener[identification] = callback;
            
            return this;
        },

        /**
         * @description
         * Unbind a listener from a specific event.
         *
         * To unbind all listener, call this function without any parameter.
         * To unbind all listener just for a specific type call this method
         * with the type and omit the identification.
         *
         * @param {String} [type] listener type identification
         * @param {String} [identification] identifies the listener which
         *   should be unbound
         * @return {bui.Observable} Fluent interface
         */
        unbind : function(type, identification) {
            var listener = this._getPrivateMembers(identifier).listener;

            if (type === undefined) {
                for(var registeredType in listener) {
                    if (listener.hasOwnProperty(registeredType)) {
                        listener[registeredType] = {};
                    }
                }
            } else if (identification === undefined) {
                listener[type] = {};
            } else {
                delete listener[type][identification];
            }

            return this;
        },

        /**
         * Unbind all listeners with the provided identification.
         *
         * @param {String} identification Listener identification
         * @return {bui.Observable} Fluent interface
         */
        unbindAll : function(identification) {
            var listener = this._getPrivateMembers(identifier).listener;

            for(var type in listener) {
                if (listener.hasOwnProperty(type)) {
                    delete listener[type][identification];
                }
            }

            return this;
        },

        /**
         * @description
         * Fire an event
         *
         * @param {String} type listener type identification
         * @param {Object[]} [params] Parameters to be passed to the listener
         * @return {Boolean} True when every listener returned a value !==
         *   false, false otherwise.
         */
        fire : function(type, params) {
            if (params === undefined) {
                params = [];
            }

            var listener = this._getPrivateMembers(identifier).listener[type];

            // fail silently when the listener type is not registered
            if (listener === undefined) {
                return true;
            }

            for (var i in listener) {
                if (listener.hasOwnProperty(i)) {
                    var status = listener[i].apply(this, params);

                    if (status === false) {
                        return false;
                    }
                }
            }

            return true;
        }
    };

    bui.util.setSuperClass(bui.Observable, bui.Object);
})(bui);
(function(bui) {
    /**
     * @namespace Generator functions for connecting arcs can be found as
     * properties of this object.
     */
    bui.connectingArcs = {};

    var connectingArcIdCounter = 0;

    /**
     * @private
     * Helper function for the generation of SVGMarkerElement elements.
     *
     * @param {String} id The id for the element.
     * @param {String|Element} data If you pass a String, a SVGPathElement
     *   will be created and its data attribute filled with the value of this
     *   parameter. In every other case it will be assumed that it's a valid
     *   SVG object and it will be added as a child to the generated marker
     *   element.
     * @param {Number} refX Value for the refX attribute
     * @param {Number} refY Value for the refY attribute
     * @param {Number} width Value for the markerWidth and viewBox attribute
     * @param {Number} height Value for the markerHeight and viewBox attribute
     * @param {String} [classes] CSS classes which should be applied to the
     *   marker element.
     * @param {Number} [markerWidthCorrection] Correction of the markers width.
     *   This value will be multiplied to the width attribute for the
     *   markerWidth attribute. Defaults to 1, i.e. no changes.
     * @return {SVGMarkerElement} The generated marker element.
     */
    var createMarker = function(id, data, refX, refY, width, height, classes,
                                markerWidthCorrection) {
        if (markerWidthCorrection === undefined) {
            markerWidthCorrection = 1;
        }

        var marker = document.createElementNS(bui.svgns, 'marker');
        marker.setAttributeNS(null, 'id', id);
        marker.setAttributeNS(null, 'orient', 'auto');
        marker.setAttributeNS(null, 'refX', refX);
        marker.setAttributeNS(null, 'refY', refY);
        marker.setAttributeNS(null, 'markerWidth',
                width * markerWidthCorrection);
        marker.setAttributeNS(null, 'markerHeight', height);
        marker.setAttributeNS(null, 'viewBox',
                ['-2 -2', width+4, height+4].join(' '));

        if (classes !== undefined) {
            marker.setAttributeNS(null, 'class', classes);
        }

        if (typeof(data) == 'string') {
            var path = document.createElementNS(bui.svgns, 'path');
            path.setAttributeNS(null, 'd', data);
            marker.appendChild(path);
        } else {
            marker.appendChild(jQuery(data).clone(false)[0]);
        }

        return marker;
    };

    /**
     * @private
     * Helper function for the generation of SVGPathElement elements.
     *
     * @param {String|Element} data If you pass a String, a SVGPathElement
     *   will be created and its data attribute filled with the value of this
     *   parameter. In every other case it will be assumed that it's a valid
     *   SVG object and it will be added as a child to the generated marker
     *   element.
     * @param {Number} refX Value for the refX attribute
     * @param {Number} refY Value for the refY attribute
     * @param {Number} width Value for the markerWidth and viewBox attribute
     * @param {Number} height Value for the markerHeight and viewBox attribute
     * @param {String} [classes] CSS classes which should be applied to the
     *   marker element.
     * @return {Object} An object with id, hoverId, element and hoverElement
     *   properties. The id property holds the marker's id and the element
     *   property the SVGMarkerElement.
     */
    var createPathWithData = function(data, refX, refY, width, height, classes)
    {
        var id = (bui.settings.idPrefix.connectingArc +
                connectingArcIdCounter++),
                hoverId = bui.util.getHoverId(id);

        var element = createMarker(id, data, refX, refY, width, height,
                classes),
                hoverElement = createMarker(hoverId, data, refX, refY,
                        width, height, classes,
                        bui.settings.style.markerWidthCorrection);

        return {
            id : id,
            hoverId : hoverId,
            element : element,
            hoverElement : hoverElement
        };
    };

    /**
     * Generator for a stimulation connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.stimulation = function() {
        return createPathWithData('M0,0L20,10L0,20Z', 20, 10, 20, 20,
                bui.settings.css.classes.connectingArcs.stimulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.stimulation.id = 'stimulation';


    /**
     * Generator for an inhibition connecting arc.
     *
     * This generates a simple line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.inhibition = function() {
        return createPathWithData('M0,0V20H1V0Z', 0, 10, 20, 20);
    };
    
    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.inhibition.id = 'inhibition';

    
    /**
     * Generator for a catalysis connecting arc.
     *
     * This generates a circle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.catalysis = function() {
        var circle = document.createElementNS(bui.svgns, 'circle');
        circle.setAttributeNS(null, 'cx', 10);
        circle.setAttributeNS(null, 'cy', 10);
        circle.setAttributeNS(null, 'r', 10);

        return createPathWithData(circle, 20, 10, 20, 20,
            bui.settings.css.classes.connectingArcs.catalysis);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.catalysis.id = 'catalysis';


    /**
     * Generator for a modulation connecting arc.
     *
     * This generates a diamond.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.modulation = function() {
        return createPathWithData('M10,0L20,10L10,20L0,10Z', 20, 10, 20, 20,
            bui.settings.css.classes.connectingArcs.modulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.modulation.id = 'modulation';

    /**
     * Generator for a necessary stimulation connecting arc.
     *
     * This generates an arrow with an additional line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.necessaryStimulation = function() {
        return createPathWithData('M0,0V20 M5,0L25,10L5,20Z', 25, 10, 26, 26,
            bui.settings.css.classes.connectingArcs.necessaryStimulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.necessaryStimulation.id = 'necessaryStimulation';
})(bui);
(function(bui) {
    // used to identify and compare the graph instances
    var graphCounter = 0;

    var identifier = 'bui.Graph';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Graph} graph
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(graph) {
        return identifier + graph.id();
    };

    /**
     * @private
     * Used to generate the transform attribute value of the _rootGroup
     * element. Extracted to a function as this may be required several
     * times.
     */
    var __setTransformString = function() {
        var privates = this._privates(identifier);
        var value = ['scale(', privates.scale.toString(), ')'].join('');

        privates.rootGroup.setAttribute('transform', value);
    };

    /**
     * @private
     * Extracted because this function is called from the constructor and from
     * rawSVG in order to replace it for the export process.
     */
    var __getStylesheetContents = function() {
        return '@import url("' + bui.settings.css.stylesheetUrl + '\");';
    };

    /**
     * @private
     * Extracted from the constructor to improve readability
     */
    var __initialPaintGraph = function() {
        var privates = this._privates(identifier);

        var div = document.createElement('div');
        privates.container.appendChild(div);

        privates.root = document.createElementNS(bui.svgns, 'svg');
        privates.root.setAttribute('xmlns', bui.svgns);
        privates.root.setAttribute('id', privates.id);
        div.appendChild(privates.root);

        var offset = jQuery(privates.root).offset();
        privates.rootOffset = {
            x : offset.left,
            y : offset.top
        };

        privates.rootDimensions = {
            width : jQuery(privates.root).width(),
            height : jQuery(privates.root).height()
        };

        privates.defsGroup = document.createElementNS(bui.svgns, 'defs');
        privates.root.appendChild(privates.defsGroup);

        privates.css = document.createElementNS(bui.svgns, 'style');
        privates.css.setAttribute('type', 'text/css');
        privates.css.textContent = __getStylesheetContents();
        privates.root.appendChild(privates.css);

        privates.rootGroup = document.createElementNS(bui.svgns, 'g');
        __setTransformString.call(this);
        privates.root.appendChild(privates.rootGroup);

        privates.nodeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.nodeGroup);

        privates.edgeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.edgeGroup);

        privates.placeholderContainer = document.createElement('div');
        document.getElementsByTagName('body')[0]
                .appendChild(privates.placeholderContainer);

        privates.connectingArcs = {};

        for (var i in bui.connectingArcs) {
            if (bui.connectingArcs.hasOwnProperty(i)) {
                var ca = bui.connectingArcs[i]();
                var id = bui.connectingArcs[i].id;
                privates.connectingArcs[id] = ca;

                privates.defsGroup.appendChild(ca.element);
                privates.defsGroup.appendChild(ca.hoverElement);
            }
        }
    };

    /**
     * @private
     * This function makes sure that each node fits onto the SVG canvas.
     * In order to do so it's a observer of the nodes' position and size
     * events.
     */
    var __assertCanvasSize = function(node) {
        var privates = this._privates(identifier);

        var bottomRight = node.absoluteBottomRight();

        if (bottomRight.x > privates.rootDimensions.width) {
            privates.rootDimensions.width = bottomRight.x;
            privates.root.setAttribute('width', bottomRight.x);
        }

        if (bottomRight.y > privates.rootDimensions.height) {
            privates.rootDimensions.height = bottomRight.y;
            privates.root.setAttribute('height', bottomRight.y);
        }
    };

    /**
     * @private
     * Generic drawable remove listener.
     */
    var __removed = function(drawable) {
        delete this._privates(identifier).drawables[drawable.id()];
    };

    /**
     * @class
     * This class controls the whole graph and is responsible for the
     * management of nodes and edges, i.e. drawables.
     *
     * @extends bui.Observable
     * @constructor
     *
     * @param {HTMLElement} container where the graph should go
     */
    bui.Graph = function(container) {
        bui.Graph.superClazz.call(this);

        this._addType(bui.Graph.ListenerType);

        var privates = this._privates(identifier);
        privates.id = bui.settings.idPrefix.graph + graphCounter++;
        privates.container = container;
        privates.drawables = {};
        privates.idCounter = 0;
        privates.scale = 1;
        privates.highPerformance = bui.settings.initialHighPerformance;

        __initialPaintGraph.call(this);
    };

    bui.Graph.prototype = {
        /**
         * @description
         * Retrieve the graph's id.
         *
         * @return {String} graph id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * Retrieve the SVG element's offset relative to the document
         *
         * @return {Object} an object with x and y properties
         */
        htmlTopLeft : function() {
            return this._privates(identifier).rootOffset;
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        topLeft : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        absolutePosition : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * @description
         * Retrieve the container which was provided to this object during
         * the creation.
         *
         * @return {HTMLElement} The container of this graph
         */
        container : function() {
            return this._privates(identifier).container;
        },

        /**
         * @description
         * Retrieve the container for placeholder elements. Placeholder
         * elements are used while dragging or resizing to improve performance.
         *
         * @return {HTMLDIVElement} The container for placeholder elements
         */
        placeholderContainer : function() {
            return this._privates(identifier).placeholderContainer;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all egdes are placed.
         *
         * @return {SVGGElement} Edge container
         */
        edgeGroup : function() {
            return this._privates(identifier).edgeGroup;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all nodes are placed.
         *
         * @return {SVGGElement} Node container
         */
        nodeGroup : function() {
            return this._privates(identifier).nodeGroup;
        },

        /**
         * @description
         * Use this method to deactivate (suspend) redrawing of the SVG. This
         * function is most useful when multiple changes are made to the SVG
         * to improve performance significantly.
         *
         * @param {Integer} duration how long you wish to suspend redrawing
         * @return {Object} A suspend handle which can be passed to
         *   {@link bui.Graph#unsuspendRedraw} to enable redrawing.
         */
        suspendRedraw : function(duration) {
            return this._privates(identifier).root.suspendRedraw(duration);
        },

        /**
         * @description
         * Used to enable redrawing. You can either unsuspend a specific
         * suspension by passing the suspend handle to this function or
         * unsuspend all by passing no parameter.
         *
         * @param {Object} [handle] the suspend handle. Can be omitted to
         *   unsuspend all.
         * @return {bui.Graph} Fluent interface
         */
        unsuspendRedraw : function(handle) {
            if (handle !== undefined) {
                this._privates(identifier).root.unsuspendRedraw(handle);
            } else {
                this._privates(identifier).root.unsuspendRedrawAll();
            }

            return this;
        },

        /**
         * @description
         * Scale the graph by passing a number to this function. To have the
         * standard scale level pass one (1) to this function. To double the
         * size pass two (2).
         *
         * You can also retrieve the current scale by calling this function
         * without parameters.
         *
         * @param {Number} [scale] The new scale, one (1) means 100%.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current scale is returned
         */
        scale : function(scale) {
            var privates = this._privates(identifier);

            if (scale !== undefined) {
                if (scale !== privates.scale) {
                    privates.scale = scale;

                    __setTransformString.call(this);
                    this.reduceCanvasSize();

                    this.fire(bui.Graph.ListenerType.scale, [this, scale]);
                }

                return this;
            }

            return privates.scale;
        },

        /**
         * Fit the Graph to the viewport, i.e. scale the graph down to show
         * the whole graph or (in the case  of a very small graph) scale it
         * up.
         *
         * @return {bui.Graph} Fluent interface
         */
        fitToPage : function() {
            var dimensions = this._privates(identifier).rootDimensions;

            var viewportWidth = $(window).width();
            var viewportHeight = $(window).height();

            var scale = Math.min(viewportWidth / dimensions.width,
                    viewportHeight / dimensions.height);
            this.scale(scale);

            return this;
        },

        /**
         * @description
         * Add a drawable to this graph by calling this function with the
         * constructor of a drawable type. The object will be completely
         * instantiated and associated to the graph, thus ready to be used.
         *
         * @param {Function} constructor The constructor function for the
         *   drawable.
         * @param {Object} [params] Parameters which should be supplied to the
         *   constructor.
         * @return {bui.Drawable} The constructed drawable object.
         */
        add : function(constructor, params) {
            var privates = this._privates(identifier);
            var drawable = null;
            var id = privates.idCounter++;

            if (params === undefined) {
                params = {};
            }

            params.id = id;
            params.graph = this;

            drawable = new constructor(params);

            privates.drawables[drawable.id()] = drawable;

            drawable.bind(bui.Drawable.ListenerType.remove,
                    __removed.createDelegate(this),
                    listenerIdentifier(this));

            // every node type has a bottomRight property. We use this to
            // identify them.
            if (drawable.bottomRight !== undefined) {
                drawable.bind(bui.Node.ListenerType.position,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                drawable.bind(bui.Node.ListenerType.size,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                this.reduceCanvasSize.call(this, drawable);
            }

            this.fire(bui.Graph.ListenerType.add, [drawable]);

            return drawable;
        },

        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        reduceCanvasSize : function() {
            var privates = this._privates(identifier);

            var maxX = Number.MIN_VALUE,
                    maxY = Number.MIN_VALUE;

            for (var i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    var drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        var bottomRight = drawable.absoluteBottomRight();

                        maxX = Math.max(maxX, bottomRight.x);
                        maxY = Math.max(maxY, bottomRight.y);
                    }
                }
            }

            var padding = bui.settings.style.graphReduceCanvasPadding;
            maxX += padding;
            maxY += padding;

            privates.rootDimensions.width = maxX;
            privates.root.setAttribute('width', maxX * privates.scale);

            privates.rootDimensions.height = maxY;
            privates.root.setAttribute('height', maxY * privates.scale);
        },

        /**
         * Retrieve the connecting arcs.
         *
         * @return {Object} You will retrieve the connecting arcs
         * in the following form:
         * {
         *   stimulation : { // id of the connecting arc type
         *     id : 'foo', // the id with which the marker can be referenced
         *     element : {} // instance of SVGMarkerElement
         *   },
         *   // more types may be here
         * }
         */
        connectingArcs : function() {
            return this._privates(identifier).connectingArcs;
        },

        /**
         * Return the raw SVG.
         *
         * Please note that the execution of this method may take a while as an
         * additional HTTP request needs to be made in order to retrieve the
         * stylesheet. The result is the complete SVG with embedded CSS.
         *
         * @return {String} The raw SVG as it can be used to save / export it.
         */
        rawSVG : function() {
            var inner = this._privates(identifier).root.parentNode.innerHTML;

            var css = '';

            jQuery.ajax({
                        url : bui.settings.css.stylesheetUrl,
                        async : false,
                        success : function(data) {
                            css = data;
                        }
                    });

            inner = inner.replace(__getStylesheetContents(), css);

            return inner;
        },

        /**
         * A graph supports a high and low performance mode. This has
         * implications on the way dragging and resizing is realized. When in
         * high performance mode the SVG will be changed while dragging or
         * resizing the node. In low performance mode this will only be done
         * at the end of the dragging or resizing.
         *
         * @param {Boolean} [highPerformance] Set the performance for this
         *   graph to high (true) or low (false). Omit to retrieve current
         *   performance setting.
         * @return {Boolean|bui.Graph} If you pass a boolean to this function
         *   it will set the new value and return the instance of the object
         *   on which you called the function (fluent interface). If you don't
         *   pass a parameter the current setting will be removed.
         */
        highPerformance : function(highPerformance) {
            var privates = this._privates(identifier);

            if (highPerformance !== undefined) {
                privates.highPerformance = highPerformance;
                return this;
            }

            return privates.highPerformance;
        },

        /**
         * Retrieve an object which holds references to all the graph's
         * drawables.
         *
         * @return {Object} Key/value store of the graph's drawables. The keys
         *   are the drawable's IDs. The value is the drawable instance
         *   reference.
         */
        drawables : function() {
            return this._privates(identifier).drawables;
        },

        /**
         * Export the whole graph to JSON.
         *
         * @return {Object} The exported graph.
         */
        toJSON : function(useDataObject) {
            var json = {}, edges = [], nodes = [];

            var dataFormat = bui.settings.dataFormat;
            updateJson(json, dataFormat.nodes, nodes);
            updateJson(json, dataFormat.edges, edges);

            var drawables = this._privates(identifier).drawables;

            for (var key in drawables) {
                if (drawables.hasOwnProperty(key) &&
                        drawables[key].includeInJSON !== false) {
                    var drawable = drawables[key];

                    if (drawable.drawableType() === 'node') {
                        nodes.push(drawable.toJSON());
                    } else {
                        edges.push(drawable.toJSON());
                    }
                }
            }

            return json;
        },

        /**
         * Reduce the whitespace on top and left hand side of the graph. This
         * isn't done automatically through the
         * {@link bui.Graph#reduceCanvasSize} method as this would probably
         * confuse the user.
         *
         * @param {Boolean} [duration] Pass a duration in milliseconds to
         *   animate the whitespace reduction. Defaults to no animation.
         * @return {bui.Graph} Fluent interface
         */
        reduceTopLeftWhitespace : function(duration) {
            duration = duration || 0;
            var padding = bui.settings.style.graphReduceCanvasPadding,
                    privates = this._privates(identifier),
                    minX = Number.MAX_VALUE,
                    minY = Number.MAX_VALUE,
                    i,
                    drawable,
                    topLeft;

            for (i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        topLeft = drawable.absolutePosition();

                        minX = Math.min(minX, topLeft.x);
                        minY = Math.min(minY, topLeft.y);
                    }
                }
            }

            minX = Math.max(minX - padding, 0) * -1;
            minY = Math.max(minY - padding, 0) * -1;

            if (minX !== 0 || minY !== 0) {
                for (i in privates.drawables) {
                    if (privates.drawables.hasOwnProperty(i)) {
                        drawable = privates.drawables[i];

                        if (drawable.bottomRight !== undefined &&
                                drawable.hasParent() === false) {
                            topLeft = drawable.position();

                            drawable.move(minX, minY, duration);
                        }
                    }
                }
            }

            return this;
        }
    };

    bui.util.setSuperClass(bui.Graph, bui.Observable);

    /**
     * @namespace
     * Observable properties of the Graph class
     */
    bui.Graph.ListenerType = {
        /** @field */
        add : bui.util.createListenerTypeId(),
        /** @field */
        scale : bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {
    var identifier = 'bui.Drawable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Drawable} drawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(drawable) {
        return identifier + drawable.id();
    };

    /**
     * @class
     * The base class for every drawable item.
     *
     * As a general rule, the constructors of drawables should never be
     * called directly but through the {@link bui.Graph#add} function.
     *
     *
     * @extends bui.Observable
     * @constructor
     *
     * Please note that the arguments should be passed in the form of one
     * object literal.
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.Drawable = function(args) {
        bui.Drawable.superClazz.call(this);
        this._addType(bui.Drawable.ListenerType);

        var privates = this._privates(identifier);
        privates.id = args.id;
        privates.graph = args.graph;
        privates.classes = [];
        privates.visible = false;
        privates.select = false;
        privates.json = null;
    };

    bui.Drawable.prototype = {
        /**
         * @description
         * Retrieve the drawable's id.
         *
         * @return {String} drawable id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * @description
         * Retrieve the graph instance to which this drawable belongs.
         *
         * @return {bui.Graph} this node's graph
         */
        graph : function() {
            return this._privates(identifier).graph;
        },

        /**
         * @description
         * Remove this drawable from the graph.
         *
         * First all remove listeners will be informed about the event and then
         * all listeners will be unbound.
         */
        remove : function() {
            this.fire(bui.Drawable.ListenerType.remove, [this]);
            this.unbind();
        },

        /**
         * @description
         * Use this function to select the drawable. Selection is normally done
         * by clicking on a drawable. Think of a file manager which provides
         * functionality to, for example, select multiple files and apply
         * actions to all selected files.
         *
         * If you omit the parameter the current selection status will be
         * returned.
         *
         * @param {Boolean} [select] True to select the drawable, false
         *   otherwise.
         * @return {bui.Drawable|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the current selection state
         *   will be returned.
         */
        select : function(select) {
            var privates = this._privates(identifier);

            if (select !== undefined) {
                if (privates.select !== select) {
                    privates.select = select;

                    this.fire(bui.Drawable.ListenerType.select,
                            [this, select]);
                }

                return this;
            }

            return privates.select;
        },

        /**
         * @description
         * Drawables can be shown or hidden using this function.
         *
         * Retrieve the current visibility state by calling this function
         * without parameter.
         *
         * @param {Boolean} [visible] True to show the drawable, false to hide.
         *   Omit to retrieve current visibility setting.
         * @return {bui.Drawable|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the current visibility state
         *   will be returned.
         */
        visible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                if (privates.visible !== visible) {
                    privates.visible = visible;

                    this.fire(bui.Drawable.ListenerType.visible,
                            [this, visible]);
                }

                return this;
            }

            return privates.visible;
        },

        /**
         * @description
         * Check whether two drawables belong to the same graph.
         *
         * @param {bui.Drawable} drawable Check if the drawable belongs to the
         *   same graph.
         * @return {Boolean} true when both belong to the same graph.
         */
        isSameGraph : function(drawable) {
            return this._privates(identifier).graph.id() ==
                    node._privates(identifier).graph.id();
        },

        /**
         * @description
         * Add a class to this drawable. This method accepts one or more
         * classes (var args).
         *
         * @param {String} klass the class which you want to add
         * @return {bui.Drawable} Fluent interface
         */
        addClass : function(klass) {
            var classes = this._privates(identifier).classes;

            var changed = false;

            for (var i = 0; i < arguments.length; i++) {
                klass = arguments[i];

                if (classes.indexOf(klass) == -1) {
                    classes.push(klass);
                    changed = true;
                }
            }

            if (changed === true) {
                this.fire(bui.Drawable.ListenerType.classes, [this,
                        this.classString()]);
            }

            return this;
        },

        /**
         * @description
         * Remove a class from this drawable, if no parameter is passed remove all classes
         *
         * @param {String} klass the class which you want to remove
         * @return {bui.Drawable} Fluent interface
         */
        removeClass : function(klass) {
            if (klass === undefined) {
                this._privates(identifier).classes = [];
                this.fire(bui.Drawable.ListenerType.classes, [this, '']);
            } else {
                var classes = this._privates(identifier).classes;

                var index = classes.indexOf(klass);

                if (index != -1) {
                    classes.splice(index, 1);
                    this.fire(bui.Drawable.ListenerType.classes, [this,
                        this.classString()]);
                }
            }

            return this;
        },

        /**
         * @description
         * Generate a class string, i.e. a string which can be used for the
         * HTML / SVG class attribute.
         *
         * @return {String} the string for the class attribute
         */
        classString : function() {
            return this._privates(identifier).classes.join(' ');
        },

        /**
         * Set some JSON meta information for this drawable. Please note that
         * it won't be processed but only stored for later usage.
         *
         * @param {Object} [json] The data which you want to store within this
         *   object. Omit to retrieve the current data.
         * @return {Object|bui.Drawable} The stored data in case you call this
         *   function without parameter. If you pass a parameter the data
         *   will be stored and instance on which you called this function
         *   will be returned (fluent interface).
         */
        json : function(json) {
            var privates = this._privates(identifier);

            if (json !== undefined) {
                privates.json = json;

                return this;
            }

            return privates.json;
        },

        /**
         * Update the JSON object.
         *
         * @param {String|String[]} path The property name which should be
         *   updated. Pass a string array to handle property chains.
         * @param {Object} value The property's value.
         * @returh {bui.Drawable} Fluent interface
         */
        updateJson : function(path, value) {
            var privates = this._privates(identifier);

            privates.json = privates.json || {};

            updateJson(privates.json, path, value);

            return this;
        },

        /**
         * Export this drawable instance to JSON
         *
         * @return {Object} The drawable instance exported to JSON.
         */
        toJSON : function() {
            var json = {},
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat.drawable;

            updateJson(json, dataFormat.id, privates.id);
            updateJson(json, dataFormat.visible, privates.visible);
            updateJson(json, dataFormat.cssClasses, privates.classes);

            return json;
        },

        /**
         * Retrieve the drawables type, i.e. either node or edge.
         *
         * @return {String} If the drawable is a node, 'node' will be returned.
         *   Otherwise 'edge' will be returned.
         */
        drawableType : function() {
            if (this.bottomRight !== undefined) {
                return 'node';
            } else {
                return 'edge';
            }
        },

        identifier : function() {
            return this.identifier;
        }
    };

    bui.util.setSuperClass(bui.Drawable, bui.Observable);

    /**
     * @namespace
     * Observable properties which all drawables share
     */
    bui.Drawable.ListenerType = {
        /** @field */
        visible :  bui.util.createListenerTypeId(),
        /** @field */
        remove :  bui.util.createListenerTypeId(),
        /** @field */
        select :  bui.util.createListenerTypeId(),
        /** @field */
        classes :  bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {

    var identifier = 'bui.Node';

    var placeholderClass = function(visible) {
        var klass = bui.settings.css.classes.placeholder;

        if (visible === false) {
            klass += ' ' + bui.settings.css.classes.invisible;
        }

        return klass;
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Node} node
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(node) {
        return identifier + node.id();
    };

    /**
     * @private
     */
    var positionPlaceHolder = function() {
        var privates = this._privates(identifier);
        var absolutePosition = this.absolutePosition();
        var graphHtmlPosition = this.graph().htmlTopLeft();
        var correction = bui.settings.style.placeholderCorrection.position;
        var scale = this.graph().scale();
        privates.placeholder.style.left = (absolutePosition.x * scale +
                graphHtmlPosition.x + correction.x) + 'px';
        privates.placeholder.style.top = (absolutePosition.y * scale +
                graphHtmlPosition.y + correction.y) + 'px';

        correction = bui.settings.style.placeholderCorrection.size;
        privates.placeholder.style.width = (privates.width * scale +
                correction.width) + 'px';
        privates.placeholder.style.height = (privates.height * scale +
                correction.height) + 'px';
    };

    /**
     * @private position changed listener
     */
    var positionChanged = function() {
        var privates = this._privates(identifier);

        var position = this.absolutePosition();

        var attrValue = ['translate(',
            position.x.toString(),
            ',',
            position.y.toString(),
            ')'].join('');
        privates.nodeGroup.setAttributeNS(null, 'transform', attrValue);

        positionPlaceHolder.call(this);

        this.fire(bui.Node.ListenerType.absolutePosition,
                [this, position.x, position.y]);
    };

    /**
     * @private jQuery UI drag stop listener
     */
    var placeholderDragStop = function() {
        var privates = this._privates(identifier);
        var scale = 1 / this.graph().scale();
        var placeholderOffset = jQuery(privates.placeholder).offset();
        var x = placeholderOffset.left;
        var y = placeholderOffset.top;

        var graphOffset = this.graph().htmlTopLeft();
        x -= graphOffset.x;
        y -= graphOffset.y;

        x *= scale;
        y *= scale;

        var parentTopLeft = privates.parent.absolutePosition();
        x -= parentTopLeft.x;
        y -= parentTopLeft.y;

        var correction = bui.settings.style.placeholderCorrection.position;
        x += correction.x * -1;
        y += correction.y * -1;

        var suspendHandle = this.graph().suspendRedraw(200);
        this.position(x, y);
        this.graph().unsuspendRedraw(suspendHandle);
    };

    /**
     * @private jQuery UI drag listener
     */
    var placeholderDrag = function() {
        if (this.graph().highPerformance() === true) {
            placeholderDragStop.call(this);
        }
    };

    /**
     * @private jQuery UI resize stop listener
     */
    var placeholderResizeStop = function() {
        var privates = this._privates(identifier);
        var scale = 1 / this.graph().scale();
        var width = jQuery(privates.placeholder).width() * scale;
        var height = jQuery(privates.placeholder).height() * scale;

        var correction = bui.settings.style.placeholderCorrection.size;

        width -= correction.width;
        height -= correction.height;

        var suspendHandle = this.graph().suspendRedraw(200);
        this.size(width, height);
        this.graph().unsuspendRedraw(suspendHandle);
    };

    var placeholderResize = function() {
        if (this.graph().highPerformance() === true) {
            placeholderResizeStop.call(this);
        }
    };

    /**
     * @private visibility listener
     */
    var visibilityChanged = function(node, visible) {
        if (visible === true) {
            this.removeClass(bui.settings.css.classes.invisible);
        } else {
            this.addClass(bui.settings.css.classes.invisible);
            this.placeholderVisible(false);
        }
    };

    /**
     * @private remove listener
     */
    var nodeRemoved = function() {
        var privates = this._privates(identifier);
        var nodeGroup = privates.nodeGroup;
        nodeGroup.parentNode.removeChild(nodeGroup);

        var placeholder = privates.placeholder;
        placeholder.parentNode.removeChild(placeholder);
    };

    /**
     * @private parent removed listener
     */
    var parentRemoved = function() {
        this.parent(this.graph());
    };

    /**
     * @private parent listener
     */
    var parentChanged = function(node, newParent, oldParent) {
        if (oldParent !== this.graph()) {
            oldParent.unbindAll(listenerIdentifier(this));
        }

        newParent.bind(bui.Drawable.ListenerType.remove,
                parentRemoved.createDelegate(this),
                listenerIdentifier(this));
        newParent.bind(bui.Node.ListenerType.absolutePosition,
                positionChanged.createDelegate(this),
                listenerIdentifier(this));

        positionChanged.call(this);
    };

    /**
     * @private class changed listener
     */
    var classesChanged = function(node, classString) {
        var nodeGroup = this._privates(identifier).nodeGroup;
        nodeGroup.setAttributeNS(null, 'class', classString);
    };

    /**
     * @private select changed listener
     */
    var selectChanged = function(node, selected) {
        if (selected === true) {
            this.addClass(bui.settings.css.classes.selected);
        } else {
            this.removeClass(bui.settings.css.classes.selected);
        }
    };

    var mouseClick = function(event) {
        if (event.ctrlKey === true) {
            this.placeholderVisible(!this.placeholderVisible());
        } else {
            this.fire(bui.Node.ListenerType.click, [this, event]);
        }
    };
    var dblclick = function(event) {
            this.placeholderVisible(!this.placeholderVisible());
    };

    /**
     * @private
     * Initial paint of the placeholder node and group node
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.nodeGroup = document.createElementNS(bui.svgns, 'g');
        privates.nodeGroup.setAttributeNS(null, 'id', this.id());
        visibilityChanged.call(this, this, this.visible());
        this.graph().nodeGroup().appendChild(privates.nodeGroup);

        privates.placeholder = document.createElement('div');
        privates.placeholder.setAttribute('class',
                placeholderClass(false)+' '+this.identifier());
        privates.placeholder.setAttribute('id',
                'placeholder_'+this.id());
        this.graph().placeholderContainer().appendChild(privates.placeholder);

        positionPlaceHolder.call(this);
        positionChanged.call(this);

        if (bui.settings.enableModificationSupport === true) {

            jQuery(privates.nodeGroup)
                    .add(privates.placeholder)
                    .click(mouseClick.createDelegate(this))
                    .dblclick(dblclick.createDelegate(this));

            if (this._enableDragging === true) {
                jQuery(privates.placeholder).draggable({
                            stop : placeholderDragStop.createDelegate(this),
                            drag : placeholderDrag.createDelegate(this)
                        });
            }

            if (this._enableResizing === true) {
                jQuery(privates.placeholder).resizable({
                            stop : placeholderResizeStop.createDelegate(this),
                            resize : placeholderResize.createDelegate(this),
                            aspectRatio : (this._forceRectangular ? 1 : false)
                        });
            }
        }
    };

    /**
     * @class
     * Base class for every drawable node. Please note that nodes shouldn't be
     * instantiated directly.
     *
     * @extends bui.Drawable
     * @constructor
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.Node = function(args) {
        args.id = bui.settings.idPrefix.node + args.id;
        bui.Node.superClazz.call(this, args);
        this._addType(bui.Node.ListenerType);

        var privates = this._privates(identifier);
        privates.x = 0;
        privates.y = 0;
        privates.width = this._minWidth;
        privates.height = this._minHeight;
        privates.parent = this.graph();
        privates.children = [];
        privates.placeholderVisible = false;

        this.bind(bui.Drawable.ListenerType.remove,
                nodeRemoved.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.parent,
                parentChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.position,
                positionChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.size,
                positionPlaceHolder.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                selectChanged.createDelegate(this),
                listenerIdentifier(this));
        this.graph().bind(bui.Graph.ListenerType.scale,
                positionPlaceHolder.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.Node.prototype = {
        _minWidth : 10,
        _minHeight : 10,
        _forceRectangular : false,
        _enableResizing : true,
        _enableDragging : true,

        /**
         * Use this function to retrieve this node's group. This function
         * is normally only required by sub classes.
         *
         * @return {SVGGElement} node group
         */
        nodeGroup : function() {
            return this._privates(identifier).nodeGroup;
        },

        /**
         * @description
         * Set or retrieve the node's position.
         *
         * You can set the position by passing both, the x- and y-axis value
         * to this function. If you pass only one parameter or none, the
         * current position is returned.
         *
         * @param {Number} [x] The new x-axis position.
         * @param {Number} [y] The new y-axis position.
         * @return {bui.Node|Object} Fluent interface in case both parameters
         *   are given. If only one or no parameter is provided the current
         *   position will be returned as an object with x and y properties.
         */
        position : function(x, y) {
            var privates = this._privates(identifier);

            if (x !== undefined && y !== undefined) {
                var changed = privates.x !== x || privates.y !== y;
                privates.x = x;
                privates.y = y;

                if (changed) {
                    this.fire(bui.Node.ListenerType.position,
                            [this, privates.x, privates.y]);
                }

                return this;
            }

            return {
                x : privates.x,
                y : privates.y
            };
        },

        /**
         * Retrieve the absolute position of this node in the SVG or set it.
         *
         * @param {Number} [x] The new x-axis position.
         * @param {Number} [y] The new y-axis position.
         * @return {Object} Object with x and y properties.
         */
        absolutePosition : function(x, y) {
            var privates = this._privates(identifier);
            var parentTopLeft = privates.parent.absolutePosition();

            if (x !== undefined && y !== undefined) {
                x -= parentTopLeft.x;
                y -= parentTopLeft.y;

                this.position(x, y);
                return this;
            } else {
                return {
                    x : parentTopLeft.x + privates.x,
                    y : parentTopLeft.y + privates.y
                };
            }
        },

        /**
         * Position the node's center on the given coordinate.
         *
         * The positioning is done relatively.
         *
         * @param {Number} x Position on x-coordinate.
         * @param {Number} y Position on y-coordinate.
         * @return {bui.Node} Fluent interface
         */
        positionCenter : function(x, y) {
            var size = this.size();

            this.position(x - size.width / 2, y - size.height / 2);

            return this;
        },

        /**
         * Retrieve the absolute position of this node in the HTML document.
         *
         * @return {Object} Object with x and y properties.
         */
        htmlTopLeft : function() {
            var privates = this._privates(identifier);

            var parentTopLeft = privates.parent.htmlTopLeft();

            return {
                x : parentTopLeft.x + privates.x,
                y : parentTopLeft.y + privates.y
            };
        },

        /**
         * @description
         * Set or retrieve the node's size.
         *
         * You can set the size by passing both, the width and height value
         * to this function. If you pass only one parameter or none, the
         * current size is returned.
         *
         * @param {Number} [width] The new width.
         * @param {Number} [height] The new height.
         * @return {bui.Node|Object} Fluent interface in case both parameters
         *   are given. If only one or no parameter is provided the current
         *   size will be returned as an object with width and height
         *   properties.
         */
        size : function(width, height) {
            var privates = this._privates(identifier);

            if (width !== undefined && height !== undefined) {
                width = Math.max(this._minWidth, width);
                height = Math.max(this._minHeight, height);

                if (this._forceRectangular === true) {
                    height = width;
                }
                var changed = privates.width !== width ||
                        privates.height !== height;
                privates.width = width;
                privates.height = height;

                if (changed) {
                    this.fire(bui.Node.ListenerType.size,
                            [this, privates.width, privates.height]);
                }

                return this;
            }

            return {
                width : privates.width,
                height : privates.height
            };
        },

        /**
         * @description
         * Use this function to retrieve the top-left corner of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        topLeft : function() {
            var privates = this._privates(identifier);

            return {
                x : privates.x,
                y : privates.y
            };
        },

        /**
         * @description
         * Use this function to retrieve the bottom-right corner of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        bottomRight : function() {
            var privates = this._privates(identifier);

            return {
                x : privates.x + privates.width,
                y : privates.y + privates.height
            };
        },

        /**
         * @description
         * Use this function to retrieve the absolute bottom right coordinates
         * of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        absoluteBottomRight : function() {
            var privates = this._privates(identifier);

            var position = this.absolutePosition();

            return {
                x : position.x + privates.width,
                y : position.y + privates.height
            };
        },

        /**
         * @description
         * Use this function to retrieve the center of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        center : function() {
            var privates = this._privates(identifier);

            return {
                x : privates.x + (privates.width / 2),
                y : privates.y + (privates.height / 2)
            };
        },

        /**
         * @description
         * Use this function to retrieve the absolute center of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        absoluteCenter : function() {
            var privates = this._privates(identifier);

            var position = this.absolutePosition();

            return {
                x : position.x + (privates.width / 2),
                y : position.y + (privates.height / 2)
            };
        },

        /**
         * @description
         * Use this function to move the node relative to its current position.
         *
         * @param {Number} x Relative change on the x-axis.
         * @param {Number} y Relative change on the y-axis.
         * @param {Number} [duration] Whether this movement should be animated
         *   and how long this animation should run in milliseconds. When
         *   omitted or a value <= 0 is passed the movement will be executed
         *   immediately.
         * @return {bui.Node} Fluent interface.
         */
        move : function(x, y, duration) {
            var privates = this._privates(identifier);

            if (duration === undefined || duration <= 0) {
                this.position(privates.x + x, privates.y + y);
            } else {
                var node = this,
                        // 1000 milliseconds / x fps
                        timeOffset = 1000 / bui.settings.animationFPS,
                        remainingCalls = Math.floor(duration / timeOffset);


                (function() {
                    // to avoid rounding issues
                    var diffX = x / remainingCalls,
                            diffY = y / remainingCalls;

                    node.position(privates.x + diffX, privates.y + diffY);

                    remainingCalls--;

                    if (remainingCalls >= 1) {
                        x -= diffX;
                        y -= diffY;
                        setTimeout(arguments.callee, timeOffset);
                    }
                })();
            }

            return this;
        },

        /**
         * @description
         * Use this function to move the node.
         *
         * @param {Number} x Absolute position on the x-axis.
         * @param {Number} y Absolute position on the y-axis.
         * @param {Number} [duration] Whether this movement should be animated
         *   and how long this animation should run in milliseconds. When
         *   omitted or a value <= 0 is passed the movement will be executed
         *   immediately.
         * @return {bui.Node} Fluent interface.
         */
        moveAbsolute : function(x, y, duration) {
            var privates = this._privates(identifier);
            return this.move(x - privates.x, y - privates.y, duration);
        },

        /**
         * Retrieve the current parent or set it
         *
         * @param {bui.Graph|bui.Node} [parent] The new parameter or
         *   omit to retrieve the current parent.
         * @return {bui.Graph|bui.Node} The current parent in case you didn't
         *   pass a parameter, fluent interface otherwise.
         */
        parent : function(parent) {
            var privates = this._privates(identifier);

            if (parent !== undefined) {
                if (parent !== privates.parent) {
                    var old = privates.parent;

                    privates.parent = parent;

                    if (old !== this.graph()) {
                        old._removeChild(this);
                    }

                    if (parent !== this.graph()) {
                        parent._addChild(this);
                    }

                    this.fire(bui.Node.ListenerType.parent,
                            [this, parent, old]);
                }

                return this;
            }

            return privates.parent;
        },

        /**
         * This function can be used to check whether this node has a parent
         * node.
         *
         * @return {Boolean} True when this node has a parent node.
         */
        hasParent : function() {
            return this.parent() !== this.graph();
        },

        /**
         * Add a child node to this node. This function call is synonymous with
         * a child.parent(this) function call.
         *
         * @param {bui.Node} child The new child node
         * @return {bui.Node} Fluent interface
         */
        addChild : function(child) {
            child.parent(this);

            return this;
        },

        /**
         * Remove a child node from this node. This function call is synonymous
         * with a child.parent(this.graph()) function call.
         *
         * @param {bui.Node} child The child node which should be removed
         * @return {bui.Node} Fluent interface
         */
        removeChild : function(child) {
            child.parent(this.graph());

            return this;
        },

        /**
         * @private
         * Internal method for the addition of a child node.
         *
         * @param {bui.Node} child The new child
         */
        _addChild : function(child) {
            this._privates(identifier).children.push(child);
        },

        /**
         * @private
         * Internal method for the removal of child nodes
         *
         * @param {bui.Node} child The child node which should be removed,
         */
        _removeChild : function(child) {
            var children = this._privates(identifier).children;

            var index = children.indexOf(child);

            if (index !== -1) {
                children.splice(index, 1);
            }
        },

        /**
         * Retrieve the node's child elements. The returned child nodes can
         * also be filtered using a callback which will be executed for every
         * child node.
         *
         * @param {Function} [checkFunction] Filter nodes using this filter
         *   function. The function will be called for every sub node. The
         *   function should return true in order to include the node in the
         *   return value.
         * @return {bui.Node[]} All the node's child elements. The returned
         *   array is actually a copy and can therefore be modified.
         */
        children : function(checkFunction) {
            var filteredChildren = [],
                    allChildren = this._privates(identifier).children;

            for (var i = 0; i < allChildren.length; i++) {
                var child = allChildren[i];

                if (checkFunction === undefined ||
                        checkFunction(child) === true) {
                    filteredChildren.push(child);
                }
            }

            return filteredChildren;
        },

        /**
         * Retrieve the node's auxiliary units.
         *
         * @return {bui.Node[]} All the node's auxiliary units. The returned
         *   array is actually a copy and can therefore be modified.
         */
        auxiliaryUnits : function() {
            return this.children(function(node) {
                return node.auxiliaryUnit === true;
            });
        },

        /**
         * Retrieve the node's auxiliary units.
         *
         * @return {bui.Node[]} All the node's sub nodes without auxiliary
         *   units. The returned array is actually a copy and can therefore be
         *   modified.
         */
        childrenWithoutAuxiliaryUnits : function() {
            return this.children(function(node) {
                return node.auxiliaryUnit !== true;
            });
        },

        /**
         * @private
         * Used to calculate line endpoints. Generally spoken this method
         * will only be used by the class {@link bui.StraightLine}.
         *
         * @param {bui.Node} otherNode
         * @return {Object} an object with x and y properties
         */
        calculateLineEnd : function(otherNode) {
            if (this.visible() === false) {
                return this.center();
            }

            var position = this.absoluteCenter(),
                    size = this.size(),
                    otherPosition = otherNode.absoluteCenter();

            var padding = bui.settings.style.edgeToNodePadding;
            var widthWithPadding = size.width + padding.leftRight * 2,
                    heightWithPadding = size.height + padding.topBottom * 2;

            var deltaX = otherPosition.x - position.x,
                    deltaY = otherPosition.y - position.y;

            var hitAngle = Math.abs(Math.atan(deltaY / deltaX));
            var sideHitAngle = Math.atan(heightWithPadding / widthWithPadding);

            var adjacent = 0;
            var goesThroughLeftOrRightSide = hitAngle < sideHitAngle;

            if (goesThroughLeftOrRightSide) {
                adjacent = widthWithPadding / 2;
            } else {
                adjacent = heightWithPadding / 2;
                // subtracting 90 degrees
                hitAngle = Math.PI / 2 - hitAngle;
            }

            var hookResult = this._calculationHook(adjacent, hitAngle);
            var opposite = hookResult.opposite;
            adjacent = hookResult.adjacent;

            var xChange = 0, yChange = 0;
            if (goesThroughLeftOrRightSide) {
                xChange = adjacent;
                yChange = opposite;
            } else {
                xChange = opposite;
                yChange = adjacent;
            }

            var hitsTop = position.y > otherPosition.y,
                    hitsLeft = position.x > otherPosition.x;

            xChange *= (hitsLeft ? -1 : 1);
            yChange *= (hitsTop ? -1 : 1);

            return {
                x : position.x + xChange,
                y : position.y + yChange
            };
        },

        /**
         * @private
         * This hook can be used to alter the calculateLineEnd function result.
         *
         * @param {Number} adjacent The length of the adjacent line
         * @param {Number} hitAngle The angle with which the line will 'hit'
         *   the shape in radians.
         * @return {Object} An object with adjacent and opposite properties.
         *   (think of trigonometric functions).
         */
        _calculationHook : function(adjacent, hitAngle) {
            return {
                adjacent : adjacent,
                opposite : Math.tan(hitAngle) * adjacent
            };
        },

        /**
         * Show or hide the placeholder which  is used for modification
         * of the node's position and size.
         *
         * @param {Boolean} [visible] Show or hide the placeholder
         * @return {bui.Node|Boolean} Fluent interface or the current
         *   visibility in case you don't pass a parameter
         */
        placeholderVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.placeholderVisible = visible;

                if (visible === true) {
                    jQuery(privates.placeholder)
                            .removeClass(bui.settings.css.classes.invisible);
                } else {
                    jQuery(privates.placeholder)
                            .addClass(bui.settings.css.classes.invisible);
                }

                return this;
            }

            return privates.placeholderVisible;
        },

        /**
         * Start the dragging process on the placeholder element at the given
         * position.
         *
         * @param {Number} x X-coordinate on which to start the dragging
         * @param {Number} y Y-coordinate on which to start the dragging
         * @param {Boolean} [correctGraphHTMLOffset] Whether or not the graph's
         *   HTML offset should be taken into account. Defaults to false.
         * @return {bui.Node} Fluent interface.
         */
        startDragging : function(x, y) {
            this.placeholderVisible(true);

            var placeholder = this._privates(identifier).placeholder;
            jQuery(placeholder).simulate("mousedown", {
                        clientX : x,
                        clientY : y
                    });

            return this;
        },

        /**
         * Automatically position the node's auxiliary units.
         *
         * @return {bui.Node} Fluent interface
         */
        positionAuxiliaryUnits : function() {
            var auxUnits = this.auxiliaryUnits();
            var possiblePositions =
                    bui.settings.style.automaticAuxiliaryUnitPositioning;

            var nodeSize = this.size();

            for (var i = 0; i < auxUnits.length &&
                    i < possiblePositions.length; i++) {
                var auxUnit = auxUnits[i];
                var positionAt = possiblePositions[i];

                var auxUnitSize = auxUnit.size();

                auxUnit.positionCenter(nodeSize.width * positionAt[0],
                        nodeSize.height * positionAt[1]);
            }

            return this;
        },

        // overridden
        toJSON : function() {
            var json = bui.Node.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier),
                    position = this.absolutePosition(),
                    i;

            updateJson(json, dataFormat.drawable.sbo,
                    getSBOForInstance(nodeMapping, this));
            updateJson(json, dataFormat.node.x, position.x);
            updateJson(json, dataFormat.node.y, position.y);
            updateJson(json, dataFormat.node.width, privates.width);
            updateJson(json, dataFormat.node.height, privates.height);

            var children = this.childrenWithoutAuxiliaryUnits();
            if (children.length > 0) {
                var subNodes = [];
                updateJson(json, dataFormat.node.subNodes, subNodes);

                for(i = 0; i < children.length; i++) {
                    subNodes.push(children[i].id());
                }
            }

            var auxUnits = this.auxiliaryUnits();
            if (auxUnits.length > 0) {
                var auxUnitsJson = [];
                updateJson(json, dataFormat.node.modifications, auxUnitsJson);

                for (i = 0; i < auxUnits.length; i++) {
                    var auxUnit = auxUnits[i];

                    if (auxUnit instanceof bui.StateVariable) {
                        auxUnitsJson.push(auxUnit.toJSON());
                    } else {
                        log('Warning: Can\'t export units of information to ' +
                                'JSON.');
                    }
                }
            }

            return json;
        },

        /**
         * Move the node to the front so that no other nodes may be positioned
         * in front of them.
         *
         * @return {bui.Node} Fluent interface.
         */
        toFront : function() {
            var nodeGroup = this._privates(identifier).nodeGroup;
            nodeGroup.parentNode.appendChild(nodeGroup);
            return this;
        },

        /**
         * Move the node to the back so that all nodes may be positioned in
         * front of this node.
         *
         * @return {bui.Node} Fluent interface.
         */
        toBack : function() {
            var nodeGroup = this._privates(identifier).nodeGroup,
                    parent = nodeGroup.parentNode;
            parent.insertBefore(nodeGroup, parent.firstChild);
            return this;
        }
    };

    bui.util.setSuperClass(bui.Node, bui.Drawable);

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.Node.ListenerType = {
        /** @field */
        parent : bui.util.createListenerTypeId(),
        /** @field */
        position : bui.util.createListenerTypeId(),
        /** @field */
        absolutePosition : bui.util.createListenerTypeId(),
        /** @field */
        size : bui.util.createListenerTypeId(),
        /** @field */
        click : bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {
    var identifier = 'bui.Labelable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Labelable} labelable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(labelable) {
        return identifier + labelable.id();
    };

    /**
     * @private label painting on multiple lines etc.
     */
    var doPaintTextWithoutAdaptToSize = function(lines) {
        var privates = this._privates(identifier);

        var previousHeight = 0;
        var firstHeight = lines[0].maxHeight;
        var totalHeight = 0;
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var aggregatedText = [];
            totalHeight += line.maxHeight;
            for(var j = 0; j < line.words.length; j++) {
                aggregatedText.push(line.words[j].word);
            }

            var tspan = document.createElementNS(bui.svgns, 'tspan');
            tspan.appendChild(document.createTextNode(
                    aggregatedText.join(' ')));
            tspan.setAttributeNS(null, 'x', line.horizontalIndention);
            tspan.setAttributeNS(null, 'dy', previousHeight);
            privates.labelElement.appendChild(tspan);

            previousHeight = line.maxHeight;
        }

        privates.labelElement.setAttributeNS(null, 'y',
                this.size().height / 2 + firstHeight - totalHeight / 2);
    };

    /**
     * @private label painting on multiple lines etc.
     */
    var doPaintTextWithAdaptToSize = function(lines) {
        var privates = this._privates(identifier);

        var aggregatedText = [];
        var maxHeight = Number.MIN_VALUE;
        var totalWidth = 0;

        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];

            for(var j = 0; j < line.words.length; j++) {
                aggregatedText.push(line.words[j].word);
            }

            totalWidth += line.totalWidth + line.spaceWidth;
            maxHeight = Math.max(maxHeight, line.maxHeight);
        }

        // we added one space too much
        totalWidth -= lines[0].spaceWidth;

        privates.labelElement.appendChild(document.createTextNode(
                    aggregatedText.join(' ')));

        var padding = bui.settings.style.adaptToLabelNodePadding;
        totalWidth += padding.left + padding.right;
        var nodeHeight = maxHeight + padding.top + padding.bottom;
        this.size(totalWidth, nodeHeight);
        privates.labelElement.setAttributeNS(null, 'x', padding.left);
        privates.labelElement.setAttributeNS(null, 'y', maxHeight);
    };

    /**
     * @private label change listener
     */
    var labelableLabelChanged = function() {
        var privates = this._privates(identifier);

        var label = this.label();
        if (privates.labelElement !== null &&
                privates.labelElement.parentNode !== null) {
            privates.labelElement.parentNode.removeChild(
                    privates.labelElement);
        }

        if (label.length === 0) {
            return;
        }

        privates.labelElement = document.createElementNS(bui.svgns, 'text');
        var lines = bui.util.calculateLabelPositioning(this.size().width,
             label, privates.calculationClasses);

        if (privates.adaptSizeToLabel === true) {
            doPaintTextWithAdaptToSize.call(this, lines);
        } else {
            doPaintTextWithoutAdaptToSize.call(this, lines);
        }

        privates.labelElement.setAttributeNS(null, 'class',
                privates.svgClasses);

        this.nodeGroup().appendChild(privates.labelElement);
    };

    /**
     * @class
     * A node which can contain a label.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Labelable = function() {
        bui.Labelable.superClazz.apply(this, arguments);
        this._addType(bui.Labelable.ListenerType);

        var privates = this._privates(identifier);
        privates.label = this._label;
        privates.adaptSizeToLabel = this._adaptSizeToLabel;
        privates.labelElement = null;
        privates.svgClasses = this._svgClasses;
        privates.calculationClasses = this._calculationClasses;

        var listener = labelableLabelChanged.createDelegate(this);
        this.bind(bui.Labelable.ListenerType.label,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.adaptSizeToLabel,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.labelClass,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.size,
                listener,
                listenerIdentifier(this));
    };

    bui.Labelable.prototype = {
        _label : '',
        _adaptSizeToLabel : false,
        _svgClasses : '',
        _ignLabelSize : false,
        _calculationClasses :
                [bui.settings.css.classes.textDimensionCalculation.standard],

        /**
         * Set or retrieve the current label
         *
         * @param {String} [label] Pass a new label to set it or omit the
         *   parameter to retrieve the current label
         * @return {bui.Labelable|String} Current label is returned when you
         *   don't pass any parameter, fluent interface otherwise.
         */
        label : function(label) {
            var privates = this._privates(identifier);

            if (label !== undefined) {
                label = label === null ? '' : label;
                if (label != privates.label) {
                    privates.label = label;
                    this.fire(bui.Labelable.ListenerType.label, [this, label]);
                }
                return this;
            }

            return privates.label;
        },

        /**
         * Set or retrieve whether the node adapts to the label size
         *
         * @param {Boolean} [adaptSizeToLabel] True to adapt to label size,
         *   false otherwise. Omit to retrieve current value.
         * @return {bui.Labelable|Boolean} Fluent interface or the current
         *   value in case no parameter is passed.
         */
        adaptSizeToLabel : function(adaptSizeToLabel) {
            var privates = this._privates(identifier);

            if (adaptSizeToLabel !== undefined) {
                if (adaptSizeToLabel !== privates.adaptSizeToLabel) {
                    privates.adaptSizeToLabel = adaptSizeToLabel;
                    this.fire(bui.Labelable.ListenerType.adaptSizeToLabel,
                            [this, adaptSizeToLabel]);
                }

                return this;
            }

            return privates.adaptSizeToLabel;
        },

        /**
         * Modify the text size etc.
         *
         * @param {String} svgClasses classes to be added to the SVG
         *   text element.
         * @param {String[]} calcClasses classes used for the calculation of
         *   the text dimensions.
         * @return {bui.Labelable} Fluent interface
         */
        labelClass : function(svgClasses, calcClasses) {
            var privates = this._privates(identifier);

            privates.svgClasses = svgClasses;
            privates.calculationClasses = calcClasses;

            this.fire(bui.Labelable.ListenerType.labelClass, [this]);

            return this;
        },

        /**
         * Retrieve the node's size based on its label. A node width of 300
         * pixels will be assumed.
         *
         * @return {Object} An object with width and height properties.
         */
        sizeBasedOnLabel : function() {
            var privates = this._privates(identifier);
            
            var lines = bui.util.calculateLabelPositioning(300,
                this.label(), privates.calculationClasses);

            var maxHeight = Number.MIN_VALUE;
            var maxWidth = Number.MIN_VALUE;

            for(var i = 0; i < lines.length; i++) {
                var line = lines[i];

                maxWidth = Math.max(maxWidth, line.totalWidth);
                maxHeight = Math.max(maxHeight, line.maxHeight);
            }

            var padding = bui.settings.style.adaptToLabelNodePadding;
            maxWidth += padding.left + padding.right;
            maxHeight += padding.top + padding.bottom;

            return {
                width : maxWidth,
                height : maxHeight
            };
        },

        // overridden
        toJSON : function() {
            var json = bui.Labelable.superClazz.prototype.toJSON.call(this),
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat;

            updateJson(json, dataFormat.node.label, privates.label);

            return json;
        }
    };

    bui.util.setSuperClass(bui.Labelable, bui.Node);

    /**
     * @namespace
     * Observable properties which all labelable nodes share
     */
    bui.Labelable.ListenerType = {
        /** @field */
        label : bui.util.createListenerTypeId(),
        /** @field */
        adaptSizeToLabel : bui.util.createListenerTypeId(),
        /** @field */
        labelClass : bui.util.createListenerTypeId()
    };
})(bui);
(function(bui) {
    var identifier = 'bui.EdgeHandle';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.EdgeHandle} EdgeHandle
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(EdgeHandle) {
        return identifier + EdgeHandle.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.EdgeHandle = function() {
        bui.EdgeHandle.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.EdgeHandle.prototype = {
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
    };

    bui.util.setSuperClass(bui.EdgeHandle, bui.Node);
})(bui);
(function(bui) {

    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     * of splines
     *
     * @extends bui.EdgeHandle
     * @constructor
     */
    bui.SplineEdgeHandle = function() {
        bui.SplineEdgeHandle.superClazz.apply(this, arguments);

        this.addClass(bui.settings.css.classes.splineEdgeHandle);
        this.position(10, 10);
    };

    bui.SplineEdgeHandle.prototype = {
        includeInJSON : false
    };

    bui.util.setSuperClass(bui.SplineEdgeHandle, bui.EdgeHandle);
})(bui);
(function(bui) {
    var identifier = 'bui.RectangularNode';

    // generate a path's arc data parameter
    // http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
    var arcParameter = function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag,
                              x, y) {
        return [rx,
                ',',
                ry,
                ' ',
                xAxisRotation,
                ' ',
                largeArcFlag,
                ',',
                sweepFlag,
                ' ',
                x,
                ',',
                y].join('');
    };

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the rectangular shape
     * @param {Number} height Height of the rectangular shape
     * @param {Number} tr Top border radius of the rectangular shape
     * @param {Number} br Bottom border radius of the rectangular shape
     * @return {String} a path's data attribute value
     */
    var generatePathData = function(width, height, tr, br) {
        var data = [];

        // start point in top-middle of the rectangle
        data.push('M' + width / 2 + ',' + 0);

        // next we go to the right
        data.push('H' + (width - tr));

        if (tr > 0) {
            // now we draw the arc in the top-right corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, width, tr));
        }

        // next we go down
        data.push('V' + (height - br));

        if (br > 0) {
            // now we draw the arc in the lower-right corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, width - br,
                    height));
        }

        // now we go to the left
        data.push('H' + br);

        if (br > 0) {
            // now we draw the arc in the lower-left corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, 0, height - br));
        }

        // next we go up
        data.push('V' + tr);

        if (tr > 0) {
            // now we draw the arc in the top-left corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, tr, 0));
        }

        // and we close the path
        data.push('Z');

        return data.join(' ');
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private position / size listener
     */
    var formChanged = function() {
        var privates = this._privates(identifier);
        var size = this.size();
        privates.rect.setAttributeNS(null, 'd', generatePathData(size.width,
                size.height, privates.topRadius, privates.bottomRadius));
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.rect = document.createElementNS(bui.svgns, 'path');
        var size = this.size();
        formChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.rect);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.RectangularNode = function() {
        bui.RectangularNode.superClazz.apply(this, arguments);
        this._addType(bui.RectangularNode.ListenerType);

        var listener = formChanged.createDelegate(this);
        this.bind(bui.Node.ListenerType.size,
                listener,
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.topRadius,
                listener,
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.bottomRadius,
                listener,
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.topRadius = 0;
        privates.bottomRadius = 0;

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.rectangle);
    };

    bui.RectangularNode.prototype = {
        
        /**
         * Set this node's radius for both upper corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        topRadius : function(radius) {
            var privates = this._privates(identifier);

            if (radius !== undefined) {
                if (privates.topRadius !== radius) {
                    privates.topRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.topRadius,
                            [this, radius]);
                }

                return this;
            }

            return privates.topRadius;
        },

        /**
         * Set this node's radius for both lower corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        bottomRadius : function(radius) {
            var privates = this._privates(identifier);

            if (radius !== undefined) {
                if (privates.bottomRadius !== radius) {
                    privates.bottomRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.bottomRadius,
                            [this, radius]);
                }

                return this;
            }

            return privates.bottomRadius;
        }
    };

    bui.util.setSuperClass(bui.RectangularNode, bui.Labelable);

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.RectangularNode.ListenerType = {
        /** @field */
        topRadius : bui.util.createListenerTypeId(),
        /** @field */
        bottomRadius : bui.util.createListenerTypeId()
    };
})(bui);
(function(bui) {
    var identifier = 'bui.UnitOfInformation';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnitOfInformation} UnitOfInformation
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnitOfInformation) {
        return identifier + UnitOfInformation.id();
    };

    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.UnitOfInformation = function() {
        bui.UnitOfInformation.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.UnitOfInformation.prototype = {
        auxiliaryUnit : true,
        includeInJSON : false,
        _enableResizing : false
    };

    bui.util.setSuperClass(bui.UnitOfInformation, bui.RectangularNode);
})(bui);
(function(bui) {
    var identifier = 'bui.Macromolecule';
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Macromolecule = function() {
        bui.Macromolecule.superClazz.apply(this, arguments);
        this.topRadius(bui.settings.style.nodeCornerRadius);
        this.bottomRadius(bui.settings.style.nodeCornerRadius);
    };
    bui.Macromolecule.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.Macromolecule, bui.RectangularNode);
})(bui);

(function(bui) {
    var identifier = 'bui.Complex';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Complex} Complex
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Complex) {
        return identifier + Complex.id();
    };

    var sizeChanged = function(node, width, height) {
        var cornerRadius = bui.settings.style.complexCornerRadius;

        var pathData = ['M', width / 2, 0,
                        'H', width - cornerRadius,
                        'L', width, cornerRadius,
                        'V', height - cornerRadius,
                        'L', width - cornerRadius, height,
                        'H', cornerRadius,
                        'L', 0, height - cornerRadius,
                        'V', cornerRadius,
                        'L', cornerRadius, 0,
                        'H', width / 2].join(' ');
        
        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.path);
    };

    /**
     * @class
     * Class for SBGN complexes.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Complex = function() {
        bui.Node.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.complex);
    };

    bui.Complex.prototype = {
        identifier : function() {
            return 'Complex';
        },
        _minWidth : 90,
        _minHeight : 90,
        /**
         * Automatically layout child elements using a simple table layout
         * strategy. You can change the strategy's settings through the first
         * parameter. The structure of this object should be like
         * bui.settings.style.complexTableLayout.
         * @param {Object} [settings] Settings for the layout process.
         *   Defaults to bui.settings.style.complexTableLayout when not
         *   provided.
         */
        tableLayout : function(settings) {
            if (settings === undefined) {
                settings = bui.settings.style.complexTableLayout;
            }

            if (settings.showBorder === true) {
                this.removeClass(bui.settings.css.classes.hideBorder);
            } else {
                this.addClass(bui.settings.css.classes.hideBorder);
            }

            // the items of the table array represent rows. Row items represent
            // columns
            var table = [[]];

            var children = this.childrenWithoutAuxiliaryUnits();

            var maxColumnsOrRow = Math.max(1,
                    Math.round(Math.sqrt(children.length)));

            var addToTable;

            if (settings.restrictNumberOfColumns === true) {
                /**
                 * @private
                 */
                addToTable = function(node) {
                    var lastRow = table[table.length - 1];

                    if (lastRow.length === maxColumnsOrRow) {
                        lastRow = [];
                        table.push(lastRow);
                    }

                    lastRow.push(node);
                };
            } else {
                var lastRow = 0;
                /**
                 * @private
                 */
                addToTable = function(node) {
                    var row = table[lastRow];

                    if (row === undefined) {
                        row = [];
                        table[lastRow] = row;
                    }

                    row.push(node);

                    lastRow++;

                    if (lastRow >= maxColumnsOrRow) {
                        lastRow = 0;
                    }
                };
            }

            var subComplexSettings = {};
            // copy original settings
            for (var key in settings) {
                if (settings.hasOwnProperty(key)) {
                    subComplexSettings[key] = settings[key];
                }
            }
            subComplexSettings.padding *= 0.7;
            subComplexSettings.restrictNumberOfColumns =
                    !subComplexSettings.restrictNumberOfColumns;

            if (subComplexSettings.padding < 4) {
                subComplexSettings.showBorder = false;
                subComplexSettings.padding = 0;
            }

            for (var i = 0; i < children.length; i++) {
                var node = children[i];

                if (node instanceof bui.Complex) {
                    node.tableLayout(subComplexSettings);
                }

                addToTable(node);
            }

            var totalWidth = Number.MIN_VALUE,
                    totalHeight = settings.padding;

            for (var rowId = 0; rowId < table.length; rowId++) {
                var row = table[rowId];

                var totalColumnWidth = settings.padding,
                        highestColumn = Number.MIN_VALUE;

                for (var columnId = 0; columnId < row.length; columnId++) {
                    // each column holds a node, i.e. a bui.Node instance
                    var columnNode = row[columnId];

                    var size = columnNode.size();
                    highestColumn = Math.max(size.height, highestColumn);

                    columnNode.position(totalColumnWidth, totalHeight);

                    // this probably needs to go to the end of the loop
                    totalColumnWidth += size.width + settings.padding;
                }

                totalHeight += highestColumn + settings.padding;
                totalWidth = Math.max(totalWidth, totalColumnWidth);
            }

            this.size(totalWidth, totalHeight);
        }
    };

    bui.util.setSuperClass(bui.Complex, bui.Node);
})(bui);

(function(bui) {
    var identifier = 'bui.Compartment';
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Compartment} Compartment
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Compartment) {
        return identifier + Compartment.id();
    };

    /**
     * @private size changed listener
     */
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier);
        privates.rect.setAttributeNS(null, 'width', width);
        privates.rect.setAttributeNS(null, 'height', height);
    };
    
    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint= function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);

        privates.rect = document.createElementNS(bui.svgns, 'rect');

        var cornerRadius = bui.settings.style.compartmentCornerRadius;
        privates.rect.setAttributeNS(null, 'rx', cornerRadius.x);
        privates.rect.setAttributeNS(null, 'ry', cornerRadius.y);

        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.rect);
    };

    /**
     * @class
     * Class for SBGN compartmentes.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Compartment = function() {
        bui.Compartment.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.compartment);

        var label = this.graph()
                .add(bui.Labelable)
                .parent(this)
                .visible(true)
                .adaptSizeToLabel(true);
        label.includeInJSON = false;
        this._privates(identifier).label = label;
    };

    bui.Compartment.prototype = {
        identifier : function() {
            return 'Compartment';
        },
        _minWidth : 90,
        _minHeight : 90,
        /**
         * Set or retrieve this node's label. The function call will be
         * delegated to {@link bui.Labelable#label}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Labelable#label
         */
        label : function() {
            var label = this._privates(identifier).label;
            return label.label.apply(label, arguments);
        },

        /**
         * Set or retrieve this node's label position. The function call will
         * be delegated to {@link bui.Node#position}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Node#position
         */
        labelPosition : function() {
            var label = this._privates(identifier).label;
            return label.position.apply(label, arguments);
        }
    };

    bui.util.setSuperClass(bui.Compartment, bui.Node);
})(bui);

(function(bui) {
    var identifier = 'bui.NucleicAcidFeature';
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.NucleicAcidFeature = function() {
        bui.NucleicAcidFeature.superClazz.apply(this, arguments);
        this.bottomRadius(bui.settings.style.nodeCornerRadius);
    };
    bui.NucleicAcidFeature.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.NucleicAcidFeature, bui.RectangularNode);
})(bui);

(function(bui) {
    var identifier = 'bui.StateVariable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StateVariable} StateVariable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(StateVariable) {
        return identifier + StateVariable.id();
    };

    /**
     * @private size changed listener
     */
    var sizeChanged = function(node, width, height) {
        var x = width / 2, y = height / 2;
        var privates = this._privates(identifier);

        privates.ellipse.setAttributeNS(null, 'cx', x);
        privates.ellipse.setAttributeNS(null, 'cy', y);

        privates.ellipse.setAttributeNS(null, 'rx', x);
        privates.ellipse.setAttributeNS(null, 'ry', y);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);
        privates.ellipse = document.createElementNS(bui.svgns, 'ellipse');
        var size = this.size();
        sizeChanged.call(this, this, size.width, size.height);
        this.nodeGroup().appendChild(privates.ellipse);
    };



    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.StateVariable = function() {
        bui.StateVariable.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.StateVariable.prototype = {
        auxiliaryUnit : true,
        includeInJSON : false,
        _enableResizing : false,

        // override
        toJSON : function() {
            // is actually an override but won't call the superclass because
            // units of information aren't considered as nodes in the JSON
            // data format. We are also assuming that only the state variable's
            // label can be edited and that therefore the JSON data needs to
            // be extracted from the label.

            var json = [null, ''];

            var labelParts = this.label().split('@');

            json[0] = getModificationSBOForLabel(labelParts[0]);

            if (labelParts.length > 1) {
                json[1] = labelParts[1];
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.StateVariable, bui.Labelable);
})(bui);
(function(bui) {
    var identifier = 'bui.SimpleChemical';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.SimpleChemical} SimpleChemical
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(SimpleChemical) {
        return identifier + SimpleChemical.id();
    };

    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        container.appendChild(privates.circle);
    };

    /**
     * @class
     * Class for SBGN simple chemicals. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.SimpleChemical = function() {
        bui.SimpleChemical.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.SimpleChemical.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.SimpleChemical, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'bui.UnspecifiedEntity';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnspecifiedEntity} UnspecifiedEntity
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnspecifiedEntity) {
        return identifier + UnspecifiedEntity.id();
    };

    /**
     * @private position / size listener
     */
    var sizeChanged = function(
            node, width, height) {
        var x = width / 2, y = height / 2;
        var privates = this._privates(identifier);
        privates.ellipse.setAttributeNS(null, 'cx', x);
        privates.ellipse.setAttributeNS(null, 'cy', y);

        privates.ellipse.setAttributeNS(null, 'rx', x);
        privates.ellipse.setAttributeNS(null, 'ry', y);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.ellipse = document.createElementNS(bui.svgns, 'ellipse');
        var size = this.size();
        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.ellipse);
    };

    /**
     * @class
     * A node with the shape of an ellipse and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.UnspecifiedEntity = function() {
        bui.UnspecifiedEntity.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.UnspecifiedEntity.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 70,
        _minHeight : 50,
    }
    bui.util.setSuperClass(bui.UnspecifiedEntity, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'bui.Process';
    /**
     * @class
     * Process node "process"
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Process = function() {
        bui.Process.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass(bui.settings.css.classes.process);
                
    };

    bui.Process.prototype = {
        identifier : function() {
            return identifier;
        },
        _enableResizing : false,
        _minWidth : bui.settings.style.processNodeMinSize.width,
        _minHeight : bui.settings.style.processNodeMinSize.height,
        _ignLabelSize : true
    };

    bui.util.setSuperClass(bui.Process, bui.RectangularNode);
})(bui);

(function(bui) {
    var identifier = 'bui.AttachedDrawable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AttachedDrawable} attachedDrawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(attachedDrawable) {
        return identifier + attachedDrawable.id();
    };

    /**
     * @private Source remove listener
     */
    var sourceRemoveListener = function() {
        this.source(null);
    };

    /**
     * @private Source remove listener
     */
    var targetRemoveListener = function() {
        this.target(null);
    };

    /**
     * @private Generic listener which will unbind previous listener
     * for the source node.
     */
    var sourceBindListener = function(attached, newX, oldX) {
        if (newX !== null) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    sourceRemoveListener.createDelegate(this),
                    listenerIdentifier(this));
        }

        if (oldX !== null) {
            oldX.unbindAll(listenerIdentifier(this));
        }
    };

    /**
     * @private Generic listener which will unbind previous listener
     * for the target node.
     */
    var targetBindListener = function(attached, newX, oldX) {
        if (newX !== null) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    targetRemoveListener.createDelegate(this),
                    listenerIdentifier(this));
        }

        if (oldX !== null) {
            oldX.unbindAll(listenerIdentifier(this));
        }
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        var privates = this._privates(identifier);

        if (privates.source !== null) {
            privates.source.unbindAll(listenerIdentifier(this));
        }

        if (privates.target !== null) {
            privates.target.unbindAll(listenerIdentifier(this));
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.Drawable
     * @constructor
     */
    bui.AttachedDrawable = function(){
        bui.AttachedDrawable.superClazz.apply(this, arguments);
        this._addType(bui.AttachedDrawable.ListenerType);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                removeListener.createDelegate(this),
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.source = null;
        privates.target = null;
    };

    bui.AttachedDrawable.prototype = {
        /**
         * Change the source of this attached drawable.
         *
         * @param {bui.Node} [source] The new source or omit if you would
         *   like to retrieve the current source.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current source is returned.
         */
        source : function(source) {
            var privates = this._privates(identifier);

            if (source !== undefined) {
                if (source !== privates.source) {
                    var oldSource = privates.source;
                    privates.source = source;
                    this.fire(bui.AttachedDrawable.ListenerType.source,
                            [this, privates.source, oldSource]);
                }

                return this;
            }

            return privates.source;
        },

        /**
         * Change the target of this attached drawable.
         *
         * @param {bui.Node} [target] The new target or omit if you would
         *   like to retrieve the current target.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current target is returned.
         */
        target : function(target) {
            var privates = this._privates(identifier);

            if (target !== undefined) {
                if (target !== privates.target) {
                    var oldTarget = privates.target;
                    privates.target = target;
                    this.fire(bui.AttachedDrawable.ListenerType.target,
                            [this, privates.target, oldTarget]);
                }

                return this;
            }

            return privates.target;
        },

        // overridden
        toJSON : function() {
            var json = bui.AttachedDrawable.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.source !== null) {
                updateJson(json, dataFormat.edge.source, privates.source.id());
            }
            if (privates.target !== null) {
                updateJson(json, dataFormat.edge.target, privates.target.id());
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.AttachedDrawable, bui.Drawable);

    /**
     * @namespace
     * Observable properties which all attached drawable nodes share
     */
    bui.AttachedDrawable.ListenerType = {
        /** @field */
        source : bui.util.createListenerTypeId(),
        /** @field */
        target : bui.util.createListenerTypeId()
    };
})(bui);
(function(bui) {
    var identifier = 'bui.AbstractLine';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AbstractLine} abstractLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(abstractLine) {
        return identifier + abstractLine.id();
    };

    /**
     * @private visibility listener
     */
    var visibilityChanged = function(drawable, visible) {
        if (visible === true) {
            this.removeClass(bui.settings.css.classes.invisible);
        } else {
            this.addClass(bui.settings.css.classes.invisible);
        }
    };

    /**
     * @private classes listener
     */
    var classesChanged = function(drawable, classString) {
        this._line.setAttributeNS(
                null, 'class', classString);
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        this._line.parentNode.removeChild(this._line);
    };

    /**
     * @private Source and target visibility listener
     */
    var endpointVisibilityChanged = function() {
        var source = this.source(), target = this.target();

        this.visible(source !== null && target !== null &&
                source.visible() === true && target.visible() === true);
    };

    /**
     * @private source changed listener
     */
    var sourceChanged = function(drawable, newSource, oldSource) {
        if (oldSource !== null) {
            oldSource.unbindAll(listenerIdentifier(this));
        }

        if (newSource !== null) {
            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            newSource.bind(bui.Node.ListenerType.absolutePosition, listener,
                    listenerIdentifier(this));
            newSource.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this));

            newSource.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
        }

        this._sourceOrTargetDimensionChanged();
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private target changed listener
     */
    var targetChanged = function(drawable, newTarget, oldTarget) {
        if (oldTarget !== null) {
            oldTarget.unbindAll(listenerIdentifier(this));
        }

        if (newTarget !== null) {
            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            newTarget.bind(bui.Node.ListenerType.absolutePosition, listener,
                    listenerIdentifier(this));
            newTarget.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this));

            newTarget.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
        }

        this._sourceOrTargetDimensionChanged();
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private mouse in listener
     */
    var lineMouseIn = function(event) {
        this.hoverEffectActive(true);
        this.fire(bui.AbstractLine.ListenerType.mouseEnter,
                                [this, event]);
    };

    /**
     * @private mouse out listener
     */
    var lineMouseOut = function(event) {
        this.hoverEffectActive(false);
        this.fire(bui.AbstractLine.ListenerType.mouseLeave,
                                [this, event]);
    };

    /**
     * @private hoverEffectActive listener
     */
    var hoverEffectActiveChanged = function(edge, active) {
        var marker;
        if (active === true && this.hoverEffect()) {
            this.addClass(bui.settings.css.classes.lineHover);

            marker = this._privates(identifier).marker;
            if (marker !== null) {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(
                                bui.util.getHoverId(marker)
                        ));
            }
        } else {
            this.removeClass(bui.settings.css.classes.lineHover);

            marker = this._privates(identifier).marker;
            if (marker !== null) {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(marker));
            }
        }
    };

    /**
     * @private line click listener
     */
    var lineClick = function(event) {
        this.fire(bui.AbstractLine.ListenerType.click,
                                [this, event]);
    };

    /**
     * @private line click listener
     */
    var lineMouseDown = function(event) {
        this.fire(bui.AbstractLine.ListenerType.mousedown,
                                [this, event]);
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AttachedDrawable
     * @constructor
     * 
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.AbstractLine = function(args){
        args.id = bui.settings.idPrefix.edge + args.id;
        bui.AbstractLine.superClazz.call(this, args);
        this._addType(bui.AbstractLine.ListenerType);

        var privates = this._privates(identifier);
        privates.hoverEffect = true;
        privates.marker = null;
        privates.markerId = null;
        privates.hoverEffectActive = false;
        privates.lineStyle = null;

        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                removeListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AbstractLine.ListenerType.marker,
                this._markerChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AbstractLine.ListenerType.hoverEffectActive,
                hoverEffectActiveChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaint();

        this._line.setAttributeNS(null, 'id', this.id());
        jQuery(this._line).mouseenter(lineMouseIn.createDelegate(this));
        jQuery(this._line).mouseleave(lineMouseOut.createDelegate(this));
        jQuery(this._line).click(lineClick.createDelegate(this));
        jQuery(this._line).mousedown(lineMouseDown.createDelegate(this));

        this.addClass(bui.settings.css.classes.line);
    };

    bui.AbstractLine.prototype = {
        /**
         * @private
         * This property should hold the line element
         */
        _line : null,

        /**
         * @private
         * Method to be overridden by sub classes.
         */
        _initialPaint : function() {
            throw 'Not implemented!';
        },

        /**
         * @private
         * Method to be overridden by sub classes.
         */
        _sourceOrTargetDimensionChanged : function() {
            throw 'Not implemented!';
        },

        /**
         * @private
         * Marker changed listener. "Protected" in order to allow subclasses
         * to override the behavior.
         */
        _markerChanged : function(line, marker) {
            if (marker === null) {
                this._line.setAttributeNS(null, 'marker-end', '');
                this._line.removeAttributeNS(null, 'marker-end');
            } else {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(marker));
            }
        },

        /**
         * Set the marker, i.e. a symbol at the end of the line.
         *
         * @param {Object} [markerId] Marker type identification.
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         * @return {bui.AbstractLine|String} The id of the current marker when
         *   you omit the parameter. In case you pass a parameter it will be
         *   set as a new marker and the current instance will be removed
         *   (fluent interface).
         */
        marker : function(markerId) {
            var privates = this._privates(identifier);

            if (markerId !== undefined) {
                if (markerId === null) {
                    privates.marker = null;
                    privates.markerId = null;
                    this.fire(bui.AbstractLine.ListenerType.marker,
                            [this, null]);
                } else {
                    var marker = this.graph().connectingArcs()[markerId];

                    if (marker !== undefined && marker.id !== privates.marker){
                        privates.marker = marker.id;
                        privates.markerId = markerId;
                        this.fire(bui.AbstractLine.ListenerType.marker,
                                [this, marker.id]);
                    }
                }

                return this;
            }

            return privates.marker;
        },

        /**
         * Set the line style. Available line style can be retrieved through
         * the {@link bui.AbstractLine.Style} object.
         *
         * @param {Object} style A property of {@link bui.AbstractLine.Style}.
         * @return {bui.AbstractLine} Fluent interface
         * @example
         * line.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            for (var availableStyle in bui.AbstractLine.Style) {
                if (bui.AbstractLine.Style.hasOwnProperty(availableStyle)) {
                    this.removeClass(bui.AbstractLine.Style[availableStyle]);
                }
            }

            this._privates(identifier).lineStyle = style;

            this.addClass(bui.AbstractLine.Style[style]);

            return this;
        },

        /**
         * Enable or disable the line's hover effect.
         *
         * @param {Boolean} [hoverEffect] True to enable hover effects, false
         *   otherwise. Omit to retrieve current setting.
         * @return {Boolean|bui.AbstractLine} Fluent interface in case you pass
         *   a new value, the current value if you omit the parameter.
         */
        hoverEffect : function(hoverEffect) {
            var privates = this._privates(identifier);
            
            if (hoverEffect !== undefined) {
                privates.hoverEffect = hoverEffect;
                return this;
            }

            return privates.hoverEffect;
        },

        /**
         * Show or hide the hover effect.
         *
         * @param {Boolean} [active] True to show the hover effect. Omit to
         *   retrieve whether it is shown or not.
         * @return {Boolean|bui.AbstractLine} If you pass a parameter the
         *   instance on which you called this function will be returned. In
         *   case you don't pass a parameter the current setting will be
         *   returned.
         */
        hoverEffectActive : function(active) {
            var privates = this._privates(identifier);

            if (active !== undefined) {
                // effect may only be shown when hover effects are activated.
                active = active && this.hoverEffect();
                
                if (active !== privates.hoverEffectActive) {
                    privates.hoverEffectActive = active;
                    this.fire(bui.AbstractLine.ListenerType.hoverEffectActive,
                                [this, active]);
                }

                return this;
            }

            return privates.hoverEffectActive;
        },

        // overridden
        toJSON : function() {
            var json = bui.AbstractLine.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.lineStyle !== null &&
                    privates.lineStyle !== bui.AbstractLine.Style.solid) {
                updateJson(json, dataFormat.edge.style, privates.lineStyle);
            }

            if (privates.markerId !== null) {
                var sbo = getSBOForMarkerId(privates.markerId);

                if (sbo !== null) {
                    updateJson(json, dataFormat.drawable.sbo, sbo);
                }
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.AbstractLine, bui.AttachedDrawable);

    /**
     * @namespace
     * Observable properties of the AbstractLine class
     */
    bui.AbstractLine.ListenerType = {
        /** @field */
        marker : bui.util.createListenerTypeId(),
        /** @field */
        click : bui.util.createListenerTypeId(),
        /** @field */
        mousedown : bui.util.createListenerTypeId(),
        /** @field */
        mouseEnter : bui.util.createListenerTypeId(),
        /** @field */
        mouseLeave : bui.util.createListenerTypeId(),
        /** @field */
        hoverEffectActive : bui.util.createListenerTypeId()
    };

    /**
     * @namespace
     * This Object defines the various line styles which can be applied to
     * a line.
     */
    bui.AbstractLine.Style = {
        solid : bui.settings.css.classes.lineStyle.solid,
        dotted : bui.settings.css.classes.lineStyle.dotted,
        dashed : bui.settings.css.classes.lineStyle.dashed
    };
})(bui);
(function(bui) {
    var identifier = 'bui.StraightLine';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StraightLine} straightLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(straightLine) {
        return identifier + straightLine.id();
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.StraightLine = function(args){
        bui.StraightLine.superClazz.apply(this, arguments);
    };

    bui.StraightLine.prototype = {
        includeInJSON : false,

        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            this._line = document.createElementNS(bui.svgns, 'line');
            this.graph().edgeGroup().appendChild(this._line);
            this.addClass(bui.settings.css.classes.invisible);
        },

        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
            var target = this.target(),
                    source = this.source();

            if (target !== null && source !== null) {
                var to = source.calculateLineEnd(target);
                this._line.setAttributeNS(null, 'x1', to.x);
                this._line.setAttributeNS(null, 'y1', to.y);

                to = target.calculateLineEnd(source);
                this._line.setAttributeNS(null, 'x2', to.x);
                this._line.setAttributeNS(null, 'y2', to.y);
            }
        }
    };

    bui.util.setSuperClass(bui.StraightLine, bui.AbstractLine);
})(bui);
(function(bui) {
    var identifier = 'bui.Spline';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Spline} spline
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(spline) {
        return identifier + spline.id();
    };

    /**
     * @private
     * Source changed event listener
     */
    var sourceChanged = function(node, source) {
        var privates = this._privates(identifier);
        privates.sourceHelperLine.target(source);
    };

    /**
     * @private
     * Target changed event listener
     */
    var targetChanged = function(node, target) {
        var privates = this._privates(identifier);
        privates.targetHelperLine.target(target);
    };

    /**
     * @private
     * Visibility changed event listener
     */
    var visibilityChanged = function(node, visible) {
        if (visible === false) {
            this.layoutElementsVisible(false);
        }
    };

    /**
     * @private mouse click listener
     */
    var lineMouseClick = function(event) {
        if (event.ctrlKey === true) {
            this.layoutElementsVisible(!this.layoutElementsVisible());
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.Spline = function(args){
        bui.Spline.superClazz.apply(this, arguments);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.Spline.prototype = {
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            privates.layoutElementsVisible = true;
            this._line = document.createElementNS(bui.svgns, 'path');
            this.graph().edgeGroup().appendChild(this._line);
            this.addClass(bui.settings.css.classes.invisible);

            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            privates.sourceSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(privates.layoutElementsVisible);
            privates.targetSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(privates.layoutElementsVisible);

            privates.sourceHelperLine = this.graph()
                    .add(bui.StraightLine)
                    .lineStyle(bui.AbstractLine.Style.dotted)
                    .hoverEffect(false)
                    .source(privates.sourceSplineHandle)
                    .visible(privates.layoutElementsVisible);

            privates.targetHelperLine = this.graph()
                    .add(bui.StraightLine)
                    .lineStyle(bui.AbstractLine.Style.dotted)
                    .hoverEffect(false)
                    .source(privates.targetSplineHandle)
                    .visible(privates.layoutElementsVisible);

            jQuery(this._line).click(lineMouseClick.createDelegate(this));
        },

        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
            var target = this.target(),
                    source = this.source();

            if (target !== null && source !== null) {

                var privates = this._privates(identifier);
                var sourceSplineHandle = privates.sourceSplineHandle,
                        targetSplineHandle = privates.targetSplineHandle;

                var sourcePosition = source
                        .calculateLineEnd(sourceSplineHandle),
                        targetPosition = target
                                .calculateLineEnd(targetSplineHandle),
                        sourceSplineHandlePosition = sourceSplineHandle
                                .absoluteCenter(),
                        targetSplineHandlePosition = targetSplineHandle
                                .absoluteCenter();
                
                var data = ['M',
                        sourcePosition.x,
                        sourcePosition.y,
                        'C',
                        sourceSplineHandlePosition.x,
                        sourceSplineHandlePosition.y,
                        targetSplineHandlePosition.x,
                        targetSplineHandlePosition.y,
                        targetPosition.x,
                        targetPosition.y].join(' ');


                this._line.setAttributeNS(null, 'd', data);
            }
        },

        /**
         * Show or hide the layout elements of this Spline. The layout
         * elements include two edgeSplineHandles and two lines. The handles
         * are used to modify the shape of the line while the two lines are
         * used as visual assistance.
         *
         * @param {Boolean} [visible] Pass true to show layout elements, false
         *   to hide them.
         * @return {bui.Spline|Boolean} Fluent interface in case you don't pass
         *   a parameter, the current visibility otherwise.
         */
        layoutElementsVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.layoutElementsVisible = visible;

                privates.sourceSplineHandle.visible(visible);
                privates.targetSplineHandle.visible(visible);
                privates.sourceHelperLine.visible(visible);
                privates.targetHelperLine.visible(visible);

                return this;
            }

            return privates.layoutElementsVisible;
        },

        /**
         * Set the spline handle positions and optionally animate them.
         * 
         * @param {Object[]} positions An array of positions, i.e. an array
         *   of objects where each object has an x and y property which
         *   resembles the spline handle coordinates.
         * @param {Number} [duration] Optional duration for an animation. The
         *   default value assumes no animation. Refer to {@link bui.Node#move}
         *   for additional information about this parameter.
         * @return {bui.Spline} Fluent interface
         */
        setSplineHandlePositions : function(positions, duration) {
            var privates = this._privates(identifier);

            if (positions.length >= 1) {
                privates.sourceSplineHandle.moveAbsolute(positions[0].x,
                        positions[0].y, duration);
            }
            if (positions.length >= 2) {
                privates.targetSplineHandle.moveAbsolute(positions[1].x,
                        positions[1].y, duration);
            }

            return this;
        },

        // overridden
        toJSON : function() {
            var json = bui.Spline.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            var sourcePosition =
                    privates.sourceSplineHandle.absoluteCenter(),
                    targetPosition =
                    privates.targetSplineHandle.absoluteCenter();

            updateJson(json, dataFormat.edge.handles, [sourcePosition,
                targetPosition]);
            updateJson(json, dataFormat.edge.type, 'curve');

            return json;
        }
    };

    bui.util.setSuperClass(bui.Spline, bui.AbstractLine);
})(bui);
(function(bui) {
    var identifier = 'bui.Edge';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Edge} edge
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(edge) {
        return identifier + edge.id();
    };

    /**
     * @private listener to the source's and target's visibility listener
     */
    var endpointVisibilityChanged = function() {
        var source = this.source(), target = this.target();

        this.visible(source !== null && source.visible() === true &&
                target !== null && target.visible() === true);
    };

    /**
     * @private source changed listener
     */
    var sourceChanged = function(edge, source, old) {
        var privates = this._privates(identifier);
        privates.lines[0].source(source);

        if (old !== null) {
            old.unbindAll(listenerIdentifier(this));
        }

        if (source !== null) {
            source.bind(bui.Drawable.ListenerType.visible,
                endpointVisibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        }
    };

    /**
     * @private target changed listener
     */
    var targetChanged = function(edge, target, old) {
        var privates = this._privates(identifier);
        privates.lines[privates.lines.length - 1].target(target);

        if (old !== null) {
            old.unbindAll(listenerIdentifier(this));
        }

        if (target !== null) {
            target.bind(bui.Drawable.ListenerType.visible,
                endpointVisibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        }
    };

    /**
     * @private Set the visibility of the edge handles
     */
    var setEdgeHandleVisibility = function() {
        var privates = this._privates(identifier);

        var edgeHandlesVisible = this.visible() === true &&
                privates.edgeHandlesVisible === true;
        var handles = privates.handles;
        for (var i = 0; i < handles.length; i++) {
            handles[i].visible(edgeHandlesVisible);
        }
    };

    /**
     * @private visibility changed listener
     */
    var visibilityChanged = function(edge, visible) {
        var privates = this._privates(identifier);

        var lines = privates.lines;
        for (var i = 0; i < lines.length; i++) {
            lines[i].visible(visible);
        }

        setEdgeHandleVisibility.call(this);
    };

    /**
     * Redraw the lines. This function is called after the addition of drag
     * handles.
     */
    var redrawLines = function() {
        var suspendHandle = this.graph().suspendRedraw(200);

        var privates = this._privates(identifier);

        // deleting old lines
        var lines = privates.lines;
        for(var i = 0; i < lines.length; i++) {
            lines[i].remove();
        }

        var handles = privates.handles,
                graph = this.graph(),
                clickListener = lineClicked.createDelegate(this),
                mouseDownListener = lineMouseDown.createDelegate(this),
                mouseEnterListener = lineMouseEnter.createDelegate(this),
                mouseLeaveListener = lineMouseLeave.createDelegate(this),
                listenerId = listenerIdentifier(this),
                sourceNode = this.source(),
                targetNode = null,
                lineStyle = privates.lineStyle;

        lines = [];

        var addLine = function() {
            var line = graph
                    .add(bui.StraightLine)
                    .source(sourceNode)
                    .target(targetNode)
                    .lineStyle(lineStyle)
                    .bind(bui.AbstractLine.ListenerType.mouseEnter,
                            mouseEnterListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mouseLeave,
                            mouseLeaveListener,
                            listenerId);

            if (bui.settings.enableModificationSupport === true) {
                line.bind(bui.AbstractLine.ListenerType.click,
                            clickListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mousedown,
                            mouseDownListener,
                            listenerId);

            }

            lines.push(line);
            sourceNode = targetNode;
        };

        for(i = 0; i < handles.length; i++) {
            targetNode = handles[i];
            addLine();
        }

        targetNode = this.target();
        addLine();

        privates.lines = lines;

        if (privates.marker !== null) {
            lines[lines.length - 1].marker(privates.marker);
        }

        this.graph().unsuspendRedraw(suspendHandle);
    };

    /**
     * Add a handle after the given node. The node may be any of the line's
     * edge handles. If the node can't be matched the edge handle will be added
     * to the beginning.
     *
     * @param {bui.Node} node An edge handle
     * @param {Number} x X-coordinate at which the edge handle should be added.
     * @param {Number} y Y-coordinate at which the edge handle should be added.
     */
    var addHandleAfter = function(node, x, y) {
        var privates = this._privates(identifier);

        var handle = this.graph()
                .add(bui.EdgeHandle)
                .positionCenter(x, y)
                .visible(privates.edgeHandlesVisible);

        var index = privates.handles.indexOf(node);

        if (index === -1) {
            index = 0;
        } else {
            // we want to add the handle after the node
            index++;
        }

        privates.handles.splice(index, 0, handle);

        redrawLines.call(this);

        return handle;
    };

    /**
     * @private line mouse down event listener
     */
    var lineMouseDown = function(line, event) {
        if (event.ctrlKey !== true) {
            var scale = 1 / this.graph().scale();
            var graphHtmlTopLeft = this.graph().htmlTopLeft();

            addHandleAfter.call(this, line.source(),
                    (event.pageX - graphHtmlTopLeft.x) * scale ,
                    (event.pageY - graphHtmlTopLeft.y) * scale)
                    .startDragging(event.clientX, event.clientY);
        }
    };

    /**
     * @private line clicked listener
     */
    var lineClicked = function(line, event) {
        // deactivated functionality based on Falko's request
//        if (event.ctrlKey === true) {
//            this.edgeHandlesVisible(!this.edgeHandlesVisible());
//        }
    };

    /**
     * @private line mouseEnter listener
     */
    var lineMouseEnter = function() {
        var privates = this._privates(identifier);

        var lines = privates.lines;
        for(var i = 0; i < lines.length; i++) {
            lines[i].hoverEffectActive(true);
        }
    };

    /**
     * @private line mouseLeave listener
     */
    var lineMouseLeave = function() {
        var privates = this._privates(identifier);

        var lines = privates.lines;
        for(var i = 0; i < lines.length; i++) {
            lines[i].hoverEffectActive(false);
        }
    };

    /**
     * @class
     * Edges between nodes are represented through this class. This class is
     * responsible for the generation of edge handles.
     *
     * @extends bui.AttachedDrawable
     * @constructor
     */
    bui.Edge = function() {
        bui.Edge.superClazz.apply(this, arguments);

        var privates = this._privates(identifier);
        privates.edgeHandlesVisible = true;
        privates.handles = [];
        privates.lines = [];
        privates.marker = null;
        privates.lineStyle = null;
        redrawLines.call(this);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.Edge.prototype = {
        edgeHandlesVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.edgeHandlesVisible = visible;

                setEdgeHandleVisibility.call(this);

                return this;
            }

            return privates.edgeHandlesVisible;
        },

        /**
         * Set the marker, i.e. a symbol at the end of the line.
         *
         * @param {Object} [markerId] Marker type identification.
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         * @return {bui.Edge|String} The id of the current marker when
         *   you omit the parameter. In case you pass a parameter it will be
         *   set as a new marker and the current instance will be removed
         *   (fluent interface).
         */
        marker : function(markerId) {
            var privates = this._privates(identifier);

            if (markerId !== undefined) {
                if (markerId === null) {
                    privates.marker = null;
                } else {
                    privates.marker = markerId;
                }

                redrawLines.call(this);

                return this;
            }

            return privates.marker;
        },

        /**
         * Set the line style. Available line style can be retrieved through
         * the {@link bui.AbstractLine.Style} object.
         *
         * @param {Object} style A property of {@link bui.AbstractLine.Style}.
         * @return {bui.AbstractLine} Fluent interface
         * @example
         * edge.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            var privates = this._privates(identifier);
            privates.lineStyle = style;
            redrawLines.call(this);
            return this;
        },

        // overridden
        toJSON : function() {
            var json = bui.Edge.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.lineStyle !== null &&
                    privates.lineStyle !== bui.AbstractLine.Style.solid) {
                updateJson(json, dataFormat.edge.style, privates.lineStyle);
            }

            if (privates.handles.length > 0) {
                var handles = [];

                for (var i = 0; i < privates.handles.length; i++) {
                    var position = privates.handles[i].absoluteCenter();
                    handles.push(position);
                }

                updateJson(json, dataFormat.edge.handles, handles);
            }

            if (privates.marker !== null) {
                var sbo = getSBOForMarkerId(privates.marker);

                if (sbo !== null) {
                    updateJson(json, dataFormat.drawable.sbo, sbo);
                }
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.Edge, bui.AttachedDrawable);
})(bui);
/*
 * All these functions and variables are defined in the util.js file as
 * the specific node types need access for the variables for the JSON
 * export.
 */

addMapping(nodeMapping, [285], bui.UnspecifiedEntity);
addMapping(nodeMapping, [247, 240], bui.SimpleChemical);
addMapping(nodeMapping, [245, 252], bui.Macromolecule);
addMapping(nodeMapping, [250, 251], bui.NucleicAcidFeature);
addMapping(nodeMapping, [253], bui.Complex);
addMapping(nodeMapping, [290], bui.Compartment);
addMapping(nodeMapping, [375, 167], bui.Process);


addMapping(processNodeMapping, [375, 167], bui.Process);


addMapping(edgeMarkerMapping, [19], bui.connectingArcs.modulation.id);
addMapping(edgeMarkerMapping, [20], bui.connectingArcs.inhibition.id);
addMapping(edgeMarkerMapping, [459, 15, 11, 10], bui.connectingArcs.stimulation.id);
addMapping(edgeMarkerMapping, [461],
        bui.connectingArcs.necessaryStimulation.id);
addMapping(edgeMarkerMapping, [13], bui.connectingArcs.catalysis.id);


addModificationMapping([215], 'acetylation', 'A');
addModificationMapping([111101], 'active', 'active');
addModificationMapping([217], 'glycosylation', 'G');
addModificationMapping([111100], 'glycosylphosphatidylinositolation', 'GPI');
addModificationMapping([233], 'hydroxylation', 'OH');
addModificationMapping([111102], 'inactive', 'inactive');
addModificationMapping([214], 'methylation', 'M');
addModificationMapping([219], 'myristoylation', 'MYR');
addModificationMapping([218], 'palmitoylation', 'PAL');
addModificationMapping([216], 'phosphorylation', 'P');
addModificationMapping([224], 'ubiquitination', 'U');
addModificationMapping([111100], 'unknownModification', '?');
addModificationMapping([111101], 'PTM_active1', 'active');
addModificationMapping([111101], 'PTM_active2', 'active');
addModificationMapping([111100], 'PTM_farnesylation', 'F');
addModificationMapping([111100], 'geranylgeranylation', 'GER');
addModificationMapping([111100], 'PTM_glycosaminoglycan', 'GA');
addModificationMapping([111100], 'PTM_oxidation', '0');
addModificationMapping([111100], 'PTM_sumoylation', 'S');

(function(bui) {

    /**
     * Default generator for node types. This will be used when
     * nodeJSON.generator is undefined.
     *
     * @param {bui.Graph} graph The graph to which the node shall be added
     * @param {Object} nodeType Node type retrieved from the node mapping.
     * @param {Object} nodeJSON Node information
     * @return {bui.Node} The generated node
     */
    var defaultNodeGenerator = function(graph, nodeType, nodeJSON) {
        var node = graph.add(nodeType.klass);

        if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'label'])) {
            if (node.label !== undefined) {
                node.label(nodeJSON.data.label);
            }
        }

        nodeJSON.data = nodeJSON.data || {};

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'x'], ['data', 'y'])) {
            nodeJSON.data.x = bui.util.toNumber(nodeJSON.data.x);
            nodeJSON.data.y = bui.util.toNumber(nodeJSON.data.y);

            node.position(nodeJSON.data.x, nodeJSON.data.y);
        }

        var standardNodeSize = bui.settings.style.importer.standardNodeSize;
        var size = {
            width : standardNodeSize.width,
            height : standardNodeSize.height
        };

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'width'], ['data', 'height'])) {
            size.width = nodeJSON.data.width;
            size.height = nodeJSON.data.height;
        } else if (node.sizeBasedOnLabel !== undefined && (!(node._ignLabelSize))) {
            size = node.sizeBasedOnLabel();

            // some padding because of various shapes
            var padding = bui.settings.style.importer.sizeBasedOnLabelPassing;
            size.width += padding.horizontal;
            size.height += padding.vertical;
        }

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'cssClasses'])) {
            node.addClass(nodeJSON.data.cssClasses);
        }

        node.size(size.width, size.height)
                .visible(true);

        nodeJSON.data.width = size.width;
        nodeJSON.data.height = size.height;

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'modification'])) {
            var modifications = nodeJSON.data.modification;

            for (var i = 0; i < modifications.length; i++) {
                var modification = modifications[i];

                var label, mapping = retrieveFrom(modificationMapping,
                        modification[0]);

                label = mapping.short;

                if (bui.settings.style.importer.modificationLabel === 'long') {
                    label += '@' + modification[1];
                }

                graph.add(bui.StateVariable)
                        .label(label)
                        .parent(node)
                        .visible(true)
                        .json(modification);
            }
        }

        return node;
    };

    /**
     * Import nodes.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @return {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var addAllNodes = function(graph, data) {
        var nodes = data.nodes,
                generatedNodes = {},
                node,
                nodeJSON;

        var addNode = function(nodeJSON, id) {
            var nodeType = retrieveFrom(nodeMapping, nodeJSON.sbo);
            var node;

            if (nodeType === undefined) {
                return undefined;
            }

            if (bui.util.propertySetAndNotNull(nodeType, 'generator')) {
                node = nodeType.generator(graph, nodeJSON);
            } else {
                node = defaultNodeGenerator(graph, nodeType, nodeJSON);
            }

            if (node !== undefined) {
                node.json(nodeJSON);
                generatedNodes[id] = node;
            }

            return node;
        };

        // add all nodes
        for (var i = 0; i < nodes.length; i++) {
            try {
                nodeJSON = nodes[i];

                addNode(nodeJSON, nodeJSON.id);
            } catch (e) {
                log(e);
            }
        }

        // add relationship information
        for (var key in generatedNodes) {
            if (generatedNodes.hasOwnProperty(key)) {
                node = generatedNodes[key];
                nodeJSON = node.json();

                if (nodeJSON.data !== undefined &&
                        nodeJSON.data.subnodes !== undefined) {
                    for (var j = 0; j < nodeJSON.data.subnodes.length; j++) {
                        var subNodeId = nodeJSON.data.subnodes[j];
                        var subNode = generatedNodes[subNodeId];

                        if (subNode !== undefined) {
                            subNode.parent(node);
                        } else {
                            log('Warning: Broken sub node reference to sub' +
                                    ' node id: ' + subNodeId);
                        }
                    }
                }
            }
        }

        return generatedNodes;
    };

    /**
     * Layout the complex nodes using a table layout.
     *
     * @param {Object} nodes A map which keys map onto {@link bui.Node}
     *   instances.
     */
    var doComplexLayout = function(nodes) {
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                var node = nodes[key];

                if (node instanceof bui.Complex &&
                        node.parent() instanceof bui.Complex === false) {
                    node.tableLayout();

                    var size = node.size();
                    var json = node.json();
                    json.data.width = size.width;
                    json.data.height = size.height;
                }
            }
        }
    };

    /**
     * Position the auxiliary units for each node.
     *
     * @param {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var positionAuxiliaryUnits = function(nodes) {
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                nodes[key].positionAuxiliaryUnits();
            }
        }
    };

    /**
     * Add edges to the graph. Information about the edges will be extracted
     * from the data parameter.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @return {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var addAllEdges = function(graph, data, generatedNodes) {
        var edges = data.edges;

        for (var i = 0; i < edges.length; i++) {
            var edgeJSON = edges[i], edge;

            var source = generatedNodes[edgeJSON.source];
            var target = generatedNodes[edgeJSON.target];

            if (source === undefined) {
                log('Edge source ' + edgeJSON.source + ' could not be found.');
                continue;
            } else if (target === undefined) {
                log('Edge target ' + edgeJSON.target + ' could not be found.');
                continue;
            }

            // ensuring that the data property exists
            edgeJSON.data = edgeJSON.data || {};

            if (edgeJSON.data.type !== 'curve') {
                edge = graph.add(bui.Edge);
            } else {
                edge = graph.add(bui.Spline)
                        .layoutElementsVisible(false);

                if (edgeJSON.data.handles !== undefined) {
                    edge.setSplineHandlePositions(edgeJSON.data.handles);
                }
            }

            edge.json(edgeJSON).source(source).target(target);

            if (edgeJSON.sbo !== undefined) {
                try {
                    var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                    edge.marker(marker.klass);
                } catch (e) {
                    log(e);
                }
            }

            var style = bui.AbstractLine.Style[edgeJSON.data.style];
            if (style !== undefined) {
                edge.lineStyle(style);
            }

            edge.visible(true);
        }
    };

    /**
     * Align nodes according to their parent-child relationships. Childs
     * should end up on top of their parents.
     *
     * @param {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var alignAccordingToNodeHierachy = function(nodes) {
        var id;
        var node;
        var alignRecursively = function(node) {
            var children = node.childrenWithoutAuxiliaryUnits();
            var i;
            if (!(node instanceof(bui.Compartment))) {
               node.toFront();
            }

            for (i = 0; i < children.length; i++) {
                var child = children[i];
                alignRecursively(child);
            }

            var auxUnits = node.auxiliaryUnits();
            for(i = 0; i < auxUnits.length; i++) {
               auxUnits[i].toFront();
            }
        };

        for (id in nodes) { //align compartments and its members
            if (nodes.hasOwnProperty(id)) {
                node = nodes[id];

                if (node.hasParent() === false &&
                   (node instanceof(bui.Compartment))){
                   alignRecursively(node);
                }

            }
        }
        for (id in nodes) { // bring non-compartment members to front
           if (nodes.hasOwnProperty(id)) {
              node = nodes[id];
              if (node.hasParent() === false &&
                 (!(node instanceof(bui.Compartment)))){
                    alignRecursively(node);
              }
           }
        }


    };

    /**
     * Import nodes and edges from JSON using this function.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     */
    bui.importFromJSON = function(graph, data) {
        var start = new Date().getTime();
        var suspendHandle = graph.suspendRedraw(20000);

        log('## Importing all nodes');
        var generatedNodes = addAllNodes(graph, data);

        log('## Layout complexes');
        doComplexLayout(generatedNodes);

        log('## Layout auxiliary units');
        positionAuxiliaryUnits(generatedNodes);

        log('## Aligning nodes according to parent-child relationships');
        alignAccordingToNodeHierachy(generatedNodes);

        log('## Adding all edges');
        addAllEdges(graph, data, generatedNodes);

        log('## Reducing canvas size');
        graph.reduceCanvasSize();

        graph.unsuspendRedraw(suspendHandle);
        var elapsed = new Date().getTime() - start;
        log('## Complete import took ' + elapsed + 'ms.');
    };

    /**
     * Update node positions by reimporting data from JSON.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @param {Number} [duration] An optional duration in milliseconds.
     *   {@link bui.Node#move}
     */
    bui.importUpdatedNodePositionsFromJSON = function(graph, data, duration) {
        var drawables = graph.drawables();

        // optimize the data structure to map json IDs to drawable references
        // to achieve a computational complexity of O(2n).
        var optimizedDrawables = {};
        for (var key in drawables) {
            if (drawables.hasOwnProperty(key)) {
                var drawable = drawables[key];
                var json = drawable.json();

                if (json !== undefined && json !== null) {
                    optimizedDrawables[json.id] = drawable;
                }
            }
        }

        var nodesJSON = data.nodes, i;
        for (i = 0; i < nodesJSON.length; i++) {
            var nodeJSON = nodesJSON[i],
                    node = optimizedDrawables[nodeJSON.id];

            if (node === undefined) {
                log('Warning: Can\'t update nodes position for json node id ' +
                        nodeJSON.id + ' because the node can\'t be found.');
                continue;
            } else if (bui.util.propertySetAndNotNull(nodeJSON,
                    ['data', 'x'], ['data', 'y']) === false) {
                continue;
            } else if (node.hasParent() === true) {
               if (!(node.parent() instanceof bui.Compartment)){
                  continue;
               }
               
            }

            var x = nodeJSON.data.x,
                    y = nodeJSON.data.y,
                    currentPosition = node.position();

            node.move(x - currentPosition.x, y - currentPosition.y, duration);
        }

        var edgesJSON = data.edges;
        for (i = 0; i < edgesJSON.length; i++) {
            var edgeJSON = edgesJSON[i],
                    edge = optimizedDrawables[edgeJSON.id];

            if (edge === undefined) {
                log('Warning: Can\'t update edge for json edge id ' +
                        edgeJSON.id + ' because the edge can\'t be found.');
                continue;
            } else if (!bui.util.propertySetAndNotNull(edgeJSON,
                    ['data', 'type'], ['data', 'handles'])) {
                continue;
            } else if (edgeJSON.data.type !== 'curve') {
                continue;
            }

            edge.setSplineHandlePositions(edgeJSON.data.handles, duration);
        }
    };
})(bui);

window.bui = bui;
})(window);