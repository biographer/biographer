(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Labelable} labelable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(labelable) {
        return 'bui.Labelable' + labelable.id();
    };

    /**
     * @class
     * A node which can contain a label.
     *
     * @extends bui.Node
     * @constructor
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     * @param {Number} [x] Position on the x-axis. Default is 0.
     * @param {Number} [y] Position on the y-axis. Default is 0.
     * @param {Number} [width] Width of the node. Default is 0.
     * @param {Number} [height] Height of the node. Default is 0.
     */
    bui.Labelable = function(id, graph, x, y, width, height){
        bui.Node.apply(this, arguments);
        this.addType(bui.Labelable.ListenerType);

        var listener = this._labelableLabelChanged.createDelegate(this);
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

    bui.Labelable.prototype = Object.create(bui.Node.prototype, {
        _label : bui.util.createPrototypeValue(''),
        _labelElement : bui.util.createPrototypeValue(null),
        _adaptSizeToLabel : bui.util.createPrototypeValue(false),
        _svgClasses : bui.util.createPrototypeValue(''),
        _calculationClasses : bui.util.createPrototypeValue(
                [bui.settings.css.classes.textDimensionCalculation.standard]),

        /**
         * Set or retrieve the current label
         *
         * @param {String} [label] Pass a new label to set it or omit the
         *   parameter to retrieve the current label
         * @return {bui.Labelable|String} Current label is returned when you
         *   don't pass any parameter, fluent interface otherwise.
         */
        label : bui.util.createPrototypeValue(function(label) {
            if (label !== undefined) {
                label = label === null ? '' : label;
                if (label != this._label) {
                    this._label = label;
                    this.fire(bui.Labelable.ListenerType.label, [this, label]);
                }
                return this;
            }

            return this._label;
        }),

        /**
         * @private label change listener
         */
        _labelableLabelChanged : bui.util.createPrototypeValue(function() {
            var label = this.label();
            if (this._labelElement !== null &&
                    this._labelElement.parentNode !== null) {
                this._labelElement.parentNode.removeChild(this._labelElement);
            }

            if (label.length === 0) {
                return;
            }

            this._labelElement = document.createElementNS(bui.svgns, 'text');
            var lines = bui.util.calculateLabelPositioning(this.width(),
                 label, this._calculationClasses);

            if (this._adaptSizeToLabel === true) {
                this._doPaintTextWithAdaptToSize(lines);
            } else {
                this._doPaintTextWithoutAdaptToSize(lines);
            }

            this._labelElement.setAttributeNS(null, 'class', this._svgClasses);

            this.nodeGroup().appendChild(this._labelElement);
        }),

        /**
         * @private label painting on multiple lines etc.
         */
        _doPaintTextWithoutAdaptToSize : bui.util.createPrototypeValue(
                function(lines) {
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
                this._labelElement.appendChild(tspan);

                previousHeight = line.maxHeight;
            }

            this._labelElement.setAttributeNS(null, 'y',
                    this.height() / 2 + firstHeight - totalHeight / 2);
        }),

        /**
         * @private label painting on multiple lines etc.
         */
        _doPaintTextWithAdaptToSize : bui.util.createPrototypeValue(
                function(lines) {
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

            this._labelElement.appendChild(document.createTextNode(
                        aggregatedText.join(' ')));

            var padding = bui.settings.style.adaptToLabelNodePadding;
            totalWidth += padding.left + padding.right;
            var nodeHeight = maxHeight + padding.top + padding.bottom;
            this.size(totalWidth, nodeHeight);
            this._labelElement.setAttributeNS(null, 'x', padding.left);
            this._labelElement.setAttributeNS(null, 'y', maxHeight);
        }),

        /**
         * Set or retrieve whether the node adapts to the label size
         *
         * @param {Boolean} [adaptSizeToLabel] True to adapt to label size,
         *   false otherwise. Omit to retrieve current value.
         * @return {bui.Labelable|Boolean} Fluent interface or the current
         *   value in case no parameter is passed.
         */
        adaptSizeToLabel : bui.util.createPrototypeValue(function(
                adaptSizeToLabel) {
            if (adaptSizeToLabel !== undefined) {
                if (adaptSizeToLabel !== this._adaptSizeToLabel) {
                    this._adaptSizeToLabel = adaptSizeToLabel;
                    this.fire(bui.Labelable.ListenerType.adaptSizeToLabel,
                            [this, adaptSizeToLabel]);
                }

                return this;
            }

            return this._adaptSizeToLabel;
        }),

        /**
         * Modify the text size etc.
         *
         * @param {String} svgClasses classes to be added to the SVG
         *   text element.
         * @param {String[]} calcClasses classes used for the calculation of
         *   the text dimensions.
         * @return {bui.Labelable} Fluent interface
         */
        labelClass : bui.util.createPrototypeValue(function(svgClasses,
                                                            calcClasses) {
            this._svgClasses = svgClasses;
            this._calculationClasses = calcClasses;

            this.fire(bui.Labelable.ListenerType.labelClass, [this]);

            return this;
        })
    });

    /**
     * @namespace
     * Observable properties which all labelable nodes share
     */
    bui.Labelable.ListenerType = {
        /** @field */
        label : 'bui.Labelable.label',
        /** @field */
        adaptSizeToLabel : 'bui.Labelable.adaptSizeToLabel',
        /** @field */
        labelClass : 'bui.Labelable.labelClass'
    };
})(bui);