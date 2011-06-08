(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StateVariable} StateVariable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(StateVariable) {
        return 'bui.StateVariable' + StateVariable.id();
    };

    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.StateVariable = function() {
        bui.Labelable.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                this._stateVariableSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._stateVariableClassesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._stateVariableSelectedChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintStateVariable();

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.StateVariable.prototype = Object.create(bui.Labelable.prototype, {
        _ellipse : bui.util.createPrototypeValue(null),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintStateVariable : bui.util.createPrototypeValue(function() {
            this._ellipse = document.createElementNS(bui.svgns, 'ellipse');
            this._stateVariableSizeChanged(this, this.width(), this.height());
            this.nodeGroup().appendChild(this._ellipse);
        }),

        /**
         * @private size changed listener
         */
        _stateVariableSizeChanged : bui.util.createPrototypeValue(
                function(node, width, height) {
            var x = width / 2, y = height / 2;

            this._ellipse.setAttributeNS(null, 'cx', x);
            this._ellipse.setAttributeNS(null, 'cy', y);

            this._ellipse.setAttributeNS(null, 'rx', x);
            this._ellipse.setAttributeNS(null, 'ry', y);
        }),

        /**
         * @private classes listener
         */
        _stateVariableClassesChanged : bui.util.createPrototypeValue(
                function(node, classString) {
            this._ellipse.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private select listener
         */
        _stateVariableSelectedChanged : bui.util.createPrototypeValue(
                function(node, selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        })
    });
})(bui);