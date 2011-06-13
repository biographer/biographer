module('Drawable');

test('drawable.classes', function() {
    expect(12);
    var graph = new bui.Graph(document.getElementById('dummy'));
    var drawable = graph.add(bui.Drawable);

    var expectedClassString = null;

    drawable.bind(bui.Drawable.ListenerType.classes,
            function(node, classString) {
        equal(classString, expectedClassString);
        equal(node.classString(), expectedClassString);
        equal(drawable.classString(), expectedClassString);
    });

    var class1 = 'hidden';
    expectedClassString = class1;
    drawable.addClass(class1);

    var class2 = 'round';
    expectedClassString = class1 + ' ' + class2;
    drawable.addClass(class2);

    expectedClassString = class2;
    drawable.removeClass(class1);

    expectedClassString = '';
    drawable.removeClass(class2);
});