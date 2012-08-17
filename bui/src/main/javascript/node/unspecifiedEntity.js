(function(bui) {
    var identifier = 'bui.UnspecifiedEntity';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnspecifiedEntity} UnspecifiedEntity
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnspecifiedEntity) {
        return identifier + UnspecifiedEntity.id();
    };

    /**
     * @private position / size listener
     */
    var sizeChanged = function(
            node, width, height) {
        var x = width / 2, y = height / 2;
        var privates = this._privates(identifier);
        privates.ellipse.setAttributeNS(null, 'cx', x);
        privates.ellipse.setAttributeNS(null, 'cy', y);

        privates.ellipse.setAttributeNS(null, 'rx', x);
        privates.ellipse.setAttributeNS(null, 'ry', y);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.ellipse = document.createElementNS(bui.svgns, 'ellipse');
        var size = this.size();
        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.ellipse);

        // set as interactable
        interact.set(privates.ellipse,
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
        privates.ellipse.addEventListener('interactresizemove', interactResizeMove);
        privates.ellipse.addEventListener('interactdragmove', interactDragMove);
        privates.ellipse.addEventListener('interactresizeend', interactResizeMove);
        privates.ellipse.addEventListener('interactdragend', interactDragMove);
        
        function interactUnset() {
            interact.unset(privates.ellipse);

            privates.ellipse.removeEventListener('interactresizemove', interactResizeMove);
            privates.ellipse.removeEventListener('interactdragmove', interactDragMove);
            privates.ellipse.removeEventListener('interactresizeend', interactResizeMove);
            privates.ellipse.removeEventListener('interactdragend', interactDragMove);
        }

        this.bind(bui.Drawable.ListenerType.remove,
                interactUnset,
                listenerIdentifier(this));
    };

    /**
     * @class
     * A node with the shape of an ellipse and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.UnspecifiedEntity = function() {
        bui.UnspecifiedEntity.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.UnspecifiedEntity.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 70,
        _minHeight : 50,
    }
    bui.util.setSuperClass(bui.UnspecifiedEntity, bui.Labelable);
})(bui);
