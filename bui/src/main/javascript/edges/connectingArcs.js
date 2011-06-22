(function(bui) {
    /**
     * @namespace Generator functions for connecting arcs can be found as
     * properties of this object.
     */
    bui.connectingArcs = {};

    var connectingArcIdCounter = 0;

    /**
     * @private
     * Helper function for the generation of SVGPathElement elements.
     *
     * @param {String} data Used to fill the path element's data attribute.
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    var createPathWithData = function(data) {
        var path = document.createElementNS(bui.svgns, 'path');

        var id = (bui.settings.idPrefix.connectingArc +
                connectingArcIdCounter++);
        path.setAttributeNS(null, 'id', id);
        path.setAttributeNS(null, 'd', data);
        
        return {
            id : id,
            element : path
        };
    };

    /**
     * @field Generator for a stimulation connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.stimulation = function() {
        return createPathWithData('M0,0L10,5L0,10Z');
    };

    /**
     * @field Generator for a inhibition connecting arc.
     *
     * This generates a simple line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.inhibition = function() {
        return createPathWithData('M0,0L0,10');
    };
})(bui);