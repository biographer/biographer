(function(bui) {
    var identifier = 'bui.VariableValue';
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
     
    var listenerIdentifier = function(Node) {
        return identifier + Node.id();
    };
    
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     **/

    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', height/2,height,         // topleft
            'L', width-height/2, height, //draw _ on top
            'C', width+height/4, height, width+height/4,0, width-height/2, 0,
            'L', height/2, 0,          //draw _ to left
            'C', -height/4, 0, -height/4, height, height/2, height, 
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
    
    bui.VariableValue = function() {
        bui.VariableValue.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        
        initialPaint.call(this);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass('VariableValue');
        var privates = this._privates(identifier);
        //this.adaptSizeToLabel(true);
    };
    
    bui.VariableValue.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 10,
        _minHeight : 14,
        _enableResizing : true,
        _adaptSizeToLabel : false,
        /*label : function(label) {
            bui.VariableValue.superClazz.superClazz.prototype.label.apply(this,[label]);
        }*/
    };

    bui.util.setSuperClass(bui.VariableValue, bui.Labelable);
})(bui);
