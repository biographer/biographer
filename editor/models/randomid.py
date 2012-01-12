#!/usr/bin/python
# -*- coding: iso-8859-15 -*-

# helper
# to rename Nodes/Edges whenever a collision occurs

from random import random

def randomID( prefix="random", length=5 ):
	return prefix + ''.join( [str(int(random()*10)) for i in range(0,length)] )

