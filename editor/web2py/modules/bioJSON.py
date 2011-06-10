#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

import json

DefaultIndent = 9			# for JSON output string formatting, 9 spaces per indent

MandatoryNodeKeys	= ['id','type','sbo','visible']
OptionalNodeKeys	= ['clone_marker', 'x', 'y', 'width', 'height', 'radius', 'label', 'compartment', 'subcomponents', 'modifications']
NodeKeys		= MandatoryNodeKeys + OptionalNodeKeys
DefaultNode		= { "type":"simple_species", "sbo":"252", "visible":True, "clone_marker":-1, "x":10, "y":10, "width":50, "height":20, "radius":30, "label":"Orphan Node", "compartment":-1, "subcomponents":[], "modifications":[] }

MandatoryEdgeKeys	= ['id','sbo','source','target']
OptionalEdgeKeys	= ['arrow', 'type', 'style', 'thickness', 'label', 'label_x', 'label_y', 'handles']
EdgeKeys		= MandatoryEdgeKeys + OptionalEdgeKeys
DefaultEdge		= { "sbo":10, "source":0, "target":1, "arrow":"target", "type":"straight", "style":"solid", "thickness":1, "label":"Orphan Edge", "label_x":10, "label_y":10, "handles":[] }

class Node:
	def __init__(self, jason):				# input parameter may be string or dictionary
		if type(jason) == type(""):
			jason = json.loads(jason)
		self.__dict__.update( DefaultNode )
		self.__dict__.update( jason )			# map all input key/value pairs to the python object
	def JSON(self):
		return json.dumps( self.__dict__, indent=DefaultIndent )
	def DICT(self):
		return self.__dict__
	def selfcheck(self):
		result = ""
		show = False
		for key in self.__dict__:
			if not key in NodeKeys:
				result += 'Warning: Unrecognized key "'+key+'" !\n'
				show = True
		for key in MandatoryNodeKeys:
			if not key in self.__dict__:
				result += "Error: "+key+" undefined but mandatory !\n"
				show = True
		if self.id == -1 or self.id == "-1":
			result += "Error: Illegal ID -1"
			show = True
		if type(self.id) == type(0):
			if self.id < 0:
				result += "Warning: id < 0 !\n"
				show = True
		if type(self.compartment) == type(0):
			if self.compartment < 0:
				result += "Warning: compartment < 0 !\n"
				show = True
		if "width" in self.__dict__ and not "height" in self.__dict__:
			result += "Warning: width, but no height !\n"
			show = True
		if "height" in self.__dict__ and not "width" in self.__dict__:
			result += "Warning: height, but no width !\n"
			show = True
		if show:
			result += "Node was: "+self.JSON()+"\n"
		return result

EdgeKeys = ['id', 'sbo', 'source', 'target', 'arrow', 'type', 'style', 'thickness', 'label_x', 'label_y', 'label', 'handles']

class Edge:
	def __init__(self, jason):				# input parameter may be string or dictionary
		if type(jason) == type(""):
			jason = json.loads(jason)
		self.__dict__.update( DefaultEdge )
		self.__dict__.update( jason )			# map all input key/value pairs to the python object
	def JSON(self):
		return json.dumps( self.__dict__, indent=DefaultIndent )
	def DICT(self):
		return self.__dict__
	def selfcheck(self):
		result = ""
		show = False
		for key in self.__dict__:
			if not key in EdgeKeys:
				result += 'Warning: Unrecognized key "'+key+'" !\n'
				show = True
		for key in MandatoryEdgeKeys:
			if not key in self.__dict__:
				result += "Error: "+key+" undefined but mandatory !\n"
				show = True
		if self.id == -1 or self.id == "-1":
			result += "Error: Illegal ID -1"
			show = True
		if type(self.id) == type(0):
			if self.id < 0:
				result += "Warning: id < 0 !\n"
				show = True
		if "label" in self.__dict__ and not ("label_x" in self.__dict__ and "label_y" in self.__dict__):
			result += "Error: Label without position (label_x and label_y)\n"
			show = True
		if ("label_x" in self.__dict__) != ("label_y" in self.__dict__):
			result += "Error: label_x and label_y need to be specified together\n"
			show = True
		if show:
			result += "Edge was: "+self.JSON()+"\n"
		return result

