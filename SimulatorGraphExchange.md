# jSBGN extension #
Upon initialization, the simulator creates a "rules" object for holding the update rules for the network and also a "states" object for tracking the current state of the network.

```
 network = {
           'nodes': [ ...
                    ... ],
           'edges': [ ...
                      ... ],
           'rules': [ 
                     'node_id' = 'true && false', //The Boolean Network function for each node
                ... ],
           'state': [ 
                      'node_id' = true, //The current state of the node(true/false)
                 ... ],
           }
```