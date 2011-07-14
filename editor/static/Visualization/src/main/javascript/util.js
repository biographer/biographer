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
})(bui);


/**
 * Ensure that a value is a number. If it is not an exception will be thrown.
 * @param {Number|String} val The value which should be converted to a number.
 *   If you pass a string it will be converted to a number if possible.
 * @return {Number} The converted number.
 */
var toNumber = function(val) {
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
var toBoolean = function(val) {
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