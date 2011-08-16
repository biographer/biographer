(function(bui) {
    // used to identify and compare the graph instances
    var graphCounter = 0;

    var identifier = 'bui.Graph';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Graph} graph
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(graph) {
        return identifier + graph.id();
    };

    /**
     * @private
     * Used to generate the transform attribute value of the _rootGroup
     * element. Extracted to a function as this may be required several
     * times.
     */
    var __setTransformString = function() {
        var privates = this._privates(identifier);
        var value = ['scale(', privates.scale.toString(), ')'].join('');

        privates.rootGroup.setAttribute('transform', value);
    };

    /**
     * @private
     * Extracted because this function is called from the constructor and from
     * rawSVG in order to replace it for the export process.
     */
    var __getStylesheetContents = function() {
        return '@import url(\'' + bui.settings.css.stylesheetUrl + '\');';
    };

    /**
     * @private
     * Extracted from the constructor to improve readability
     */
    var __initialPaintGraph = function() {
        var privates = this._privates(identifier);

        var div = document.createElement('div');
        privates.container.appendChild(div);

        privates.root = document.createElementNS(bui.svgns, 'svg');
        privates.root.setAttribute('xmlns', bui.svgns);
        privates.root.setAttribute('id', privates.id);
        div.appendChild(privates.root);

        var offset = jQuery(privates.root).offset();
        privates.rootOffset = {
            x : offset.left,
            y : offset.top
        };

        privates.rootDimensions = {
            width : jQuery(privates.root).width(),
            height : jQuery(privates.root).height()
        };

        privates.defsGroup = document.createElementNS(bui.svgns, 'defs');
        privates.root.appendChild(privates.defsGroup);

        privates.css = document.createElementNS(bui.svgns, 'style');
        privates.css.setAttribute('type', 'text/css');
        privates.css.textContent = __getStylesheetContents();
        privates.root.appendChild(privates.css);

        privates.rootGroup = document.createElementNS(bui.svgns, 'g');
        __setTransformString.call(this);
        privates.root.appendChild(privates.rootGroup);

        privates.nodeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.nodeGroup);

        privates.edgeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.edgeGroup);

        privates.placeholderContainer = document.createElement('div');
        document.getElementsByTagName('body')[0]
                .appendChild(privates.placeholderContainer);

        privates.connectingArcs = {};

        for(var i in bui.connectingArcs) {
            if (bui.connectingArcs.hasOwnProperty(i)) {
                var ca = bui.connectingArcs[i]();
                var id = bui.connectingArcs[i].id;
                privates.connectingArcs[id] = ca;

                privates.defsGroup.appendChild(ca.element);
                privates.defsGroup.appendChild(ca.hoverElement);
            }
        }
    };

    /**
     * @private
     * This function makes sure that each node fits onto the SVG canvas.
     * In order to do so it's a observer of the nodes' position and size
     * events.
     */
    var __assertCanvasSize = function(node) {
        var privates = this._privates(identifier);

        var bottomRight = node.absoluteBottomRight();

        if (bottomRight.x > privates.rootDimensions.width) {
            privates.rootDimensions.width = bottomRight.x;
            privates.root.setAttribute('width', bottomRight.x);
        }

         if (bottomRight.y > privates.rootDimensions.height) {
            privates.rootDimensions.height = bottomRight.y;
            privates.root.setAttribute('height', bottomRight.y);
        }
    };

    /**
     * @private
     * Generic drawable remove listener.
     */
    var __removed = function(drawable) {
        delete this._privates(identifier).drawables[drawable.id()];
    };

    /**
     * @class
     * This class controls the whole graph and is responsible for the
     * management of nodes and edges, i.e. drawables.
     *
     * @extends bui.Observable
     * @constructor
     *
     * @param {HTMLElement} container where the graph should go
     */
    bui.Graph = function(container) {
        bui.Graph.superClazz.call(this);

        this._addType(bui.Graph.ListenerType);

        var privates = this._privates(identifier);
        privates.id = bui.settings.idPrefix.graph + graphCounter++;
        privates.container = container;
        privates.drawables = {};
        privates.idCounter = 0;
        privates.scale = 1;
        privates.highPerformance = bui.settings.initialHighPerformance;

        __initialPaintGraph.call(this);
    };

    bui.Graph.prototype = {
        /**
         * @description
         * Retrieve the graph's id.
         *
         * @return {String} graph id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * Retrieve the SVG element's offset relative to the document
         *
         * @return {Object} an object with x and y properties
         */
        htmlTopLeft : function() {
            return this._privates(identifier).rootOffset;
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        topLeft : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        absolutePosition : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * @description
         * Retrieve the container which was provided to this object during
         * the creation.
         * 
         * @return {HTMLElement} The container of this graph
         */
        container : function() {
            return this._privates(identifier).container;
        },

        /**
         * @description
         * Retrieve the container for placeholder elements. Placeholder
         * elements are used while dragging or resizing to improve performance.
         *
         * @return {HTMLDIVElement} The container for placeholder elements
         */
        placeholderContainer : function() {
            return this._privates(identifier).placeholderContainer;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all egdes are placed.
         *
         * @return {SVGGElement} Edge container
         */
        edgeGroup : function() {
            return this._privates(identifier).edgeGroup;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all nodes are placed.
         *
         * @return {SVGGElement} Node container
         */
        nodeGroup : function() {
            return this._privates(identifier).nodeGroup;
        },

        /**
         * @description
         * Use this method to deactivate (suspend) redrawing of the SVG. This
         * function is most useful when multiple changes are made to the SVG
         * to improve performance significantly.
         *
         * @param {Integer} duration how long you wish to suspend redrawing
         * @return {Object} A suspend handle which can be passed to
         *   {@link bui.Graph#unsuspendRedraw} to enable redrawing.
         */
        suspendRedraw : function(duration) {
            return this._privates(identifier).root.suspendRedraw(duration);
        },

        /**
         * @description
         * Used to enable redrawing. You can either unsuspend a specific
         * suspension by passing the suspend handle to this function or
         * unsuspend all by passing no parameter.
         *
         * @param {Object} [handle] the suspend handle. Can be omitted to
         *   unsuspend all.
         * @return {bui.Graph} Fluent interface
         */
        unsuspendRedraw : function(handle) {
            if (handle !== undefined) {
                this._privates(identifier).root.unsuspendRedraw(handle);
            } else {
                this._privates(identifier).root.unsuspendRedrawAll();
            }

            return this;
        },

        /**
         * @description
         * Scale the graph by passing a number to this function. To have the
         * standard scale level pass one (1) to this function. To double the
         * size pass two (2).
         *
         * You can also retrieve the current scale by calling this function
         * without parameters.
         *
         * @param {Number} [scale] The new scale, one (1) means 100%.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current scale is returned
         */
        scale : function(scale) {
            var privates = this._privates(identifier);

            if (scale !== undefined) {
                if (scale !== privates.scale) {
                    privates.scale = scale;

                    __setTransformString.call(this);

                    this.fire(bui.Graph.ListenerType.scale, [this, scale]);
                }

                return this;
            }

            return privates.scale;
        },

        /**
         * @description
         * Add a drawable to this graph by calling this function with the
         * constructor of a drawable type. The object will be completely
         * instantiated and associated to the graph, thus ready to be used.
         *
         * @param {Function} constructor The constructor function for the
         *   drawable.
         * @param {Object} [params] Parameters which should be supplied to the
         *   constructor.
         * @return {bui.Drawable} The constructed drawable object.
         */
        add : function(constructor, params) {
            var privates = this._privates(identifier);
            var drawable = null;
            var id = privates.idCounter++;

            if (params === undefined) {
                params = {};
            }

            params.id = id;
            params.graph = this;

            drawable = new constructor(params);

            privates.drawables[drawable.id()] = drawable;

            drawable.bind(bui.Drawable.ListenerType.remove,
                    __removed.createDelegate(this),
                    listenerIdentifier(this));

            // every node type has a bottomRight property. We use this to
            // identify them.
            if (drawable.bottomRight !== undefined) {
                drawable.bind(bui.Node.ListenerType.position,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                drawable.bind(bui.Node.ListenerType.size,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                this.reduceCanvasSize.call(this, drawable);
            }

            this.fire(bui.Graph.ListenerType.add, [drawable]);

            return drawable;
        },

        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        reduceCanvasSize : function() {
            var privates = this._privates(identifier);

            var x = Number.MIN_VALUE, y = Number.MIN_VALUE;

            for(var i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    var drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        var bottomRight = drawable.absoluteBottomRight();

                        x = Math.max(x, bottomRight.x);
                        y = Math.max(y, bottomRight.y);
                    }
                }
            }

            var padding = bui.settings.style.graphReduceCanvasPadding;
            x += padding;
            y += padding;

            privates.rootDimensions.width = x;
            privates.root.setAttribute('width', x);

            privates.rootDimensions.height = y;
            privates.root.setAttribute('height', y);
        },

        /**
         * Retrieve the connecting arcs.
         *
         * @return {Object} You will retrieve the connecting arcs
         * in the following form:
         * {
         *   stimulation : { // id of the connecting arc type
         *     id : 'foo', // the id with which the marker can be referenced
         *     element : {} // instance of SVGMarkerElement
         *   },
         *   // more types may be here
         * }
         */
        connectingArcs : function() {
            return this._privates(identifier).connectingArcs;
        },

        /**
         * Return the raw SVG.
         *
         * Please note that the execution of this method may take a while as an
         * additional HTTP request needs to be made in order to retrieve the
         * stylesheet. The result is the complete SVG with embedded CSS.
         *
         * @return {String} The raw SVG as it can be used to save / export it.
         */
        rawSVG : function() {
            var inner = this._privates(identifier).root.parentNode.innerHTML;

            var css = '';
            
            jQuery.ajax({
                url : bui.settings.css.stylesheetUrl,
                async : false,
                success : function(data) {
                    css = data;
                }
            });

            inner = inner.replace(__getStylesheetContents(), css);

            return inner;
        },

        /**
         * A graph supports a high and low performance mode. This has
         * implications on the way dragging and resizing is realized. When in
         * high performance mode the SVG will be changed while dragging or
         * resizing the node. In low performance mode this will only be done
         * at the end of the dragging or resizing.
         *
         * @param {Boolean} [highPerformance] Set the performance for this
         *   graph to high (true) or low (false). Omit to retrieve current
         *   performance setting.
         * @return {Boolean|bui.Graph} If you pass a boolean to this function
         *   it will set the new value and return the instance of the object
         *   on which you called the function (fluent interface). If you don't
         *   pass a parameter the current setting will be removed.
         */
        highPerformance : function(highPerformance) {
            var privates = this._privates(identifier);

            if (highPerformance !== undefined) {
                privates.highPerformance = highPerformance;
                return this;
            }

            return privates.highPerformance;
        },

        /**
         * Retrieve an object which holds references to all the graph's
         * drawables.
         *
         * @return {Object} Key/value store of the graph's drawables. The keys
         *   are the drawable's IDs. The value is the drawable instance
         *   reference.
         */
        drawables : function() {
            return this._privates(identifier).drawables;
        },

        /**
         * Export the whole graph to JSON.
         * 
         * @return {Object} The exported graph.
         */
        toJSON : function() {
            var json = {};

            var dataFormat = bui.settings.dataFormat;
            updateJson(json, dataFormat.nodes, {});
            updateJson(json, dataFormat.edges, {});

            var drawables = this._privates(identifier).drawables;

            for (var key in drawables) {
                if (drawables.hasOwnProperty(key) &&
                        drawables[key].includeInJSON !== false) {
                    var drawable = drawables[key];

                    if (drawable.bottomRight !== undefined) {
                        json.nodes.push(drawable.toJSON());
                    } else {
                        json.edges.push(drawable.toJSON());
                    }
                }
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.Graph, bui.Observable);

    /**
     * @namespace
     * Observable properties of the Graph class
     */
    bui.Graph.ListenerType = {
        /** @field */
        add : bui.util.createListenerTypeId(),
        /** @field */
        scale : bui.util.createListenerTypeId()
    };
})(bui);