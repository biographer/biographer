(function(bui) {
    /**
     * @namespace Generator functions for connecting arcs can be found as
     * properties of this object.
     */
    bui.connectingArcs = {};

    var connectingArcIdCounter = 0;

    /**
     * @private
     * Helper function for the generation of SVGMarkerElement elements.
     *
     * @param {String} id The id for the element.
     * @param {String|Element} data If you pass a String, a SVGPathElement
     *   will be created and its data attribute filled with the value of this
     *   parameter. In every other case it will be assumed that it's a valid
     *   SVG object and it will be added as a child to the generated marker
     *   element.
     * @param {Number} refX Value for the refX attribute
     * @param {Number} refY Value for the refY attribute
     * @param {Number} width Value for the markerWidth and viewBox attribute
     * @param {Number} height Value for the markerHeight and viewBox attribute
     * @param {String} [classes] CSS classes which should be applied to the
     *   marker element.
     * @param {Number} [markerWidthCorrection] Correction of the markers width.
     *   This value will be multiplied to the width attribute for the
     *   markerWidth attribute. Defaults to 1, i.e. no changes.
     * @return {SVGMarkerElement} The generated marker element.
     */
    var createMarker = function(id, data, refX, refY, width, height, classes,
                                markerWidthCorrection) {
        if (markerWidthCorrection === undefined) {
            markerWidthCorrection = 1;
        }

        var marker = document.createElementNS(bui.svgns, 'marker');
        marker.setAttributeNS(null, 'id', id);
        marker.setAttributeNS(null, 'orient', 'auto');
        marker.setAttributeNS(null, 'refX', refX);
        marker.setAttributeNS(null, 'refY', refY);
        marker.setAttributeNS(null, 'markerWidth',
                width * markerWidthCorrection);
        marker.setAttributeNS(null, 'markerHeight', height);
        marker.setAttributeNS(null, 'viewBox',
                ['-2 -2', width+4, height+4].join(' '));

        if (classes !== undefined) {
            marker.setAttributeNS(null, 'class', classes);
        }

        if (typeof(data) == 'string') {
            var path = document.createElementNS(bui.svgns, 'path');
            path.setAttributeNS(null, 'd', data);
            if(classes == bui.settings.css.classes.connectingArcs.assignment || classes == bui.settings.css.classes.connectingArcs.production)
                path.setAttributeNS(null, 'fill', 'black');
            else
                path.setAttributeNS(null, 'fill', 'white');
            path.setAttributeNS(null, 'stroke', 'black');
            marker.appendChild(path);
        } else {
            marker.appendChild(jQuery(data).clone(false)[0]);
        }

        return marker;
    };

    /**
     * @private
     * Helper function for the generation of SVGPathElement elements.
     *
     * @param {String|Element} data If you pass a String, a SVGPathElement
     *   will be created and its data attribute filled with the value of this
     *   parameter. In every other case it will be assumed that it's a valid
     *   SVG object and it will be added as a child to the generated marker
     *   element.
     * @param {Number} refX Value for the refX attribute
     * @param {Number} refY Value for the refY attribute
     * @param {Number} width Value for the markerWidth and viewBox attribute
     * @param {Number} height Value for the markerHeight and viewBox attribute
     * @param {String} [classes] CSS classes which should be applied to the
     *   marker element.
     * @return {Object} An object with id, hoverId, element and hoverElement
     *   properties. The id property holds the marker's id and the element
     *   property the SVGMarkerElement.
     */
    var createPathWithData = function(data, refX, refY, width, height, classes)
    {
        var id = (bui.settings.idPrefix.connectingArc +
                connectingArcIdCounter++),
                hoverId = bui.util.getHoverId(id);

        var element = createMarker(id, data, refX, refY, width, height,
                classes),
                hoverElement = createMarker(hoverId, data, refX, refY,
                        width, height, classes,
                        bui.settings.style.markerWidthCorrection);

        return {
            id : id,
            hoverId : hoverId,
            element : element,
            hoverElement : hoverElement
        };
    };

    /**
     * Generator for a assignment connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.assignment = function() {
        return createPathWithData('M0,0 S10,10,0,20 L20,10 Z', 20, 10, 20, 20,
                bui.settings.css.classes.connectingArcs.assignment);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.assignment.id = 'assignment';
    

    /**
     * Generator for a stimulation connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.absoluteStimulation = function() {
        return createPathWithData('M0,0 L0,20 L10,15 L10,5 L0,0 Z M10,0 L10,20 L25,10Z', 25, 10, 35, 20,
                bui.settings.css.classes.connectingArcs.stimulation);
    };
    bui.connectingArcs.absoluteStimulation.id = 'absoluteStimulation';

    /**
     * Generator for a stimulation connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.stimulation = function() {
        return createPathWithData('M0,0L20,10L0,20Z', 20, 10, 20, 20,
                bui.settings.css.classes.connectingArcs.stimulation);
    };
    bui.connectingArcs.stimulation.id = 'stimulation';


    /**
    * Generator for a production connecting arc.
    *
    * This generates a simple triangle.
    *
    * @return {Object} An object with id and element properties. The id
    *   property holds the id of the marker and the element property the
    *   generated element.
    */
    bui.connectingArcs.production = function() {
       return createPathWithData('M0,0L20,10L0,20Z', 20, 10, 20, 20,
                                 bui.settings.css.classes.connectingArcs.production);
    };
    
    /**
    * @field Identifier for this connecting arc type.
    */
    bui.connectingArcs.production.id = 'production';
    
    
    /**
    * Generator for a substrate connecting arc.
    *
    * This generates nothing.
    *
    * @return {Object} An object with id and element properties. The id
    *   property holds the id of the marker and the element property the
    *   generated element.
    */
    bui.connectingArcs.substrate = function() {
       return createPathWithData('', 20, 10, 20, 20,
                                 bui.settings.css.classes.connectingArcs.substrate);
    };
    
    /**
    * @field Identifier for this connecting arc type.
    */
    bui.connectingArcs.substrate.id = 'substrate';
    
    
    /**
     * Generator for an inhibition connecting arc.
     *
     * This generates a simple line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.inhibition = function() {
        return createPathWithData('M0,0 V20 H1 V0 ZM22,0', 2, 10, 20, 22);
    };
    
    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.inhibition.id = 'inhibition';

    /**
     * Generator for a absolute inhibition connecting arc.
     *
     * This generates an inhibition with an additional line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.absoluteInhibition = function() {
        return createPathWithData('M0,0 V25 M10,0 V25Z', 10, 12, 10, 26,
            bui.settings.css.classes.connectingArcs.necessaryStimulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.absoluteInhibition.id = 'absoluteInhibition';
    
    /**
     * Generator for a catalysis connecting arc.
     *
     * This generates a circle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.catalysis = function() {
        var circle = document.createElementNS(bui.svgns, 'circle');
        circle.setAttributeNS(null, 'cx', 10);
        circle.setAttributeNS(null, 'cy', 10);
        circle.setAttributeNS(null, 'r', 10);

        return createPathWithData(circle, 20, 10, 20, 20,
            bui.settings.css.classes.connectingArcs.catalysis);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.catalysis.id = 'catalysis';


    /**
     * Generator for a control connecting arc.
     *
     * This generates a diamond.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.control = function() {
        return createPathWithData('M10,0L20,10L10,20L0,10Z', 20, 10, 20, 20,
            bui.settings.css.classes.connectingArcs.control);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.control.id = 'control';

    /**
     * Generator for a necessary stimulation connecting arc.
     *
     * This generates an arrow with an additional line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.necessaryStimulation = function() {
        return createPathWithData('M0,0 V20 M10,0 L25,10L10,20Z', 25, 10, 26, 26,
            bui.settings.css.classes.connectingArcs.necessaryStimulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.necessaryStimulation.id = 'necessaryStimulation';
})(bui);
