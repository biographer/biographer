(function(bui) {
    var identifier = 'bui.Edge';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Edge} edge
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(edge) {
        return identifier + edge.id();
    };

    /**
     * @private listener to the source's and target's visibility listener
     */
    var endpointVisibilityChanged = function() {
        var source = this.source(), target = this.target();

        this.visible(source !== null && source.visible() === true &&
                target !== null && target.visible() === true);
    };

    /**
     * @private source changed listener
     */
    var sourceChanged = function(edge, source, old) {
        var privates = this._privates(identifier);
        privates.lines[0].source(source);

        if (old !== null) {
            old.unbindAll(listenerIdentifier(this));
        }

        if (source !== null) {
            source.bind(bui.Drawable.ListenerType.visible,
                endpointVisibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        }
    };

    /**
     * @private target changed listener
     */
    var targetChanged = function(edge, target, old) {
        var privates = this._privates(identifier);
        privates.lines[privates.lines.length - 1].target(target);

        if (old !== null) {
            old.unbindAll(listenerIdentifier(this));
        }

        if (target !== null) {
            target.bind(bui.Drawable.ListenerType.visible,
                endpointVisibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        }
    };

    /**
     * @private Set the visibility of the edge handles
     */
    var setEdgeHandleVisibility = function() {
        var privates = this._privates(identifier);

        var edgeHandlesVisible = this.visible() === true &&
                privates.edgeHandlesVisible === true;
        var handles = privates.handles;
        for (var i = 0; i < handles.length; i++) {
            handles[i].visible(edgeHandlesVisible);
        }
    };

    /**
     * @private visibility changed listener
     */
    var visibilityChanged = function(edge, visible) {
        var privates = this._privates(identifier);

        var lines = privates.lines;
        for (var i = 0; i < lines.length; i++) {
            lines[i].visible(visible);
        }

        setEdgeHandleVisibility.call(this);
    };

    /**
     * Add a handle after the given node. The node may be any of the line's
     * edge handles. If the node can't be matched the edge handle will be added
     * to the beginning.
     *
     * @param {bui.Node} node An edge handle
     * @param {Number} x X-coordinate at which the edge handle should be added.
     * @param {Number} y Y-coordinate at which the edge handle should be added.
     */
    var addHandleAfter = function(node, x, y) {
        var privates = this._privates(identifier);

        var handle = this.graph()
                .add(bui.EdgeHandle)
                .positionCenter(x, y)
                .visible(privates.edgeHandlesVisible);

        var index = privates.handles.indexOf(node);

        if (index === -1) {
            index = 0;
        } else {
            // we want to add the handle after the node
            index++;
        }

        privates.handles.splice(index, 0, handle);
    };

    /**
     * @private line clicked listener
     */
    var lineClicked = function(line, event) {
        addHandleAfter.call(this, line.source(), event.pageX, event.pageY);
    };

    /**
     * @class
     * Edges between nodes are represented through this class. This class is
     * responsible for the generation of edge handles.
     *
     * @extends bui.AttachedDrawable
     * @constructor
     */
    bui.Edge = function() {
        bui.Edge.superClazz.apply(this, arguments);

        var line = this.graph().add(bui.StraightLine);
        line.bind(bui.AbstractLine.ListenerType.click,
                lineClicked.createDelegate(this),
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.edgeHandlesVisible = true;
        privates.lines = [line];
        privates.handles = [];

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.Edge.prototype = {
        edgeHandlesVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.edgeHandlesVisible = visible;

                setEdgeHandleVisibility.call(this);

                return this;
            }

            return privates.edgeHandlesVisible;
        }
    };

    bui.util.setSuperClass(bui.Edge, bui.AttachedDrawable);
})(bui);