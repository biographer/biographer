(function(bui) {
    var identifier = 'bui.SimpleChemical';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.SimpleChemical} SimpleChemical
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(SimpleChemical) {
        return identifier + SimpleChemical.id();
    };

    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        container.appendChild(privates.circle);

        // set as interactable
        interact.set(privates.circle,
            {drag: this._enableDragging, resize: this._enableResizing, squareResize: this._forceRectangular, squareResize: this._forceRectangular});

        // create eventListener delegate functions
        var interactDragMove = (function (event) {
            var position = this.position(),
                scale = this.graph().scale();

            if ((event.type === 'interactdragmove' && this.graph().highPerformance()) ||
                (event.type === 'interactdragend' && !this.graph().highPerformance())) {
                this.position(position.x + event.detail.dx / scale, position.y + event.detail.dy / scale);
            }
        }).createDelegate(this);

        var interactResizeMove = (function (event) {
            var size = this.size(),
                scale = this.graph().scale();
            
            if ((event.type === 'interactresizemove' && this.graph().highPerformance()) ||
                (event.type === 'interactresizeend' && !this.graph().highPerformance())) {
                this.size(size.width + event.detail.dx / scale, size.height + event.detail.dy / scale);
            }
        }).createDelegate(this);

        // add event listeners
        privates.circle.addEventListener('interactresizemove', interactResizeMove);
        privates.circle.addEventListener('interactdragmove', interactDragMove);
        privates.circle.addEventListener('interactresizeend', interactResizeMove);
        privates.circle.addEventListener('interactdragend', interactDragMove);

        function interactUnset() {
            interact.unset(privates.circle);

            privates.circle.removeEventListener('interactresizemove', interactResizeMove);
            privates.circle.removeEventListener('interactdragmove', interactDragMove);
            privates.circle.removeEventListener('interactresizeend', interactResizeMove);
            privates.circle.removeEventListener('interactdragend', interactDragMove);
        }

        this.bind(bui.Drawable.ListenerType.remove,
                interactUnset,
                listenerIdentifier(this));
    };

    /**
     * @class
     * Class for SBGN simple chemicals. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.SimpleChemical = function() {
        bui.SimpleChemical.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.SimpleChemical.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.SimpleChemical, bui.Labelable);
})(bui);
