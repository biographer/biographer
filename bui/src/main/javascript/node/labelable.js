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
			tspan.style.setProperty('fill', privates.color.label);
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
		privates.labelElement.style.setProperty('fill', privates.color.label);
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
		privates.color = {
			background: '',
			label: ''
		};
        privates.svgClasses = this._svgClasses;
        privates.calculationClasses = this._calculationClasses;

        var listener = labelableLabelChanged.createDelegate(this);
        this.bind(bui.Labelable.ListenerType.label,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
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
        identifier : function() {
            return identifier;
        },
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
         * Set or retrieve the current color
         *
         * @param {Object} [options] object with propertied background and/or label
         * which are the new colors to be set. Omit to retrieve current colors.
         * @return {bui.Labelable|Object} Current colors are returned when you
         *   don't pass any parameter, fluent interface otherwise.
         */
		color : function(options) {
            var privates = this._privates(identifier),
			changed = false;
			
			if (!options || !(options.background || options.label)) {
				// Return object giving background and text color
				return privates.color;
			}
			if (options.background !== null || options.background !== null) {
				changed = changed || options.background !== privates.color.background;
				privates.color.background = options.background;
			}
			if (options.label !== null || options.label !== null) {
				changed = changed || options.label !== privates.color.label;
				privates.color.label = options.label;
			}
			if(changed) {
				//Fire the colorchanged
				this.fire(bui.Labelable.ListenerType.color, [this]);
			}
			
			return this;
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
        labelClass : bui.util.createListenerTypeId(),
        /** @field */
		color : bui.util.createListenerTypeId()
    };
})(bui);
