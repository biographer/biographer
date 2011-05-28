(function(bui){
    /**
     * @class
     * The base class for every drawable items.
     *
     * As a general rule, the constructors of drawables should never be
     * called directly but through the {@link bui.Graph#add} function.
     *
     * @extends bui.Observable
     * @constructor
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.Drawable = function(id, graph) {
        bui.Observable.call(this);
        this.addType(bui.Drawable.ListenerType);

        this._id = id;
        this._graph = graph;
        this._classes = [];
    };

    bui.Drawable.prototype = Object.create(bui.Observable.prototype, {
        _id : bui.util.createPrototypeValue(null),
        _graph : bui.util.createPrototypeValue(null),
        _select : bui.util.createPrototypeValue(false),
        _visible : bui.util.createPrototypeValue(false),
        _classes : bui.util.createPrototypeValue(null),

        /**
         * @description
         * Retrieve the drawable's id.
         *
         * @return {String} drawable id.
         */
        id : bui.util.createPrototypeValue(function() {
            return this._id;
        }),

        /**
         * @description
         * Retrieve the graph instance to which this drawable belongs.
         *
         * @return {bui.Graph} this node's graph
         */
        graph : bui.util.createPrototypeValue(function() {
            return this._graph;
        }),

        /**
         * @description
         * Remove this drawable from the graph.
         *
         * First all remove listeners will be informed about the event and then
         * all listeners will be unbound.
         */
        remove : bui.util.createPrototypeValue(function() {
            this.fire(bui.Drawable.ListenerType.remove, [this]);
            this.unbind();
        }),

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
        select : bui.util.createPrototypeValue(function(select) {
            if (select !== undefined) {
                if (this._select !== select) {
                    this._select = select;

                    this.fire(bui.Drawable.ListenerType.select,
                            [this, select]);
                }

                return this;
            }

            return this._select;
        }),

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
        visible : bui.util.createPrototypeValue(function(visible) {
            if (visible !== undefined) {
                if (this._visible !== visible) {
                    this._visible = visible;

                    this.fire(bui.Drawable.ListenerType.visible,
                            [this, visible]);
                }

                return this;
            }

            return this._visible;
        }),

        /**
         * @description
         * Check whether two drawables belong to the same graph.
         *
         * @param {bui.Drawable} drawable Check if the drawable belongs to the
         *   same graph.
         * @return {Boolean} true when both belong to the same graph.
         */
        isSameGraph : bui.util.createPrototypeValue(function(drawable) {
            return this._graph.id() == node._graph.id();
        }),

       /**
        * @description
        * Add a class to this drawable
        *
        * @param {String} klass the class which you want to add
        * @return {bui.Drawable} Fluent interface
        */
        addClass : bui.util.createPrototypeValue(function(klass) {
            if (this._classes.indexOf(klass) == -1) {
                this._classes.push(klass);
                this.fire(bui.Drawable.ListenerType.classes, [this,
                    this.classString()]);
            }

            return this;
        }),

        /**
        * @description
        * Remove a class from this drawable
        *
        * @param {String} klass the class which you want to remove
        * @return {bui.Drawable} Fluent interface
        */
        removeClass : bui.util.createPrototypeValue(function(klass) {
            var index = this._classes.indexOf(klass);

            if (index != -1) {
                this._classes.splice(index, 1);
                this.fire(bui.Drawable.ListenerType.classes, [this,
                    this.classString()]);
            }

            return this;
        }),

        /**
         * @description
         * Generate a class string, i.e. a string which can be used for the
         * HTML / SVG class attribute.
         *
         * @return {String} the string for the class attribute 
         */
        classString : bui.util.createPrototypeValue(function() {
            return this._classes.join(' ');
        })
    });

    /**
     * @namespace
     * Observable properties which all drawables share
     */
    bui.Drawable.ListenerType = {
        /** @field */
        visible : 'bui.Drawable.visible',
        /** @field */
        remove : 'bui.Drawable.remove',
        /** @field */
        select : 'bui.Drawable.select',
        /** @field */
        classes : 'bui.Drawable.classes'
    };
})(bui);