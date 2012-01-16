#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# main graph object library
# by Matthias Bock <matthias.bock@hu-berlin.de>
# Execute via biographer web2py environment
# Created in the context of Google Summer of Code 2011
# http://code.google.com/p/biographer/
# License is GNU GPL Version 2


### dependencies ###

import os
from datetime import datetime		# to log with timestamp
from copy import deepcopy
from math import ceil
from hashlib import md5
import pickle

import json				# JSON format
import libsbml				# SBML format
import pygraphviz

from node import Node
from edge import Edge

from defaults import *
from SBO_terms import *


### Graph object definition ###

class Graph:
	def __init__(self, filename=None, JSON=None, SBML=None, verbosity=2):
		self.reset()
		self.verbosity = verbosity
		if filename is not None:
			self.importfile( filename )
		if JSON is not None:
			self.importJSON( JSON )
		if SBML is not None:
			self.importSBML( SBML )

	def owns(self, key1, key2=None, key3=None):
		if key2 is None:
			return key1 in self.__dict__.keys()
		if key3 is None:
			return self.owns(key1) and self.owns(key2)
		return self.owns(key1) and self.owns(key2) and self.owns(key3)

	def reset(self, clearDEBUG=True):					# reset current model
		self.Nodes = []
		self.Edges = []
		self.Compartments = []
		self.CenterNode = None
		self.dict_hash = ""
		self.JSON = None
		self.JSON_hash = ""
		self.SBML = None
		self.BioPAX = None
		self.BioLayout = None
		self.MD5 = None
		self.maxID = 1
		self.mapped = False
		self.IDmapNodes = self.IDmapEdges = {}
		if clearDEBUG:
			self.DEBUG = ""

	def log(self, msg, raw=False):
		msg = msg.strip()
		if msg != "":
			time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
			if not raw:
				msg = time+": "+msg
			self.DEBUG += msg+"\n"
			print msg

	def status(self):
		self.log("Network has "+str(self.NodeCount())+" Nodes ("+str(len(self.Compartments))+" of which are compartments) and "+str(self.EdgeCount())+" Edges.")

	def generateObjectLinks(self):
		self.log("Generating object links ...")
		for n in self.Nodes:
			if n.data.owns('compartment'):
				n.parent = self.getNodeByID(n.data.compartment)
		for e in self.Edges:
			e.source = self.getNodeByID(e.source)			# add Source and Target Node as Python Object links
			e.target = self.getNodeByID(e.target)

	def initialize(self, removeOrphans=False):				# initialize the network
		self.mapped = False
		self.log("Initializing Graph ...")
		self.status()
		self.selfcheck( removeOrphanEdges=removeOrphans )
		self.mapIDs()
		self.generateObjectLinks()
		self.hash()
		self.log("Graph initialized.")

	def enumerate_IDs(self):						# enumerate IDs and correct collisions
		self.node_IDs = []
		self.edge_IDs = []
		for n in self.Nodes:
			while n.id in self.node_IDs:
				oldID = str(n.id)
				n.id = randomID()
				if self.verbosity >= 1:
					self.log("Collision: Node '"+odlID+"' renamed to '"+n.id+"'")
			self.node_IDs.append(n.id)
		for e in self.Edges:
			while e.id in self.edge_IDs or e.id in self.node_IDs:
				oldID = str(e.id)
				e.id = randomID()
				if self.verbosity >= 1:
					self.log("Collision: Edge '"+oldID+"' renamed to '"+e.id+"'")
			self.edge_IDs.append(e.id)

	def enumerate_compartments(self):					# enumerate compartment list
		self.Compartments = []
		self.Compartment_IDs = [TopCompartmentID]
		for n in self.Nodes:
			if getNodeType(n.type) == getNodeType("Compartment Node"):
				self.Compartments.append(n)
				self.Compartment_IDs.append(n.id)

	def check_node_compartments(self):
		for n in self.Nodes:
			if not n.data.owns('compartment'):
				n.data.compartment = TopCompartmentID
				if self.verbosity >= 2:
					self.log("Strange: "+str(n.id)+".data.compartment is not defined. Moved to top.")
			if not n.data.compartment in self.Compartment_IDs:
				if self.verbosity >= 1:
					new = Node(defaults=True)
					new.id = n.data.compartment
					self.Nodes.append(new)
					compartmentIDs.append(new.id)
					self.log("Warning: Compartment '"+str(n.data.compartment)+"' for Node '"+str(n.id)+"' not found. Created.")
				n.data.compartment = TopCompartmentID

	def check_edge_connections(self, removeOrphanEdges=True):
		for e in self.Edges:
			if not e.source in self.node_IDs:
				self.Edges.pop( self.Edges.index(e) )
				if self.verbosity >= 1:
					self.log("Warning: Source node "+str(e.source)+" for edge "+str(e.id)+" not found. Edge removed.")
			elif not e.target in self.node_IDs:
				self.Edges.pop( self.Edges.index(e) )
				if self.verbosity >= 1:
					self.log("Warning: Target node "+str(e.target)+" for edge "+str(e.id)+" not found. Edge removed.")

	def refresh_subnode_arrays(self):
		for n in self.Nodes:
			n.data.subnodes = []
			for sub in self.Nodes:
				if sub != n:
					if sub.data.owns('compartment') and sub.data.compartment == n.id:
						n.data.subnodes.append(sub)	# object link

	def autosize_nodes(self):						# checks, if subnodes are bigger than parents and resizes the parent accordingly
		for node in self.Nodes:
			for subnode in node.data.subnodes:

				if node.data.owns('width') and subnode.data.owns('width'):
					if subnode.data.width > node.data.width:
						if self.verbosity >= 2:
							self.log("Warning: Resizing subnode "+str(subnode.id)+" of "+str(node.id)+", which is broadener than parent")
						node.data.width = subnode.data.width+20

				if node.data.owns('height') and subnode.data.owns('height'):
					if subnode.data.height > node.data.height:
						if self.verbosity >= 2:
							self.log("Warning: Resizing subnode "+str(subnode.id)+" of "+str(node.id)+", which is higher than parent")
						node.data.height = subnode.data.height+20

	def refresh_node_connected_edges(self):
		for node in self.Nodes:
			node.edges = []
			for edge in self.Edges:
				if edge.source == node or e.target == node.id:
					node.edges.append(edges)

	def find_abstract_nodes(self):
		for node in self.Nodes:
			if getNodeType(node.type) == getNodeType('Process Node'):
				node.is_abstract = True

	def selfcheck(self, autoresize=True, removeOrphanEdges=True):

		self.log("Performing Selfcheck ...")

		for n in self.Nodes:						# self-check all Nodes and Edges
			self.log( n.selfcheck(verbosity=self.verbosity), raw=True )
		for e in self.Edges:
			self.log( e.selfcheck(verbosity=self.verbosity), raw=True )

		self.enumerate_IDs()
		self.enumerate_compartments()
		self.check_node_compartments()
		self.check_edge_connections( removeOrphanEdges )
		self.refresh_subnode_arrays()
		self.refresh_node_connected_edges()
		self.find_abstract_nodes()

		if autoresize:
			self.autosize_nodes()


	### generating a unique Graph identifier ###

	def hash(self):
		self.MD5 = md5( pickle.dumps(self) ).hexdigest()
		return self.MD5


	### handling element IDs ###

	def mapIDs(self):							# generate a map of IDs and array indices
		self.log("Mapping IDs ...")
		self.maxID = 1							# thereby determine the highest ID used in our model
		self.IDmapNodes = self.IDmapEdges = {}
		for i in range(0, len(self.Nodes)):
			self.IDmapNodes[ self.Nodes[i].id ] = i
			try:
				if int( self.Nodes[i].id ) > self.maxID:	# may raise an exception, if Node ID is not integer
					self.maxID = int( self.Nodes[i].id )+1
			except:
				pass						# ... this exception is ignored
		for i in range(0, len(self.Edges)):
			self.IDmapEdges[ self.Edges[i].id ] = i
			try:
				if int( self.Edge[i].id ) > self.maxID:
					self.maxID = int( self.Edge[i].id )+1
			except:
				pass						# ... again ignored
		self.mapped = True

	def newID(self):							# generate a valid ID for the creation of a new object into our model
		self.maxID += 1
		return self.maxID

	def getNodeByID(self, ID):						# return Node with specified ID, else None
		if self.mapped:
			if ID in self.IDmapNodes.keys():
				return self.Nodes[ self.IDmapNodes[ID] ]
		else:
			for n in self.Nodes:
				if n.id == ID:
					return n
		return None

	def getEdgeByID(self, ID):
		return self.Edges[ self.IDmapEdges[ID] ]

	def getNodeIndex(self, node):						# get the array index of a specified Node
		if not node in self.Nodes:
			return 0						# not found
		return self.Nodes.index(node)					# counting starts with 0...

	def getCompartmentIndex(self, node):					# get the array index of a specified Node
		if not node in self.Compartments:
			return 0						# not found
		return self.Compartments.index(node)+1				# counting starts with 1...


	### functions for Graph creation: import / export ###

	def checkJSON(self, JSON):
		pre = "JSON checker: "
		if len(JSON) > 0:
			if JSON.find("'") > -1:
				JSON = JSON.replace("'",'"')			# JSON parser expects " quotes, ' quotes are not understood !
				self.log(pre+"' quotations are not understood and have been replaced. Please only use \" quotes in the future.")

			if JSON.lstrip()[0] != "{":				# JSON needs to start with "{"
				JSON = "{\n"+JSON+"\n}"
				self.log(pre+"JSON = '{' + JSON + '}'")

			while JSON.count("[") > JSON.count("]"):		# count "[" == count "]" ?
				JSON += "]"
				self.log(pre+"JSON = JSON + '}'")
			while JSON.count("[") < JSON.count("]"):
				JSON = "["+JSON
				self.log(pre+"JSON = '{' + JSON")

			while JSON.count("{") > JSON.count("}"):		# count "{" == count "}" ?
				JSON += "}"
				self.log(pre+"JSON = JSON + '}'")
			while JSON.count("{") < JSON.count("}"):
				JSON = "{"+JSON
				self.log(pre+"JSON = '{' + JSON")

			json = JSON.lower().replace(" ","")
			if json.find('nodes:') == -1 and json.find('"nodes":') == -1 and json.find("'nodes':") == -1:
				self.log(pre+'"nodes:" statement not found')
			if json.find('edges:') == -1 and json.find('"edges":') == -1 and json.find("'edges':") == -1:
				self.log(pre+'"nodes:" statement not found')

			while JSON.find("//") > -1:				# remove commentary
				p = JSON.find("//")
				q = JSON.find("\n", p)
				self.log(pre+"Removed commentary '"+JSON[p:q]+"'")
				JSON = JSON[:p] + JSON[q+1:]

			alphabet = range(ord("a"), ord("z")+1)+range(ord("A"), ord("Z")+1)
			space = ""
			for i in range(0,15):
				space += " "
			p = 0							### put all hash keys in quotes ###
			quoter = True
			while p < len(JSON):
				if JSON[p] == "{":				# hash starts, quotation started
					quoter = True
				if JSON[p] == ":":				# definition starts, quotation stopped
					quoter = False			
				if JSON[p] == ",":				# definition completed, quotation restarted
					quoter = True
				if False and quoter:
					if JSON[p] == '"' or JSON[p] == "'":	# quote found, quotation stopped
						quoter = False
					elif ord(JSON[p]) in alphabet:		# next byte is a character, not a quote !
						before = (space+JSON+space)[p:p+30].replace(" ","").replace("\n","").replace("\t","")
						q = p+1
						while ord(JSON[q]) in alphabet:
							q += 1
						JSON = JSON[:q] + '"' + JSON[q:]	# insert quote after statement
						JSON = JSON[:p] + '"' + JSON[p:]	# insert quote before statement
						after = (space+JSON+space)[p:p+30].replace(" ","").replace("\n","").replace("\t","")
						self.log(pre+"Added missing quotation: ... "+before+" ... -> ... "+after+" ...")
						quoter = False			# done here, no more quotation
				p += 1
		else:
			self.log(pre+"JSON = '{}'")
			JSON = "{}"
		return JSON	#.replace("\n","").replace("\t","").replace(" : ",":")	# for debugging, to make it easier to track the JSON importer problem

	def importJSON(self, JSON):						# import JSON
		self.reset()
		self.log("Importing JSON ...")

		JSON = self.checkJSON(JSON)
		try:
			JSON = json.loads(JSON)
		#except ValueError as e:
		#	self.log(str(e.__dict__))
		#	return
		except Exception, err:
			self.log("Fatal: JSON parser raised an exception! %s"%err)
			return
		self.Nodes = [Node(n, defaults=True) for n in JSON["nodes"]]
		self.Edges = [Edge(e, defaults=True) for e in JSON["edges"]]
		self.initialize()

	def exportJSON(self, Indent=DefaultIndent):				# export current model to JSON code
		self.log("Exporting JSON ...")

		d = self.exportDICT(status=False)

		h = md5( pickle.dumps(d) ).hexdigest()
		print 'Hash: '+h
		if self.JSON_hash != h:
			self.JSON = json.dumps( d, indent=Indent )
			self.JSON_hash = h

		self.status()
		return self.JSON

	def exportDICT(self, status=True):					# export current model as python dictionary
		if status:
			self.status()

		h = md5( pickle.dumps(self.Nodes) ).hexdigest() + md5( pickle.dumps(self.Edges) ).hexdigest()
		print 'Hash: '+h
		if self.dict_hash != h:
			self.exportdict = { "nodes":[n.exportDICT() for n in self.Nodes], "edges":[e.exportDICT() for e in self.Edges] }
			self.dict_hash = h

		return self.exportdict

	def importSBML(self, SBML):						# import SBML
		self.reset()
		self.log("Importing SBML ...")

		SBML = libsbml.readSBMLFromString( SBML )
		model = SBML.getModel()
		if model is None:
			self.log("Error: SBML model is None !")
			return False

		for compartment in model.getListOfCompartments():
			n = Node( defaults=True )
			n.id			= compartment.getId()
			n.sbo			= getSBO("Compartment")
			n.type                  = getNodeType("Compartment Node")
			n.data.label		= compartment.getName() if compartment.isSetName() else compartment.getId()
			if compartment.isSetOutside():
				n.data.compartment	= compartment.getOutside()
			self.Nodes.append(n)
			#self.Compartments.append(n)

		for species in model.getListOfSpecies():
			n = Node( defaults=True )
			n.id			= species.getId()
			n.sbo			= getSBO( species.getSBOTerm() )
			n.type			= 'simple species'#getNodeType("Entitiy Pool Node")
			n.data.label		= species.getName() if species.isSetName() else species.getId()
			n.data.compartment	= species.getCompartment()
			self.Nodes.append(n)

		self.mapIDs()	# because we will use newID() below

		for reaction in model.getListOfReactions():			# create a process node
			n			= Node( defaults=True )
			n.id			= reaction.getId()
			n.sbo			= '375'#getSBO("Unspecified")
		        n.type         		= 'reaction'#getNodeType('Process Node')
			n.data.label		= reaction.getName() if reaction.isSetName() else reaction.getId()
			n.data.width		= 26
			n.data.height		= 26
			self.Nodes.append(n)
			self.IDmapNodes[ n.id ]	= len(self.Nodes)-1

			for reactant in reaction.getListOfReactants():		# create Edges from the educts, products and modifiers to this process node
				e		= Edge( defaults=True )
				e.id		= self.newID()
				e.sbo           = 10#getSBO('Reactant')
				e.type		= getEdgeType(e.sbo)#'Substrate'
				e.source        = reactant.getSpecies()
				e.target	= n.id
				self.Edges.append(e)

			for product in reaction.getListOfProducts():
				e		= Edge( defaults=True )
				e.id		= self.newID()
				e.sbo           = 393#getSBO('Production')
				e.type		= getEdgeType(e.sbo)#'Product'
				e.source        = n.id
				e.target	= product.getSpecies()
				self.Edges.append(e)

			for modifier in reaction.getListOfModifiers():
				e		= Edge( defaults=True )
				e.id		= self.newID()
				#e.sbo		= getSBO( modifier.getSBOTerm() )
				e.sbo		= 19
				if modifier.isSetSBOTerm():
					e.sbo	= int(getSBO( modifier.getSBOTerm() ))
				e.type		= getEdgeType(e.sbo)#'Modifier'
				e.source        = modifier.getSpecies()
				e.target	= n.id
				self.Edges.append(e)

		self.initialize()


	### main model layouting section
	### invoking the layout subproject, that is seperately developed

	### here: http://code.google.com/p/biographer/source/browse?repo=layout


	# Exchange Format:

	# as defined here: http://code.google.com/p/biographer/wiki/LayoutInputFormat

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

	def export_to_Layouter(self):
		self.log("Exporting Layout ...")
		global layout
		layout = ""
		def write(s):
			global layout
			layout += str(s)+"\n"

		write( len(self.Compartments) )			# Compartments
		for compartment in self.Compartments:
			write( str(self.getCompartmentIndex(compartment)) +" "+ compartment.id )

		write("///")

		write( len(self.Nodes) )
		for node in self.Nodes:				# Nodes
			write( self.getNodeIndex(node) )
			write( getLayoutNodeType(node.type) )
			write( node.id )
			write( self.getCompartmentIndex(node.ParentComparent) )
			write( node.data.x )
			write( node.data.y )
			write( node.data.width )
			write( node.data.height )
			write( 0 )				# direction, a property we don't have, but the Layouter needs

		write("///")

		write( len(self.Edges) )			# Edges
		for edge in self.Edges:
			write( edge.type +" "+ str(self.getNodeIndex(edge.SourceNode)) +" "+ str(self.getNodeIndex(edge.TargetNode)) )

