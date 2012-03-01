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
            'C', width+height/3, height, width+height/3,0, width-height/2, 0,
            'L', height/2, 0,          //draw _ to left
            'C', -height/3, 0, -height/3, height, height/2, height, 
            'Z'].join(' '); //draw \ to middle left

        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
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
        container.appendChild(privates.path);
    };
    bui.VariableValue = function() {
        bui.VariableValue.superClazz.apply(this, arguments);
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        
        initialPaint.call(this);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass('VariableValue');
        this.adaptSizeToLabel(true);
    };
    bui.VariableValue.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 1,
        _minHeight : 14,
        _enableResizing : true,
        _adaptSizeToLabel : false,
        /*label : function(label) {
            bui.VariableValue.superClazz.superClazz.prototype.label.apply(this,[label]);
        }*/
    };

    bui.util.setSuperClass(bui.VariableValue, bui.Labelable);
})(bui);
