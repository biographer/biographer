(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnitOfInformation} UnitOfInformation
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnitOfInformation) {
        return 'bui.UnitOfInformation' + UnitOfInformation.id();
    };

    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.UnitOfInformation = function() {
        bui.RectangularNode.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.UnitOfInformation.prototype = Object.create(
            bui.RectangularNode.prototype, {});
})(bui);