#		self.log(layout)

		return layout

	def import_from_Layouter(self, layout):
		self.log("Importing Layout ...")
		lines = layout.split("\n")

		# Compartments are ignored

		while lines[0] != "///":
			lines.pop()
		lines.pop()		# ///
		lines.pop()		# number of nodes

		for node in self.Nodes:
			lines.pop()			# node index
			lines.pop()			# node type
			lines.pop()			# node id
			lines.pop()			# node compartment
			node.data.x = lines.pop()
			node.data.y = lines.pop()
			node.data.width = lines.pop()
			node.data.height = lines.pop()
			lines.pop()			# node direction

		# Edges are ignored		

		self.initialize()


	### secondary model layouting
	### using graphviz

	def export_to_graphviz(self, debug=True):
		self.log("Exporting model to graphviz ...")

		# http://networkx.lanl.gov/pygraphviz/tutorial.html
		graphviz_model = pygraphviz.AGraph(directed=True)

		self.node_name_mapping = {}
		abstract_nodes = 0
		global abstract_nodes

		def recurse( parent, compartment_ID ):
			global abstract_nodes
			if debug:
				print "recursing "+str(compartment_ID)
			for node in self.Nodes:
				if not node.is_abstract:
					if (str(node.data.compartment) == str(compartment_ID)) or ((not node.data.owns('compartment')) and (compartment_ID == TopCompartmentID)):
						if getNodeType(node.type) == getNodeType('Compartment'):
							self.node_name_mapping[str(node.id)] = 'cluster'+str(len(self.node_name_mapping.keys()))
							l = node.data.label if node.data.owns("label") and node.data.label != "" else str(node.id)
							subgraph = parent.add_subgraph(	[],
											name = self.node_name_mapping[str(node.id)],
											label = str(l) )
