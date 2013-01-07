(function(bui) {
    var identifier = 'EdgeHandle';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.EdgeHandle} EdgeHandle
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(EdgeHandle) {
        return identifier + EdgeHandle.id();
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
    };

    /**
     * @private
     */
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
    bui.EdgeHandle = function() {
        bui.EdgeHandle.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.EdgeHandle.prototype = {
        identifier : function() {
            return identifier;
        },
        edge : function(e){
          var privates = this._privates(identifier);
          if (e !==undefined){
            privates.edge=e;
            return this;
          } else {
            return privates.edge;
          }
        },
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
//        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.EdgeHandle, bui.Node);
})(bui);
