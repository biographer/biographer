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
                    (source.visible() === true || source instanceof bui.EdgeHandle) && 
                    (target.visible() === true || target instanceof bui.EdgeHandle));
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
            newSource.bind(bui.Node.ListenerType.absolutePosition, listener,
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
            newTarget.bind(bui.Node.ListenerType.absolutePosition, listener,
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
    var lineMouseIn = function(event) {
        this.hoverEffectActive(true);
        this.fire(bui.AbstractLine.ListenerType.mouseEnter,
                                [this, event]);
    };

    /**
     * @private mouse out listener
     */
    var lineMouseOut = function(event) {
        this.hoverEffectActive(false);
        this.fire(bui.AbstractLine.ListenerType.mouseLeave,
                                [this, event]);
    };

    /**
     * @private hoverEffectActive listener
     */
    var hoverEffectActiveChanged = function(edge, active) {
        var marker;
        if (active === true && this.hoverEffect()) {
            this.addClass(bui.settings.css.classes.lineHover);

            marker = this._privates(identifier).marker;
            if (marker !== null) {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(
                                bui.util.getHoverId(marker)
                        ));
            }
        } else {
            this.removeClass(bui.settings.css.classes.lineHover);

            marker = this._privates(identifier).marker;
            if (marker !== null) {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(marker));
            }
        }
    };

    /**
     * @private line click listener
     */
    var lineClick = function(event) {
        this.fire(bui.AbstractLine.ListenerType.click,
                                [this, event]);
    };

    /**
     * @private line click listener
     */
    var lineMouseDown = function(event) {
        this.fire(bui.AbstractLine.ListenerType.mousedown,
                                [this, event]);
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
        //args.id = bui.settings.idPrefix.edge + args.id;
        bui.AbstractLine.superClazz.call(this, args);
        this._addType(bui.AbstractLine.ListenerType);

        var privates = this._privates(identifier);
        privates.hoverEffect = true;
        privates.marker = null;
        privates.markerId = null;
        privates.hoverEffectActive = false;
        privates.lineStyle = null;

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
        this.bind(bui.AbstractLine.ListenerType.hoverEffectActive,
                hoverEffectActiveChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaint();

        this._line.setAttributeNS(null, 'id', this.id());
        jQuery(this._line).mouseenter(lineMouseIn.createDelegate(this));
        jQuery(this._line).mouseleave(lineMouseOut.createDelegate(this));
        jQuery(this._line).click(lineClick.createDelegate(this));
        jQuery(this._line).mousedown(lineMouseDown.createDelegate(this));

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
                    privates.markerId = null;
                    this.fire(bui.AbstractLine.ListenerType.marker,
                            [this, null]);
                } else {
                    var marker = this.graph().connectingArcs()[markerId];

                    if (marker !== undefined && marker.id !== privates.marker){
                        privates.marker = marker.id;
                        privates.markerId = markerId;
                        this.fire(bui.AbstractLine.ListenerType.marker,
                                [this, marker.id]);
                    }
                }

                return this;
            }

            return privates.markerId;
        },

        /**
         * Get the marker ID, i.e. a symbol at the end of the line.
         *
         * @return {String} The ID of the current marker symbol
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         */
        markerId : function() {
            var privates = this._privates(identifier);

            return privates.markerId;
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

            this._privates(identifier).lineStyle = style;

            this.addClass(bui.AbstractLine.Style[style]);

            return this;
        },

        /**
         * Enable or disable the line's hover effect.
         *
         * @param {Boolean} [hoverEffect] True to enable hover effects, false
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
        },

        /**
         * Show or hide the hover effect.
         *
         * @param {Boolean} [active] True to show the hover effect. Omit to
         *   retrieve whether it is shown or not.
         * @return {Boolean|bui.AbstractLine} If you pass a parameter the
         *   instance on which you called this function will be returned. In
         *   case you don't pass a parameter the current setting will be
         *   returned.
         */
        hoverEffectActive : function(active) {
            var privates = this._privates(identifier);

            if (active !== undefined) {
                // effect may only be shown when hover effects are activated.
                active = active && this.hoverEffect();
                
                if (active !== privates.hoverEffectActive) {
                    privates.hoverEffectActive = active;
                    this.fire(bui.AbstractLine.ListenerType.hoverEffectActive,
                                [this, active]);
                }

                return this;
            }

            return privates.hoverEffectActive;
        },

        // overridden
        toJSON : function() {
            var json = bui.AbstractLine.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.lineStyle !== null &&
                    privates.lineStyle !== bui.AbstractLine.Style.solid) {
                updateJson(json, dataFormat.edge.style, privates.lineStyle);
            }

            if (privates.markerId !== null) {
                var sbo = getSBOForMarkerId(privates.markerId);

                if (sbo !== null) {
                    updateJson(json, dataFormat.drawable.sbo, sbo);
                }
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.AbstractLine, bui.AttachedDrawable);

    /**
     * @namespace
     * Observable properties of the AbstractLine class
     */
    bui.AbstractLine.ListenerType = {
        /** @field */
        marker : bui.util.createListenerTypeId(),
        /** @field */
        click : bui.util.createListenerTypeId(),
        /** @field */
        mousedown : bui.util.createListenerTypeId(),
        /** @field */
        mouseEnter : bui.util.createListenerTypeId(),
        /** @field */
        mouseLeave : bui.util.createListenerTypeId(),
        /** @field */
        hoverEffectActive : bui.util.createListenerTypeId()
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
