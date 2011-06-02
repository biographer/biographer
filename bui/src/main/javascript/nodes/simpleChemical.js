(function(bui) {

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.SimpleChemical} SimpleChemical
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(SimpleChemical) {
        return 'bui.SimpleChemical' + SimpleChemical.id();
    };

    /**
     * @class
     * Class for SBGN simple chemicals. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.SBGNNode
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
    bui.SimpleChemical = function(id, graph, x, y, width, height) {
        if (width !== height) {
            throw 'Width and height must be equal for ' +
                            'simple chemicals.';
        }
        bui.SBGNNode.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                this._simpleChemicalSizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                this._simpleChemicalClassesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                this._simpleChemicalSelectedChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaintSimpleChemical();
    };

    bui.SimpleChemical.prototype = Object.create(bui.SBGNNode.prototype, {
        _circle : bui.util.createPrototypeValue(null),
        _preserveAspectRatio : bui.util.createPrototypeValue(true),

        /**
         * @private used from the constructor to improve readability
         */
        _initialPaintSimpleChemical : bui.util.createPrototypeValue(
                function() {
            var container = this.nodeGroup();
            this._circle = document.createElementNS(bui.svgns, 'circle');
            this._simpleChemicalSizeChanged(this, this.width());
            container.appendChild(this._circle);
        }),

        _simpleChemicalSizeChanged : bui.util.createPrototypeValue(
                function(node, width) {
            var r = width / 2;

            this._circle.setAttributeNS(null, 'cx', r);
            this._circle.setAttributeNS(null, 'cy', r);
            this._circle.setAttributeNS(null, 'r', r);
        }),

        /**
         * @private classes listener
         */
        _simpleChemicalClassesChanged : bui.util.createPrototypeValue(
                function(node, classString) {
            this._circle.setAttributeNS(null, 'class', classString);
        }),

        /**
         * @private select listener
         */
        _simpleChemicalSelectedChanged : bui.util.createPrototypeValue(
                function(node, selected) {
            if (selected) {
                this.addClass(bui.settings.css.classes.selected);
            } else {
                this.removeClass(bui.settings.css.classes.selected);
            }
        }),

        /*
         * documented in super class. Method overriden to preserve aspect
         * ratio.
         */
        width : bui.util.createPrototypeValue(function(width) {
            if (width !== undefined) {
                bui.SBGNNode.prototype.position.call(this,
                        width, width);
                return this;
            } else {
                return bui.SBGNNode.prototype.width.call(this);
            }
        }),

        /*
         * documented in super class. Method overriden to preserve aspect
         * ratio.
         */
        height : bui.util.createPrototypeValue(function(height) {
            if (height !== undefined) {
                bui.SBGNNode.prototype.position.call(this,
                        height, height);
                return this;
            } else {
                return bui.SBGNNode.prototype.height.call(this);
            }
        }),

        /*
         * documented in super class. Method overriden to preserve aspect
         * ratio.
         */
        size : bui.util.createPrototypeValue(function(width, height) {
            if (width !== undefined && height !== undefined) {
                if (width !== height && Math.abs(width - height) > 10) {
                    throw 'Width and height must be equal for ' +
                            'simple chemicals.';
                }

                bui.SBGNNode.prototype.size.call(this,
                        width, width);

                return this;
            } else {
                return bui.SBGNNode.prototype.size.call(this);
            }
        })
    });
})(bui);