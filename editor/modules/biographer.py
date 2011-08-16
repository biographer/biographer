#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# biographer library
# by Matthias Bock <matthias.bock@hu-berlin.de>
# Please execute via the biographer web2py environment
# Created in the context of Google Summer of Code 2011
# http://code.google.com/p/biographer/
# License is GNU GPL Version 2


### dependencies ###

from constants import *			# biographer defaults & constants
import os
from time import time, sleep		# to measure layouter runtime
from datetime import datetime		# to log with timestamp
from copy import deepcopy
from math import ceil
from random import random		# to generate new, random IDs on collision
from hashlib import md5
import json				# JSON format
import libsbml				# SBML format
from libimpress import ODP		# OpenDocument format
from libbiopax import BioPAX		# BioPAX format
import pygraphviz			# calling graphviz from python
import re				# regular expressions; graphviz output parsing
from subprocess import Popen, PIPE	# for calling the layouter
from shlex import split			# shell argument splitting


#### main ####

def randomID( prefix="random", length=5 ):
	return prefix + ''.join( [str(int(random()*10)) for i in range(0,length)] )

class data:								# data structure, used for both Node and Edge optional parameters
	def __init__(self, dictionary={} ):
		self.__dict__.update( deepcopy(dictionary) )
		if not self.owns('id'):
			self.id = randomID()

	def owns(self, key1, key2=None, key3=None):
		if key2 is None:
			return key1 in self.__dict__.keys()
		if key3 is None:
			return self.owns(key1) and self.owns(key2)
		return self.owns(key1) and self.owns(key2) and self.owns(key3)

	def exportDICT(self):
		me = deepcopy(self.__dict__)
		del me['id']
		return me

### Node ###

