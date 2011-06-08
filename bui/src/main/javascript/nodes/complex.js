(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Complex} Complex
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Complex) {
        return 'bui.Complex' + Complex.id();
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
                this._complexSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._complexClassesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._complexSelectedChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintComplex();

        this.addClass(bui.settings.css.classes.complex);
    };

    bui.Complex.prototype = Object.create(bui.Node.prototype, {
        _path : bui.util.createPrototypeValue(null),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintComplex : bui.util.createPrototypeValue(
                function() {
            var container = this.nodeGroup();
            this._path = document.createElementNS(bui.svgns, 'path');
            this._complexSizeChanged(this, this.width(), this.height());
            container.appendChild(this._path);
        }),

        _complexSizeChanged : bui.util.createPrototypeValue(
                function(node, width, height) {
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
            this._path.setAttributeNS(null, 'd', pathData);
        }),

        /**
         * @private classes listener
         */
        _complexClassesChanged : bui.util.createPrototypeValue(
                function(node, classString) {
            this._path.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private select listener
         */
        _complexSelectedChanged : bui.util.createPrototypeValue(
                function(node, selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        })
    });
})(bui);