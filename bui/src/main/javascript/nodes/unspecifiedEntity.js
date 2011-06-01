(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnspecifiedEntity} UnspecifiedEntity
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnspecifiedEntity) {
        return 'bui.UnspecifiedEntity' + UnspecifiedEntity.id();
    };

    bui.UnspecifiedEntity = function() {
        bui.SBGNNode.apply(this, arguments);
        this.addType(bui.UnspecifiedEntity.ListenerType);

        this.bind(bui.Node.ListenerType.position,
                this._positionOrSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.size,
                this._positionOrSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._selectedChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintUnspecifiedEntity();
    };

    bui.UnspecifiedEntity.prototype = Object.create(bui.SBGNNode.prototype, {
        _ellipse : bui.util.createPrototypeValue(null),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintUnspecifiedEntity : bui.util.createPrototypeValue(
                function() {
            var container = this.nodeGroup();
            this._ellipse = document.createElementNS(bui.svgns, 'ellipse');
            this._ellipse.setAttributeNS(null, 'id', this.id());
            this._positionOrSizeChanged();
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
         * @private classes listener
         */
        _classesChanged : bui.util.createPrototypeValue(function(node,
                                                                 classString) {
            this._ellipse.setAttributeNS(null, 'class', classString);
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
        })
    });

    bui.UnspecifiedEntity.ListenerType = {
    };
})(bui);