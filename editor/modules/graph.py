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
	def __init__(self, filename=None, JSON=None, SBML=None, verbosity=debug):
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
		self.abstract_nodes = 0
		self.Compartments = []
		self.CenterNode = None
		self.dict_hash = ""
		self.JSON = None
		self.JSON_hash = ""
		self.SBML = None
		self.BioPAX = None
		self.BioLayout = None
		self.MD5 = None
		if clearDEBUG:
			self.DEBUG = ""

	def log(self, level, msg, raw=False):
		if level >= self.verbosity:
			msg = msg.strip()
			if msg != "":
				time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
				if not raw:
					msg = time+": "+msg
				self.DEBUG += msg+"\n"
				print msg

	def status(self):
		self.log(info, "Network has "+str(self.NodeCount())+" nodes ("+str(len(self.Compartments))+" compartments, "+str(self.abstract_nodes)+" abstract) and "+str(self.EdgeCount())+" edges.")


	## initialize ###

	def make_object_links(self):
		self.log(debug, "Generating object links ...")

		def getNodeByID(ID):						# return Node with specified ID, else None
			for n in self.Nodes:
				if n.id == ID:
					return n
			return None

		for n in self.Nodes:
			if n.data.owns('compartment'):
				n.data.compartment = getNodeByID(n.data.compartment)
				if n.data.compartment is None:
					del n.data.compartment
		for e in self.Edges:
			e.source = getNodeByID(e.source)			# add Source and Target Node as Python Object links
			e.target = getNodeByID(e.target)

	def refresh_node_connected_edges(self):
		for node in self.Nodes:
			node.edges = []
			for edge in self.Edges:
				if edge.source == node or edge.target == node:
					node.edges.append(edge)

	def refresh_node_connections(self):
		for node in self.Nodes:
			node.connections = []
			for edge in node.edges:
				if edge.source == node:
					node.connections.append( edge.target )
				else:
					node.connections.append( edge.source )

	def refresh_subnode_arrays(self):
		for n in self.Nodes:
			n.data.subnodes = []
			for sub in self.Nodes:
				if sub != n:
					if sub.data.owns('compartment') and sub.data.compartment == n:
						n.data.subnodes.append(sub)	# object link

	def find_abstract_nodes(self):
		self.abstract_nodes = 0
		for node in self.Nodes:
			if node.is_abstract in [1, '1', True, 'True', 'true', 'TRUE', 'yes', 'YES']:
				node.is_abstract = True
				self.abstract_nodes += 1

	def move_process_nodes(self):
		for node in self.Nodes:
			if getNodeType(node.type) in [getNodeType('Process'), getNodeType('Reaction'), getNodeType('Entitiy Pool Node')]:
				for i in range(len(node.connections)):
					try:
						node.data.compartment = node.connections[0].data.compartment
						break
					except:
						pass

	def initialize(self, removeOrphans=False):				# initialize the network
		self.mapped = False
		self.log(debug, "Initializing Graph ...")
		self.status()
		self.selfcheck( removeOrphanEdges=removeOrphans )
		self.make_object_links()
		self.refresh_node_connected_edges()
		self.refresh_node_connections()
		self.refresh_subnode_arrays()
		self.find_abstract_nodes()
		self.move_process_nodes()
		self.hash()
		self.log(info, "Graph initialized.")


	### selfcheck ###

	def enumerate_IDs(self):						# enumerate IDs and correct collisions
		self.node_IDs = []
		self.edge_IDs = []
		for n in self.Nodes:
			while n.id in self.node_IDs:
				oldID = str(n.id)
				n.id = randomID()
				self.log(error, "Collision: Node '"+odlID+"' renamed to '"+n.id+"'")
			self.node_IDs.append(n.id)
		for e in self.Edges:
			while e.id in self.edge_IDs or e.id in self.node_IDs:
				oldID = str(e.id)
				e.id = randomID()
				self.log(error, "Collision: Edge '"+oldID+"' renamed to '"+e.id+"'")
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
				self.log(warning, "Warning: "+str(n.id)+".data.compartment is not defined. Moved to top.")

			if not n.data.compartment in self.Compartment_IDs:
				new = Node(defaults=True)
				new.id = n.data.compartment
				self.Nodes.append(new)
				self.log(warning, "Warning: Compartment '"+str(n.data.compartment)+"' for Node '"+str(n.id)+"' not found. Created.")

	def check_edge_connections(self, removeOrphanEdges=True):	# in the pre-objectlink-phase; edge.source/.target are still strings
		for e in self.Edges:
			if not e.source in self.node_IDs:
				self.Edges.pop( self.Edges.index(e) )
				self.log(error, "Warning: Source node "+str(e.source)+" for edge "+str(e.id)+" not found. Edge removed.")
			elif not e.target in self.node_IDs:
				self.Edges.pop( self.Edges.index(e) )
				self.log(error, "Warning: Target node "+str(e.target)+" for edge "+str(e.id)+" not found. Edge removed.")

	def check_node_sizes(self):						# checks, if subnodes are bigger than parents and resizes the parent accordingly
		for node in self.Nodes:
			for subnode in node.data.subnodes:

				if node.data.owns('width') and subnode.data.owns('width'):
					if subnode.data.width > node.data.width:
						self.log(warning, "Warning: Resizing subnode "+str(subnode.id)+" of "+str(node.id)+", which is broadener than parent")
						node.data.width = subnode.data.width+20

				if node.data.owns('height') and subnode.data.owns('height'):
					if subnode.data.height > node.data.height:
						self.log(warning, "Warning: Resizing subnode "+str(subnode.id)+" of "+str(node.id)+", which is higher than parent")
						node.data.height = subnode.data.height+20

	def selfcheck(self, removeOrphanEdges=True):

		self.log(debug, "Performing Selfcheck ...")

		for n in self.Nodes:						# self-check all Nodes and Edges
			self.log( error, n.selfcheck(verbosity=self.verbosity), raw=True )
		for e in self.Edges:
			self.log( error, e.selfcheck(verbosity=self.verbosity), raw=True )

		self.enumerate_IDs()
		self.enumerate_compartments()
		self.check_node_compartments()
		self.check_edge_connections( removeOrphanEdges )
		self.check_node_sizes()


	### generating a unique Graph identifier ###

	def hash(self):
		self.MD5 = md5( pickle.dumps(self) ).hexdigest()
		return self.MD5


	### functions for Graph creation: import / export ###

	def checkJSON(self, JSON):
		pre = "JSON checker: "
		if len(JSON) > 0:
			if JSON.find("'") > -1:
				JSON = JSON.replace("'",'"')			# JSON parser expects " quotes, ' quotes are not understood !
				self.log(warning, pre+"' quotations are not understood and have been replaced. Please only use \" quotes in the future.")

			if JSON.lstrip()[0] != "{":				# JSON needs to start with "{"
				JSON = "{\n"+JSON+"\n}"
				self.log(warning, pre+"JSON = '{' + JSON + '}'")

			while JSON.count("[") > JSON.count("]"):		# count "[" == count "]" ?
				JSON += "]"
				self.log(warning, pre+"JSON = JSON + '}'")
			while JSON.count("[") < JSON.count("]"):
				JSON = "["+JSON
				self.log(warning, pre+"JSON = '{' + JSON")

			while JSON.count("{") > JSON.count("}"):		# count "{" == count "}" ?
				JSON += "}"
				self.log(warning, pre+"JSON = JSON + '}'")
			while JSON.count("{") < JSON.count("}"):
				JSON = "{"+JSON
				self.log(warning, pre+"JSON = '{' + JSON")

			json = JSON.lower().replace(" ","")
			if json.find('nodes:') == -1 and json.find('"nodes":') == -1 and json.find("'nodes':") == -1:
				self.log(warning, pre+'"nodes:" statement not found')
			if json.find('edges:') == -1 and json.find('"edges":') == -1 and json.find("'edges':") == -1:
				self.log(warning, pre+'"nodes:" statement not found')

			while JSON.find("//") > -1:				# remove commentary
				p = JSON.find("//")
				q = JSON.find("\n", p)
				self.log(warning, pre+"Removed commentary '"+JSON[p:q]+"'")
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
						self.log(warning, pre+"Added missing quotation: ... "+before+" ... -> ... "+after+" ...")
						quoter = False			# done here, no more quotation
				p += 1
		else:
			self.log(warning, pre+"JSON = '{}'")
			JSON = "{}"
		return JSON	#.replace("\n","").replace("\t","").replace(" : ",":")	# for debugging, to make it easier to track the JSON importer problem

	def importJSON(self, JSON):						# import JSON
		self.reset()
		self.log(debug, "Importing JSON ...")

		JSON = self.checkJSON(JSON)
		try:
			JSON = json.loads(JSON)
		#except ValueError as e:
		#	self.log(str(e.__dict__))
		#	return
		except Exception, err:
			self.log(error, "Fatal: JSON parser raised an exception! %s"%err)
			return
		self.Nodes = [Node(n, defaults=True) for n in JSON["nodes"]]
		self.Edges = [Edge(e, defaults=True) for e in JSON["edges"]]
		self.initialize()

	def exportJSON(self, Indent=DefaultIndent):				# export current model to JSON code

		d = self.exportDICT(status=False)

		self.log(debug, "Exporting JSON ...")

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

		self.log(debug, "Exporting dictionary ...")

		h = md5( pickle.dumps(self.Nodes) ).hexdigest() + md5( pickle.dumps(self.Edges) ).hexdigest()
		print 'Hash: '+h
		if self.dict_hash != h:
			self.exportdict = { "nodes":[n.exportDICT() for n in self.Nodes], "edges":[e.exportDICT() for e in self.Edges] }
			self.dict_hash = h

		return self.exportdict

	def importSBML(self, SBML):						# import SBML
		self.reset()
		self.log(debug, "Importing SBML ...")

		SBML = libsbml.readSBMLFromString( SBML )
		model = SBML.getModel()
		if model is None:
			self.log(error, "Error: SBML model is None !")
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

		for reaction in model.getListOfReactions():			# create a process node
			n			= Node( defaults=True )
			n.id			= reaction.getId()
			n.sbo			= '375'#getSBO("Unspecified")
		        n.type         		= 'reaction'#getNodeType('Process Node')
			n.data.label		= reaction.getName() if reaction.isSetName() else reaction.getId()
			n.data.width		= 26
			n.data.height		= 26
			self.Nodes.append(n)

			for reactant in reaction.getListOfReactants():		# create Edges from the educts, products and modifiers to this process node
				e		= Edge( defaults=True )
				e.id		= 'reactant'+str(len(self.Nodes))
				e.sbo           = 10#getSBO('Reactant')
				e.type		= getEdgeType(e.sbo)#'Substrate'
				e.source        = reactant.getSpecies()
				e.target	= n.id
				self.Edges.append(e)

			for product in reaction.getListOfProducts():
				e		= Edge( defaults=True )
				e.id		= 'product'+str(len(self.Nodes))
				e.sbo           = 393#getSBO('Production')
				e.type		= getEdgeType(e.sbo)#'Product'
				e.source        = n.id
				e.target	= product.getSpecies()
				self.Edges.append(e)

			for modifier in reaction.getListOfModifiers():
				e		= Edge( defaults=True )
				e.id		= 'modifier'+str(len(self.Nodes))
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
		self.log(debug, "Exporting Layout ...")
		global layout
		layout = ""
		def write(s):
			global layout
			layout += str(s)+"\n"

		write( len(self.Compartments) )			# Compartments
		for compartment in self.Compartments:
			write( str(self.Compartments.index(compartment)) +" "+ str(compartment.id) )

		write("///")

		write( len(self.Nodes) )
		for node in self.Nodes:				# Nodes
			write( self.Nodes.index(node) )
			write( getLayoutNodeType(node.type) )
			write( node.id )
			write( self.Compartments.index(node.data.compartment) )
			write( node.data.x )
			write( node.data.y )
			write( node.data.width )
			write( node.data.height )
			write( 0 )				# direction, a property we don't have, but the Layouter needs

		write("///")

		write( len(self.Edges) )			# Edges
		for edge in self.Edges:
			write( edge.type +" "+ str( self.Nodes.index(edge.source) ) +" "+ str( self.Nodes.index(edge.target) ) )

		self.log(debug, layout)

		return layout

	def import_from_Layouter(self, layout):
		self.log(debug, "Importing Layout ...")
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
			node.data.x = float(lines.pop())
			node.data.y = float(lines.pop())
			node.data.width = float(lines.pop())
			node.data.height = float(lines.pop())
			lines.pop()			# node direction

		# Edges are ignored		

		self.initialize()


	### secondary model layouting
	### using graphviz

	def export_to_graphviz(self):
		self.log(debug, "Exporting model to graphviz ...")

		# http://networkx.lanl.gov/pygraphviz/tutorial.html
		graphviz_model = pygraphviz.AGraph(directed=True)

		global alias_counter
		alias_counter = 0

		def recurse( parent, compartment_ID ):
			global alias_counter
			self.log(debug, "recursing "+str(compartment_ID))
			for node in self.Nodes:
				if node.is_abstract:
					self.log(debug, 'Not adding abstract node '+str(node.id))
				else:
					if (node.data.owns('compartment') and str(node.data.compartment.id) == str(compartment_ID)) or ((not node.data.owns('compartment')) and (compartment_ID == TopCompartmentID)):
						if getNodeType(node.type) == getNodeType('Compartment'):
							node.alias = 'cluster'+str(alias_counter)
							alias_counter += 1
							l = node.data.label if node.data.owns("label") and node.data.label != "" else str(node.id)
							subgraph = parent.add_subgraph(	[],
											name = node.alias,
											label = str(l),
											shape = 'ellipse'		)

							self.log(debug, 'Created subgraph for compartment '+str(node.id)+' in '+str(compartment_ID)+' ...')
							recurse( subgraph, node.id )
						else:
							self.log(debug, 'Adding '+str(node.id)+' to '+str(compartment_ID)+' ...')

							node.alias = 'node'+str(alias_counter)
							alias_counter += 1
							l = node.data.label if node.data.owns("label") and node.data.label != ""  else str(node.id)
							s = 'ellipse' if ( getNodeType(str(node.type)) != getNodeType("Process Node")) else 'box'
							parent.add_node( node.alias, label=str(l), shape=s )
		recurse( graphviz_model, TopCompartmentID )

		self.log(info, 'Added '+str(alias_counter)+' nodes.')

		counter = 0
		for edge in self.Edges:
			self.log(debug, 'Adding edge from '+str(edge.source.id)+' to '+str(edge.target.id))

			try:
				source = edge.source.alias
				target = edge.target.alias
				arrow = 'tee' if getEdgeType(edge.sbo) == getEdgeType(getSBO('Inhibition')) else 'normal'
				graphviz_model.add_edge( source, target, arrowhead=arrow )
				counter += 1
			except:
				print "failed to add edge"
				if self.verbosity >= debug:
					print edge.exportDICT()
					print edge.source.exportDICT()
					print edge.target.exportDICT()

		self.log(info, 'Added '+str(counter)+' edges.')

		return graphviz_model

	def import_from_graphviz(self, layout):
		self.log(debug, "Updating layout from graphviz ...")

		# http://www.graphviz.org/doc/info/attrs.html#d:pos

		def find_node_in_graphviz_output(haystack, needle):
			allowed_chars = [' ', '\t', '[']
			p = haystack.find(needle)
			while p > -1:
				try:
					if (haystack[p-1] in allowed_chars) and (haystack[p+len(needle)] in allowed_chars) and (haystack[p+len(needle)+1] in allowed_chars):
						return haystack[p:haystack.find(';',p)]
				except:	# string index out of range
					pass
				p = haystack.find(needle, p+1)
			return None

		def find_subgraph_in_graphviz_output(haystack, needle):
			p = haystack.find('subgraph '+needle)
			if p > -1:
				return haystack[p:haystack.find(';', p)]
			return None

		for node in self.Nodes:
			if not node.is_abstract:
				if not node.owns('alias'):
					self.log(error, 'Error: Node '+str(node.id)+' lacks alias.')
				else:
					if getNodeType(node.type) == getNodeType('Compartment'):
						coordinates = find_subgraph_in_graphviz_output(layout, node.alias)
						if coordinates is not None:
							node.update_from_graphviz_subgraph( coordinates )
						else:
							self.log(warning, "Warning: Node "+str(node.id)+" not updated")
					else:
						coordinates = find_node_in_graphviz_output(layout, node.alias)
						if coordinates is not None:
							node.update_from_graphviz_node( coordinates )
						else:
							self.log(warning, "Warning: Node "+str(node.id)+" not updated")

		self.log(info, "Model updated.")


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
		self.log(debug, "Splitting "+str(node.id)+" ...")

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

		self.log(info, str(NumClones)+" clones created. "+str(node.id)+" is now abstract.")
	
		# re-distribute Edges connected to the original Node onto clone Nodes #

		if len(node.ConnectedEdges) > 0:
			CurrentClone = 0
			EdgesPerClone = ceil( len(ConnectedEdges) / float(NumClones) )	# must be ceiled, because ALL Edges need to be distributed
			EdgesOfCurrentClone = 0
			for edge in node.ConnectedEdges:

				if edge.source == node.id:
					edge.source = clone[CurrentClone].id
					self.log(info, "Edge "+str(e.id)+" now originates from cloned Node "+str(clone[CurrentClone].id))
					EdgesOfCurrentClone += 1

				elif edge.target == node.id:
					edge.target = clone[CurrentClone].id
					self.log(info, "Edge "+str(e.id)+" now points to cloned Node "+str(clone[CurrentClone].id))
					EdgesOfCurrentClone += 1

				if EdgesOfCurrentClone >= EdgesPerClone:
					CurrentClone += 1

		self.log(info, "Node "+str(node.id)+" cloned to 1 abstract Node + "+str(NumClones)+" clones. "+str( len(node.ConnectedEdges) )+" Edges re-distributed.")
		self.initialize()
			

	def setMaxEdges(self, degree):							# split all Nodes, that have more than "degree" Edges connected
		self.MaxEdges = degree
		self.log(iinfo, "Maximum Edge count set to "+str(degree)+".")
		for n in self.Nodes:							# for all Nodes
			if len(n.ConnectedEdges) > degree:
				self.log(info, str(n.id)+" exceeds maximum edge count.")
				self.Split( n )


	def Dijkstra(self, start, distance):
		try:
			distance = int(distance)
		except:
			distance = 0
		if distance < 1:
			self.log(error, "Fatal: Dijkstra requires positive integer arguments !")
			return

		# http://en.wikipedia.org/wiki/Dijkstra%27s_algorithm
		self.status()
		self.log(error, "Cutting width distance "+str(distance)+" around Node "+start.id+" ...")

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

