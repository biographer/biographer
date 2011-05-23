test('observable', function() {
    expect(7);

    var type1 = 'foo', type2 = 'bar', expectedType = null;
    
    var generateTypeListener = function(type) {
        var associatedType = type;

        return function() {
            equal(associatedType, expectedType);
        };
    };

    var o = new bui.Observable()
        .addType(type1)
        .addType(type2)
        .bind(type1, generateTypeListener(type1), type1)
        .bind(type2, generateTypeListener(type2), type2);

    expectedType = type1;
    ok(o.fire(type1));

    expectedType = type2;
    ok(o.fire(type2));

    ok(o.unbind(type1, type1).fire(type1));

    expectedType = type2;
    ok(o.fire(type2));
});