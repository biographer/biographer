(function(bui) {
    var identifier = 'bui.AbstractLine';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AbstractLine} abstractLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(abstractLine) {
        return identifier + abstractLine.id();
    };

    /**
     * @private visibility listener
     */
    var visibilityChanged = function(drawable, visible) {
        if (visible === true) {
            this.removeClass(bui.settings.css.classes.invisible);
        } else {
            this.addClass(bui.settings.css.classes.invisible);
        }
    };

    /**
     * @private classes listener
     */
    var classesChanged = function(drawable, classString) {
        this._line.setAttributeNS(
                null, 'class', classString);
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        this._line.parentNode.removeChild(this._line);
    };

    /**
     * @private Source and target visibility listener
     */
    var endpointVisibilityChanged = function() {
        var source = this.source(), target = this.target();

        this.visible(source !== null && target !== null &&
                source.visible() === true && target.visible() === true);
    };

    /**
     * @private source changed listener
     */
    var sourceChanged = function(drawable, newSource, oldSource) {
        if (oldSource !== null) {
            oldSource.unbindAll(listenerIdentifier(this));
        }

        if (newSource !== null) {
            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            newSource.bind(bui.Node.ListenerType.position, listener,
                    listenerIdentifier(this));
            newSource.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this));

            newSource.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
        }

        this._sourceOrTargetDimensionChanged();
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private target changed listener
     */
    var targetChanged = function(drawable, newTarget, oldTarget) {
        if (oldTarget !== null) {
            oldTarget.unbindAll(listenerIdentifier(this));
        }

        if (newTarget !== null) {
            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            newTarget.bind(bui.Node.ListenerType.position, listener,
                    listenerIdentifier(this));
            newTarget.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this));

            newTarget.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
        }

        this._sourceOrTargetDimensionChanged();
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private mouse in listener
     */
    var lineMouseIn = function() {
        if (this.hoverEffect() === true) {
            this.addClass(bui.settings.css.classes.lineHover);

            var marker = this._privates(identifier).marker;
            if (marker !== null) {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(
                                bui.util.getHoverId(marker)
                        ));
            }
        }
    };

    /**
     * @private mouse out listener
     */
    var lineMouseOut = function() {
        this.removeClass(bui.settings.css.classes.lineHover);

        var marker = this._privates(identifier).marker;
        if (marker !== null) {
            this._line.setAttributeNS(null, 'marker-end',
                    bui.util.createMarkerAttributeValue(marker));
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AttachedDrawable
     * @constructor
     * 
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.AbstractLine = function(args){
        args.id = bui.settings.idPrefix.edge + args.id;
        bui.AbstractLine.superClazz.call(this, args);
        this._addType(bui.AbstractLine.ListenerType);

        var privates = this._privates(identifier);
        privates.hoverEffect = true;
        privates.marker = null;

        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                removeListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AbstractLine.ListenerType.marker,
                this._markerChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaint();

        this._line.setAttributeNS(null, 'id', this.id());
        jQuery(this._line).mouseenter(lineMouseIn.createDelegate(this));
        jQuery(this._line).mouseleave(lineMouseOut.createDelegate(this));

        this.addClass(bui.settings.css.classes.line);
    };

    bui.AbstractLine.prototype = {
        /**
         * @private
         * This property should hold the line element
         */
        _line : null,

        /**
         * @private
         * Method to be overridden by sub classes.
         */
        _initialPaint : function() {
            throw 'Not implemented!';
        },

        /**
         * @private
         * Method to be overridden by sub classes.
         */
        _sourceOrTargetDimensionChanged : function() {
            throw 'Not implemented!';
        },

        /**
         * @private
         * Marker changed listener. "Protected" in order to allow subclasses
         * to override the behavior.
         */
        _markerChanged : function(line, marker) {
            if (marker === null) {
                this._line.setAttributeNS(null, 'marker-end', '');
                this._line.removeAttributeNS(null, 'marker-end');
            } else {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(marker));
            }
        },

        /**
         * Set the marker, i.e. a symbol at the end of the line.
         *
         * @param {Object} [markerId] Marker type identification.
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         * @return {bui.AbstractLine|String} The id of the current marker when
         *   you omit the parameter. In case you pass a parameter it will be
         *   set as a new marker and the current instance will be removed
         *   (fluent interface).
         */
        marker : function(markerId) {
            var privates = this._privates(identifier);

            if (markerId !== undefined) {
                if (markerId === null) {
                    privates.marker = null;
                    this.fire(bui.AbstractLine.ListenerType.marker,
                            [this, null]);
                } else {
                    var marker = this.graph().connectingArcs()[markerId];

                    if (marker !== undefined && marker.id !== privates.marker){
                        privates.marker = marker.id;
                        this.fire(bui.AbstractLine.ListenerType.marker,
                                [this, marker.id]);
                    }
                }

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
         * line.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            for (var availableStyle in bui.AbstractLine.Style) {
                if (bui.AbstractLine.Style.hasOwnProperty(availableStyle)) {
                    this.removeClass(bui.AbstractLine.Style[availableStyle]);
                }
            }

            this.addClass(bui.AbstractLine.Style[style]);

            return this;
        },

        /**
         * Enable or disable the line's hover effect.
         *
         * @param {Boolean} [hoverEffect] True to activate hover effects, false
         *   otherwise. Omit to retrieve current setting.
         * @return {Boolean|bui.AbstractLine} Fluent interface in case you pass
         *   a new value, the current value if you omit the parameter.
         */
        hoverEffect : function(hoverEffect) {
            var privates = this._privates(identifier);
            
            if (hoverEffect !== undefined) {
                privates.hoverEffect = hoverEffect;
                return this;
            }

            return privates.hoverEffect;
        }
    };

    bui.util.setSuperClass(bui.AbstractLine, bui.AttachedDrawable);

    /**
     * @namespace
     * Observable properties of the AbstractLine class
     */
    bui.AbstractLine.ListenerType = {
        /** @field */
        marker : bui.util.createListenerTypeId()
    };

    /**
     * @namespace
     * This Object defines the various line styles which can be applied to
     * a line.
     */
    bui.AbstractLine.Style = {
        solid : bui.settings.css.classes.lineStyle.solid,
        dotted : bui.settings.css.classes.lineStyle.dotted,
        dashed : bui.settings.css.classes.lineStyle.dashed
    };
})(bui);