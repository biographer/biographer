(function(bui) {

    var readyFunctions = [];

    /**
     * @description
     * Use this function to add functions (callbacks) which are to be
     * executed when the whole document is done loading.
     *
     * @param {Function} callback Function to be executed when the document is
     *   ready
     */
    bui.ready = function(callback) {
        readyFunctions.push(callback);
    };

    // executing the ready functions
    $(function() {
        for(var i = 0; i < readyFunctions.length; i++) {
            readyFunctions[i]();
        }
    });

    /**
     * @class
     * Base class for all the biographer-ui classes
     */
    bui.Object = function() {
        this.__private = {};
    };

    /**
     * Retrieve the private members for a given class
     *
     * @param {Object} identifier This identifies for which class the private
     *   members shall be retrieved.
     * @return {Object} An object from which the private members could be
     *   retrieved
     */
    bui.Object.prototype._getPrivateMembers = function(identifier) {
        var privates = this.__private[identifier];

        if (privates === undefined) {
            privates = {};
            this.__private[identifier] = privates;
        }

        return privates;
    };

    /**
     * Retrieve the private members for a given class
     *
     * @param {Object} identifier This identifies for which class the private
     *   members shall be retrieved.
     * @return {Object} An object from which the private members could be
     *   retrieved
     */
    bui.Object.prototype._privates = function(identifier) {
        return this._getPrivateMembers(identifier);
    };
})(bui);

/**
 * @private
 * @see bui.Node._calculationHook
 */
var circularShapeLineEndCalculationHook = function(adjacent, hitAngle) {
    var radius = this.size().width / 2;

    var padding = bui.settings.style.edgeToNodePadding;
    radius += Math.sqrt(Math.pow(padding.topBottom, 2) +
            Math.pow(padding.leftRight, 2));

    return {
        opposite : Math.sin(hitAngle) * radius,
        adjacent : Math.cos(hitAngle) * radius
    };
};