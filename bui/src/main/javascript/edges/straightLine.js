(function(bui) {
    var identifier = 'bui.StraightLine';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StraightLine} straightLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(straightLine) {
        return identifier + straightLine.id();
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.StraightLine = function(args){
        bui.StraightLine.superClazz.apply(this, arguments);
    };

    bui.StraightLine.prototype = {
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            this._line = document.createElementNS(bui.svgns, 'line');
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
                var to = source.calculateLineEnd(target);
                this._line.setAttributeNS(null, 'x1', to.x);
                this._line.setAttributeNS(null, 'y1', to.y);

                to = target.calculateLineEnd(source);
                this._line.setAttributeNS(null, 'x2', to.x);
                this._line.setAttributeNS(null, 'y2', to.y);
            }
        }
    };

    bui.util.setSuperClass(bui.StraightLine, bui.AbstractLine);
})(bui);