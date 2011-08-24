(function(bui) {
    var identifier = 'bui.Drawable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Drawable} drawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(drawable) {
        return identifier + drawable.id();
    };

    /**
     * @class
     * The base class for every drawable item.
     *
     * As a general rule, the constructors of drawables should never be
     * called directly but through the {@link bui.Graph#add} function.
     *
     *
     * @extends bui.Observable
     * @constructor
     *
     * Please note that the arguments should be passed in the form of one
     * object literal.
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.Drawable = function(args) {
        bui.Drawable.superClazz.call(this);
        this._addType(bui.Drawable.ListenerType);

        var privates = this._privates(identifier);
        privates.id = args.id;
        privates.graph = args.graph;
        privates.classes = [];
        privates.visible = false;
        privates.select = false;
        privates.json = null;
    };

    bui.Drawable.prototype = {
        /**
         * @description
         * Retrieve the drawable's id.
         *
         * @return {String} drawable id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * @description
         * Retrieve the graph instance to which this drawable belongs.
         *
         * @return {bui.Graph} this node's graph
         */
        graph : function() {
            return this._privates(identifier).graph;
        },

        /**
         * @description
         * Remove this drawable from the graph.
         *
         * First all remove listeners will be informed about the event and then
         * all listeners will be unbound.
         */
        remove : function() {
            this.fire(bui.Drawable.ListenerType.remove, [this]);
            this.unbind();
        },

        /**
         * @description
         * Use this function to select the drawable. Selection is normally done
         * by clicking on a drawable. Think of a file manager which provides
         * functionality to, for example, select multiple files and apply
         * actions to all selected files.
         *
         * If you omit the parameter the current selection status will be
         * returned.
         *
         * @param {Boolean} [select] True to select the drawable, false
         *   otherwise.
         * @return {bui.Drawable|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the current selection state
         *   will be returned.
         */
        select : function(select) {
            var privates = this._privates(identifier);

            if (select !== undefined) {
                if (privates.select !== select) {
                    privates.select = select;

                    this.fire(bui.Drawable.ListenerType.select,
                            [this, select]);
                }

                return this;
            }

            return privates.select;
        },

        /**
         * @description
         * Drawables can be shown or hidden using this function.
         *
         * Retrieve the current visibility state by calling this function
         * without parameter.
         *
         * @param {Boolean} [visible] True to show the drawable, false to hide.
         *   Omit to retrieve current visibility setting.
         * @return {bui.Drawable|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the current visibility state
         *   will be returned.
         */
        visible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                if (privates.visible !== visible) {
                    privates.visible = visible;

                    this.fire(bui.Drawable.ListenerType.visible,
                            [this, visible]);
                }

                return this;
            }

            return privates.visible;
        },

        /**
         * @description
         * Check whether two drawables belong to the same graph.
         *
         * @param {bui.Drawable} drawable Check if the drawable belongs to the
         *   same graph.
         * @return {Boolean} true when both belong to the same graph.
         */
        isSameGraph : function(drawable) {
            return this._privates(identifier).graph.id() ==
                    node._privates(identifier).graph.id();
        },

        /**
         * @description
         * Add a class to this drawable
         *
         * @param {String} klass the class which you want to add
         * @return {bui.Drawable} Fluent interface
         */
        addClass : function(klass) {
            var classes = this._privates(identifier).classes;
            if (classes.indexOf(klass) == -1) {
                classes.push(klass);
                this.fire(bui.Drawable.ListenerType.classes, [this,
                    this.classString()]);
            }

            return this;
        },

        /**
         * @description
         * Remove a class from this drawable, if no parameter is passed remove all classes
         *
         * @param {String} klass the class which you want to remove
         * @return {bui.Drawable} Fluent interface
         */
        removeClass : function(klass) {
            if (klass === undefined) {
                this._privates(identifier).classes = [];
                this.fire(bui.Drawable.ListenerType.classes, [this, '']);
            } else {
                var classes = this._privates(identifier).classes;

                var index = classes.indexOf(klass);

                if (index != -1) {
                    classes.splice(index, 1);
                    this.fire(bui.Drawable.ListenerType.classes, [this,
                        this.classString()]);
                }
            }

            return this;
        },

        /**
         * @description
         * Generate a class string, i.e. a string which can be used for the
         * HTML / SVG class attribute.
         *
         * @return {String} the string for the class attribute
         */
        classString : function() {
            return this._privates(identifier).classes.join(' ');
        },

        /**
         * Set some JSON meta information for this drawable. Please note that
         * it won't be processed but only stored for later usage.
         *
         * @param {Object} [json] The data which you want to store within this
         *   object. Omit to retrieve the current data.
         * @return {Object|bui.Drawable} The stored data in case you call this
         *   function without parameter. If you pass a parameter the data
         *   will be stored and instance on which you called this function
         *   will be returned (fluent interface).
         */
        json : function(json) {
            var privates = this._privates(identifier);

            if (json !== undefined) {
                privates.json = json;

                return this;
            }

            return privates.json;
        },

        /**
         * Update the JSON object.
         *
         * @param {String|String[]} path The property name which should be
         *   updated. Pass a string array to handle property chains.
         * @param {Object} value The property's value.
         * @returh {bui.Drawable} Fluent interface
         */
        updateJson : function(path, value) {
            var privates = this._privates(identifier);

            privates.json = privates.json || {};

            updateJson(privates.json, path, value);

            return this;
        },

        /**
         * Export this drawable instance to JSON
         *
         * @return {Object} The drawable instance exported to JSON.
         */
        toJSON : function() {
            var json = {},
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat.drawable;

            updateJson(json, dataFormat.id, privates.id);
            updateJson(json, dataFormat.visible, privates.visible);

            return json;
        },

        /**
         * Retrieve the drawables type, i.e. either node or edge.
         *
         * @return {String} If the drawable is a node, 'node' will be returned.
         *   Otherwise 'edge' will be returned.
         */
        drawableType : function() {
            if (this.bottomRight !== undefined) {
                return 'node';
            } else {
                return 'edge';
            }
        },

        identifier : function() {
            return this.identifier;
        }
    };

    bui.util.setSuperClass(bui.Drawable, bui.Observable);

    /**
     * @namespace
     * Observable properties which all drawables share
     */
    bui.Drawable.ListenerType = {
        /** @field */
        visible :  bui.util.createListenerTypeId(),
        /** @field */
        remove :  bui.util.createListenerTypeId(),
        /** @field */
        select :  bui.util.createListenerTypeId(),
        /** @field */
        classes :  bui.util.createListenerTypeId()
    };
})(bui);
