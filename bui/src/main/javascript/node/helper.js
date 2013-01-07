(function(bui) {
    var identifier = 'Helper';
    /**
     * @class
     * Helper node "helper"
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Helper = function() {
        bui.Helper.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass(bui.settings.css.classes.process);
                
    };

    bui.Helper.prototype = {
        identifier : function() {
            return identifier;
        },
        _enableResizing : false,
        _minWidth : bui.settings.style.helperNodeMinSize.width,
        _minHeight : bui.settings.style.helperNodeMinSize.height,
        _ignLabelSize : true
    };

    bui.util.setSuperClass(bui.Helper, bui.RectangularNode);
})(bui);
