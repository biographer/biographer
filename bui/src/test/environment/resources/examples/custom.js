var customExample = {
    nodes : [
        {
            id : 'node1',
            sbo : 253,
            data : {
                x : 100,
                y : 500,
                subnodes : [
                   'node2',
                   'node3'
                ]
                // TODO state variable 'tense'
            }
        }, {
            id : 'node2',
            sbo : 245,
            data : {
                label : 'actin'
            }
        }, {
            id : 'node3',
            sbo : 245,
            data : {
                label : 'myosin'
            }
        }, {
            id : 'node4',
            sbo : 253,
            data : {
                x : 610,
                y : 525,
                subnodes : [
                    'node5',
                    'node6',
                    'node7'
                ]
                // TODO state variable 'relaxed'
            }
        }, {
            id : 'node5',
            sbo : 245,
            data : {
                label : 'actin'
            }
        }, {
            id : 'node6',
            sbo : 245,
            data : {
                label : 'myosin'
            }
        }, {
            id : 'node7',
            sbo : 247,
            data : {
                label : 'ATP'
            }
        }, {
            id : 'node8',
            sbo : 247,
            data : {
                label : 'ADP',
                x : 380,
                y : 445
            }
        }, {
            id : 'node9',
            sbo : 247,
            data : {
                label : 'Pi',
                x : 495,
                y : 455
            }
        }, {
            id : 'node10',
            sbo : 375,
            data : {
                x : 490,
                y : 550
            }
        }, {
            id : 'node11',
            sbo : 375, // TODO change to dissociation
            data : {
                x : 255,
                y : 380
            }
        }, {
            id : 'node12',
            sbo : 245,
            data : {
                label : 'myosin',
                x : 220,
                y : 245
            }
        }, {
            id : 'node13',
            sbo : 245,
            data : {
                label : 'actin',
                x : 590,
                y : 320
            }
        }, {
            id : 'node14',
            sbo : 375,
            data : {
                x : 715,
                y : 425
            }
        }
    ],
    edges : [
        {
             id : 'edge1',
             sbo : 459,
             source : 'node1',
             target : 'node11'
        }, {
             id : 'edge2',
             sbo : 132154, // incorrect SBO id to test robustness
             source : 'node11',
             target : 'node12'
        }, {
             id : 'edge3',
             sbo : 459,
             source : 'node11',
             target : 'node13'
        }, {
             id : 'edge4',
             sbo : 459,
             source : 'node13',
             target : 'node14'
        }, {
             id : 'edge5',
             sbo : 459,
             source : 'node14',
             target : 'node4'
        }, {
             id : 'edge6',
             sbo : 459,
             source : 'node4',
             target : 'node10'
        }, {
             id : 'edge7',
             sbo : 459,
             source : 'node10',
             target : 'node9'
        }, {
             id : 'edge8',
             sbo : 459,
             source : 'node10',
             target : 'node8'
        }, {
             id : 'edge8',
             sbo : 459,
             source : 'node10',
             target : 'node1'
        }
    ]
};