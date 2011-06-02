(function(bui) {
    // generate a path's arc data parameter
    // http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
    var arcParameter = function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag,
                              x, y) {
        return [rx.toString(),
                ',',
                ry.toString(),
                ' ',
                xAxisRotation,
                ' ',
                largeArcFlag.toString(),
                ',',
                sweepFlag.toString(),
                ' ',
                x.toString(),
                ',',
                y.toString()].join('');
    };

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the rectangular shape
     * @param {Number} height Height of the rectangular shape
     * @param {Number} tr Top border radius of the rectangular shape
     * @param {Number} br Bottom border radius of the rectangular shape
     * @return {String} a path's data attribute
     */
    var generatePathData = function(width, height, tr, br) {
        var data = [];

        // start point in top-middle of the rectangle
        data.push('M' + width / 2 + ',' + 0);

        // next we go to the right
        data.push('H' + (width - tr));

        if (tr > 0) {
            // now we draw the arc in the top-right corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, width, tr));
        }

        // next we go down
        data.push('V' + (height - br));

        if (br > 0) {
            // now we draw the arc in the lower-right corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, width - br,
                    height));
        }

        // now we go to the left
        data.push('H' + br);

        if (br > 0) {
            // now we draw the arc in the lower-left corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, 0, height - br));
        }

        // next we go up
        data.push('V' + tr);

        if (tr > 0) {
            // now we draw the arc in the top-left corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, tr, 0));
        }

        // and we close the path
        data.push('Z');

        return data.join(' ');
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return 'bui.RectangularNode' + RectangularNode.id();
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.SBGNNode
     * @constructor
     */
    bui.RectangularNode = function() {
        bui.SBGNNode.apply(this, arguments);
        this.addType(bui.RectangularNode.ListenerType);

        this.bind(bui.Node.ListenerType.size,
                this._formChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._selectedChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.topRadius,
                this._formChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.bottomRadius,
                this._formChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintRectangularNode();

        this.addClass(bui.settings.css.classes.rectangle);
    };

    bui.RectangularNode.prototype = Object.create(bui.SBGNNode.prototype, {
        _rect : bui.util.createPrototypeValue(null),
        _topRadius : bui.util.createPrototypeValue(0),
        _bottomRadius : bui.util.createPrototypeValue(0),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintRectangularNode : bui.util.createPrototypeValue(
                function() {
            var container = this.nodeGroup();
            this._rect = document.createElementNS(bui.svgns, 'path');
            this._formChanged(this, this.width(), this.height());
            container.appendChild(this._rect);
        }),

        /**
         * @private position / size listener
         */
        _formChanged : bui.util.createPrototypeValue(function() {
            this._rect.setAttributeNS(null, 'd', generatePathData(this.width(),
                    this.height(), this._topRadius, this._bottomRadius));
        }),

        /**
         * @private classes listener
         */
        _classesChanged : bui.util.createPrototypeValue(function(node,
                                                                 classString) {
            this._rect.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private select listener
         */
        _selectedChanged : bui.util.createPrototypeValue(function(node,
                                                                  selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        }),

        /**
         * Set this node's radius for both upper corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        topRadius : bui.util.createPrototypeValue(function(radius) {
            if (radius !== undefined) {
                if (this._topRadius !== radius) {
                    this._topRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.topRadius,
                            [this, radius]);
                }

                return this;
            }

            return this._topRadius;
        }),

        /**
         * Set this node's radius for both lower corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        bottomRadius : bui.util.createPrototypeValue(function(radius) {
            if (radius !== undefined) {
                if (this._bottomRadius !== radius) {
                    this._bottomRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.bottomRadius,
                            [this, radius]);
                }

                return this;
            }

            return this._bottomRadius;
        })
    });

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.RectangularNode.ListenerType = {
        /** @field */
        topRadius : 'bui.RectangularNode.topRadius',
        /** @field */
        bottomRadius : 'bui.RectangularNode.bottomRadius'
    };
})(bui);