#!/usr/bin/env python
# -*- coding: iso-8859-15 -*-

# https://sourceforge.net/projects/biopax/develop
# hg clone http://biopax.hg.sourceforge.net:8000/hgroot/biopax/paxtools

# Example from
# http://biopax.hg.sourceforge.net/hgweb/biopax/paxtools/file/0e0bca8f3506/paxtools-console/src/main/resources/org/biopax/paxtools/binding/python

from jpype import *

# start Java Virtual Machine
startJVM(getDefaultJVMPath(), "-ea","-Djava.class.path=/usr/lib/paxtools.jar")

# print out using java or python
java.lang.System.out.println("Starting pythonPaxToolsExample")

print "Java Version: \t\t", java.lang.System.getProperty("java.version")
print "Java Class Path: \t", java.lang.System.getProperty("java.class.path")

# get the paxtools package as a shortcut
paxPkg = JPackage("org.biopax.paxtools")

# short form e.g. Document = JPackage('org').w3c.dom.Document
# create a new BioPAX model to add data to
l3Factory = paxPkg.impl.level3.Level3FactoryImpl()
model = l3Factory.createModel()

# will be using the following BioPAX classes (model interfaces):
proteinClass = java.lang.Class.forName("org.biopax.paxtools.model.level3.Protein", True, java.lang.ClassLoader.getSystemClassLoader())
cellularLocationCvClass = java.lang.Class.forName("org.biopax.paxtools.model.level3.CellularLocationVocabulary", True, java.lang.ClassLoader.getSystemClassLoader())

# add elements to the model
# step 1: create an object using the factory
protein = l3Factory.create(proteinClass, "protein1")

# step 2: must set unique RDF ID and add to model for each object created
model.add(protein)

# step 3: add data to your object
protein.addAvailability("availability text")
cellLoc = l3Factory.create(cellularLocationCvClass, "cellularLocationVocabulary1")
model.add(cellLoc)
cellLoc.addComment("comment")
cellLoc.addTerm("cytoplasm")
protein.setCellularLocation(cellLoc)

# or, do the creation, setting RDF ID and adding to model in one step
proteinClass = java.lang.Class.forName("org.biopax.paxtools.model.level3.Protein", True, java.lang.ClassLoader.getSystemClassLoader())

# once you get a reference to a Class object of a given type, you can reuse it across multiple calls to model.addNew method
protein2 = model.addNew(proteinClass, "protein2")
protein2.addComment("created protein2")

# export to BioPAX OWL
javaIO = JPackage("java.io")
io = paxPkg.io.SimpleIOHandler(paxPkg.model.BioPAXLevel.L3)

# output to stdout
io.convertToOWL(model, java.lang.System.out)

# output to a file
fileOS = javaIO.FileOutputStream("test.owl")
io.convertToOWL(model, fileOS)
fileOS.close()

# read from file
fileIS = javaIO.FileInputStream("test.owl")
model2 = io.convertFromOWL(fileIS)
io.convertToOWL(model, java.lang.System.out)

# Shutdown Java Virtual Machine
shutdownJVM() 

