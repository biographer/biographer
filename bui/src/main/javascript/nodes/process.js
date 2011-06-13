(function(bui) {
    /**
     * @class
     * Process node "process"
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Process = function() {
        
        bui.RectangularNode.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
    };

    bui.Process.prototype = Object.create(bui.RectangularNode.prototype, {
        _allowResizing : bui.util.createPrototypeValue(false),
        _minWidth : bui.util.createPrototypeValue(
                bui.settings.style.processNodeMinSize.width),
        _minHeight : bui.util.createPrototypeValue(
                bui.settings.style.processNodeMinSize.height)
    });
})(bui);