(function(bui) {
      /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StraightLine} straightLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(straightLine) {
        return 'bui.StraightLine' + straightLine.id();
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AttachedDrawable
     * @constructor
     * 
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     * @param {SVGGElement} [customContainer] Can be used to group elements.
     *   When omitted, the line will be added to the SVG's edge group.
     */
    bui.StraightLine = function(id, graph, customContainer){
        id = bui.settings.idPrefix.edge + id;
        bui.AttachedDrawable.call(this, id, graph);
        this.addType(bui.StraightLine.ListenerType);

        if (customContainer !== undefined) {
            this._container = customContainer;
        } else {
            this._container = this.graph().edgeGroup();
        }

        this._initialPaintStraightLine();

        this.bind(bui.Drawable.ListenerType.visible,
                this._straightLineVisibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._straightLineClassesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                this._straightLineRemoveListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.source,
                this._straightLineSourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                this._straightLineTargetChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.StraightLine.prototype = Object.create(bui.AttachedDrawable.prototype, {
        _line : bui.util.createPrototypeValue(null),

        /**
         * @private initial paint
         */
        _initialPaintStraightLine : bui.util.createPrototypeValue(function() {
            this._line = document.createElementNS(bui.svgns, 'line');
            this._container.appendChild(this._line);
            this.addClass(bui.settings.css.classes.invisible);
        }),

        /**
         * @private visibility listener
         */
        _straightLineVisibilityChanged : bui.util.createPrototypeValue(
                function(drawable, visible) {
            if (visible === true) {
                this.removeClass(bui.settings.css.classes.invisible);
            } else {
                this.addClass(bui.settings.css.classes.invisible);
            }
        }),

        /**
         * @private classes listener
         */
        _straightLineClassesChanged : bui.util.createPrototypeValue(
                function(drawable, classString) {
            this._line.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private remove listener
         */
        _straightLineRemoveListener : bui.util.createPrototypeValue(
                function() {
            this._line.parentNode.removeChild(this._line);
        }),

        /**
         * @private source changed listener
         */
        _straightLineSourceChanged : bui.util.createPrototypeValue(
                function(drawable, newSource, oldSource) {
            if (oldSource !== null) {
                oldSource.unbindAll(listenerIdentifier(this));
            }

            if (newSource !== null) {
                var listener = this._straightLineSourceDimensionChanged
                        .createDelegate(this);
                newSource.bind(bui.Node.ListenerType.position, listener,
                        listenerIdentifier(this));
                newSource.bind(bui.Node.ListenerType.size, listener,
                        listenerIdentifier(this));

                listener = this._straightLineEndpointVisibilityChanged
                        .createDelegate(this);
                newSource.bind(bui.Drawable.ListenerType.visible, listener,
                        listenerIdentifier(this));
            }
                    
            this._straightLineSourceDimensionChanged(newSource);
            this._straightLineEndpointVisibilityChanged();
        }),

        /**
         * @private Source position and size listener
         */
        _straightLineSourceDimensionChanged : bui.util.createPrototypeValue(
                function(source) {
            var center = source.center();
            this._line.setAttributeNS(null, 'x1', center.x);
            this._line.setAttributeNS(null, 'y1', center.y);
        }),

        /**
         * @private Source and target visibility listener
         */
        _straightLineEndpointVisibilityChanged : bui.util.createPrototypeValue(
                function() {
            var source = this.source(), target = this.target();

            this.visible(source !== null && target !== null &&
                    source.visible() === true && target.visible() === true);
        }),

        /**
         * @private target changed listener
         */
        _straightLineTargetChanged : bui.util.createPrototypeValue(
                function(drawable, newTarget, oldTarget) {
            if (oldTarget !== null) {
                oldTarget.unbindAll(listenerIdentifier(this));
            }

            if (newTarget !== null) {
                var listener = this._straightLineTargetDimensionChanged
                        .createDelegate(this);
                newTarget.bind(bui.Node.ListenerType.position, listener,
                        listenerIdentifier(this));
                newTarget.bind(bui.Node.ListenerType.size, listener,
                        listenerIdentifier(this));

                listener = this._straightLineEndpointVisibilityChanged
                        .createDelegate(this);
                newTarget.bind(bui.Drawable.ListenerType.visible, listener,
                        listenerIdentifier(this));
            }

            this._straightLineTargetDimensionChanged(newTarget);
            this._straightLineEndpointVisibilityChanged();
        }),

        /**
         * @private Target position and size listener
         */
        _straightLineTargetDimensionChanged : bui.util.createPrototypeValue(
                function(target) {
            var center = target.center();
            this._line.setAttributeNS(null, 'x2', center.x);
            this._line.setAttributeNS(null, 'y2', center.y);
        })
    });
})(bui);