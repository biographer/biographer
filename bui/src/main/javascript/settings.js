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
     * Whether or not the bui.Graph will be initialised in high or low
     * performance mode. True for high performance.
     */
    initialHighPerformance : true,

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
     * The url from which the CSS file should be imported and CSS classes
     */
    css : {
        stylesheetUrl : 'resources/css/visualization-svg.css',
        classes : {
            invisible : 'hidden',
            selected : 'selected',
            placeholder : 'placeholder',
            rectangle : 'rect',
            complex : 'complex',
            compartment : 'compartment',
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
                catalysis : 'catalysis',
                modulation : 'modulation',
                necessaryStimulation : 'necessaryStimulation'
            },
            splineEdgeHandle : 'splineEdgeHandle',
            splineAutoEdgeHandle : 'autoAlign'
        }
    },
    /**
     * @field
     * Various styles that can not be realized using CSS
     */
    style : {
        /**
         * @field Correction of the placeholder positioning and size
         */
        placeholderCorrection : {
            position : {
                x : -1,
                y : -1
            },
            size : {
                width : -2,
                height : -2
            }
        },
        edgeHandleRadius : 4,
        nodeCornerRadius : 25,
        adaptToLabelNodePadding : {
            top : 5,
            right : 5,
            bottom : 5,
            left : 5
        },
        complexCornerRadius : 25,
        compartmentCornerRadius : {
            x : 25,
            y : 15
        },
        processNodeMinSize : {
            width : 26,
            height : 26
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
            }
        },
        markerWidthCorrection : 0.25 // (1 / .lineHover#stroke-width) (see CSS)
    }
};