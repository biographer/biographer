bui.clone = function(degree){
        alert('clone all with deg > '+degree);
        var all_drawables = graph.drawables();
        var count = 0;
        var nodes = [];
        for (var key in all_drawables) {
            drawable = all_drawables[key];
            drawable.index = count;
            ++count;
            if ((drawable.identifier() == 'bui.Labelable')||(drawable.identifier() == 'Compartment')||(drawable.identifier() == 'bui.StateVariable')){
                //ignore
            }else if (drawable.drawableType()=='node'){
                var dparent = drawable.parent();
                if (('absolutePositionCenter' in drawable)&& (!('identifier' in dparent) || dparent.identifier() != 'Complex')){
                    var pos = drawable.absolutePositionCenter();
                    drawable.x = pos.x;
                    drawable.y = pos.y;
                    nodes.push(drawable);
                }
            }else if(drawable.identifier() == 'bui.Edge'){
                edges.push(drawable);
                var source = edge.source()
                var target = edge.target()
                source.id()
            }
        }

} 
