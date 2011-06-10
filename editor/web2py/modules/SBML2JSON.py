#!/usr/bin/env python
import libsbml

class SBML2JSON:
    def __init__(self):
        self.id2sbml = {}
        self.sbml2id = {}
        self.inc = 0
    def _inc(self):
        self.inc += 1
        return self.inc
    def fromSBML(self, filename=None, SBMLDocument=None):
        self.id2sbml = {}
        self.sbml2id = {}
        if filename is not None:
            self.SBMLDocument = libsbml.readSBML(filename)
        else:
            self.SBMLDocument = SBMLDocument
        if self.SBMLDocument is None:
            raise HELL #
        model = self.SBMLDocument.getModel()
        for compartment in model.getListOfCompartments():
            self.id2sbml[self._inc()] = compartment.getId()
            self.sbml2id[compartment.getId()] = self.inc
            print 'create node compartment',compartment.getId(), compartment.getName(), compartment.getOutside()
        for species in model.getListOfSpecies():
            self.id2sbml[self._inc()] = species.getId()
            self.sbml2id[species.getId()] = self.inc
            print 'create node species',species.getId(), species.getName(), species.getCompartment(), species.getSBOTerm()
        for reaction in model.getListOfReactions():
            self.id2sbml[self._inc()] = reaction.getId()
            self.sbml2id[reaction.getId()] = self.inc
            print 'create node reaction', reaction.getId(), reaction.getName()
            for reactant in reaction.getListOfReactants():
                print 'create edge',reactant.getSpecies(), self.sbml2id[reactant.getSpecies()], 'to', self.sbml2id[reaction.getId()], reactant.getSBOTerm() # Edge SBO Term
            for product in reaction.getListOfProducts():
                print 'create edge',product.getSpecies(), self.sbml2id[reaction.getId()], 'to', self.sbml2id[product.getSpecies()]
            for modifier in reaction.getListOfModifiers():
                print 'create edge',modifier.getSpecies(), self.sbml2id[modifier.getSpecies()], 'to', self.sbml2id[reaction.getId()]

if __name__ == "__main__":
    s2j = SBML2JSON()
    s2j.fromSBML(filename="test.xml")
            
        
            
