(function(bui) {
      /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AttachedDrawable} attachedDrawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(attachedDrawable) {
        return 'bui.AttachedDrawable' + attachedDrawable.id();
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.Drawable
     * @constructor
     */
    bui.AttachedDrawable = function(){
        bui.Drawable.apply(this, arguments);
        this.addType(bui.AttachedDrawable.ListenerType);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                this._attachedDrawableSourceBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                this._attachedDrawableTargetBindListener.createDelegate(this),
                listenerIdentifier(this));
    };

    bui.AttachedDrawable.prototype = Object.create(bui.Drawable.prototype, {
        _source : bui.util.createPrototypeValue(null),
        _target : bui.util.createPrototypeValue(null),

        /**
         * Change the source of this attached drawable.
         *
         * @param {bui.Node} [source] The new source or omit if you would
         *   like to retrieve the current source.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current source is returned.
         */
        source : bui.util.createPrototypeValue(function(source) {
            if (source !== undefined) {
                if (source !== this._source) {
                    var oldSource = this._source;
                    this._source = source;
                    this.fire(bui.AttachedDrawable.ListenerType.source,
                            [this, this._source, oldSource]);
                }

                return this;
            }

            return this._source;
        }),

        /**
         * Change the target of this attached drawable.
         *
         * @param {bui.Node} [target] The new target or omit if you would
         *   like to retrieve the current target.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current target is returned.
         */
        target : bui.util.createPrototypeValue(function(target) {
            if (target !== undefined) {
                if (target !== this._target) {
                    var oldTarget = this._target;
                    this._target = target;
                    this.fire(bui.AttachedDrawable.ListenerType.target,
                            [this, this._target, oldTarget]);
                }

                return this;
            }

            return this._target;
        }),

        /**
         * @private Source remove listener
         */
        _attachedDrawableSourceRemoveListener : bui.util.createPrototypeValue(
                function() {
            this.source(null);
        }),

        /**
         * @private Source remove listener
         */
        _attachedDrawableTargetRemoveListener : bui.util.createPrototypeValue(
                function() {
            this.target(null);
        }),

        /**
         * @private Generic listener which will unbind previous listener
         * for the source node.
         */
        _attachedDrawableSourceBindListener : bui.util.createPrototypeValue(
                function(attached, newX, oldX) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    this._attachedDrawableSourceRemoveListener.createDelegate(
                            this), listenerIdentifier(this));
            oldX.unbindAll(listenerIdentifier(this));
        }),

        /**
         * @private Generic listener which will unbind previous listener
         * for the target node.
         */
        _attachedDrawableTargetBindListener : bui.util.createPrototypeValue(
                function(attached, newX, oldX) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    this._attachedDrawableTargetRemoveListener.createDelegate(
                            this), listenerIdentifier(this));
            oldX.unbindAll(listenerIdentifier(this));
        })
    });

    /**
     * @namespace
     * Observable properties which all attached drawable nodes share
     */
    bui.AttachedDrawable.ListenerType = {
        /** @field */
        source : 'bui.AttachedDrawable.source',
        /** @field */
        target : 'bui.AttachedDrawable.target'
    };
})(bui);