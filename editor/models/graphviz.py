#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# wrapper for graphviz

def layout_using_graphviz(graph, execution_folder="/tmp", picture_output_folder="/tmp", use_cache=True):

	import pygraphviz

	graphviz_model = graph.export_to_graphviz()

	png = graph.MD5+".png"
	graphviz_layout = graph.MD5+".graphviz_layout"
	s   = graph.MD5+".str"
	pngpath = os.path.join(execution_folder, png)
	graphviz_layoutpath = os.path.join(execution_folder, graphviz_layout)

	if use_cache and os.path.exists( pngpath ):	# no need to do the cpu-intense layouting again
		cached = True
		graph.graphviz_layout = open(graphviz_layoutpath).read()
		graph.log("A matching graphviz layout was found in cache. use_cache is enabled. Not executing graphviz.")
	else:
		graph.log("Executing graphviz ...")
		cached = False
		graphviz_model.dpi = 70;
		graphviz_model.layout( prog='graphviz_layout' )
		graphviz_model.draw( pngpath )
		graph.graphviz_layout = graphviz_model.string()
		open(graphviz_layoutpath,'w').write(graph.graphviz_layout)
		graph.log("graphviz completed.")

	graph.import_from_graphviz_graphviz_layout( graph.graphviz_layout )

	return graph.graphviz_layout, png, cached, None

