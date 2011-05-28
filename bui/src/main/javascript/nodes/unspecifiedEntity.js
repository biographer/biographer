(function(bui) {
    bui.UnspecifiedEntity = function() {
        bui.SBGNNode.apply(this, arguments);
        this.addType(bui.UnspecifiedEntity.ListenerType);

        this._initialPaint();

        this.bind(bui.Node.ListenerType.position,
                this._positionChanged.createDelegate(this),
                this);
        this.bind(bui.Node.ListenerType.size,
                this._sizeChanged.createDelegate(this),
                this);
    };

    bui.UnspecifiedEntity.prototype = Object.create(bui.SBGNNode.prototype, {
        _ellipse : bui.util.createPrototypeValue(null),

        _initialPaint : bui.util.createPrototypeValue(function() {
            var container = this.graph().nodeGroup();

            this._ellipse = document.createElementNS(bui.svgns, 'ellipse');
            this._positionChanged();
            this._sizeChanged(this, this.width(), this.height());
            container.appendChild(this._ellipse);
        }),

        _positionChanged : bui.util.createPrototypeValue(function(node, x, y) {
            var center = this.center();
            this._ellipse.setAttributeNS(null, 'cx', center.x);
            this._ellipse.setAttributeNS(null, 'cy', center.y);
        }),

        _sizeChanged : bui.util.createPrototypeValue(function(node, width,
                                                              height) {
            this._ellipse.setAttributeNS(null, 'rx', width / 2);
            this._ellipse.setAttributeNS(null, 'ry', height / 2);
        })
    });

    bui.UnspecifiedEntity.ListenerType = {
    };
})(bui);