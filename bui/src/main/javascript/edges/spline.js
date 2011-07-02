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
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.Spline = function(args){
        bui.Spline.superClazz.apply(this, arguments);
    };

    bui.Spline.prototype = {
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
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
                    .visible(true);
            privates.targetSplineHandle = this.graph()
                    .add(bui.SplineEdgeHandle)
                    .bind(bui.Node.ListenerType.absolutePosition,
                            listener,
                            listenerIdentifier(this))
                    .visible(true);
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

                var sourcePosition = source.calculateLineEnd(sourceSplineHandle),
                        targetPosition = target.calculateLineEnd(targetSplineHandle),
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
        }
    };

    bui.util.setSuperClass(bui.Spline, bui.AbstractLine);
})(bui);