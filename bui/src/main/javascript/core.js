(function(bui) {

    /*
     * Make sure that the size of the body element is at least the size of the
     * available viewport. This is mandatory for the lasso as otherwise the
     * click event on the body won't be recognized.
     */
//    $(window).resize(function() {
//        var documentWidth = $(document).width();
//        var documentHeight = $(document).height();
//
//        var bodyWidth = $("body").width();
//        var bodyHeight = $("body").height();
//
//        $("body").width(Math.max(documentWidth, bodyWidth));
//        $("body").height(Math.max(documentHeight, bodyHeight));
//    });


    
    var readyFunctions = [];

    /**
     * @description
     * Use this function to add functions (callbacks) which are to be
     * executed when the whole document is done loading.
     *
     * @param {Function} callback Function to be executed when the document is
     *   ready
     */
    bui.ready = function(callback) {
        readyFunctions.push(callback);
    };

    // executing the ready functions
    $(function() {
        for(var i = 0; i < readyFunctions.length; i++) {
            readyFunctions[i]();
        }
    });
})(bui);