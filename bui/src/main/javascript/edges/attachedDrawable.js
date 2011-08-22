(function(bui) {
    var identifier = 'bui.AttachedDrawable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AttachedDrawable} attachedDrawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(attachedDrawable) {
        return identifier + attachedDrawable.id();
    };

    /**
     * @private Source remove listener
     */
    var sourceRemoveListener = function() {
        this.source(null);
    };

    /**
     * @private Source remove listener
     */
    var targetRemoveListener = function() {
        this.target(null);
    };

    /**
     * @private Generic listener which will unbind previous listener
     * for the source node.
     */
    var sourceBindListener = function(attached, newX, oldX) {
        if (newX !== null) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    sourceRemoveListener.createDelegate(this),
                    listenerIdentifier(this));
        }

        if (oldX !== null) {
            oldX.unbindAll(listenerIdentifier(this));
        }
    };

    /**
     * @private Generic listener which will unbind previous listener
     * for the target node.
     */
    var targetBindListener = function(attached, newX, oldX) {
        if (newX !== null) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    targetRemoveListener.createDelegate(this),
                    listenerIdentifier(this));
        }

        if (oldX !== null) {
            oldX.unbindAll(listenerIdentifier(this));
        }
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        var privates = this._privates(identifier);

        if (privates.source !== null) {
            privates.source.unbindAll(listenerIdentifier(this));
        }

        if (privates.target !== null) {
            privates.target.unbindAll(listenerIdentifier(this));
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.Drawable
     * @constructor
     */
    bui.AttachedDrawable = function(){
        bui.AttachedDrawable.superClazz.apply(this, arguments);
        this._addType(bui.AttachedDrawable.ListenerType);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                removeListener.createDelegate(this),
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.source = null;
        privates.target = null;
    };

    bui.AttachedDrawable.prototype = {
        /**
         * Change the source of this attached drawable.
         *
         * @param {bui.Node} [source] The new source or omit if you would
         *   like to retrieve the current source.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current source is returned.
         */
        source : function(source) {
            var privates = this._privates(identifier);

            if (source !== undefined) {
                if (source !== privates.source) {
                    var oldSource = privates.source;
                    privates.source = source;
                    this.fire(bui.AttachedDrawable.ListenerType.source,
                            [this, privates.source, oldSource]);
                }

                return this;
            }

            return privates.source;
        },

        /**
         * Change the target of this attached drawable.
         *
         * @param {bui.Node} [target] The new target or omit if you would
         *   like to retrieve the current target.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current target is returned.
         */
        target : function(target) {
            var privates = this._privates(identifier);

            if (target !== undefined) {
                if (target !== privates.target) {
                    var oldTarget = privates.target;
                    privates.target = target;
                    this.fire(bui.AttachedDrawable.ListenerType.target,
                            [this, privates.target, oldTarget]);
                }

                return this;
            }

            return privates.target;
        },

        // overridden
        toJSON : function() {
            var json = bui.AttachedDrawable.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.source !== null) {
                updateJson(json, dataFormat.edge.source, privates.source.id());
            }
            if (privates.target !== null) {
                updateJson(json, dataFormat.edge.target, privates.target.id());
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.AttachedDrawable, bui.Drawable);

    /**
     * @namespace
     * Observable properties which all attached drawable nodes share
     */
    bui.AttachedDrawable.ListenerType = {
        /** @field */
        source : bui.util.createListenerTypeId(),
        /** @field */
        target : bui.util.createListenerTypeId()
    };
})(bui);