class Graph:
	def __init__(self, jason):
		self.Nodes = []
		self.Edges = []
		self.DEBUG = "Loading bioGraph from string ...\n"
		try:
			jason = json.loads(jason)
		except:
			self.DEBUG += "Error: Could not parse JSON"
			return
		self.Nodes = [Node(n) for n in jason["nodes"]]
		self.Edges = [Edge(e) for e in jason["edges"]]
		self.Indent = DefaultIndent
		self.selfcheck()
		self.DEBUG += "Loaded "+str(len(self.Nodes))+" nodes and "+str(len(self.Edges))+" edges.\n"
	def fromFile(self, fname):
		self.DEBUG = "Loading bioGraph from "+fname+" ...\n"
		self.fromJSON( open(fname, "r").read() )
		self.selfcheck()
		self.DEBUG += "Loaded "+str(len(self.Nodes))+" nodes and "+str(len(self.Edges))+" edges.\n"
	def JSON(self):							# return graph as JSON string
		return json.dumps( { "nodes":[n.DICT() for n in self.Nodes], "edges":[e.DICT() for e in self.Edges] }, indent=self.Indent )
	def DICT(self):
		return self.__dict__					# return graph as dictionary
	def NodeCount(self):
		return len(self.Nodes)
	def EdgeCount(self):
		return len(self.Edges)
	def selfcheck(self):
		# perform selfchecks on each subcomponent
		# check for colliding IDs
		usedIDs = []
		compartments = []
		nodeIDs = []
		for n in self.Nodes:
			self.DEBUG += n.selfcheck()
			if n.id in usedIDs:
				self.DEBUG += "Error: ID collision (Node "+str(n.id)+")\n"
			else:
				usedIDs.append(n.id)
			if n.type == "compartment":
				compartments.append(n.id)
			nodeIDs.append(n.id)
		for e in self.Edges:
			self.DEBUG += e.selfcheck()
			if e.id in usedIDs:
				self.DEBUG += "Error: ID collision (Edge "+str(e.id)+")\n"
			else:
				usedIDs.append(e.id)
		# non-existing compartments referenced
		for n in self.Nodes:
			if n.compartment != -1 and not n.compartment in compartments:
				self.DEBUG += "Error: Compartment "+str(n.compartment)+" for Node "+str(n.id)+" does not exist!\n"
		# non-existent nodes connected
		for e in self.Edges:
			if not e.source in nodeIDs:
				self.DEBUG += "Error: Source Node "+str(e.source)+" for Edge "+str(e.id)+" does not exist!\n"
			if not e.target in nodeIDs:
				self.DEBUG += "Error: Target Node "+str(e.target)+" for Edge "+str(e.id)+" does not exist!\n"
		# node position outside compartment/parent
		autoresize = True
		for n in self.Nodes:
			for subID in n.subcomponents:
				s = None
				for n in self.Nodes:
					if n.id == subID:
						s = n
				if s == None:
					result += "Error: Subcomponent "+str(subID)+" for Node "+str(n.id)+" does not exist !\n"
				else:
					if s.x+s.width > n.x+n.width:
						result += "Warning: Subcomponent "+str(s.id)+" for Node "+str(n.id)+" outside of parent !\n"
						if autoresize:
							n.width = s.x+s.width-n.x
					if s.y+s.height > n.y+n.height:
						result += "Warning: Subcomponent "+str(s.id)+" for Node "+str(n.id)+" outside of parent !\n"
						if autoresize:
							n.height = s.y+s.height-n.y

