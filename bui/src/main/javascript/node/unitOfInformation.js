(function(bui) {
    var identifier = 'bui.UnitOfInformation';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnitOfInformation} UnitOfInformation
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnitOfInformation) {
        return identifier + UnitOfInformation.id();
    };

    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.UnitOfInformation = function() {
        bui.UnitOfInformation.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.UnitOfInformation.prototype = {
        _enableResizing : false
    };

    bui.util.setSuperClass(bui.UnitOfInformation, bui.RectangularNode);
})(bui);