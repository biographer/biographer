#!/usr/bin/python
# -*- coding: iso-8859-15 -*-


def execute_graphviz(self, execution_folder="/tmp", use_cache=True, update_nodes=True):
	self.log("Preparing graphviz model ...")

	# http://networkx.lanl.gov/pygraphviz/tutorial.html
	graphviz_model = pygraphviz.AGraph(directed=True)

	changes = False
	# !!!!!!!!!!!!!!!!!!!!!!!!!!
	# Compartments have to be added as
	# SG = graphviz_model.add_subgraph(name='bla')
	# !!!!!!!!!!!!!!!!!!!!!!!!!!
	for node in self.Nodes:
		# !!!!!!!!!!!!!!!!!!!!!!!!!!!!
		# This rule actually removes compartments!!!!!!
		# Come up with something different!
		# !!!!!!!!!!!!!!!!!!!!!!!!!!!!
		#if (not node.is_abstract) and (self.EdgeCount(node) > 0):
		graphviz_model.add_node( 	str(node.id),
						label = node.data.label if node.data.owns("label") else str(node.id),
						shape = 'ellipse' if node.type != getNodeType("Process Node") else 'box'
					)
		#
		#elif updateNodeProperties:
		#	self.Nodes.pop( self.Nodes.index(node) )
		#	changes = True
		#	self.log("Warning: Graphviz can't handle Node "+str(node.id)+"! Node deleted.")
	if changes:
		self.initialize()	# necessary; e.g. ID map may not fit anymore, because we deleted Nodes

	for edge in self.Edges:
		graphviz_model.add_edge(	str(edge.source),
						str(edge.target),
						arrowhead='normal' if edge.sbo in [getSBO('Consumption'), getSBO('Production')] else 'tee'
					)

	png = self.MD5+".png"
	dot = self.MD5+".dot"
	s   = self.MD5+".str"
	pngpath = os.path.join(execution_folder, png)
	dotpath = os.path.join(execution_folder, dot)

	if use_cache and os.path.exists( pngpath ):	# no need to do the cpu-intense layouting again
		cached = True
		self.dot = open(dotpath).read()
		self.log("A matching graphviz layout was found in cache. use_cache is enabled. Not executing graphviz.")
	else:
		self.log("Executing graphviz ...")
		cached = False
		graphviz_model.dpi = 70;
		graphviz_model.layout( prog='dot' )
		graphviz_model.draw( pngpath )
		self.dot = graphviz_model.string()
		open(dotpath,'w').write(self.dot)
		self.log("graphviz completed.")

	# http://www.graphviz.org/doc/info/attrs.html#d:pos
	changes = False
	if update_nodes:
		for node in self.Nodes:
			p = self.dot.find("\t"+str(node.id)+"\t")
			if p > -1:
				q = self.dot.find(";", p)
				node.update_using_graphviz_output( self.dot[p:q] )
			else:
				self.Nodes.pop( self.Nodes.index(node) )
				changes = True
				self.log("Error: Updating Node "+str(node.id)+" failed! Node deleted.")
		self.log("Model updated.")

	if changes:
		self.initialize()

	return self.dot, png, cached, None

