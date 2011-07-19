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

from constants import *		# biographer defaults & constants

def biographerNode2LayoutNode( node ):
	return {'id':ID, 'type':Type, 'compartment':compartment, 'x':x, 'y':y, 'width':width, 'height':height, 'direction':direction}

def LayoutNode2biographerNode( node ):
	result = DefaultNode
	result.type		= node['type']
	result.id		= node['id']
	result.data['compartment'] = node['compartment']
	result.data['x']	= node['x']
	result.data['y']	= node['y']
	result.data['width']	= node['width']
	result.data['height']	= node['height']
	# direction? nodes do not have a direction ...
	return result

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

	def add_node(self, Type, ID, compartment, x, y, width, height, direction):
		self.nodes.append( {'type':Type, 'id':ID, 'compartment':compartment, 'x':x, 'y':y, 'width':width, 'height':height, 'direction':direction} )

	def add_edge(self, Type, From, to):
		self.edges.append( {'type':Type, 'from':From, 'to':to} )

	def parse(self, layout):
		pass

