function testObservable(observable) {
    expect(7);

    var type1 = 'foo', type2 = 'bar', expectedType = null;

    var generateTypeListener = function(type) {
        var associatedType = type;

        return function() {
            equal(associatedType, expectedType);
        };
    };

    observable.addType(type1)
        .addType(type2)
        .bind(type1, generateTypeListener(type1), type1)
        .bind(type2, generateTypeListener(type2), type2);

    expectedType = type1;
    ok(observable.fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));

    ok(observable.unbind(type1, type1).fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));
}

test('observable', function() {
    testObservable(new bui.Observable());
});

test('observable.addTypeObject', function() {
    expect(7);

    var type1 = 'foo', type2 = 'bar', expectedType = null;

    var generateTypeListener = function(type) {
        var associatedType = type;

        return function() {
            equal(associatedType, expectedType);
        };
    };

    var observable = new bui.Observable();
    observable.addType({ first : type1, second : type2})
        .bind(type1, generateTypeListener(type1), type1)
        .bind(type2, generateTypeListener(type2), type2);

    expectedType = type1;
    ok(observable.fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));

    ok(observable.unbind(type1, type1).fire(type1));

    expectedType = type2;
    ok(observable.fire(type2));
});

test('inheritance', function() {
    testObservable(new bui.Graph())
});