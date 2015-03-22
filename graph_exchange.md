# jSBGN, a JSON Based Graph-Exchange Format #

## Introduction ##

The Graph-Exchange Format is the format used for exchanging a pathway model  visualization (Graph) between the three parts of this project: The server, the Visualizer, and the Layouter. In the current state of development it is used only between Server and Visualizer, as the importer of the Layouter still contains bugs.

It is formatted in JSON, providing all necessary information to generate a graph from scratch. The nodes in this graph represent either a single biochemical compound or protein, a complex of several such components acting together as one, or a reaction. Edges connect the nodes in such a way that a bipartite graph is formed, in which reaction nodes are only connected to compound/protein/complex nodes. The edges do not only define that a component is participating in a reaction, but also describe its role: reactant, product, or modifier, e.g. an enzyme catalyzing the reaction. Furthermore, Edges also carry properties specifying drawing styles (colors, line thickness etc.) and, in case the source Node is a modifier, the type of modification they cause on the target reaction Node.

The [Simulator](Simulator.md) extends jSBGN in-browser at runtime.

## JSON ##

```
var network = {
   sbgnlang : 'PD' // language of the current document: PD, ER, AF
   nodes : [       // array of Nodes
       {
           'id' : '0',
                   // string
                   // unique Node identifier
           'type' : 'simple chemical',
                   // string
                   // can be  ['simple chemical', 'complex', 'compartment', 'process', ...]
            'sbo' : 252,
                   // integer or string
                   // the Nodes's SBO term
                   // for a list of supported SBO terms, see below
           'is_abstract' : false,
                   // boolean
                   // if true, the Node will not appear in the layout
                   // it will then only serve as a prototype carrying common properties of cloned Nodes
           'data' : {
                     // optional parameters
                    'multimer' : true, 
                           // boolean render as multimer
                           // only for simple chemical, nucleic acid feature, macromolecule, complex
                           // can also be done via the sbo id
                    'clonemarker' : true,
                           // boolean
                           // render a clone marker for this node
                           // clone markers indicate the dublication of the element 
                           // it is rendered as 30% black area at the bottom of the node
                    'x' : 50,
                    'y' : 300,
                           // integers
                           // only if the Node is not abstract and not a compartment
                    'color' : {background: '#FFAABB', border: 'rgb(0,0,0)', label: 'black'}
                           // object or string
                           // defines color of background, border or label (not all have to be set)
                           // if only a color string is given (instead of {}), background color is set
                    'label' : 'ATP',
                           // string
                    'width' : 100,
                    'height' : 80,
                           // integers
                           // only for Nodes with shape box
                    'radius' : 30,
                           // integer
                           // only for Nodes with round shape
                    'subnodes' : ['1','2','3'],
                           // array of strings
                           // IDs of Nodes contained inside this Node
                           // only for complexes and compartments
                    'compartment' : 1,
                           // string
                           // ID of the compartment, containing this Node
                           // only if not abstract and not a reaction Node
                    'orientation' : 'up',
                           // up|down|left|right
                           // only works for Tags
                    'modifications' : [[216,”Y2”],[216,”R3”]],
                           // array of modification qualifiers
                           // list of modifications of certain residuals
                           // e.g. phosphorylation (SBO:216) of second amino acid "Y2"
                           // only for compound Nodes
                    'statevariable' : ['T174','Y176'],
                           // similar to modificatioin but not bound to SBO terms
                    'unitofinformation' : ['ct:mRNA','mt:prot'],
                           
                    'cssClasses' : ['red','highlight']
                           // array of strings
                           // arbitrary CSS classes 
                }
       }
   ],
   edges : [       // array of Edges
       {
           'id' : '1',
                   // string
                   // unique Edge identifier
           'sbo' : 10,
                   // integer
                   // for a list of supported SBO terms, see below
                   // SBO:0000019 modulation
                   // SBO:0000020 inhibition
                   // SBO:0000013 catalysis
                   // SBO:0000459,SBO:0000462 stimulation
                   // SBO:0000464 assignment
                   // SBO:0000461 necessaryStimulation
                   // SBO:0000407 absoluteInhibition
           'source' : 'node1',
                   // string
                   // Node/Edge, from which the Edge originates
                   // state variables of nodes can be directly addressed by nodeid:label
                   // if the source is an edge an output node SBO:0000409 (SBGN-ER) will be created on the source edge 
                   // edge points can be addressed directly by edgeid:pointidx notation (e.g. edge0:2)
           'target' : 'node1:p@501',
                   // string; as in source
           'data' : {
                     // optional parameters
                    'type' : 'straight',
                           // string
                           // one of ['straight', 'curve']
                    'style' : 'solid',
                           // string
                           // one of ['solid', 'dashed', 'dotted']
                    'thickness': 1,
                           // integer or float
                           // line thickness
                    'label': 'label text',
                           // string
                    'label_x': 100,
                    'label_y': 20,
                           // integers
                           // label coordinates
                    'handles' : [ {x: 10, y: 20}, {x: -10, y: -10}, ..., {x: 30, y: -40}],
                           // array of point objects
                           // first point for source handle, last for target
                           // coordinates relative to nodes
                           // only used if type is curve
                           // handles for additional spline points have to be included between source and target handles
                           // note: first handle points away from 1st point; all other handles point towards the next point
                    'points' : [ {x: 100, y: 100}, ...],
                           // array of point objects
                           // additional edge points between source and target
                           // in case of a spline edge, for each additional point a handle point is to be included into 'handles'
                    'pointtypes' : [ "Outcome" ],
                           // types of edge points
                           // optional argument. for each point from points a type can be given. 
                           // if emtpy or undefined, a default EdgeHandle is created. if "Outcome", a outcome node is created SBO 409
                    'color' : {color: '#FFAABB', width: 5, dasharray: '5,5'}
                           // object
                           // defines color, width and dasharray of an edge
                }
       }
   ]
}
```