#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

from copy import deepcopy
from randomid import randomID
import json

from defaults import *
from SBO_terms import *
from data import Data


### Edge object definition ###

class Edge:
	def __init__(self, JSON=None, defaults=False):			# input parameter may be string or dictionary
		if defaults:
			self.__dict__.update( deepcopy(DefaultEdge) )
			# conversion of data dictionary to data object happens below
			# this is necessary, to ensure takeover of the data default values during update

		if JSON is not None:
			if type(JSON) == type(""):
				JSON = json.loads(JSON)
			data = self.data				# save it, since it will be overwritten by .update
			self.__dict__.update( deepcopy(JSON) )		# import all input key/value pairs to the python object

			new_data = self.data				# self.data will be a dictionary
			self.data.update(data)				# put old data settings back in place
			self.data.update(new_data)			# perform a separate update for data subobject

		# after that self.data will be a dictionary
		# we don't want that, we want to access all parameters in the way node.data.subnodes etc...
		if not self.owns('data'):
			self.data = {}
		if type(self.data) == type( {} ):
			self.data = Data(self.data)

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

	def export_to_Layouter(self):
		return {
			'id'	:	edge.id,
			'type'	:	'Directed',
			'source':	edge.source,
			'target':	edge.target
			}

	def import_from_Layouter(self, layout):
		self.id			= layout['id']
		self.type		= layout['type']
		self.source		= layout['source']
		self.target		= layout['target']

	def selfcheck(self, verbosity=1):
		result = ""
		show = False

		for key in self.__dict__.keys():				# check if we recognize all keys
			if not key in ['SourceNode', 'TargetNode']:		# skip it ...
				if key in EdgeKeyAliases.keys():		# is it an alias ...
					newkey = EdgeKeyAliases[key]
					if verbosity >= 2:
						result += 'Warning: Edge property "'+key+'" renamed to "'+newkey+'"\n'
					self.__dict__[newkey] = self.__dict__[key]
					del self.__dict__[key]
					key = newkey
				if not key in EdgeKeys:
					if key in OptionalEdgeKeys:
						if verbosity >= 2:
							result += 'Warning: Edge property "'+key+'" moved below "data"\n'
						self.data.__dict__[key] = self.__dict__[key]
						del self.__dict__[key]
					else:
						if verbosity >= 2:
							result += 'Warning: Ignoring unrecognized Edge property "'+key+'"\n'
						show = True

		for key in self.data.__dict__.keys():			# check optional keys
			if key in EdgeKeyAliases.keys():		# is it an alias ...
				newkey = EdgeKeyAliases[key]
				if verbosity >= 2:
					result += 'Warning: Optional edge property "'+key+'" renamed to "'+newkey+'"\n'
				self.data.__dict__[newkey] = self.data.__dict__[key]
				del self.data.__dict__[key]
				key = newkey
			if not key in OptionalEdgeKeys:
				if key == 'id':
					if not self.owns('id'):
						if verbosity >= 2:
							result += 'Warning: '+self.id+'.data.id moved to '+self.id+'.id\n'
						self.id = self.data.id
						self.data.id = randomID()
				elif key in NodeKeys:			# is it a mandatory key ...
					if verbosity >= 2:
						result += 'Warning: Edge property "'+key+'" does not belong in "data"\n'
					self.__dict__[key] = self.data.__dict__[key]
					del self.data.__dict__[key]
				else:
					if verbosity >= 2:
						result += 'Warning: Unrecognized optional Edge property "'+key+'"\n'
					show = True

		for key in MandatoryEdgeKeys:				# check for mandatory keys
			if not self.owns(key):
				if verbosity >= 1:
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

#		if show:						# if errors: show source
#			result += "Edge contains errors: "+self.exportJSON()+"\n"
		return result

