(function(bui) {
    bui.SBGNNode = function() {
        bui.Labelable.apply(this, arguments);
        this.addType(bui.SBGNNode.ListenerType);
    };

    bui.SBGNNode.prototype = Object.create(bui.Labelable.prototype, {
    });

    /**
     * @namespace
     * Observable properties which all SBGN nodes share
     */
    bui.SBGNNode.ListenerType = {
    };
})(bui);