(function(bui) {
    var identifier = 'bui.Perturbation';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', width/5, height/2,         // start point in middle left, go clockwise to draw
            'L', 0, height,     // draw / to top
            'L', width, height, //draw _ on top
            'L', (width/5)*4, height/2,     //draw \ to middle right
            'L', width, 0,      //draw / to bottm
            'L', 0, 0,          //draw _ to left
            'L', width/5, height/2, 
            'Z'].join(' '); //draw \ to middle left

        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.path);

        // set as interactable
        interact.set(privates.path,
            {drag: this._enableDragging, resize: this._enableResizing, squareResize: this._forceRectangular});

        // create eventListener delegate functions
        interactDragMove = (function (event) {
            var position = this.position(),
                scale = this.graph().scale();
                
            this.position(position.x + event.detail.dx / scale, position.y + event.detail.dy / scale);
        }).createDelegate(this);

        interactResizeMove = (function (event) {
            var size = this.size(),
                scale = this.graph().scale();
                
            this.size(size.width + event.detail.dx / scale, size.height + event.detail.dy / scale);
        }).createDelegate(this);

        // add event listeners
        privates.path.addEventListener('interactresizemove', interactResizeMove);
        privates.path.addEventListener('interactdragmove', interactDragMove);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Perturbation = function() {
        bui.Perturbation.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        //var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.perturbation);
    };

    bui.Perturbation.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 80,
        _minHeight : 60,
    };

    bui.util.setSuperClass(bui.Perturbation, bui.Labelable);

})(bui);
