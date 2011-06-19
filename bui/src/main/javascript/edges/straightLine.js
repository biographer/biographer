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
     * @private initial paint
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);
        privates.line = document.createElementNS(bui.svgns, 'line');
        privates.container.edgeGroup().appendChild(privates.line);
        this.addClass(bui.settings.css.classes.invisible);
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
        this._privates(identifier).line.setAttributeNS(
                null, 'class', classString);
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        this._privates(identifier).line.parentNode.removeChild(this._line);
    };

    /**
     * @private Source position and size listener
     */
    var sourceDimensionChanged = function(source) {
        var center = source.absoluteCenter();
        var line = this._privates(identifier).line;
        line.setAttributeNS(null, 'x1', center.x);
        line.setAttributeNS(null, 'y1', center.y);
    };

    /**
     * @private Source and target visibility listener
     */
    var endpointVisibilityChanged = function() {
        var source = this.source(), target = this.target();

        this.visible(source !== null && target !== null &&
                source.visible() === true && target.visible() === true);
    };

    /**
     * @private source changed listener
     */
    var sourceChanged = function(drawable, newSource, oldSource) {
        if (oldSource !== null) {
            oldSource.unbindAll(listenerIdentifier(this));
        }

        if (newSource !== null) {
            var listener = sourceDimensionChanged.createDelegate(this);
            newSource.bind(bui.Node.ListenerType.position, listener,
                    listenerIdentifier(this));
            newSource.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this));

            newSource.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
        }

        sourceDimensionChanged.call(this, newSource);
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private Target position and size listener
     */
    var targetDimensionChanged = function(target) {
        var center = target.absoluteCenter();
        var line = this._privates(identifier).line;
        line.setAttributeNS(null, 'x2', center.x);
        line.setAttributeNS(null, 'y2', center.y);
    };

    /**
     * @private target changed listener
     */
    var targetChanged = function(drawable, newTarget, oldTarget) {
        if (oldTarget !== null) {
            oldTarget.unbindAll(listenerIdentifier(this));
        }

        if (newTarget !== null) {
            var listener = targetDimensionChanged.createDelegate(this);
            newTarget.bind(bui.Node.ListenerType.position, listener,
                    listenerIdentifier(this));
            newTarget.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this));

            newTarget.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
        }

        targetDimensionChanged.call(this, newTarget);
        endpointVisibilityChanged.call(this);
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
    bui.StraightLine = function(args){
        args.id = bui.settings.idPrefix.edge + args.id;
        bui.AttachedDrawable.call(this, args);

        this._privates(identifier).container = this.graph();

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

        initialPaint.call(this);
    };

    bui.util.setSuperClass(bui.StraightLine, bui.AttachedDrawable);
})(bui);