class Node:
	def __init__(self, JSON=None, defaults=False):			# input may be string or dictionary
		if defaults:
			self.__dict__.update( deepcopy(DefaultNode) )
		if JSON is not None:
			if type(JSON) == type(""):
				JSON = json.loads(JSON)
			self.__dict__.update( deepcopy(JSON) )		# map all input key/value pairs to the python object
			# after that self.data will be a dictionary
			# we don't want that, we want to access all parameters in the way node.data.subnodes etc...
		if not self.owns('data'):
			self.data = {}
		self.data = data(self.data)

	def owns(self, key1, key2=None, key3=None):
		if key2 is None:
			return key1 in self.__dict__.keys()
		if key3 is None:
			return self.owns(key1) and self.owns(key2)
		return self.owns(key1) and self.owns(key2) and self.owns(key3)

	def setByGraphviz( self, dot ):
		if not self.owns("data"):
			self.data = data()

		r = re.compile('[\d\.]+')

		key = 'pos="'
		p = dot.find(key)
		if p == -1:
			return False
		p += len(key)
		q = dot.find('"', p)
		pos = r.findall( dot[p:q] )
		self.data.x = pos[0]
		self.data.y = pos[1]

		key = 'width="'
		p = dot.find(key)
		if p == -1:
			return False
		p += len(key)
		q = dot.find('"', p)
		self.data.width = int( float( r.findall(dot[p:q])[0] ) *70)		# temporary workaround	# future

		key = 'height="'
		p = dot.find(key)
		if p == -1:
			return False
		p += len(key)
		q = dot.find('"', p)
		self.data.height = int( float( r.findall(dot[p:q])[0] ) *70)		# temporary workaround

		return str(self.id)+" is now at ( "+str(self.data.x)+" | "+str(self.data.y)+" ), width = "+str(self.data.width)+", height = "+str(self.data.height)

	def exportJSON(self, Indent=DefaultIndent):			# export Node as JSON string
		return json.dumps( self.exportDICT(), indent=Indent )

	def exportDICT(self):
		me = deepcopy(self.__dict__)				# convert self to dictionary
		me['data'] = self.data.exportDICT()
		if "ConnectedEdges" in me.keys():			# do not export ConnectedEdges,
			del me["ConnectedEdges"]
		if "SubNodes" in me.keys():				# SubNodes,
			del me["SubNodes"]
		if "CompartmentNode" in me.keys():			# and the CompartmentNode
			del me["CompartmentNode"]
		return me

	def exportLayout(self):
		return {
			'id'		: self.id, \
			'type'		: self.type, \
			'compartment'	: self.data.compartment, \
			'x'		: self.data.x, \
			'y'		: self.data.y, \
			'width'		: self.data.width, \
			'height'	: self.data.height, \
			'direction'	: ''
			}

	def importLayout(self, layout):
		self.type		= layout['type']
		self.id			= layout['id']
		self.data.compartment 	= layout['compartment']
		self.data.x		= layout['x']
		self.data.y		= layout['y']
		self.data.width		= layout['width']
		self.data.height	= layout['height']

	def selfcheck(self):						# perform some basic integrity checks
		result = ""
		show = False

		for key in self.__dict__.keys():				# check if we recognize all keys
			if not key in ["ConnectedEdges", "SubNodes", "CompartmentNode"]:	# else skip it ...
				if key in NodeKeyAliases.keys():		# is it an alias ...
					newkey = NodeKeyAliases[key]
					result += 'Format error: '+self.id+'.'+key+' moved to '+self.id+'.'+newkey+'\n'
					self.__dict__[newkey] = self.__dict__[key]
					del self.__dict__[key]
					key = newkey
				if not key in NodeKeys:
					if key in OptionalNodeKeys:		# is it an optional key ...
						result += 'Format error: '+self.id+'.'+key+'" moved to '+self.id+'.data.'+key+'\n'
						self.data.__dict__[key] = self.__dict__[key]
						del self.__dict__[key]
					else:
						result += 'Format error: Unrecognized Node property "'+key+'" !\n'
						show = True

		for key in self.data.__dict__.keys():				# check optional keys
			if key in NodeKeyAliases.keys():		# is it an alias ...
				newkey = NodeKeyAliases[key]
				result += 'Format error: '+self.id+'.data.'+key+' moved to '+self.id+'.data.'+newkey+'\n'
				self.data.__dict__[newkey] = self.data.__dict__[key]
				del self.data.__dict__[key]
				key = newkey
			if not key in OptionalNodeKeys:
				if key == 'id':
					if not self.owns('id'):
						result += 'Format error: '+self.id+'.data.id moved to '+self.id+'.id\n'
						self.id = self.data.id
						self.data.id = randomID()
				elif key in NodeKeys:			# is it a mandatory key ...
					result += 'Format error: '+self.id+'.data.'+key+' moved to '+self.id+'.'+key+'\n'
					self.__dict__[key] = self.data.__dict__[key]
					del self.data.__dict__[key]
				else:
					result += 'Format error: Unrecognized optional Node property "'+key+'" !\n'
					show = True

		for key in MandatoryNodeKeys:				# check mandatory keys
			if not self.owns(key):
				result += 'Error: '+self.id+'.'+key+' undefined but mandatory !\n'
				show = True

		if str(self.id) == "-1":				# check ID
			result += "Error: Node ID -1 is not allowed !\n"
			show = True
		if type(self.id) == type(0):
			if self.id < 0:
				result += "Warning: Node ID < 0 !\n"
				show = True

		if self.data.owns("compartment") and ( type(self.data.compartment) == type(0) ):	# check compartment
			if self.data.compartment < 0 and self.type in [0,3]:
				result += "Warning: Node compartment < 0 !\n"
				show = True
									# check visual properties
		if self.data.owns("width") is not self.data.owns("height"):
			result += "Warning: Incomplete information on Node size !\n"
			show = True

		if show:						# if errors: show source
			result += "Node contains errors: "+self.exportJSON()+"\n"
		return result
### end Node ###


### Edge ###

