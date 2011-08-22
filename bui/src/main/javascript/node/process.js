(function(bui) {
    /**
     * @class
     * Process node "process"
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Process = function() {
        bui.Process.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
    };

    bui.Process.prototype = {
        _enableResizing : false,
        _minWidth : bui.settings.style.processNodeMinSize.width,
        _minHeight : bui.settings.style.processNodeMinSize.height
    };

    bui.util.setSuperClass(bui.Process, bui.RectangularNode);
})(bui);