(function(bui) {
    var identifier = 'Process';
    /**
     * @class
     * Process node "process"
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Process = function(type) {
        bui.Process.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass(bui.settings.css.classes.process);
        if (typeof(type) === 'object') {
            if(type == 379) this.label('\\\\');
            else if(type == 396) this.label('?');
        }
                
    };

    bui.Process.prototype = {
        identifier : function() {
            return identifier;
        },
        _enableResizing : false,
        _adaptSizeToLabel : false,
        _minWidth : bui.settings.style.processNodeMinSize.width,
        _minHeight : bui.settings.style.processNodeMinSize.height,
        _ignLabelSize : true
    };

    bui.util.setSuperClass(bui.Process, bui.RectangularNode);
})(bui);
