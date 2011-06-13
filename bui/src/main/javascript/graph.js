(function(bui) {
    // used to identify and compare the graph instances
    var graphCounter = 0;

    // will hold generator function to create drawable objects with a variable
    // amount of arguments. These arguments can be passed as an array.
    var drawableGenerator = {};

    /**
     * @private
     * Retrieve the generator function for a drawable.
     *
     * @param {Function} constructor The constructor of a drawable
     * @return {Function} A function which can be called to generate the
     *   object
     */
    var getGenerator = function(constructor) {
        var existingGenerator = drawableGenerator[constructor];
        if (existingGenerator !== undefined) {
            return existingGenerator;
        } else {
            var F = function(args) {
                return constructor.apply(this, args);
            };

            F.prototype = constructor.prototype;

            var generator = function(args) {
                return new F(args);
            };

            drawableGenerator[constructor] = generator;
            return generator;
        }
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Graph} graph
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(graph) {
        return 'bui.Graph' + graph.id();
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
        bui.Observable.call(this);

        this.addType(bui.Graph.ListenerType);
        this._id = bui.settings.idPrefix.graph + graphCounter++;
        this._container = container;
        this._initialPaintGraph();
        this._drawables = {};
    };

    bui.Graph.prototype = Object.create(bui.Observable.prototype, {
        _container : bui.util.createPrototypeValue(null),
        _root : bui.util.createPrototypeValue(null),
        _rootOffset : bui.util.createPrototypeValue(null),
        _rootDimensions : bui.util.createPrototypeValue(null),
        _css : bui.util.createPrototypeValue(null),
        _rootGroup : bui.util.createPrototypeValue(null),
        _nodeGroup : bui.util.createPrototypeValue(null),
        _edgeGroup : bui.util.createPrototypeValue(null),
        _placeholderContainer : bui.util.createPrototypeValue(null),

        _scale : bui.util.createPrototypeValue(1),
        _id : bui.util.createPrototypeValue(null),
        _idCounter : bui.util.createPrototypeValue(0),
        _drawables : bui.util.createPrototypeValue(null),

        /**
         * @private
         * Extracted from the constructor to improve readability
         */
        _initialPaintGraph : bui.util.createPrototypeValue(function() {
            this._root = document.createElementNS(bui.svgns, 'svg');
            this._root.setAttributeNS(null, 'id', this._id);
            this._container.appendChild(this._root);

            var offset = jQuery(this._root).offset();
            this._rootOffset = {
                x : offset.left,
                y : offset.top
            };

            this._rootDimensions = {
                width : jQuery(this._root).width(),
                height : jQuery(this._root).height()
            };

            this._css = document.createElementNS(bui.svgns, 'style');
            this._css.setAttributeNS(null, 'type', 'text/css');
            this._css.textContent = '@import url(\'' +
                    bui.settings.css.stylesheetUrl + '\');';
            this._root.appendChild(this._css);

            this._rootGroup = document.createElementNS(bui.svgns, 'g');
            this._setTransformString();
            this._root.appendChild(this._rootGroup);

            this._nodeGroup = document.createElementNS(bui.svgns, 'g');
            this._rootGroup.appendChild(this._nodeGroup);

            this._edgeGroup = document.createElementNS(bui.svgns, 'g');
            this._rootGroup.appendChild(this._edgeGroup);

            this._placeholderContainer = document.createElement('div');
            document.getElementsByTagName('body')[0]
                    .appendChild(this._placeholderContainer);
        }),

        /**
         * @private
         * Used to generate the transform attribute value of the _rootGroup
         * element. Extracted to a function as this may be required several
         * times.
         */
        _setTransformString : bui.util.createPrototypeValue(function() {
            var value = ['scale(', this._scale.toString(), ')'].join('');

            this._rootGroup.setAttributeNS(null, 'transform', value);
        }),

        /**
         * @description
         * Retrieve the graph's id.
         *
         * @return {String} graph id.
         */
        id : bui.util.createPrototypeValue(function() {
            return this._id;
        }),

        /**
         * Retrieve the SVG element's offset relative to the document
         *
         * @return {Object} an object with x and y properties
         */
        rootOffset : bui.util.createPrototypeValue(function() {
            return this._rootOffset;
        }),

        /**
         * @description
         * Retrieve the container which was provided to this object during
         * the creation.
         * 
         * @return {HTMLElement} The container of this graph
         */
        container : bui.util.createPrototypeValue(function() {
            return this._container;
        }),

        /**
         * @description
         * Retrieve the container for placeholder elements. Placeholder
         * elements are used while dragging or resizing to improve performance.
         *
         * @return {HTMLDIVElement} The container for placeholder elements
         */
        placeholderContainer : bui.util.createPrototypeValue(function() {
            return this._placeholderContainer;
        }),

        /**
         * @description
         * Retrieve the SVG group element in which all egdes are placed.
         *
         * @return {SVGGElement} Edge container
         */
        edgeGroup : bui.util.createPrototypeValue(function() {
            return this._edgeGroup;
        }),

        /**
         * @description
         * Retrieve the SVG group element in which all nodes are placed.
         *
         * @return {SVGGElement} Node container
         */
        nodeGroup : bui.util.createPrototypeValue(function() {
            return this._nodeGroup;
        }),

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
        suspendRedraw : bui.util.createPrototypeValue(function(duration) {
            return this._root.suspendRedraw(duration);
        }),

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
        unsuspendRedraw : bui.util.createPrototypeValue(function(handle) {
            if (handle !== undefined) {
                this._root.unsuspendRedraw(handle);
            } else {
                this._root.unsuspendRedrawAll();
            }

            return this;
        }),

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
        scale : bui.util.createPrototypeValue(function(scale) {
            if (scale !== undefined) {
                if (scale !== this._scale) {
                    this._scale = scale;

                    this._setTransformString();

                    this.fire(bui.Graph.ListenerType.scale, [this, scale]);
                }

                return this;
            }

            return this._scale;
        }),

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
        add : bui.util.createPrototypeValue(function(constructor, params) {
            var drawable = null;
            var id = this._idCounter++;

            if (params === undefined) {
                drawable = new constructor(id, this);
            } else {
                params.unshift(id, this);
                drawable = getGenerator(constructor)(params);
            }

            this._drawables[drawable.id()] = drawable;

            drawable.bind(bui.Drawable.ListenerType.remove,
                    this._removed.createDelegate(this),
                    listenerIdentifier(this));

            // every node type has a bottomRight property. We use this to
            // identify them.
            if (drawable.bottomRight !== undefined) {
                drawable.bind(bui.Node.ListenerType.position,
                        this._assertCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                drawable.bind(bui.Node.ListenerType.size,
                        this._assertCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                this._assertCanvasSize(drawable);
            }

            this.fire(bui.Graph.ListenerType.add, [drawable]);

            return drawable;
        }),

        /**
         * @private
         * Generic drawable remove listener.
         */
        _removed : bui.util.createPrototypeValue(function(drawable) {
            delete this._drawables[drawable.id()];
        }),

        /**
         * @private
         * This function makes sure that each nodes fits onto the SVG canvas.
         * In order to do so it's a observer of the nodes' position and size
         * events.
         */
        _assertCanvasSize : bui.util.createPrototypeValue(function(node) {
            var bottomRight = node.bottomRight();

            if (bottomRight.x > this._rootDimensions.width) {
                this._rootDimensions.width = bottomRight.x;
                this._root.setAttribute('width', bottomRight.x);
            }

             if (bottomRight.y > this._rootDimensions.height) {
                this._rootDimensions.height = bottomRight.y;
                this._root.setAttribute('height', bottomRight.y);
            }
        }),

        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        reduceCanvasSize : bui.util.createPrototypeValue(function() {
            var x = Integer.MIN_VALUE, y = Integer.MIN_VALUE;

            for(var i in this._drawables) {
                if (this._drawables.hasOwnProperty(i)) {
                    var drawable = this._drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        var bottomRight = drawable.bottomRight();

                        x = Math.max(x, bottomRight.x);
                        y = Math.max(y, bottomRight.y);
                    }
                }
            }

            this._rootDimensions.width = x;
            this._root.setAttribute('width', x);

            this._rootDimensions.height = y;
            this._root.setAttribute('height', y);
        })
    });

    /**
     * @namespace
     * Observable properties of the Graph class
     */
    bui.Graph.ListenerType = {
        /** @field */
        add : 'bui.Graph.add',
        /** @field */
        scale : 'bui.Graph.scale'
    };
})(bui);