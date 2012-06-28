(function(bui) {
    var identifier = 'bui.Association';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Association} Association
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Association) {
        return identifier + Association.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);

        // set as interactable
        interact.set(privates.circle,
            {drag: this._enableDragging, resize: this._enableResizing, squareResize: this._forceRectangular});

        // create eventListener delegate functions
        interactDragMove = (function (event) {
            var position = this.position(),
                scale = this.graph().scale();

            if ((event.type === 'interactdragmove' && this.graph().highPerformance()) ||
                (event.type === 'interactdragend' && !this.graph().highPerformance())) {
                this.position(position.x + event.detail.dx / scale, position.y + event.detail.dy / scale);
            }
        }).createDelegate(this);

        interactResizeMove = (function (event) {
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
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Association = function() {
        bui.Association.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
        this.addClass('Outcome');// the stylesheet mus fill the circle black
    };

    bui.Association.prototype = {
        identifier : function() {
            return 'Association';
        },
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
        _minWidth : 14,
        _minHeight : 14,
        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
    };

    bui.util.setSuperClass(bui.Association, bui.Node);
})(bui);
