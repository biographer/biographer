// can't make this variable private because of the JsDoc toolkit.
/**
 * @namespace The whole biographer-ui library can be accessed through this var.
 */
bui = {};

/**
 * @namespace SVG namespace definition
 */
bui.svgns = "http://www.w3.org/2000/svg";


/**
 * @namespace Settings are stored within this variable
 */
bui.settings = {
    /**
     * @field
     * Define the SBGN Language: PD, ER, AF
     * this makes minor differnces in e.g. how StateVariable will be drawn
     */
    SBGNlang : 'PD',

    /**
     * @field
     *  if this is true all handles on edges (not splines) will be distributed equally on a straight line from source to target as soon as the source or target are moved
     */
    straightenEdges : false,

    /**
     * @field
     * Whether or not the bui.Graph will be initialised in high or low
     * performance mode. True for high performance.
     */
    initialHighPerformance : true,

    /**
     * @field
     * Set to true to enable modification support. Please note though that this
     * can have a strong impact on the initial load time as described in the
     * following issue.
     * http://code.google.com/p/biographer/issues/detail?id=6
     */
    enableModificationSupport : true,

    /**
     * @field
     * set to disable certain dynamic SVG features (like suspendRedraw) which
     * are not needed or supported by static SVG generation in node.js
     */
    staticSVG : false,

    /**
     * @field
     * How many frames per second (FPS) should be used for animations.
     */
    animationFPS : 30,

    /**
     * @field
     * Prefixes for various ids
     */
    idPrefix : {
        graph : 'graph',
        node : 'node',
        edge : 'edge',
        connectingArc : 'connectingArc'
    },

    /**
     * @field
     * Id suffixes
     */
    idSuffix : {
        hover : 'hover'
    },

    /**
     * @field
     * The data exchange format
     */
    dataFormat : {
        nodes : 'nodes',
        edges : 'edges',
        drawable : {
            id : 'id',
            visible : 'visible',
            sbo : 'sbo',
            cssClasses : ['data', 'cssClasses']
        },
        node : {
            label : ['data', 'label'],
            x : ['data', 'x'],
            y : ['data', 'y'],
            width : ['data', 'width'],
            height : ['data', 'height'],
            subNodes : ['data', 'subnodes'],
            modification : ['data', 'modification'],
            statevariable : ['data', 'statevariable'],
            color : ['data', 'color']
        },
        edge : {
            source : 'source',
            target : 'target',
            style : ['data', 'style'],
            type : ['data', 'type'],
            handles : ['data', 'handles'],
            points : ['data', 'points'],
            pointtypes : ['data', 'pointtypes']
        }

    },

    /**
     * @field
     * The url from which the CSS file should be imported and CSS classes
     */
    css : {
        stylesheetUrl : '../static/bui/css/visualization-svg.css',
        classes : {
            invisible : 'hidden',
            selected : 'selected',
            rectangle : 'rect',
            complex : 'complex',
            compartment : 'compartment',
            process : 'process',
            perturbation : 'perturbation',
            annotation : 'annotation',
            statevariable : 'statevariable',
            smallText : 'small',
            textDimensionCalculation : {
                generic : 'textDimensionCalculation',
                standard : 'defaultText',
                small : 'smallText'
            },
            line : 'line',
            lineStyle : {
                solid : 'solid',
                dotted : 'dotted',
                dashed : 'dashed'
            },
            lineHover : 'lineHover',
            connectingArcs : {
                stimulation : 'stimulation',
                assignment : 'assignment',
                catalysis : 'catalysis',
                control : 'control',
                necessaryStimulation : 'necessaryStimulation',
                absoluteInhibition : 'absoluteInhibition'
            },
            splineEdgeHandle : 'splineEdgeHandle',
            splineAutoEdgeHandle : 'autoAlign',
            hideBorder : 'hideBorder'
        }
    },
    /**
     * @field
     * Various styles that can not be realized using CSS
     */
    style : {
        graphReduceCanvasPadding : 30,
        edgeHandleRadius : 4,
        nodeCornerRadius : 15,
        adaptToLabelNodePadding : {
            top : 5,
            right : 5,
            bottom : 5,
            left : 5
        },
        complexCornerRadius : 15,
        complexTableLayout : {
            padding : 10,
            restrictNumberOfColumns : false,
            showBorder : true
        },
        compartmentCornerRadius : {
            x : 25,
            y : 15
        },
        processNodeMinSize : {
            width : 26,
            height : 26
        },
        helperNodeMinSize : {
            width : 5,
            height : 5
        },
        edgeToNodePadding : {
            topBottom : 5,
            leftRight : 5
        },
        importer : {
            standardNodeSize : {
                width : 70,
                height : 70
            },
            sizeBasedOnLabelPassing : {
                horizontal : 20,
                vertical : 20
            },
            modificationLabel : 'long' // either 'long' or 'short'
        },
        // x/y coordinates as % of a node's size (1 = 100%)
        // T = top, L = left, R = right, B = bottom, CX = Center X,
        // CY = center y
        automaticAuxiliaryUnitPositioning : [[0, 0], // T-L
                [1, 1], // B-R
                [1, 0], // T-R
                [0, 1], // B-L
                [0.5, 0], // T-CX
                [1, 0.5], // CY-R
                [0.5, 1], // B-CX
                [0, 0.5] // CY-L
        ],
        markerWidthCorrection : 0.25 // (1 / .lineHover#stroke-width) (see CSS)
    }
};
