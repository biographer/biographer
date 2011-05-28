(function(bui) {

    var placeholderClass = function(visible) {
        var klass = bui.settings.css.classes.placeholder;

        if (visible === false) {
            klass += ' ' + bui.settings.css.classes.invisible;
        }

        return klass;
    };

    /**
     * @class
     * Base class for every drawable node. Please note that nodes shouldn't be
     * instantiated directly.
     *
     * @extends bui.Drawable
     * @constructor
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     * @param {Number} [x] Position on the x-axis. Default is 0.
     * @param {Number} [y] Position on the y-axis. Default is 0.
     * @param {Number} [width] Width of the node. Default is 0.
     * @param {Number} [height] Height of the node. Default is 0.
     */
    bui.Node = function(id, graph, x, y, width, height) {
        id = bui.settings.idPrefix.node + id;
        bui.Drawable.call(this, id, graph);
        this.addType(bui.Node.ListenerType);

        this._x = x !== undefined ? x : 0;
        this._y = y !== undefined ? y : 0;
        this._width = width !== undefined ? width : 0;
        this._height = height !== undefined ? height : 0;

        this._initialPaintNode();
    };

    bui.Node.prototype = Object.create(bui.Drawable.prototype, {
        _x : bui.util.createPrototypeValue(null),
        _y : bui.util.createPrototypeValue(null),
        _width : bui.util.createPrototypeValue(null),
        _height : bui.util.createPrototypeValue(null),
        _placeholder : bui.util.createPrototypeValue(null),

        /**
         * @private
         * Initial paint of the placeholder node
         */
        _initialPaintNode : bui.util.createPrototypeValue(function() {
            var placeholderContainer = this.graph().placeholderContainer();

            this._placeholder = document.createElement('div');
            this._placeholder.setAttribute('class', placeholderClass(false));
            placeholderContainer.appendChild(this._placeholder);
            this._nodeSizeChanged();
            this._nodePositionChanged();

            this.bind(bui.Node.ListenerType.position,
                    this._nodePositionChanged.createDelegate(this),
                    'placeholder');
            this.bind(bui.Node.ListenerType.size,
                    this._nodeSizeChanged.createDelegate(this),
                    'placeholder');

            jQuery(this._placeholder).draggable({
                stop : this._placeholderDragStop.createDelegate(this)
            });

            jQuery(this._placeholder).resizable({
                stop : this._placeholderResizeStop.createDelegate(this)
            });
        }),

        /**
         * @private size change listener
         */
        _nodeSizeChanged : bui.util.createPrototypeValue(function() {
            var rootOffset = this.graph().rootOffset();
            this._placeholder.style.width = (this._width +
                    rootOffset.x) +'px';
            this._placeholder.style.height = (this._height +
                    rootOffset.y) + 'px';
        }),

        /**
         * @private position change listener
         */
        _nodePositionChanged : bui.util.createPrototypeValue(function() {
            this._placeholder.style.left = this._x + 'px';
            this._placeholder.style.top = this._y + 'px';
        }),

        /**
         * @private placeholder drag stop listener
         */
        _placeholderDragStop : bui.util.createPrototypeValue(function() {
            var placeholderOffset = jQuery(this._placeholder).offset();
            var rootOffset = this.graph().rootOffset();

            var x = Math.max(placeholderOffset.left - rootOffset.x, 0);
            var y = Math.max(placeholderOffset.top - rootOffset.y, 0);

            this.position(x, y);
        }),

        /**
         * @private placeholder resize stop listener
         */
        _placeholderResizeStop : bui.util.createPrototypeValue(function() {
            var width = jQuery(this._placeholder).width();
            var height = jQuery(this._placeholder).height();

            this.size(width, height);
        }),

        /**
         * @description
         * Set or retrieve the node's position on the x-axis.
         *
         * @param {Number} [x] The new x-axis position.
         * @return {bui.Node|Number} Fluent interface in case a parameter
         *   is given. The current x-axis position is returned otherwise.
         */
        x : bui.util.createPrototypeValue(function(x) {
            if (x !== undefined) {
                if (x !== this._x) {
                    this._x = x;
                    this.fire(bui.Node.ListenerType.position,
                            [this, this._x, this._y]);
                }
                return this;
            }
            return this._x;
        }),

        /**
         * @description
         * Set or retrieve the node's position on the y-axis.
         *
         * @param {Number} [y] The new y-axis position.
         * @return {bui.Node|Number} Fluent interface in case a parameter
         *   is given. The current y-axis position is returned otherwise.
         */
        y : bui.util.createPrototypeValue(function(y) {
            if (y !== undefined) {
                if (y !== this._y) {
                    this._y = y;
                    this.fire(bui.Node.ListenerType.position,
                            [this, this._x, this._y]);
                }
                return this;
            }
            return this._y;
        }),

        /**
         * @description
         * Set or retrieve the node's position.
         *
         * You can set the position by passing both, the x- and y-axis value
         * to this function. If you pass only one parameter or none, the
         * current position is returned.
         *
         * @param {Number} [x] The new x-axis position.
         * @param {Number} [y] The new y-axis position.
         * @return {bui.Node|Object} Fluent interface in case both parameters
         *   are given. If only one or no parameter is provided the current
         *   position will be returned as an object with x and y properties.
         */
        position : bui.util.createPrototypeValue(function(x, y) {
            if (x !== undefined && y !== undefined) {
                var changed = this._x !== x || this._y !== y;
                this._x = x;
                this._y = y;

                if (changed) {
                    this.fire(bui.Node.ListenerType.position,
                            [this, this._x, this._y]);
                }

                return this;
            }

            return {
                x : this._x,
                y : this._y
            };
        }),

        /**
         * @description
         * Set or retrieve the node's width.
         *
         * @param {Number} [width] The new width.
         * @return {bui.Node|Number} Fluent interface in case a parameter
         *   is given. The current width is returned otherwise.
         */
        width : bui.util.createPrototypeValue(function(width) {
            if (width !== undefined) {
                if (width !== this._width) {
                    this._width = width;
                    this.fire(bui.Node.ListenerType.size,
                            [this, this._width, this._height]);
                }
                return this;
            }
            return this._width;
        }),

        /**
         * @description
         * Set or retrieve the node's height.
         *
         * @param {Number} [height] The new height.
         * @return {bui.Node|Number} Fluent interface in case a parameter
         *   is given. The current height is returned otherwise.
         */
        height : bui.util.createPrototypeValue(function(height) {
            if (height !== undefined) {
                if (height !== this._height) {
                    this._height = height;
                    this.fire(bui.Node.ListenerType.size,
                            [this, this._width, this._height]);
                }
                return this;
            }
            return this._height;
        }),

        /**
         * @description
         * Set or retrieve the node's size.
         *
         * You can set the size by passing both, the width and height value
         * to this function. If you pass only one parameter or none, the
         * current size is returned.
         *
         * @param {Number} [width] The new width.
         * @param {Number} [height] The new height.
         * @return {bui.Node|Object} Fluent interface in case both parameters
         *   are given. If only one or no parameter is provided the current
         *   size will be returned as an object with width and height
         *   properties.
         */
        size : bui.util.createPrototypeValue(function(width, height) {
            if (width !== undefined && height !== undefined) {
                var changed = this._width !== width || this._height !== height;
                this._width = width;
                this._height = height;

                if (changed) {
                    this.fire(bui.Node.ListenerType.size,
                            [this, this._width, this._height]);
                }

                return this;
            }

            return {
                width : this._width,
                height : this._height
            };
        }),

        /**
         * @description
         * Use this function to retrieve the top-left corner of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        topLeft : bui.util.createPrototypeValue(function() {
            return {
                x : this._x,
                y : this._y
            };
        }),

        /**
         * @description
         * Use this function to retrieve the bottom-right corner of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        bottomRight : bui.util.createPrototypeValue(function() {
            return {
                x : this._x + this._width,
                y : this._y + this._height
            };
        }),

        /**
         * @description
         * Use this function to retrieve the center of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        center : bui.util.createPrototypeValue(function() {
            return {
                x : this._x + (this._width / 2),
                y : this._y + (this._height / 2)
            };
        }),

        /**
         * @description
         * Use this function to move the relative to its current position.
         *
         * @param {Number} x Relative change on the x-axis.
         * @param {Number} y Relative change on the y-axis.
         * @param {Boolean} [duration] Whether this movement should be animated
         *   and how long this animation should run. When omitted or a value
         *   <= 0 is passed the movement will be executed immediately.
         * @return {bui.Node} Fluent interface.
         */
        move : bui.util.createPrototypeValue(function(x, y, duration) {
            if (duration === undefined || duration <= 0) {
                this.position(this._x + x, this._y + y);
            } else {
                throw "Not implemented.";
            }

            return this;
        })
    });

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.Node.ListenerType = {
        /** @field */
        position : 'bui.Node.position',
        /** @field */
        size : 'bui.Node.size'
    };
})(bui);