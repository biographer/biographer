(function(bui) {
    bui.UnspecifiedEntity = function() {
        bui.SBGNNode.apply(this, arguments);
        this.addType(bui.UnspecifiedEntity.ListenerType);

        this.bind(bui.Node.ListenerType.position,
                this._positionOrSizeChanged.createDelegate(this),
                this);
        this.bind(bui.Node.ListenerType.size,
                this._positionOrSizeChanged.createDelegate(this),
                this);
        this.bind(bui.Drawable.ListenerType.visible,
                this._visibilityChanged.createDelegate(this),
                this);
        this.bind(bui.Drawable.ListenerType.classes,
                this._classesChanged.createDelegate(this),
                this);
        this.bind(bui.Drawable.ListenerType.remove,
                this._removedListener.createDelegate(this),
                this);
        this.bind(bui.Drawable.ListenerType.select,
                this._selectedChanged.createDelegate(this),
                this);
        this.bind(bui.Labelable.ListenerType.label,
                this._labelChanged.createDelegate(this),
                this);

        this._initialPaintUnspecifiedEntity();
    };

    bui.UnspecifiedEntity.prototype = Object.create(bui.SBGNNode.prototype, {
        _ellipse : bui.util.createPrototypeValue(null),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintUnspecifiedEntity : bui.util.createPrototypeValue(
                function() {
            var container = this.graph().nodeGroup();
            this._ellipse = document.createElementNS(bui.svgns, 'ellipse');
            this._ellipse.setAttributeNS(null, 'id', this.id());
            this._positionOrSizeChanged();
            this._visibilityChanged(this, this.visible());
            container.appendChild(this._ellipse);
        }),

        /**
         * @private position / size listener
         */
        _positionOrSizeChanged : bui.util.createPrototypeValue(function() {
            var center = this.center();
            this._ellipse.setAttributeNS(null, 'cx', center.x);
            this._ellipse.setAttributeNS(null, 'cy', center.y);
            
            this._ellipse.setAttributeNS(null, 'rx', this.width() / 2);
            this._ellipse.setAttributeNS(null, 'ry', this.height() / 2);
        }),

        /**
         * @private visibility listener
         */
        _visibilityChanged : bui.util.createPrototypeValue(function(node,
                                                            visible) {
            if (visible) {
                this.removeClass(bui.settings.css.classes.invisible);
            } else {
                this.addClass(bui.settings.css.classes.invisible);
            }
        }),

        /**
         * @private classes listener
         */
        _classesChanged : bui.util.createPrototypeValue(function(node,
                                                                 classString) {
            this._ellipse.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private remove listener
         */
        _removedListener : bui.util.createPrototypeValue(function() {
            this._ellipse.parentNode.removeChild(this._ellipse);
        }),

        /**
         * @private select listener
         */
        _selectedChanged : bui.util.createPrototypeValue(function(node,
                                                                  selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        }),

        /**
         * @private label listener
         */
        _labelChanged : bui.util.createPrototypeValue(function(node, label) {
            // TODO implement
        })
    });

    bui.UnspecifiedEntity.ListenerType = {
    };
})(bui);