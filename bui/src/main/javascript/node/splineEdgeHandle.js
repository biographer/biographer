(function(bui) {

    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     * of splines
     *
     * @extends bui.EdgeHandle
     * @constructor
     */
    bui.SplineEdgeHandle = function() {
        bui.SplineEdgeHandle.superClazz.apply(this, arguments);

        this.addClass(bui.settings.css.classes.splineEdgeHandle);
        this.position(10, 10);
    };

    bui.SplineEdgeHandle.prototype = {
        includeInJSON : false
    };

    bui.util.setSuperClass(bui.SplineEdgeHandle, bui.EdgeHandle);
})(bui);