#											shape = 'ellipse'		)

							if debug:
								self.log('Created subgraph for compartment '+str(node.id)+' in '+str(compartment_ID)+' ...')
							recurse( subgraph, node.id )
						else:
							if debug:
								self.log('Adding '+str(node.id)+' to '+str(compartment_ID)+' ...')

							self.node_name_mapping[str(node.id)] = 'node'+str(len(self.node_name_mapping.keys()))
							l = node.data.label if node.data.owns("label") and node.data.label != ""  else str(node.id)
							s = 'ellipse' if ( getNodeType(str(node.type)) != getNodeType("Process Node")) else 'box'
#							parent.add_node(	name, label=l, shape=s		)	# Fehler?
							parent.add_node(	self.node_name_mapping[str(node.id)], label=str(l)		)
				else:
					abstract_nodes += 1
		recurse( graphviz_model, TopCompartmentID )

		if debug:
			print self.node_name_mapping
			print 'Node name map has '+str(len(self.node_name_mapping.keys()))+' entries.'
			print 'Total node count is '+str(len(self.Nodes))+', '+str(abstract_nodes)+' of which are abstract'

		for edge in self.Edges:
			if str(edge.source) not in self.node_name_mapping.keys():
				print "Warning: Not adding arrow with unknown source '"+str(edge.source)+"'"

			elif str(edge.target) not in self.node_name_mapping.keys():
				print "Warning: Not adding arrow with unknown target '"+str(edge.target)+"'"

			else:
				source = self.node_name_mapping[ str(edge.source) ]
				target = self.node_name_mapping[ str(edge.target) ]
				arrow = 'tee' if getEdgeType(edge.sbo) == getEdgeType(getSBO('Inhibition')) else 'normal'

				if debug:
					print 'Adding edge from '+str(edge.source)+' to '+str(edge.target)
				try:
					graphviz_model.add_edge( source, target, arrowhead=arrow )
				except:
					if debug:
						print "failed"
		return graphviz_model

	def import_from_graphviz(self, layout, debug=True):
		self.log("Updating layout from graphviz ...")

		# http://www.graphviz.org/doc/info/attrs.html#d:pos

		def find_node_in_graphviz_output(haystack, needle):
			allowed_chars = [' ', '\t', '[']
			p = haystack.find(needle)
			while p > -1:
				try:
					if (haystack[p-1] in allowed_chars) and (haystack[p+len(needle)] in allowed_chars) and (haystack[p+len(needle)+1] in allowed_chars):
						return p
				except:	# string index out of range
					pass
				p = haystack.find(needle, p+1)
			return None

		def find_subgraph_in_graphviz_output(haystack, needle):
			p = haystack.find('subgraph '+needle)
			if p > -1:
				return haystack[p:haystack.find(';', p)]
			return None

		# invert node name mapping dictionary for reverse lookup
		self.node_name_mapping = dict([[v,k] for k,v in self.node_name_mapping.items()])

		if debug:
			print self.node_name_mapping

		for node in self.Nodes:
			if not node.is_abstract:
				if str(node.id) not in self.node_name_mapping.keys():
					print "Error: Node name mapping failed for '"+str(node.id)+"' in '"+str(node.data.compartment)+"'"

				else:
					nodealias = self.node_name_mapping[ str(node.id) ]

					if getNodeType(node.type) == getNodeType('Compartment'):
						coordinates = find_subgraph_in_graphviz_output(layout, nodealias)
						if coordinates is not None:
							node.update_from_graphviz_subgraph( coordinates )
						else:
							self.log("Warning: Node "+str(node.id)+" not updated")
					else:
						coordinates = find_node_in_graphviz_output(layout, nodealias)
						if coordinates is not None:
							node.update_from_graphviz_node( coordinates )
						else:
							self.log("Warning: Node "+str(node.id)+" not updated")

		self.log("Updated.")


	### basic functions on Graph properties ###

	def NodeCount(self):
		return len(self.Nodes)

	def EdgeCount(self, node=None):
		if node == None:
			return len( self.Edges )
		else:
			return len( self.getConnectedEdges(node) )


	### functions for really doing something with the Graph ###

	def Split(self, node, NumClones=1):
		self.log("Splitting "+str(node.id)+" ...")

		clones = []
		for i in range(0, NumClones):
			clones.append( deepcopy(node) )
			clones[i].id = self.newID()
			clones[i].data.clone_marker = node.id
		node.is_abstract = True

		######################################################################
		# an error will occur, if a Node is cloned, that is already abstract
		# reaction Nodes cannot be cloned !
		######################################################################

		self.log(str(NumClones)+" clones created. "+str(node.id)+" is now abstract.")
	
		# re-distribute Edges connected to the original Node onto clone Nodes #

		if len(node.ConnectedEdges) > 0:
			CurrentClone = 0
			EdgesPerClone = ceil( len(ConnectedEdges) / float(NumClones) )	# must be ceiled, because ALL Edges need to be distributed
			EdgesOfCurrentClone = 0
			for edge in node.ConnectedEdges:

				if edge.source == node.id:
					edge.source = clone[CurrentClone].id
					self.log("Edge "+str(e.id)+" now originates from cloned Node "+str(clone[CurrentClone].id))
					EdgesOfCurrentClone += 1

				elif edge.target == node.id:
					edge.target = clone[CurrentClone].id
					self.log("Edge "+str(e.id)+" now points to cloned Node "+str(clone[CurrentClone].id))
					EdgesOfCurrentClone += 1

				if EdgesOfCurrentClone >= EdgesPerClone:
					CurrentClone += 1

		self.log("Node "+str(node.id)+" cloned to 1 abstract Node + "+str(NumClones)+" clones. "+str( len(node.ConnectedEdges) )+" Edges re-distributed.")
		self.initialize()
			

	def setMaxEdges(self, degree):							# split all Nodes, that have more than "degree" Edges connected
		self.MaxEdges = degree
		self.log("Maximum Edge count set to "+str(degree)+".")
		for n in self.Nodes:							# for all Nodes
			if len(n.ConnectedEdges) > degree:
				self.log(str(n.id)+" exceeds maximum edge count.")
				self.Split( n )


	def Dijkstra(self, start, distance):
		try:
			distance = int(distance)
		except:
			distance = 0
		if distance < 1:
			self.log("Fatal: Dijkstra requires positive integer arguments !")
			return

		# http://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
		self.status()
		self.log("Cutting width distance "+str(distance)+" around Node "+start.id+" ...")

		print "Suche Knoten mit Distanz: "+str(distance)

		Besucht = {}
		Queue = {start:0}
		d = 0
		while ( d < distance ):
			print "Distanz: "+str(d)
			print "Besucht: ", Besucht
			print "Queue: ", Queue
			d += 1
			for node in Queue:						# für alle Nodes in der Queue,
				if node not in Besucht.keys():				#  die noch nicht besucht wurden,
					Besucht[node] = Queue[node]			#   speichere ihre Distanz in Besucht
			Queue = {}							# leere die Queue
			for node in Besucht.keys():					# für alle besuchten Nodes,
				if Besucht[node] == d-1:				#  die zuletzt nach Besucht geschrieben wurden,
					for neighbour in self.getNeighbours(node):	#   finde alle Nachbarn,
						if neighbour is not None:		#    die es gibt,
							print "gibt es: ", neighbour.id
							Queue[ neighbour ] = d		#     und speichere ihre Distanz in der Queue
						else:
							print "gibt es nicht: ", neighbour

		self.Nodes = Besucht.keys()
		self.initialize( removeOrphans=True )