class Edge:
	def __init__(self, JSON=None, defaults=False):			# input parameter may be string or dictionary
		if defaults:
			self.__dict__.update(deepcopy(DefaultEdge))
		if JSON is not None:
			if type(JSON) == type(""):
				JSON = json.loads(JSON)
			self.__dict__.update(deepcopy(JSON))		# import all input key/value pairs to the python object
		if not self.owns('data'):
			self.data = {}
		self.data = data(self.data)

	def owns(self, key1, key2=None, key3=None):
		if key2 is None:
			return key1 in self.__dict__.keys()
		if key3 is None:
			return self.owns(key1) and self.owns(key2)
		return self.owns(key1) and self.owns(key2) and self.owns(key3)

	def theotherID(self, nodeID):
		if self.owns('source') and self.owns('target'):
			if self.source == nodeID:
				return self.target
			if self.target == nodeID:
				return self.source
		return None

	def exportJSON(self, Indent=DefaultIndent):			# export Edge as JSON
		return json.dumps( self.exportDICT(), indent=Indent )

	def exportDICT(self):
		me = deepcopy(self.__dict__)				# export self as dictionary
		me['data'] = self.data.exportDICT()
		if "SourceNode" in me.keys():				# do not export SourceNode and TargetNode
			del me["SourceNode"]
		if "TargetNode" in me.keys():
			del me["TargetNode"]
		return me

	def exportLayout(self):
		return {
			'id'	:	edge.id,
			'type'	:	'Directed',
			'source':	edge.source,
			'target':	edge.target
			}

	def importLayout(self, layout):
		self.id			= layout['id']
		self.type		= layout['type']
		self.source		= layout['source']
		self.target		= layout['target']

	def selfcheck(self):
		result = ""
		show = False

		for key in self.__dict__.keys():				# check if we recognize all keys
			if not key in ['SourceNode', 'TargetNode']:		# skip it ...
				if key in EdgeKeyAliases.keys():		# is it an alias ...
					newkey = EdgeKeyAliases[key]
					result += 'Automatically corrected error: Edge property "'+key+'" should be named "'+newkey+'" !\n'
					self.__dict__[newkey] = self.__dict__[key]
					del self.__dict__[key]
					key = newkey
				if not key in EdgeKeys:
					if key in OptionalEdgeKeys:
						result += 'Automatically corrected error: Edge property "'+key+'" belongs under "data" !\n'
						self.data.__dict__[key] = self.__dict__[key]
						del self.__dict__[key]
					else:
						result += 'Warning: Unrecognized Edge property "'+key+'" !\n'
						show = True

		for key in self.data.__dict__.keys():			# check optional keys
			if key in EdgeKeyAliases.keys():		# is it an alias ...
				newkey = EdgeKeyAliases[key]
				result += 'Automatically corrected error: Optional edge property "'+key+'" should be named "'+newkey+'" !\n'
				self.data.__dict__[newkey] = self.data.__dict__[key]
				del self.data.__dict__[key]
				key = newkey
			if not key in OptionalEdgeKeys:
				if key == 'id':
					if not self.owns('id'):
						result += 'Format error: '+self.id+'.data.id moved to '+self.id+'.id\n'
						self.id = self.data.id
						self.data.id = randomID()
				elif key in NodeKeys:			# is it a mandatory key ...
					result += 'Automatically corrected error: Edge property "'+key+'" does not belong under "data" !\n'
					self.__dict__[key] = self.data.__dict__[key]
					del self.data.__dict__[key]
				else:
					result += 'Warning: Unrecognized optional Edge property "'+key+'" !\n'
					show = True

		for key in MandatoryEdgeKeys:				# check for mandatory keys
			if not self.owns(key):
				result += "Error: Mandatory Edge key "+key+" is missing !\n"
				show = True

		if str(self.id) == "-1":				# check ID
			result += "Error: Edge ID -1 is not allowed !\n"
			show = True
		if type(self.id) == type(0):
			if self.id < 0:
				result += "Warning: Edge ID < 0 !\n"
				show = True

									# check label
		if self.data.owns("label") and not (self.data.owns("label_x") and self.data.owns("label_y")):
			result += "Error: Label position missing !\n"
			show = True
		if self.data.owns("label_x") is not self.data.owns("label_y"):
			result += "Error: Label position incomplete !\n"
			show = True

		if show:						# if errors: show source
			result += "Edge contains errors: "+self.exportJSON()+"\n"
		return result
