(function(bui) {
    var identifier = 'bui.Dissociation';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Dissociation} Dissociation
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Dissociation) {
        return identifier + Dissociation.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
        privates.subcircle.setAttributeNS(null, 'cx', r);
        privates.subcircle.setAttributeNS(null, 'cy', r);
        privates.subcircle.setAttributeNS(null, 'r', width / 4);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        privates.subcircle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);
        this.nodeGroup().appendChild(privates.subcircle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Dissociation = function() {
        bui.Dissociation.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.Dissociation.prototype = {
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
        _minWidth : 14,
        _minHeight : 14,
        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
    };

    bui.util.setSuperClass(bui.Dissociation, bui.Node);
})(bui);
