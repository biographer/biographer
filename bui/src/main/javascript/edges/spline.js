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
        },

        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
            var target = this.target(),
                    source = this.source();

            if (target !== null && source !== null) {

                // TODO change to sourceSplineHandle absoluteCenter
                var sourcePosition = source.calculateLineEnd(target),
                        targetPosition = target.calculateLineEnd(source),
                        sourceSplineHandle = { x : sourcePosition.x + 20, y : sourcePosition.y + 20},
                        targetSplineHandle = { x : targetPosition.x - 20, y : targetPosition.y - 20};
                
                var data = ['M',
                        sourcePosition.x,
                        sourcePosition.y,
                        'C',
                        sourceSplineHandle.x,
                        sourceSplineHandle.y,
                        targetSplineHandle.x,
                        targetSplineHandle.y,
                        targetPosition.x,
                        targetPosition.y].join(' ');


                this._line.setAttributeNS(null, 'd', data);
            }
        }
    };

    bui.util.setSuperClass(bui.Spline, bui.AbstractLine);
})(bui);