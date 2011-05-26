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
        this._initialPaint();
        this._drawables = {};
    };

    bui.Graph.prototype = Object.create(bui.Observable.prototype, {
        _container : bui.util.createPrototypeValue(null),
        _root : bui.util.createPrototypeValue(null),
        _rootGroup : bui.util.createPrototypeValue(null),
        _scale : bui.util.createPrototypeValue(1),
        _id : bui.util.createPrototypeValue(null),
        _idCounter : bui.util.createPrototypeValue(0),
        _drawables : bui.util.createPrototypeValue(null),

        /**
         * @private
         * Extracted from the constructor to improve readability
         */
        _initialPaint : bui.util.createPrototypeValue(function() {
            this._root = document.createElementNS(bui.svgns, 'svg');
            this._root.setAttributeNS(bui.svgns, 'id', this._id);
            this._container.appendChild(this._root);

            this._rootGroup = document.createElementNS(bui.svgns, 'g');
            this._setTransformString();
            this._root.appendChild(this._rootGroup);
        }),

        /**
         * @private
         * Used to generate the transform attribute value of the _rootGroup
         * element. Extracted to a function as this may be required several
         * times.
         */
        _setTransformString : bui.util.createPrototypeValue(function() {
            var value = ['scale(', this._scale.toString(), ')'].join('');

            this._rootGroup.setAttributeNS(bui.svgns, 'transform', value);
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
                    this._removed.createDelegate(this), this._id);

            this.fire(bui.Graph.ListenerType.add, [drawable]);

            return drawable;
        }),

        /**
         * @private
         * Generic drawable remove listener.
         */
        _removed : bui.util.createPrototypeValue(function(drawable) {
            delete this._drawables[drawable.id()];
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