(function(bui) {
    /**
     * @class
     * By inheriting from this class you can allow observers. Please note
     * that you have to add types using the {@link bui.Observable#addType}
     * function before listener can be added.
     */
    bui.Observable = function() {
        this._listener = {};
    };

    bui.Observable.prototype = {
        _listener : null,

        /**
         * @description
         * Add a listener type to this observable object. An added listener
         * type allows to register listeners and fire events specific to
         * this type.
         *
         * @param {String|Object} type The new type - a string which describes
         *   it or an object (map) for which all values
         *   (please note it's values - not keys) are used and added as types.
         * @return {bui.Observable} Fluent interface
         */
        addType : function(type) {
            if (typeof(type) === 'string') {
                this._listener[type] = {};
            } else {
                for (var i in type) {
                    if (type.hasOwnProperty(i)) {
                        this._listener[type[i]] = {};
                    }
                }
            }

            return this;
        },

        /**
         * @description
         * Bind listener to a specific type
         *
         * @param {String} type The type of event that should be observed
         * @param {Function} callback Method to be called
         * @param {Object} [identification] An identifier used to identify the
         *   listener in the list of all over listeners. Should be unique for
         *   the listener type. When ommited the callback will be used for
         *   identification purposes.
         * @return {bui.Observable} Fluent interface
         */
        bind : function(type, callback, identification) {
            var listener = this._listener[type];

            if (identification === undefined || identification === null) {
                identification = callback;
            }

            listener[identification] = callback;
            return this;
        },

        /**
         * @description
         * Unbind a listener from a specific event.
         *
         * To unbind all listener, call this function without any parameter.
         * To unbind all listener just for a specific type call this method
         * with the type and omit the identification.
         *
         * @param {String} [type] listener type identification
         * @param {String} [identification] identifies the listener which
         *   should be unbound
         * @return {bui.Observable} Fluent interface
         */
        unbind : function(type, identification) {
            if (type === undefined) {
                for(var registeredType in this._listener) {
                    if (this._listener.hasOwnProperty(registeredType)) {
                        this._listener[registeredType] = {};
                    }
                }
            } else if (identification === undefined) {
                this._listener[type] = {};
            } else {
                delete this._listener[type][identification];
            }

            return this;
        },

        /**
         * Unbind all listeners with the provided identification.
         *
         * @param {String} identification Listener identification
         * @return {bui.Observable} Fluent interface
         */
        unbindAll : function(identification) {
            for(var type in this._listener) {
                if (this._listener.hasOwnProperty(type)) {
                    delete this._listener[type][identification];
                }
            }

            return this;
        },

        /**
         * @description
         * Fire an event
         *
         * @param {String} type listener type identification
         * @param {Object[]} [params] Parameters to be passed to the listener
         * @return {Boolean} True when every listener returned a value !==
         *   false, false otherwise.
         */
        fire : function(type, params) {
            if (params === undefined) {
                params = [];
            }

            var listener = this._listener[type];

            for (var i in listener) {
                if (listener.hasOwnProperty(i)) {
                    var status = listener[i].apply(this, params);

                    if (status === false) {
                        return false;
                    }
                }
            }

            return true;
        }
    };
})(bui);