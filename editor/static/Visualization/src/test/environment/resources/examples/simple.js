var simpleExample = {
   "edges" : [
      {
         "id" : 0,
         "sbo" : 15,
         "source" : "MAP:Cs7732-18-5_CY_Reactome:177923",
         "target" : "Reactome:177923"
      },
      {
         "id" : 1,
         "sbo" : 15,
         "source" : "Reactome:180522",
         "target" : "Reactome:177923"
      },
      {
         "id" : 2,
         "sbo" : 11,
         "source" : "Reactome:177923",
         "target" : "Reactome:180523"
      },
      {
         "id" : 3,
         "sbo" : 11,
         "source" : "Reactome:177923",
         "target" : "MAP:Cs14265-44-2_CY_Reactome:177923"
      },
      {
         "id" : 4,
         "sbo" : 11,
         "source" : "Reactome:177923",
         "target" : "Reactome:180499"
      },
      {
         "id" : 5,
         "sbo" : 13,
         "source" : "Reactome:180269",
         "target" : "Reactome:177923"
      }
   ],
   "nodes" : [
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "Paxillin:Src complex",
            "modification" : [],
            "ref" : "Reactome:180523",
            "subnodes" : [
               "Reactome:180493",
               "Reactome:65043"
            ],
            "x" : "994",
            "y" : "34"
         },
         "id" : "Reactome:180523",
         "is_abstract" : 0,
         "sbo" : 253,
         "type" : "Complex"
      },
      {
         "data" : {
            "compartment" : "MAP:Cytosol",
            "label" : "GRB2:Phospho-GAB1",
            "modification" : [],
            "ref" : "Reactome:180304",
            "subnodes" : [
               "MAP:UP62993_CY",
               "Reactome:180344"
            ],
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:180304",
         "is_abstract" : 1,
         "sbo" : 253,
         "type" : "Complex"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "EGF:Phospho-EGFR (Y992, Y1068, Y1086, Y1148, Y1173) dimer",
            "modification" : [],
            "ref" : "Reactome:179882",
            "subnodes" : [
               "Reactome:179860"
            ],
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:179882",
         "is_abstract" : 1,
         "sbo" : 253,
         "type" : "Complex"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "EGF:Phospho-EGFR",
            "modification" : [],
            "ref" : "Reactome:179860",
            "subnodes" : [
               "Reactome:179863",
               "Reactome:179803"
            ],
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:179860",
         "is_abstract" : 1,
         "sbo" : 253,
         "type" : "Complex"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "Paxillin:CSK:Src complex",
            "modification" : [],
            "ref" : "Reactome:180522",
            "subnodes" : [
               "Reactome:180493",
               "Reactome:65043",
               "Reactome:180499"
            ],
            "x" : "1088",
            "y" : "222"
         },
         "id" : "Reactome:180522",
         "is_abstract" : 0,
         "sbo" : 253,
         "type" : "Complex"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "SHP2-GRB2:Phospho GAB1-EGF-Phospho-EGFR dimer",
            "modification" : [],
            "ref" : "Reactome:180269",
            "subnodes" : [
               "Reactome:180304",
               "Reactome:179882",
               "Reactome:162563"
            ],
            "x" : "581",
            "y" : "222"
         },
         "id" : "Reactome:180269",
         "is_abstract" : 0,
         "sbo" : 253,
         "type" : "Complex"
      },
      {
         "data" : {
            "compartment" : "MAP:Cytosol",
            "label" : "Orthophosphate",
            "modification" : [],
            "ref" : "MAP:Cs14265-44-2_CY",
            "x" : null,
            "y" : null
         },
         "id" : "MAP:Cs14265-44-2_CY",
         "is_abstract" : 1,
         "sbo" : 247,
         "type" : "SimpleCompound"
      },
      {
         "data" : {
            "compartment" : "MAP:Cytosol",
            "label" : "H2O",
            "modification" : [],
            "ref" : "MAP:Cs7732-18-5_CY",
            "x" : null,
            "y" : null
         },
         "id" : "MAP:Cs7732-18-5_CY",
         "is_abstract" : 1,
         "sbo" : 247,
         "type" : "SimpleCompound"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "Paxillin",
            "modification" : [],
            "ref" : "Reactome:180493",
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:180493",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "Proto-oncogene tyrosine-protein kinase Src ",
            "modification" : [],
            "ref" : "Reactome:65043",
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:65043",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Extracellular",
            "label" : "EGF",
            "modification" : [],
            "ref" : "Reactome:179863",
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:179863",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Cytosol",
            "label" : "SHP2 protein",
            "modification" : [],
            "ref" : "Reactome:162563",
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:162563",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Cytosol",
            "label" : "GRB2()",
            "modification" : [],
            "ref" : "MAP:UP62993_CY",
            "x" : null,
            "y" : null
         },
         "id" : "MAP:UP62993_CY",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "Phospho-EGFR",
            "modification" : [
               [
                  216,
                  "1068"
               ],
               [
                  216,
                  "1148"
               ],
               [
                  216,
                  "1173"
               ],
               [
                  216,
                  "1086"
               ],
               [
                  216,
                  "992"
               ]
            ],
            "ref" : "Reactome:179803",
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:179803",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Plasmamembrane",
            "label" : "Tyrosine-protein kinase CSK",
            "modification" : [],
            "ref" : "Reactome:180499",
            "x" : "581",
            "y" : "34"
         },
         "id" : "Reactome:180499",
         "is_abstract" : 0,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "compartment" : "MAP:Cytosol",
            "label" : "Phospho-GAB1",
            "modification" : [
               [
                  216,
                  "627"
               ],
               [
                  216,
                  "659"
               ],
               [
                  216,
                  "447"
               ],
               [
                  216,
                  "472"
               ],
               [
                  216,
                  "589"
               ]
            ],
            "ref" : "Reactome:180344",
            "x" : null,
            "y" : null
         },
         "id" : "Reactome:180344",
         "is_abstract" : 1,
         "sbo" : 252,
         "type" : "Protein"
      },
      {
         "data" : {
            "label" : null,
            "ref" : "Reactome:177923",
            "x" : "581",
            "y" : "122"
         },
         "id" : "Reactome:177923",
         "is_abstract" : 0,
         "sbo" : 167,
         "type" : "Reaction"
      },
      {
         "data" : {
            "clone_marker" : "MAP:Cs7732-18-5_CY",
            "compartment" : "MAP:Cytosol",
            "label" : "H2O",
            "modification" : [],
            "ref" : "MAP:Cs7732-18-5_CY",
            "x" : "196",
            "y" : "222"
         },
         "id" : "MAP:Cs7732-18-5_CY_Reactome:177923",
         "is_abstract" : 0,
         "sbo" : 247,
         "type" : "SimpleCompound"
      },
      {
         "data" : {
            "clone_marker" : "MAP:Cs14265-44-2_CY",
            "compartment" : "MAP:Cytosol",
            "label" : "Orthophosphate",
            "modification" : [],
            "ref" : "MAP:Cs14265-44-2_CY",
            "x" : "179",
            "y" : "34"
         },
         "id" : "MAP:Cs14265-44-2_CY_Reactome:177923",
         "is_abstract" : 0,
         "sbo" : 247,
         "type" : "SimpleCompound"
      },
      {
         "data" : {
            "label" : "Cytosol",
            "ref" : "MAP:Cytosol",
            "subnodes" : [
               "Reactome:180304",
               "MAP:Cs14265-44-2_CY",
               "Reactome:162563",
               "MAP:Cs7732-18-5_CY",
               "MAP:UP62993_CY",
               "Reactome:180344"
            ],
            "x" : null,
            "y" : null
         },
         "id" : "MAP:Cytosol",
         "is_abstract" : 0,
         "sbo" : 290,
         "type" : "Compartment"
      },
      {
         "data" : {
            "label" : "Cytosol",
            "ref" : "MAP:Cytosol",
            "subnodes" : [
               "Reactome:180304",
               "MAP:Cs14265-44-2_CY",
               "Reactome:162563",
               "MAP:Cs7732-18-5_CY",
               "MAP:UP62993_CY",
               "Reactome:180344"
            ],
            "x" : null,
            "y" : null
         },
         "id" : "MAP:Cytosol",
         "is_abstract" : 0,
         "sbo" : 290,
         "type" : "Compartment"
      },
      {
         "data" : {
            "label" : "Cytosol",
            "ref" : "MAP:Cytosol",
            "subnodes" : [
               "Reactome:180304",
               "MAP:Cs14265-44-2_CY",
               "Reactome:162563",
               "MAP:Cs7732-18-5_CY",
               "MAP:UP62993_CY",
               "Reactome:180344"
            ],
            "x" : null,
            "y" : null
         },
         "id" : "MAP:Cytosol",
         "is_abstract" : 0,
         "sbo" : 290,
         "type" : "Compartment"
      }
   ]
};
