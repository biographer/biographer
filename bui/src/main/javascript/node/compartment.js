(function(bui) {
    var identifier = 'bui.Compartment';
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Compartment} Compartment
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Compartment) {
        return identifier + Compartment.id();
    };

    /**
     * @private size changed listener
     */
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier);
        privates.rect.setAttributeNS(null, 'width', width);
        privates.rect.setAttributeNS(null, 'height', height);
    };
    
    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint= function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);

        privates.rect = document.createElementNS(bui.svgns, 'rect');

        var cornerRadius = bui.settings.style.compartmentCornerRadius;
        privates.rect.setAttributeNS(null, 'rx', cornerRadius.x);
        privates.rect.setAttributeNS(null, 'ry', cornerRadius.y);

        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.rect);

        // set as interactable
        interact.set(privates.rect,
            {drag: this._enableDragging, resize: this._enableResizing});

        // create eventListener delegate functions
        interactDragMove = (function (event) {
            var position = this.position();
            this.position(position.x + event.detail.dx, position.y + event.detail.dy);
        }).createDelegate(this);

        interactResizeMove = (function (event) {
            var size = this.size();
            this.size(size.width + event.detail.dx, size.height + event.detail.dy);
        }).createDelegate(this);

        // add event listeners
        privates.rect.addEventListener('interactresizemove', interactResizeMove);
        privates.rect.addEventListener('interactdragmove', interactDragMove);
    };

    /**
     * @class
     * Class for SBGN compartmentes.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Compartment = function() {
        bui.Compartment.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.compartment);

        var label = this.graph()
                .add(bui.Labelable)
                .parent(this)
                .visible(true)
                .adaptSizeToLabel(true);
        label.includeInJSON = false;
        this._privates(identifier).label = label;
    };

    bui.Compartment.prototype = {
        identifier : function() {
            return 'Compartment';
        },
        _minWidth : 90,
        _minHeight : 90,
        /**
         * Set or retrieve this node's label. The function call will be
         * delegated to {@link bui.Labelable#label}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Labelable#label
         */
        label : function() {
            var label = this._privates(identifier).label;
            return label.label.apply(label, arguments);
        },

        /**
         * Set or retrieve this node's label position. The function call will
         * be delegated to {@link bui.Node#position}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Node#position
         */
        labelPosition : function() {
            var label = this._privates(identifier).label;
            return label.position.apply(label, arguments);
        },
        toJSON : function() {
            var json = bui.Compartment.superClazz.prototype.toJSON.call(this),
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat;
            updateJson(json, dataFormat.node.label, privates.label.label());

            return json;
        }
    };

    bui.util.setSuperClass(bui.Compartment, bui.Node);
})(bui);
