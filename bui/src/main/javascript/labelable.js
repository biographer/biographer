(function(bui) {
    /**
     * @class
     * A node which can contain a label.
     *
     * @extends bui.Node
     * @constructor
     *
     * @param {String} [label] Text which should be shown.
     */
    bui.Labelable = function(id, graph, x, y, width, height, label) {
        bui.Node.apply(this, arguments);
        this.addType(bui.Labelable.ListenerType);
        
        if (label !== undefined) {
            this._label = label;
        } else {
            this._label = '';
        }

    };

    bui.Labelable.prototype = Object.create(bui.Node.prototype, {
        _label : bui.util.createPrototypeValue(''),

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
                if (label != this._label) {
                    this._label = label;
                    this.fire(bui.Labelable.ListenerType.label, [this, label]);
                }
                return this;
            }

            return this._label;
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