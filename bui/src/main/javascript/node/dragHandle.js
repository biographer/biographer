(function(bui) {
    var identifier = 'bui.DragHandle';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.DragHandle} DragHandle
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(DragHandle) {
        return identifier + DragHandle.id();
    };

    /**
     * @private size changed listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.DragHandle = function() {
        bui.DragHandle.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.dragHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.DragHandle.prototype = {
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false
    };

    bui.util.setSuperClass(bui.DragHandle, bui.Node);
})(bui);