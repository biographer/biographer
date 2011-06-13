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
     */
    bui.StraightLine = function(id, graph){
        id = bui.settings.idPrefix.edge + id;
        bui.AttachedDrawable.call(this, id, graph);
        this.addType(bui.StraightLine.ListenerType);

        this._initialPaintStraightLine();

        this.bind(bui.AttachedDrawable.ListenerType.source,
                this._straightLineSourceChanged.createDelegate(true),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                this._straightLineTargetChanged.createDelegate(true),
                listenerIdentifier(this));
    };

    bui.StraightLine.prototype = Object.create(bui.Drawable.prototype, {
        /**
         * @private initial paint
         */
        _initialPaintStraightLine : bui.util.createPrototypeValue(function() {
            var group =
        }),

        /**
         * @private source changed listener
         */
        _straightLineSourceChanged : bui.util.createPrototypeValue(
                function(drawable, newSource, oldSource) {
            oldSource.unbindAll(listenerIdentifier(this));

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
            
        }),

        /**
         * @private Source and target visibility listener
         */
        _straightLineEndpointVisibilityChanged : bui.util.createPrototypeValue(
                function() {
            var source = this.source(), target = this.target();

            this.visible(source !== null && target !== null &&
                    source.visible() === true && target.visible() === tru);
        }),

        /**
         * @private target changed listener
         */
        _straightLineTargetChanged : bui.util.createPrototypeValue(
                function(drawable, newTarget, oldTarget) {
            oldTarget.unbindAll(listenerIdentifier(this));

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

        })
    });
})(bui);