(function(bui) {
    var identifier = 'VariableValue';
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
     
    var listenerIdentifier = function(Node) {
        return identifier + Node.id();
    };
    
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     **/
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier)
        if (privates.is_existence || privates.is_location) height = width;
        var pathData = [
            'M', height/2,height,         // topleft
            'L', width-height/2, height, //draw _ on top
            'C', width+height/4, height, width+height/4,0, width-height/2, 0,
            'L', height/2, 0,          //draw _ to left
            'C', -height/4, 0, -height/4, height, height/2, height, 
            'Z'].join(' '); //draw \ to middle left
        privates.path.setAttributeNS(null, 'd', pathData);
        if(privates.is_existence == true){
            privates.existence_path.setAttributeNS(null, 'd', pathData)
            privates.clippath_path.setAttributeNS(null, 'width', width/2+height/4);
            privates.clippath_path.setAttributeNS(null, 'height', height);
            privates.clippath_path.setAttributeNS(null, 'x', width/2);
        }
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };
    
    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.path);
    };
    
    bui.VariableValue = function() {
        bui.VariableValue.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        
        initialPaint.call(this);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass('VariableValue');
        var privates = this._privates(identifier);
        privates.is_existence = false;
        privates.is_location = false;
        //this.adaptSizeToLabel(true);
    };
    
    bui.VariableValue.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 10,
        _minHeight : 14,
        _enableResizing : true,
        _adaptSizeToLabel : false,
        /*label : function(label) {
            bui.VariableValue.superClazz.superClazz.prototype.label.apply(this,[label]);
        }*/
        existence: function(flag){
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_existence){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_existence = flag;
                    if (flag===true){
                        this.label("");
                        privates.existence_path = document.createElementNS(bui.svgns, 'path');
                        privates.existence_path.style.setProperty('fill', 'black');
                        container.appendChild(privates.existence_path);
                        privates.existence_path.setAttribute('clip-path','url(#existence_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'existence_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect');
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.existence_path);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this;
            }
            return privates.is_existence;
        },
        location: function(flag){
            //FIXME must implement location symbol here: a big T titled to the side
            //two lines and a clippath around it
        }
    };

    bui.util.setSuperClass(bui.VariableValue, bui.Labelable);
})(bui);
