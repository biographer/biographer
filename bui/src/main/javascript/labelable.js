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
     */
    bui.Labelable = function() {
        bui.Node.apply(this, arguments);
        this.addType(bui.Labelable.ListenerType);

        this.bind(bui.Labelable.ListenerType.label,
                this._labelableLabelChanged.createDelegate(this),
                listenerIdentifier(this));

        this.bind(bui.Node.ListenerType.size,
                this._labelableLabelChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.Labelable.prototype = Object.create(bui.Node.prototype, {
        _label : bui.util.createPrototypeValue(''),
        _labelElement : bui.util.createPrototypeValue(null),

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
            if (this._labelElement !== null) {
                this._labelElement.parentNode.removeChild(this._labelElement);
                this._labelElement = null;
            }

            if (label.length === 0) {
                return;
            }

            this._labelElement = document.createElementNS(bui.svgns, 'text');

            var lines = bui.util.calculateLabelPositioning(this.width(),
                 label,
                 [bui.settings.css.classes.textDimensionCalculation.standard]);

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

            this._labelElement.setAttributeNS(null, 'y', this.height() / 2);

            this.nodeGroup().appendChild(this._labelElement);
        })
    });

    /**
     * @namespace
     * Observable properties which all labelable nodes share
     */
    bui.Labelable.ListenerType = {
        /** @field */
        label : 'bui.Labelable.label'
    };
})(bui);