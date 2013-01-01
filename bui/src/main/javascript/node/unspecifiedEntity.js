(function(bui) {
    var identifier = 'bui.UnspecifiedEntity';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnspecifiedEntity} UnspecifiedEntity
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnspecifiedEntity) {
        return identifier + UnspecifiedEntity.id();
    };

    /**
     * @private position / size listener
     */
    var sizeChanged = function(
            node, width, height) {
        var x = width / 2, y = height / 2;
        var privates = this._privates(identifier);
        privates.ellipse.setAttributeNS(null, 'cx', x);
        privates.ellipse.setAttributeNS(null, 'cy', y);

        privates.ellipse.setAttributeNS(null, 'rx', x);
        privates.ellipse.setAttributeNS(null, 'ry', y);
        if (privates.is_cloned){
            privates.clone_ellipse.setAttributeNS(null, 'cx', x);
            privates.clone_ellipse.setAttributeNS(null, 'cy', y);
            privates.clone_ellipse.setAttributeNS(null, 'rx', x);
            privates.clone_ellipse.setAttributeNS(null, 'ry', y);
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
        privates.ellipse.style.setProperty('fill', color.background);
        privates.ellipse.style.setProperty('stroke', color.border);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.ellipse = document.createElementNS(bui.svgns, 'ellipse');
        var size = this.size();
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.ellipse);
    };

    /**
     * @class
     * A node with the shape of an ellipse and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.UnspecifiedEntity = function() {
        bui.UnspecifiedEntity.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);
        privates.is_cloned = false;
        initialPaint.call(this);
    };

    bui.UnspecifiedEntity.prototype = {
        identifier : function() {
            return identifier;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag==true){
                        privates.clone_ellipse = document.createElementNS(bui.svgns, 'ellipse');
                        privates.clone_ellipse.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_ellipse);
                        privates.clone_ellipse.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect')
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_ellipse);
                        defsGroup.removeChild(clippath);
                    }
                }
                return this
            }
            return privates.is_cloned;
        },
        _minWidth : 70,
        _minHeight : 50,
    }
    bui.util.setSuperClass(bui.UnspecifiedEntity, bui.Labelable);
})(bui);
