(function(bui) {
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.SBGNNode} SBGNNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(SBGNNode) {
        return 'bui.SBGNNode' + SBGNNode.id();
    };

    bui.SBGNNode = function() {
        bui.Labelable.apply(this, arguments);
    };

    bui.SBGNNode.prototype = Object.create(bui.Labelable.prototype, {
    });
})(bui);