(function(bui) {
    /**
     * @class
     * This class controls the whole graph and is responsible for the
     * management of nodes and edges, i.e. drawables.
     *
     * @param {HTMLElement} container where the graph should go
     */
    bui.Graph = function(container, width, height) {
        this._container = container;

        var paper = Raphael(container, width, height);
    };

    bui.Graph.prototype = {
        _container : null,
        _offset : null,
        _scale : 1,
        _idCounter : 0,

        /**
         * @return {HTMLElement} The container of this graph
         */
        container : function() {
            return this._container;
        },

        /**
         * @description
         * Scale the graph by passing a number to this function. To have the
         * standard scale level pass one (1) to this function. To double the
         * size pass two (2).
         *
         * You can also retrieve the current scale by calling this function
         * without parameter.
         *
         * @param {Number} [scale] The new scale, one (1) means 100%.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current scale is returned
         */
        scale : function(scale) {
        },

        add : function(drawable, params) {
        }
    };

    bui.Graph.ListenerType = {
        'add' : 'Graph.add',
        'scale' : 'Graph.scale'
    };
})(bui);