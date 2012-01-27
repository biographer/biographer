(function(bui) {
    var identifier = 'bui.EmptySet';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.EmptySet} EmptySet
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(EmptySet) {
        return identifier + EmptySet.id();
    };

    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
        var pathData = [
            'M', 0, width,
            'L', width, 0, 
            'Z'].join(' ');
        privates.dash.setAttributeNS(null, 'd', pathData);
        privates.dash.setAttributeNS(null, 'stroke', 'black');
        privates.dash.setAttributeNS(null, 'stroke-width', 2);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.circle = document.createElementNS(bui.svgns, 'circle');
        privates.dash = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, this.size().width);
        container.appendChild(privates.circle);
        container.appendChild(privates.dash);
    };

    /**
     * @class
     * Class for SBGN simple chemicals. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.EmptySet = function() {
        bui.EmptySet.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.EmptySet.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.EmptySet, bui.Labelable);
})(bui);
