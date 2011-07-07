#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

infile = "demograph.json"

from bioJSON import Graph

graph = Graph()

graph.fromFile(infile)

#graph.selfcheck()
#print graph.nodes
#print graph.edges
#print graph.JSON()
#print graph.DICT()
