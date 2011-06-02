(function(bui) {
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Macromolecule = function() {
        bui.RectangularNode.apply(this, arguments);
        this.topRadius(bui.settings.style.nodeCornerRadius);
        this.bottomRadius(bui.settings.style.nodeCornerRadius);
    };

    bui.Macromolecule.prototype = bui.RectangularNode.prototype;
})(bui);