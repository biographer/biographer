#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# wrapper for graphviz

def layout_using_graphviz(graph, execution_folder="/tmp", use_cache=True, update_nodes=True):

	import pygraphviz

	graph.log("Preparing graphviz model ...")

	# http://networkx.lanl.gov/pygraphviz/tutorial.html
	graphviz_model = pygraphviz.AGraph(directed=True)

	changes = False
	# !!!!!!!!!!!!!!!!!!!!!!!!!!
	# Compartments have to be added as
	# SG = graphviz_model.add_subgraph(name='bla')
	# !!!!!!!!!!!!!!!!!!!!!!!!!!
	for node in graph.Nodes:
		# !!!!!!!!!!!!!!!!!!!!!!!!!!!!
		# This rule actually removes compartments!!!!!!
		# Come up with something different!
		# !!!!!!!!!!!!!!!!!!!!!!!!!!!!
		#if (not node.is_abstract) and (graph.EdgeCount(node) > 0):
		graphviz_model.add_node( 	str(node.id),
						label = node.data.label if node.data.owns("label") else str(node.id),
						shape = 'ellipse' if node.type != getNodeType("Process Node") else 'box'
					)
		#
		#elif updateNodeProperties:
		#	graph.Nodes.pop( graph.Nodes.index(node) )
		#	changes = True
		#	graph.log("Warning: Graphviz can't handle Node "+str(node.id)+"! Node deleted.")
	if changes:
		graph.initialize()	# necessary; e.g. ID map may not fit anymore, because we deleted Nodes

	for edge in graph.Edges:
		graphviz_model.add_edge(	str(edge.source),
						str(edge.target),
						arrowhead='normal' if edge.sbo in [getSBO('Consumption'), getSBO('Production')] else 'tee'
					)

	png = graph.MD5+".png"
	dot = graph.MD5+".dot"
	s   = graph.MD5+".str"
	pngpath = os.path.join(execution_folder, png)
	dotpath = os.path.join(execution_folder, dot)

	if use_cache and os.path.exists( pngpath ):	# no need to do the cpu-intense layouting again
		cached = True
		graph.dot = open(dotpath).read()
		graph.log("A matching graphviz layout was found in cache. use_cache is enabled. Not executing graphviz.")
	else:
		graph.log("Executing graphviz ...")
		cached = False
		graphviz_model.dpi = 70;
		graphviz_model.layout( prog='dot' )
		graphviz_model.draw( pngpath )
		graph.dot = graphviz_model.string()
		open(dotpath,'w').write(graph.dot)
		graph.log("graphviz completed.")

	if update_nodes:
		graph.import_from_graphviz_dot( graph.dot )

	return graph.dot, png, cached, None

