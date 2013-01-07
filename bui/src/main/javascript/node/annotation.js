(function(bui) {
    var identifier = 'Annotation';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', 0,0,         // start
            'H', width-15, //draw _ on top to 7/8
            'L', width, 15,
            'V', height,
            'H', 0,0,
            'Z'].join(' '); //draw \ to middle left
        var edgeData = [
            'M', width-15, 0,
            'L', width, 15,
            'H', width-15,
            
            'Z'].join(' ');
        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
        this._privates(identifier).edgePath.setAttributeNS(null, 'd', edgeData);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        privates.edgePath = document.createElementNS(bui.svgns, 'path');
        privates.edgePath.style.setProperty('fill', 'black');
        privates.edgePath.style.setProperty('stroke-width', '0')
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color());
        container.appendChild(privates.path);
        container.appendChild(privates.edgePath);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Annotation = function() {
        bui.Annotation.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        //var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.annotation);
    };

    bui.Annotation.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 80,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.Annotation, bui.Labelable);

})(bui);
