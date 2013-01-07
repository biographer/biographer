(function(bui) {
    var identifier = 'bui.SimpleChemical';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.SimpleChemical} SimpleChemical
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(SimpleChemical) {
        return identifier + SimpleChemical.id();
    };

    var sizeChanged = function(node, width, height) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
        if (privates.is_multimere == true){
            privates.multimere_circle.setAttributeNS(null, 'cx', r+5);
            privates.multimere_circle.setAttributeNS(null, 'cy', r+7);
            privates.multimere_circle.setAttributeNS(null, 'r', r);
        }
        if (privates.is_cloned == true){
            privates.clone_circle.setAttributeNS(null, 'cx', r);
            privates.clone_circle.setAttributeNS(null, 'cy', r);
            privates.clone_circle.setAttributeNS(null, 'r', r);
            privates.clippath_path.setAttributeNS(null, 'width', width);
            privates.clippath_path.setAttributeNS(null, 'height', height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(height/3));
        }
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.circle.style.setProperty('fill', color.background);
        privates.circle.style.setProperty('stroke', color.border);
        if (privates.is_multimere == true){
            privates.multimere_circle.style.setProperty('fill', color.background);
            privates.multimere_circle.style.setProperty('stroke', color.border);
        }
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.circle);
    };

    /**
     * @class
     * Class for SBGN simple chemicals. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.SimpleChemical = function() {
        bui.SimpleChemical.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);
        privates.is_multimere = false;
        privates.is_cloned = false;
        initialPaint.call(this);
    };

    bui.SimpleChemical.prototype = {
        identifier : function() {
            return identifier;
        },
        /**
         * Set this node's multimere state.
         *
         * @param {Bool} [flag] optional flag to set multimere state
         * @return {bui.RectangularNode|Bool} Fluent interface if you pass
         *   a parameter, the current multimere status otherwise.
         */
        multimere : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_multimere){
                    var container = this.nodeGroup();
                    privates.is_multimere = flag;
                    if (flag==true){
                        privates.multimere_circle = document.createElementNS(bui.svgns, 'circle');
                        container.insertBefore(privates.multimere_circle, container.firstChild);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                    }else{
                        container.removeChild(privates.multimere_circle);
                    }
                }
                return this
            }
            return privates.is_multimere;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag==true){
                        privates.clone_circle = document.createElementNS(bui.svgns, 'circle');
                        privates.clone_circle.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_circle);
                        privates.clone_circle.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect')
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_circle);
                        defsGroup.removeChild(clippath);
                    }
                }
                return this
            }
            return privates.is_cloned;
        },
        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.SimpleChemical, bui.Labelable);
})(bui);
