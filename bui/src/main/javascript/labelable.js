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

        this.bind(bui.Labelable.ListenerType.label,
                this._labelableLabelChanged.createDelegate(this),
                listenerIdentifier(this));

        this.bind(bui.Labelable.ListenerType.adaptSizeToLabel,
                this._labelableLabelChanged.createDelegate(this),
                listenerIdentifier(this));

        this.bind(bui.Node.ListenerType.size,
                this._labelableLabelChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.Labelable.prototype = Object.create(bui.Node.prototype, {
        _label : bui.util.createPrototypeValue(''),
        _labelElement : bui.util.createPrototypeValue(null),
        _adaptSizeToLabel : bui.util.createPrototypeValue(false),

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
                console.log(this._labelElement)
                this._labelElement.parentNode.removeChild(this._labelElement);
            }

            if (label.length === 0) {
                return;
            }

            this._labelElement = document.createElementNS(bui.svgns, 'text');

            var lines = bui.util.calculateLabelPositioning(this.width(),
                 label,
                 [bui.settings.css.classes.textDimensionCalculation.standard]);

            if (this._adaptSizeToLabel === true) {
                this._doPaintTextWithAdaptToSize(lines);
            } else {
                this._doPaintTextWithoutAdaptToSize(lines);
            }


            this._labelElement.setAttributeNS(null, 'y', this.height() / 2);

            this.nodeGroup().appendChild(this._labelElement);
        }),

        /**
         * @private label painting on multiple lines etc.
         */
        _doPaintTextWithoutAdaptToSize : bui.util.createPrototypeValue(
                function(lines) {
            var previousHight = 0;
            for(var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var aggregatedText = [];
                for(var j = 0; j < line.words.length; j++) {
                    aggregatedText.push(line.words[j].word);
                }

                var tspan = document.createElementNS(bui.svgns, 'tspan');
                tspan.appendChild(document.createTextNode(
                        aggregatedText.join(' ')));
                tspan.setAttributeNS(null, 'x', line.horizontalIndention);
                tspan.setAttributeNS(null, 'dy', previousHight);
                this._labelElement.appendChild(tspan);

                previousHight = line.maxHeight;
            }
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

            this.size(totalWidth, maxHeight);
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
        adaptSizeToLabel : 'bui.Labelable.adaptSizeToLabel'
    };
})(bui);