#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

class sampleobject:
    def __init__(self, dic):
        for key in dic:
            val = dic[key]	
            if type(val) == type({}):				# is val a dictionary ?
                self.__dict__[str(key)] = sampleobject(val)	# create python object child to self, named key, class d2o, initialize it with d2o.__init__(val)
            else:
                self.__dict__[str(key)] = val			# create python object child to self, named key, assign value val

    def dictionary(self):	# translate python object to dictionary
        return self.__dict__

import json
js = '{"a": 0, "b": 0, "c": {"a":0, "b":1}}'	# string
jo = json.loads(js)				# translate JSON string to python dictionary

o = sampleobject(jo)
print o.a, o.b
print o.c
print o.c.a, o.c.b
if 'c' in o.c.__dict__:
    print o.c.c


class Node:
	def __init__(self, json_object):
		self.id = json_object["id"]
		self.type ...
		self.data ...
		self.x = json_object["data"]["x"] if "x" in json_object["data"] else None
	def dump_json(self):
		if self.x is not None:
		return {'x':self.x}

class Graph:
    def __init__(self):
        self.nodes = []
        self.edges = []
    def load_json(self, json_object):
        self.nodes = [Node(x) for x in json_object["nodes"]]
        self.edges ...
    def dump_json(self):
        return {"nodes":[x.dump_json() for x in self.nodes],
                "edges":...}


