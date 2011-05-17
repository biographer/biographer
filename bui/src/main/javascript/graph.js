(function(bui) {
    bui.Graph = function(container) {
        this._container = container;
        this._scale = 1;
        this._idCounter = 0;
    };

    bui.Graph.prototype = {
        container : function() {
            return this._container;
        },

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