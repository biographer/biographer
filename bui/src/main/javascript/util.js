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
})(bui);