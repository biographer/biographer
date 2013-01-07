(function(bui) {
    var identifier = 'EmptySet';

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
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.circle.style.setProperty('fill', color.background);
        privates.circle.style.setProperty('stroke', color.border);
        privates.dash.style.setProperty('stroke', color.border);
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
		colorChanged.call(this, this, this.color());
        container.appendChild(privates.circle);
        container.appendChild(privates.dash);
    };

    /**
     * @class
     * Class for SBGN empty set. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.EmptySet = function() {
        bui.EmptySet.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Labelable.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.EmptySet.prototype = {
        identifier : function() {
            return 'EmptySet';
        },
        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook,
    };

    bui.util.setSuperClass(bui.EmptySet, bui.Labelable);
})(bui);
