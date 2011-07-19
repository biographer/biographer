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
from copy import deepcopy

def biographerNode2LayoutNode( node ):
	return {'id':node.id, \
		'type':node.type, \
		'compartment':node.data['compartment'], \
		'x':node.data['x'], \
		'y':node.data['y'], \
		'width':node.data['width'], \
		'height':node.data['height'], \
		'direction':''}	# direction?

def LayoutNode2biographerNode( node ):
	result = deepcopy(DefaultNode)nenene
	result.type		= node['type']
	result.id		= node['id']
	result.data['compartment'] = node['compartment']
	result.data['x']	= node['x']
	result.data['y']	= node['y']
	result.data['width']	= node['width']
	result.data['height']	= node['height']
	# direction? nodes do not have a direction ...
	return result

def biographerEdge2LayoutEdge( edge ):
	pass

def LayoutEdge2biographerEdge( edge ):
	result = deepcopy(DefaultEdge)nenene
	result.type = edge['type']
	result.from neenenene
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

	def add_node(self, d):
		self.nodes.append( d )

	def add_edge(self, e):
		self.edges.append( {'id':len(self.edges)}.update(e) )

	def export(self, layout):
		pass

