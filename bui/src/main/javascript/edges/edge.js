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
     * Redraw the lines. This function is called after the addition of drag
     * handles.
     */
    var redrawLines = function() {
        var suspendHandle = this.graph().suspendRedraw(200);

        var privates = this._privates(identifier);

        // deleting old lines
        var lines = privates.lines;
        for(var i = 0; i < lines.length; i++) {
            lines[i].remove();
        }

        var handles = privates.handles,
                graph = this.graph(),
                clickListener = lineClicked.createDelegate(this),
                mouseDownListener = lineMouseDown.createDelegate(this),
                mouseEnterListener = lineMouseEnter.createDelegate(this),
                mouseLeaveListener = lineMouseLeave.createDelegate(this),
                listenerId = listenerIdentifier(this),
                sourceNode = this.source(),
                targetNode = null;

        lines = [];

        var addLine = function() {
            var line = graph
                    .add(bui.StraightLine)
                    .source(sourceNode)
                    .target(targetNode)
                    .bind(bui.AbstractLine.ListenerType.click,
                            clickListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mousedown,
                            mouseDownListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mouseEnter,
                            mouseEnterListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mouseLeave,
                            mouseLeaveListener,
                            listenerId);

            lines.push(line);
            sourceNode = targetNode;
        };

        for(i = 0; i < handles.length; i++) {
            targetNode = handles[i];
            addLine();
        }

        targetNode = this.target();
        addLine();

        privates.lines = lines;

        this.graph().unsuspendRedraw(suspendHandle);
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

        var graphHtmlTopLeft = this.graph().htmlTopLeft();
        x -= graphHtmlTopLeft.x;
        y -= graphHtmlTopLeft.y;

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

        redrawLines.call(this);

        handle.startDragging(x, y);
    };

    /**
     * @private line mouse down event listener
     */
    var lineMouseDown = function(line, event) {
        if (event.ctrlKey !== true) {
            addHandleAfter.call(this, line.source(), event.pageX, event.pageY);
        }
    };

    /**
     * @private line clicked listener
     */
    var lineClicked = function(line, event) {
        if (event.ctrlKey === true) {
            this.edgeHandlesVisible(!this.edgeHandlesVisible());
        }
    };

    /**
     * @private line mouseEnter listener
     */
    var lineMouseEnter = function() {
        var privates = this._privates(identifier);

        var lines = privates.lines;
        for(var i = 0; i < lines.length; i++) {
            lines[i].hoverEffectActive(true);
        }
    };

    /**
     * @private line mouseLeave listener
     */
    var lineMouseLeave = function() {
        var privates = this._privates(identifier);

        var lines = privates.lines;
        for(var i = 0; i < lines.length; i++) {
            lines[i].hoverEffectActive(false);
        }
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

        var privates = this._privates(identifier);
        privates.edgeHandlesVisible = true;
        privates.handles = [];
        privates.lines = [];
        redrawLines.call(this);

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