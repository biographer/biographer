<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

	<title>Biographer-ui Test Suite</title>

    <link rel="stylesheet" type="text/css" href="resources/css/visualization-html.css" />
    <link rel="stylesheet" type="text/css" href="resources/css/jquery-ui-1.8.13.css" />

	<script type="text/javascript" src="resources/js/jquery-1.6.min.js"></script>
	<script type="text/javascript" src="resources/js/jquery-ui-1.8.12.custom.min.js"></script>
    <script type="text/javascript" src="resources/js/biographer-ui.js"></script>

    <script type="text/javascript">


        bui.ready(function() {
            graph = new bui.Graph(document.getElementsByTagName('body')[0]);

            outterComplex = graph
                .add(bui.Complex, [100, 100, 215, 240])
                .visible(true);

            nucleic = graph
                .add(bui.NucleicAcidFeature,[30, 140, 150, 75,outterComplex])
                .label('IRF1-GAS')
                .visible(true);
            graph.add(bui.UnitOfInformation, [40,-13,0,0,nucleic])
                .label('ct:grr')
                .visible(true);

            innerComplex = graph
                .add(bui.Complex, [10, 10, 195, 110, outterComplex])
                .visible(true);

            macromolecule = graph
                .add(bui.Macromolecule, [20, 20, 150, 70, innerComplex])
                .label('STAT1a')
                .visible(true);

            graph.add(bui.StateVariable, [13,-14,0,0,macromolecule])
                .label('P@Y701')
                .visible(true);
            graph.add(bui.StateVariable, [80,-14,0,0,macromolecule])
                .label('P@Y727')
                .visible(true);
            graph.add(bui.UnitOfInformation, [50,53,0,0,macromolecule])
                .label('mt:prot')
                .visible(true);

            compartment = graph
                .add(bui.Compartment, [400, 50, 150, 75])
                .visible(true)
                .label('cytosol');

            dragHandle = graph
                .add(bui.DragHandle, [423, 253])
                .visible(true);

            process = graph
                    .add(bui.Process, [440, 250])
                    .visible(true);
        });
    </script>
</head>
<body>
</body>
</html>
