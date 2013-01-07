var simpleExample={
    "edges": [
        {
            "source": "c1",
            "sbo": 11,
            "data": {
                "type": "curve",
                "handles": [
                    150,
                    0,
                    -25,
                    -25,
                    -25,
                    -25,
                    0,
                    -150
                ],
                "points": [
                    200,
                    200,
                    300,
                    200
                ]
            },
            "target": "c2",
            "id": "e0",
            "type": "Substrate"
        },
        {
            "source": "c2",
            "sbo": 11,
            "data": {
                "type": "curve",
                "handles": [
                    5,
                    5,
                    -5,
                    5
                ],
                "points": [
                    
                ]
            },
            "target": "c3",
            "id": "e1",
            "type": "Substrate"
        },
        {
            "source": "c2",
            "sbo": 10,
            "data": {
                "type": "straight",
                "points": [
                    400,
                    400
                ]
            },
            "target": "c4",
            "type": "Substrate"
        },
        {
            "source": "e1",
            "sbo": 20,
            "target": "c4",
            "type": "Substrate"
        },
        {
            "source": "c3",
            "sbo": 13,
            "target": "e0:1",
            "type": "Substrate"
        }

    ],
    "nodes": [
        {
            "is_abstract": 0,
            "sbo": "167",
            "data": {
                "width": "70",
                "y": "100",
                "x": "100",
                "label": "C1",
                "height": "70",
                "dir": 0
            },
            "type": "Reaction",
            "id": "c1"
        },
        {
            "is_abstract": 0,
            "sbo": "252",
            "data": {
                "width": "70",
                "y": "300",
                "x": "300",
                "label": "C2",
                "height": "70",
                "dir": 0
            },
            "type": "Protein",
            "id": "c2"
        },
        {
            "is_abstract": 0,
            "sbo": "252",
            "data": {
                "width": "70",
                "y": "300",
                "x": "600",
                "label": "C3",
                "height": "70",
                "dir": 0
            },
            "type": "Protein",
            "id": "c3"
        },
        {
            "is_abstract": 0,
            "sbo": "252",
            "data": {
                "width": "70",
                "y": "600",
                "x": "600",
                "label": "C4",
                "height": "70",
                "dir": 0
            },
            "type": "Protein",
            "id": "c4"
        }
    ]
};