### end Edge ###




### Graph ###

class Graph:
	def __init__(self, filename=None, JSON=None, SBML=None, ODP=None, BioPAX=None):
		self.empty()
		if filename is not None:
			self.importfile( filename )
		if JSON is not None:
			self.importJSON( JSON )
		if SBML is not None:
			self.importSBML( SBML )
		if ODP is not None:
			self.importODP( ODP )
		if BioPAX is not None:
			self.importBioPAX( BioPAX )

	def owns(self, key1, key2=None, key3=None):
		if key2 is None:
			return key1 in self.__dict__.keys()
		if key3 is None:
			return self.owns(key1) and self.owns(key2)
		return self.owns(key1) and self.owns(key2) and self.owns(key3)

	def empty(self, clearDEBUG=True):					# reset current model
		self.Nodes = []
		self.Edges = []
		self.Compartments = []
		self.CenterNode = None
		self.JSON = None
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
		self.log("Network has "+str(self.NodeCount())+" Nodes ("+str(len(self.Compartments))+" Compartments) and "+str(self.EdgeCount())+" Edges.")

	def pickCompartments(self):						# create array Compartments with links to the appropriate Node Objects
		self.log("Picking Compartments ...")
		self.Compartments = []
		CompartmentNode = getNodeType("Compartment Node")
		for node in self.Nodes:
			if node.type == CompartmentNode:
				self.Compartments.append(node)

	def generateObjectLinks(self):
		self.log("Generating object links ...")
		for n in self.Nodes:
			n.ConnectedEdges = self.getConnectedEdges(n)		# add connected Edges as Object links
			n.SubNodes = []
			if n.data.owns('subnodes'):
				for subID in n.data.subnodes:			# add SubNodes as Object links
					node = self.getNodeByID(subID)
					if node is not None:
						n.SubNodes.append( node )
			n.CompartmentNode = None				# add CompartmentNode as Object Link
			if n.data.owns('compartment'):
				n.CompartmentNode = self.getNodeByID(n.data.compartment)
		for e in self.Edges:
			e.SourceNode = self.getNodeByID(e.source)		# add Source and Target Node as Python Object links
			e.TargetNode = self.getNodeByID(e.target)

	def initialize(self, removeOrphans=False):				# initialize the network
		self.mapped = False
		self.log("Initializing Graph ...")
		self.status()
		self.selfcheck( removeOrphanEdges=removeOrphans )
		self.mapIDs()
		self.pickCompartments()
		self.generateObjectLinks()
		self.hash()
		self.log("Graph initialized.")

	def selfcheck(self, autoresize=True, removeOrphanEdges=True):		# perform some basic integrity checks on the created Graph

		self.log("Performing Selfcheck ...")

		for n in self.Nodes:						# self-check all Nodes and Edges
			self.log( n.selfcheck(), raw=True )
		for e in self.Edges:
			self.log( e.selfcheck(), raw=True )

		usedIDs = []				# remember all used IDs
		nodeIDs = []				# remember all Node IDs
		compartmentIDs = [TopCompartmentID]	# remember compartments
		for n in self.Nodes:						# check for (and correct) colliding Node IDs !
			while n.id in usedIDs:
				oldID = str(n.id)
				n.id = randomID()
				self.log("Collision: Node ID changed from '"+odlID+"' to '"+n.id+"' !")
			usedIDs.append(n.id)
			if n.type == getNodeType("Compartment Node"):
				compartmentIDs.append(n.id)
			nodeIDs.append(n.id)

		for e in self.Edges:						# check for (and correct) colliding Node IDs !
			while e.id in usedIDs:
				oldID = str(e.id)
				e.id = randomID()
				self.log("Collision: Edge ID changed from '"+oldID+"' to '"+e.id+"' !")
			usedIDs.append(e.id)

		for n in self.Nodes:
			if not n.data.owns('compartment'):
				n.data.compartment = TopCompartmentID
				self.log("Strange: "+str(n.id)+".data.compartment is not defined. Node moved to top.")
			if not n.data.compartment in compartmentIDs:		# valid compartment ?
				self.log("Error: Compartment "+str(n.data.compartment)+" for Node "+str(n.id)+" not found ! Node moved to top.")
				n.data.compartment = TopCompartmentID

		for e in self.Edges:
			orphan = False
			if not e.source in nodeIDs:				# Source Node exists?
				self.log("Error: Source Node "+str(e.source)+" for Edge "+str(e.id)+" not found !")
				orphan = True
			if not e.target in nodeIDs:				# Target Node exists ?
				self.log("Error: Target Node "+str(e.target)+" for Edge "+str(e.id)+" not found !")
				orphan = True
			if orphan and removeOrphanEdges:			# No -> Orphan!
				self.log("Edge removed.")
				self.Edges.pop( self.Edges.index(e) )		# remove it

		for n in self.Nodes:						# Nodes have non-existing subnodes ?
										# or subnodes lie outside parent ?
			if not n.data.owns('subnodes'):
				n.data.subnodes = []
				self.log("Strange: "+str(n.id)+".data.subnodes is not defined. Attached an empty array.")
			for subID in n.data.subnodes:
				s = self.getNodeByID( subID )
				if s is None:
					n.data.subnodes.pop( n.data.subnodes.index(subID) )	# Subnode not found -> remove !
					self.log("Error: Subnode "+str(subID)+" of Node "+str(n.id)+" not found ! Subnode removed.")
				else:
					if s.data.owns('x','y','width') and n.data.owns('x','y','width'):
						if s.data.x + s.data.width > n.data.x + n.data.width:
							self.log("Warning: Subnode "+str(s.id)+" of Node "+str(n.id)+" broadener than parent !")
							if autoresize:
								n.data.width = s.data.x + s.data.width - n.data.x
								self.log("Autoresize: Made it smaller.")
						if s.data.y + s.data.height > n.data.y + n.data.height:
							self.log("Warning: Subnode "+str(s.id)+" of Node "+str(n.id)+" higher than parent !")
							if autoresize:
								n.data.height = s.data.y + s.data.height - n.data.y
								self.log("Autoresize: Made it smaller.")

	### generating a unique Graph identifier ###

	def hash(self):
		self.MD5 = md5( self.exportJSON() ).hexdigest()
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
		return self.Nodes.index(node)+1					# counting starts with 1...


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

			json = JSON.lower()
			if json.replace(" ","").find('nodes:') == -1:		# nodes: present?
				self.log(pre+"No Nodes defined !")
			if json.replace(" ","").find('edges:') == -1:		# edges: present?
				self.log(pre+"No Edges defined !")

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
				if quoter:
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
		self.empty()
		self.log("Importing JSON ...")

		JSON = self.checkJSON(JSON)
		try:
			JSON = json.loads(JSON)
		#except ValueError as e:
		#	self.log(str(e.__dict__))
		#	return
		except:
			self.log("Fatal: JSON parser raised an exception!")
			return
		self.Nodes = [Node(n, defaults=True) for n in JSON["nodes"]]
		self.Edges = [Edge(e, defaults=True) for e in JSON["edges"]]
		self.initialize()

	def exportJSON(self, Indent=DefaultIndent):				# export current model to JSON code
		self.log("Exporting JSON ...")
		self.JSON = json.dumps( self.exportDICT(status=False), indent=Indent )
		self.status()
		return self.JSON

	def exportDICT(self, status=True):					# export current model as python dictionary
		if status:
			self.status()
		return { "nodes":[n.exportDICT() for n in self.Nodes], "edges":[e.exportDICT() for e in self.Edges] }

	def importSBML(self, SBML):						# import SBML
		self.empty()
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
			n.type                  = getNodeType("Compartment")
			n.data.label		= compartment.getName()
			if compartment.isSetOutside():
				n.data.compartment	= compartment.getOutside()
			self.Nodes.append(n)

		for species in model.getListOfSpecies():
			n = Node( defaults=True )
			n.id			= species.getId()
			n.sbo			= getSBO( species.getSBOTerm() )
			n.type			= getNodeType("Entitiy Pool Node")
			n.data.label		= species.getName()
			n.data.compartment	= species.getCompartment()
			self.Nodes.append(n)

		self.mapIDs()	# because we will use newID() below

		for reaction in model.getListOfReactions():			# create a process node
			n			= Node( defaults=True )
			n.id			= reaction.getId()
			n.sbo			= getSBO("Unspecified")
		        n.type         		= getNodeType('Process Node')
			n.data.label		= reaction.getName()
			self.Nodes.append(n)
			self.IDmapNodes[ n.id ]	= len(self.Nodes)-1

			for reactant in reaction.getListOfReactants():		# create Edges from the educts, products and modifiers to this process node
				e		= Edge( defaults=True )
				e.id		= self.newID()
				e.sbo           = getSBO('Reactant')
				e.type		= getEdgeType(e.sbo)
				e.source        = reactant.getSpecies()
				e.target	= n.id
				self.Edges.append(e)

			for product in reaction.getListOfProducts():
				e		= Edge( defaults=True )
				e.id		= self.newID()
				e.sbo           = getSBO('Production')
				e.type		= getEdgeType(e.sbo)
				e.source        = n.id
				e.target	= product.getSpecies()
				self.Edges.append(e)

			for modifier in reaction.getListOfModifiers():
				e		= Edge( defaults=True )
				e.id		= self.newID()
				e.sbo		= getSBO( modifier.getSBOTerm() )
				e.type		= getEdgeType(e.sbo)
				e.source        = modifier.getSpecies()
				e.target	= n.id
				self.Edges.append(e)

		self.initialize()

	def importODP(self, odp):						# import an OpenOffice Impress Document
		self.empty()
		self.log("Importing ODP ...")
		impress = ODP( odp )
		self.log( impress.DEBUG )
		self.Nodes = impress.Nodes
		self.Edges = impress.Edges
		self.initialize()

	def exportODP(self):							# export an OpenOffice Impress Document
		self.log("Exporting ODP ...")
		impress = ODP()
		impress.Nodes = self.Nodes
		impress.Edges = self.Edges
		self.status()
		return impress.export()

	def importBioPAX(self, biopax):
		self.empty()
		self.log("Importing BioPAX ...")
		b = BioPAX( biopax )
		self.Nodes = b.Nodes
		self.Edges = b.Edges
		self.initialize()

	def exportGraphviz(self, folder="/tmp", useCache=True, updateNodeProperties=False):
		self.log("Exporting Graphviz ...")
		self.status()

		# http://networkx.lanl.gov/pygraphviz/tutorial.html
		G = pygraphviz.AGraph(directed=True)

		changes = False
		for node in self.Nodes:
			if (not node.is_abstract) and (self.EdgeCount(node) > 0):
				G.add_node( 	str(node.id),
						label = node.data.label if node.data.owns("label") else str(node.id),
						shape = 'ellipse' if node.type != getNodeType("Process Node") else 'box'
						)
			elif updateNodeProperties:
				self.Nodes.pop( self.Nodes.index(node) )
				changes = True
				self.log("Warning: Graphviz can't handle Node "+str(node.id)+"! Node deleted.")
		if changes:
			self.initialize()	# e.g. ID map won't fit anymore, because we deleted Nodes

		for edge in self.Edges:
			G.add_edge( str(edge.source), str(edge.target),
				    arrowhead='normal' if edge.sbo in [ getSBO('Consumption'), getSBO('Production') ] else 'tee' )

		png = self.MD5+".png"
		dot = self.MD5+".dot"
		s   = self.MD5+".str"
		pngpath = os.path.join(folder, png)
		dotpath = os.path.join(folder, dot)
		if useCache and os.path.exists( pngpath ):
			cached = True
			# no need to do the cpu-intense layouting again
			self.dot = open(dotpath).read()
		else:
			cached = False
			G.dpi = 70;
			G.layout( prog='dot' )
			G.draw( pngpath )
			self.dot = G.string()
			open(dotpath,'w').write(self.dot)

		# http://www.graphviz.org/doc/info/attrs.html#d:pos
		changes = False
		if updateNodeProperties:
			for node in self.Nodes:
				p = self.dot.find("\t"+str(node.id)+"\t")
				if p > -1:
					q = self.dot.find(";", p)
					node.setByGraphviz( self.dot[p:q] )
				else:
					self.Nodes.pop( self.Nodes.index(node) )
					changes = True
					self.log("Warning: Updating Node "+str(node.id)+" from graphviz output failed! Node deleted.")
		if changes:
			self.initialize()

		return self.dot, png, cached, None

	### biographer Layout ###

	# http://code.google.com/p/biographer/wiki/LayoutInputFormat

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

	def exportLayout(self):
		self.log("Exporting Layout ...")
		global layout
		layout = ""
		def write(s):
			global layout
			layout += str(s)+"\n"

		write( len(self.Compartments) )			# Compartments
		for compartment in self.Compartments:
			write( str(self.getNodeIndex(compartment)) +" "+ compartment.id )

		write("///")

		write( len(self.Nodes) )
		for node in self.Nodes:				# Nodes
			write( self.getNodeIndex(node) )
			write( getLayoutNodeType(node.type) )
			write( node.id )
			write( self.getNodeIndex(node.CompartmentNode) )
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

	def importLayout(self, layout):
		self.log("Importing Layout ...")
		# deleted... will change drastically anyway, makes no sense to develop now
		self.initialize()

	def Layout(self, Layouter):
		timeout = 10
		start = time()									# start a timer

		self.LayouterInput = self.exportLayout()
		self.LayouterOutput = ""

		self.log("Executing "+Layouter+" ...")						# Input ...
		layouter = Popen( split(Layouter), stdin=PIPE, stdout=PIPE )			# execute "layout"
		layouter.communicate( input=self.LayouterInput )				# stdin, stdout
		self.LayouterRuntime = 0
		while layouter.poll is None and self.LayouterRuntime < timeout:			# wait until timeout
			sleep(3)
			self.LayouterRuntime = time()-start
			print str(self.LayouterRuntime)

		if self.LayouterRuntime >= timeout:						# process timed out !
			self.log("Error: Process timed out !")
			return

		self.LayouterOutput = layouter.communicate( input=self.LayouterInput )[0]	# Output ...
		layouter.stdin.close()
		self.importLayout( self.LayouterOutput )					# import STDOUT

		self.log("Executable finished.")


	### basic functions on Graph properties ###

	def getConnectedEdges(self, node):							# returns an array of Edges, pointing from/to the specified Node
		edges = []
		for e in self.Edges:
			if (str(e.source) == str(node.id)) or (str(e.target) == str(node.id)):
				edges.append( e )
		return edges

	def getConnectedNodes(self, node):
		results = []
		if not node.owns('ConnectedEdges'):
			node.ConnectedEdges = self.getConnectedEdges(node)
		for edge in node.ConnectedEdges:
			results.append( self.getNodeByID( edge.theotherID(node.id) ) )
		return results

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

