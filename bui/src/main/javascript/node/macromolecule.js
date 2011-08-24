(function(bui) {
    var identifier = 'bui.Macromolecule';
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Macromolecule = function() {
        bui.Macromolecule.superClazz.apply(this, arguments);
        this.topRadius(bui.settings.style.nodeCornerRadius);
        this.bottomRadius(bui.settings.style.nodeCornerRadius);
    };
    bui.Macromolecule.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60,
    };

    bui.util.setSuperClass(bui.Macromolecule, bui.RectangularNode);
})(bui);
