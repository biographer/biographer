(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Compartment} Compartment
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Compartment) {
        return 'bui.Compartment' + Compartment.id();
    };

    /**
     * @class
     * Class for SBGN compartmentes.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Compartment = function() {
        bui.Node.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                this._compartmentSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._compartmentClassesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._compartmentSelectedChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintCompartment();

        this.addClass(bui.settings.css.classes.compartment);

        this._label = this.graph()
                .add(bui.Labelable, [0,0,0,0,this])
                .visible(true)
                .adaptSizeToLabel(true);
    };

    bui.Compartment.prototype = Object.create(bui.Node.prototype, {
        _rect : bui.util.createPrototypeValue(null),
        _label : bui.util.createPrototypeValue(null),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintCompartment : bui.util.createPrototypeValue(
                function() {
            var container = this.nodeGroup();
            this._rect = document.createElementNS(bui.svgns, 'rect');

            var cornerRadius = bui.settings.style.compartmentCornerRadius;
            this._rect.setAttributeNS(null, 'rx', cornerRadius.x);
            this._rect.setAttributeNS(null, 'ry', cornerRadius.y);

            this._compartmentSizeChanged(this, this.width(), this.height());
            container.appendChild(this._rect);
        }),

        _compartmentSizeChanged : bui.util.createPrototypeValue(
                function(node, width, height) {

            this._rect.setAttributeNS(null, 'width', width);
            this._rect.setAttributeNS(null, 'height', height);

        }),

        /**
         * @private classes listener
         */
        _compartmentClassesChanged : bui.util.createPrototypeValue(
                function(node, classString) {
            this._rect.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private select listener
         */
        _compartmentSelectedChanged : bui.util.createPrototypeValue(
                function(node, selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        }),

        /**
         * Set or retrieve this node's label. The function call will be
         * delegated to {@link bui.Labelable#label}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Labelable#label
         */
        label : bui.util.createPrototypeValue(function() {
            return this._label.label.apply(this._label, arguments);
        })
    });
})(bui);