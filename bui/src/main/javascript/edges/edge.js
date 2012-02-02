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
            source.bind(bui.Node.ListenerType.absolutePosition, recalculatePoints.createDelegate(this), listenerIdentifier(this));
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
            target.bind(bui.Node.ListenerType.absolutePosition, recalculatePoints.createDelegate(this), listenerIdentifier(this));
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
                targetNode = null,
                lineStyle = privates.lineStyle;

        lines = [];

        var addLine = function() {
            var line = graph
                    .add(bui.StraightLine)
                    .source(sourceNode)
                    .target(targetNode)
                    .lineStyle(lineStyle)
                    .bind(bui.AbstractLine.ListenerType.mouseEnter,
                            mouseEnterListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mouseLeave,
                            mouseLeaveListener,
                            listenerId);

            if (bui.settings.enableModificationSupport === true) {
                line.bind(bui.AbstractLine.ListenerType.click,
                            clickListener,
                            listenerId)
                    .bind(bui.AbstractLine.ListenerType.mousedown,
                            mouseDownListener,
                            listenerId);

            }

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

        if (privates.marker !== null) {
            lines[lines.length - 1].marker(privates.marker);
        }

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

        var handle = this.graph()
                .add(bui.EdgeHandle)
                .visible(privates.edgeHandlesVisible);
        handle.positionCenter(x, y);

        var index = privates.handles.indexOf(node);

        if (index === -1) {
            index = 0;
        } else {
            // we want to add the handle after the node
            index++;
        }

        privates.handles.splice(index, 0, handle);

        redrawLines.call(this);

        return handle;
    };

    /**
     * @private line mouse down event listener
     */
    var lineMouseDown = function(line, event) {
        if (event.ctrlKey !== true) {
            var scale = 1 / this.graph().scale();
            var graphHtmlTopLeft = this.graph().htmlTopLeft();

            addHandleAfter.call(this, line.source(),
                    (event.pageX - graphHtmlTopLeft.x) * scale ,
                    (event.pageY - graphHtmlTopLeft.y) * scale)
                    .startDragging(event.clientX, event.clientY);
        }
    };

    /**
     * @private line clicked listener
     */
    var lineClicked = function(line, event) {
        // deactivated functionality based on Falko's request
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
    /*
     *
     */
    var recalculatePoints = function() {
        var privates = this._privates(identifier);
        
        if((privates.handles.length > 0) && (privates.lines[0].source() != null) && (privates.lines[privates.lines.length - 1].target() != null)){
            var sp = privates.lines[0].source().absoluteCenter();
            var tp = privates.lines[privates.lines.length - 1].target().absoluteCenter();
            var devby = 1/(privates.handles.length+3);
            var lx = tp.x-sp.x;
            var ly = tp.y-sp.y;
            for(var i = 0; i<privates.handles.length; i++){
                privates.handles[i].positionCenter(sp.x+((i+2)*devby*lx),sp.y+((i+2)*devby*ly));
            }
            redrawLines.call(this);
        }
    }

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
        privates.marker = null;
        privates.lineStyle = null;
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

        addPoint : function(x, y, type){
            var privates = this._privates(identifier);
            var handle = undefined
            
            if (type == 'Outcome'){
                //SBO:0000409
                //An outcome is represented by a black dot located on the arc of a statement
                //The diameter of the dot has to be larger than the thickness of the arc.
                //-----------------------------
                handle = this.graph()
                    .add(bui.EdgeHandle)
                    .size(12,12)
                    .visible(true);
                handle.addClass('Outcome');// the stylesheet mus fill the circle black
            }else if ((type == 'and')||(type == 'or')||(type == 'not')||(type == 'delay')){
                //SBO:0000174 ! or
                //SBO:0000173 ! and
                //...
                handle = this.graph()
                    .add(bui.LogicalOperator, type)
                    .visible(true);
                handle.addClass('LogicalOperator');
            } else{
                handle = this.graph()
                    .add(bui.EdgeHandle)
                    .visible(privates.edgeHandlesVisible);
                handle.addClass('edgeHandle');//let the stylesheet make it grey
            }
            handle.positionCenter(x, y);
            
            index = 0;
            privates.handles.splice(index, 0, handle);
            redrawLines.call(this);
            return handle;
        },
        recalculatePoints : function(){
            recalculatePoints.call(this)
        },
        handles : function(){
            var privates = this._privates(identifier);
            return privates.handles;
        },
        edgeHandlesVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.edgeHandlesVisible = visible;

                setEdgeHandleVisibility.call(this);

                return this;
            }

            return privates.edgeHandlesVisible;
        },

        /**
         * Set the marker, i.e. a symbol at the end of the line.
         *
         * @param {Object} [markerId] Marker type identification.
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         * @return {bui.Edge|String} The id of the current marker when
         *   you omit the parameter. In case you pass a parameter it will be
         *   set as a new marker and the current instance will be removed
         *   (fluent interface).
         */
        marker : function(markerId) {
            var privates = this._privates(identifier);

            if (markerId !== undefined) {
                if (markerId === null) {
                    privates.marker = null;
                } else {
                    privates.marker = markerId;
                }

                redrawLines.call(this);

                return this;
            }

            return privates.marker;
        },

        /**
         * Set the line style. Available line style can be retrieved through
         * the {@link bui.AbstractLine.Style} object.
         *
         * @param {Object} style A property of {@link bui.AbstractLine.Style}.
         * @return {bui.AbstractLine} Fluent interface
         * @example
         * edge.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            var privates = this._privates(identifier);
            privates.lineStyle = style;
            redrawLines.call(this);
            return this;
        },

        // overridden
        toJSON : function() {
            var json = bui.Edge.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.lineStyle !== null &&
                    privates.lineStyle !== bui.AbstractLine.Style.solid) {
                updateJson(json, dataFormat.edge.style, privates.lineStyle);
            }

            if (privates.handles.length > 0) {
                log('toJSON called iterating handles');
                var handles = [];

                for (var i = 0; i < privates.handles.length; i++) {
                    var position = privates.handles[i].absoluteCenter();
                    handles.push(position);
                }
                log('got this ')
                updateJson(json, dataFormat.edge.handles, handles);
            }

            if (privates.marker !== null) {
                var sbo = getSBOForMarkerId(privates.marker);

                if (sbo !== null) {
                    updateJson(json, dataFormat.drawable.sbo, sbo);
                }
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.Edge, bui.AttachedDrawable);
})(bui);
