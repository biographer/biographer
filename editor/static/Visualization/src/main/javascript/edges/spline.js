(function(bui) {
    var identifier = 'bui.Spline';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Spline} spline
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(spline) {
        return identifier + spline.id();
    };

    /**
     * @private
     * Source changed event listener
     */
    var sourceChanged = function(node, source) {
        var privates = this._privates(identifier);
        privates.sourceHelperLine.target(source);
    };

    /**
     * @private
     * Target changed event listener
     */
    var targetChanged = function(node, target) {
        var privates = this._privates(identifier);
        privates.targetHelperLine.target(target);
    };

    /**
     * @private
     * Visibility changed event listener
     */
    var visibilityChanged = function(node, visible) {
        if (visible === false) {
            this.layoutElementsVisible(false);
        }
    };

    /**
     * @private mouse click listener
     */
    var lineMouseClick = function(event) {
        if (event.ctrlKey === true) {
            this.layoutElementsVisible(!this.layoutElementsVisible());
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.Spline = function(args){
        bui.Spline.superClazz.apply(this, arguments);

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

    bui.Spline.prototype = {
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            privates.layoutElementsVisible = true;
            this._line = document.createElementNS(bui.svgns, 'path');
            this.graph().edgeGroup().appendChild(this._line);
            this.addClass(bui.settings.css.classes.invisible);

            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            privates.sourceSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(privates.layoutElementsVisible);
            privates.targetSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(privates.layoutElementsVisible);

            privates.sourceHelperLine = this.graph()
                    .add(bui.StraightLine)
                    .lineStyle(bui.AbstractLine.Style.dotted)
                    .hoverEffect(false)
                    .source(privates.sourceSplineHandle)
                    .visible(privates.layoutElementsVisible);

            privates.targetHelperLine = this.graph()
                    .add(bui.StraightLine)
                    .lineStyle(bui.AbstractLine.Style.dotted)
                    .hoverEffect(false)
                    .source(privates.targetSplineHandle)
                    .visible(privates.layoutElementsVisible);

            jQuery(this._line).click(lineMouseClick.createDelegate(this));
        },

        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
            var target = this.target(),
                    source = this.source();

            if (target !== null && source !== null) {

                var privates = this._privates(identifier);
                var sourceSplineHandle = privates.sourceSplineHandle,
                        targetSplineHandle = privates.targetSplineHandle;

                var sourcePosition = source
                        .calculateLineEnd(sourceSplineHandle),
                        targetPosition = target
                                .calculateLineEnd(targetSplineHandle),
                        sourceSplineHandlePosition = sourceSplineHandle
                                .absoluteCenter(),
                        targetSplineHandlePosition = targetSplineHandle
                                .absoluteCenter();
                
                var data = ['M',
                        sourcePosition.x,
                        sourcePosition.y,
                        'C',
                        sourceSplineHandlePosition.x,
                        sourceSplineHandlePosition.y,
                        targetSplineHandlePosition.x,
                        targetSplineHandlePosition.y,
                        targetPosition.x,
                        targetPosition.y].join(' ');


                this._line.setAttributeNS(null, 'd', data);
            }
        },

        /**
         * Show or hide the layout elements of this Spline. The layout
         * elements include two edgeSplineHandles and two lines. The handles
         * are used to modify the shape of the line while the two lines are
         * used as visual assistance.
         *
         * @param {Boolean} [visible] Pass true to show layout elements, false
         *   to hide them.
         * @return {bui.Spline|Boolean} Fluent interface in case you don't pass
         *   a parameter, the current visibility otherwise.
         */
        layoutElementsVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.layoutElementsVisible = visible;

                privates.sourceSplineHandle.visible(visible);
                privates.targetSplineHandle.visible(visible);
                privates.sourceHelperLine.visible(visible);
                privates.targetHelperLine.visible(visible);

                return this;
            }

            return privates.layoutElementsVisible;
        }
    };

    bui.util.setSuperClass(bui.Spline, bui.AbstractLine);
})(bui);