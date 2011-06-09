(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.DragHandle} DragHandle
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(DragHandle) {
        return 'bui.DragHandle' + DragHandle.id();
    };

    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.DragHandle = function() {
        bui.Node.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                this._dragHandleSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._dragHandleClassesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._dragHandleSelectedChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintDragHandle();

        var widthHeight = bui.settings.style.dragHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.DragHandle.prototype = Object.create(bui.Node.prototype, {
        _circle : bui.util.createPrototypeValue(null),
        _preserveAspectRatio : bui.util.createPrototypeValue(true),
        _allowResizing : bui.util.createPrototypeValue(false),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintDragHandle : bui.util.createPrototypeValue(function() {
            this._circle = document.createElementNS(bui.svgns, 'circle');
            this._dragHandleSizeChanged(this, this.width());
            this.nodeGroup().appendChild(this._circle);
        }),

        /**
         * @private size changed listener
         */
        _dragHandleSizeChanged : bui.util.createPrototypeValue(
                function(node, width) {
            var r = width / 2;

            this._circle.setAttributeNS(null, 'cx', r);
            this._circle.setAttributeNS(null, 'cy', r);
            this._circle.setAttributeNS(null, 'r', r);
        }),

        /**
         * @private classes listener
         */
        _dragHandleClassesChanged : bui.util.createPrototypeValue(
                function(node, classString) {
            this._circle.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private select listener
         */
        _dragHandleSelectedChanged : bui.util.createPrototypeValue(
                function(node, selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        })
    });
})(bui);