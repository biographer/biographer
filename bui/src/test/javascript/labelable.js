module('Labelable');

test('labelable.color', function() {
    var graph = new bui.Graph(document.getElementById('dummy')),
        labelable = graph.add(bui.Labelable),
		expectedBgColor = '',
		expectedLabelColor = '';
	
	var listener = function (origin, newColor) {
		if (newColor.background !== null && newColor.background !== undefined) {
			expectedBgColor = expectedBgColor.toLowerCase();
			equal(newColor.background, expectedBgColor, 'color.background provided to listener.');
		}
		if (newColor.label !== null && newColor.label !== undefined) {
			expectedLabelColor = expectedLabelColor.toLowerCase();
			equal(newColor.label, expectedLabelColor, 'color.label provided to listener.');
		}
        equal(origin.color().background, expectedBgColor, 'color.background of provided labelable.');
        equal(origin.color().label, expectedLabelColor, 'color.label of provided labelable.');
        equal(labelable.color().background, expectedBgColor, 'color.backgound of variable labelable.');
        equal(labelable.color().label, expectedLabelColor, 'color.label of variable labelable.');
	};
		
	labelable.bind(bui.Labelable.ListenerType.color, listener);
	
	expect(27);
    labelable.color({background: (expectedBgColor = 'blue'), label: (expectedLabelColor = '#ffffff')});
    labelable.color({background: (expectedBgColor = 'BLUE'), label: (expectedLabelColor = '#FFFFff')});
    labelable.color({background: (expectedBgColor = '0000ff'), label: (expectedLabelColor = 'white')});
    labelable.color({background: (expectedBgColor = 'Blue')});
    labelable.color({label: (expectedLabelColor = '#FFFFFF')});
    labelable.color({label: (expectedLabelColor = '#ffffff')});
    labelable.color({background: (expectedBgColor = 'yellow')});
});

