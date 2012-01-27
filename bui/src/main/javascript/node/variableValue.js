(function(bui) {
    var identifier = 'bui.VariableValue';
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.VariableValue = function() {
        bui.VariableValue.superClazz.apply(this, arguments);
        this.topRadius(7);
        this.bottomRadius(7);
        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass('VariableValue');
        //this.adaptSizeToLabel(true);
        //this.size(this.size().x, 14);
    };
    bui.VariableValue.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 14,
        _minHeight : 14,
        _enableResizing : false,
        _adaptSizeToLabel : false,
        /*label : function(label) {
            bui.VariableValue.superClazz.superClazz.prototype.label.apply(this,[label]);
        }*/
    };

    bui.util.setSuperClass(bui.VariableValue, bui.RectangularNode);
})(bui);
