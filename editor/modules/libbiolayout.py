#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# http://code.google.com/p/biographer/wiki/LayoutInputFormat

# graph exchange format mini docu:
# --------------------------------
# number of compartments
# node index " " node name     (note: 0 is unknown)
# ...
# ///
# number of nodes
# node index
# node type
# node id/name
# node compartment
# node x
# node y
# node width
# node height
# node direction
# ...
# ///
# number of edges
# edgetype from to
# ...

class Layout:
	def __init__(self, layout=None):
		self.number_of_compartments = 0
		self.compartments = []
		self.nodes = []
		self.edges = []
		if layout is not None:
			self.parse( layout )

	def add_compartment(self, label):
		self.compartments.append( label )

	def add_node(self, d):
		self.nodes.append( d )

	def add_edge(self, e):
		if not 'id' in e.keys():
			e['id'] = len(self.edges)
		self.edges.append( e )

	def export(self):			# export object to Layouter
		result = str( len(self.compartments) )+"\n"
		for i in range(0, len(self.compartments)):
			result += self.compartments[i]+"\n"
		result += "///\n"
		result += str( len(self.nodes) )+"\n"
		for i in range(0, len(self.nodes)):
			node = self.nodes[i]
			result += str(i)+"\n"
			result += str(node['type'])+"\n"
			result += str(node['id'])+"\n"
			result += str(node['compartment'])+"\n"
			result += str(node['x'])+"\n"
			result += str(node['y'])+"\n"
			result += str(node['width'])+"\n"
			result += str(node['height'])+"\n"
			result += node['direction']+"\n"
		result += "///\n"
		result += str( len(self.edges) )+"\n"
		for i in range(0, len(self.edges)):
			edge = self.edges[i]
			result += str(edge['type'])+" "+str(edge['source'])+" "+str(edge['target'])+"\n"
		return result

	def parse(self, layout):		# create object from Layouter input
		pass

