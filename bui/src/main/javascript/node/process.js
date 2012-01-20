(function(bui) {
    var identifier = 'bui.Process';
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
        this.addClass(bui.settings.css.classes.process);
                
    };

    bui.Process.prototype = {
        identifier : function() {
            return identifier;
        },
        _enableResizing : false,
        _minWidth : bui.settings.style.processNodeMinSize.width,
        _minHeight : bui.settings.style.processNodeMinSize.height,
        _ignLabelSize : true
    };

    bui.util.setSuperClass(bui.Process, bui.RectangularNode);
})(bui);
