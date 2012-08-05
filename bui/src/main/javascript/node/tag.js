(function(bui) {
    var identifier = 'bui.Tag';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', 0, 0,         // start point in middle left, go clockwise to draw
            'L', 0, height,     // draw / to top
            'L', (width/5)*4, height, //draw _ on top
            'L', width, height/2,     //draw \ to middle right
            'L', (width/5)*4, 0,      //draw / to bottm
            'L', 0, 0,          //draw _ to left
            'Z'].join(' '); //draw \ to middle left

        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
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
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.path);

    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Tag = function() {
        bui.Tag.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.perturbation);
    };

    bui.Tag.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 40,
        _minHeight : 30,
        orientation : function(type){
            var centerpos = this.absolutePositionCenter();
            if(type=='down'){
                this._privates(identifier).path.setAttributeNS(null, 'transform', 'rotate(90,'+centerpos.x+','+centerpos.y+')');
            }else if(type=='up'){
                this._privates(identifier).path.setAttributeNS(null, 'transform', 'rotate(270,'+centerpos.x+','+centerpos.y+')');
            }else if(type=='left'){
                this._privates(identifier).path.setAttributeNS(null, 'transform', 'rotate(180,'+centerpos.x+','+centerpos.y+')');
            }else if(type=='right'){
                //this._privates(identifier).path.setAttributeNS(null, 'transform', 'roatet(0)');
            }
        }
    };

    bui.util.setSuperClass(bui.Tag, bui.Labelable);

})(bui);
