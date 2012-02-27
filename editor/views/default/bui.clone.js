bui.clone = function(degree){
        var suspendHandle = graph.suspendRedraw(20000);
        var all_drawables = graph.drawables();
        // create a counting dictionary for the nodes
        var degree_count = {};
        for (var key in all_drawables) {
            drawable = all_drawables[key];
            if ((drawable.identifier()=='bui.UnspecifiedEntity')||(drawable.identifier()=='bui.SimpleChemical')||(drawable.identifier()=='bui.RectangularNode')||(drawable.identifier()=='bui.Phenotype')||(drawable.identifier()=='bui.NucleicAcidFeature')||(drawable.identifier()=='bui.Macromolecule')){
                degree_count[drawable.id()] = 0;
            }
        }
        // count edges connecting the relevant nodes
        for (var key in all_drawables) {
            drawable = all_drawables[key];
            if (drawable.identifier() == 'bui.Edge'){
                if (drawable.source().id() in degree_count){
                    degree_count[drawable.source().id()] = degree_count[drawable.source().id()] + 1;
                };
                if (drawable.target().id() in degree_count){
                    degree_count[drawable.target().id()] = degree_count[drawable.target().id()] + 1;
                };
            }
        }
        // go through all the nodes with a higher than appreciated degree
        auto_indent = 1000;
        for (var key in degree_count) {
            drawable = all_drawables[key];
            if (degree_count[drawable.id()] > degree){
                old_node_id = drawable.id();

                // create a new node for every time the old node is referenced
                for (var edge_key in all_drawables){
		    var edge = all_drawables[edge_key];
                    if ((edge.identifier() == 'bui.Edge')&&((edge.source().id() == old_node_id)||(edge.target().id() == old_node_id))){
			// create a new node
			++auto_indent;
			var new_node = graph.add(bui[drawable.identifier().substr(4)]) 
			    .visible(true)
			    .label(drawable.label())
                .parent(drawable.parent())
			    .addClass('cloneMarker')
			    .position(drawable.position().x, drawable.position().y)
			    .size(drawable.size().height, drawable.size().width);
			// reroute the edge
			if (edge.source().id() == old_node_id){
			    all_drawables[edge_key].source(new_node);
			} else {
			    all_drawables[edge_key].target(new_node);
			}
		    }
		};
            };
        };
        for (var key in all_drawables) {
            drawable = all_drawables[key];
            if (drawable.id() in degree_count){
                if (degree_count[drawable.id()] > degree){
		    drawable.remove();
                }
            }
        }
        graph.unsuspendRedraw(suspendHandle);
} 
