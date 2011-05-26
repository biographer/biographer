(function(bui) {
    bui.Node = function(id, graph, x, y, width, height) {
        bui.Drawable.apply(this, arguments);
        this.addType(bui.Node.ListenerType);

        this._x = x != undefined ? x : null;
        this._y = y != undefined ? y : null;
        this._width = width != undefined ? width : null;
        this._height = height != undefined ? height : null;
    };

    bui.Node.prototype = Object.create(bui.Drawable.prototype, {
        _x : bui.util.createPrototypeValue(null),
        _y : bui.util.createPrototypeValue(null),
        _width : bui.util.createPrototypeValue(null),
        _height : bui.util.createPrototypeValue(null),

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

        topLeft : bui.util.createPrototypeValue(function() {
            return {
                x : this._x,
                y : this._y
            };
        }),

        bottomRight : bui.util.createPrototypeValue(function() {
            return {
                x : this._x + this._width,
                y : this._y + this._height
            };
        }),

        center : bui.util.createPrototypeValue(function() {
            return {
                x : this._x + (this._width / 2),
                y : this._y + (this._height / 2)
            };
        }),

        move : bui.util.createPrototypeValue(function(x, y, animate) {
            if (animate !== true) {
                animate = false;
            } else {
                throw "Not implemented.";
            }
        })
    });

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.Node.ListenerType = {
        position : 'bui.Node.position',
        size : 'bui.Node.size'
    };
})(bui);