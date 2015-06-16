var Promesse = require('../promesse');
//var Promesse = require('q').promise;

var p = new Promesse(function(resolve, reject) {
    setTimeout(function() {
        resolve('result1')
    }, 1000);
});

p.then(function(value) {
    return {
        then: function(resolvePromise, rejectPromise) {
            resolvePromise({
                then: function(resolvePromise, rejectPromise) {
                    rejectPromise(':/')
                }
            });
        }
    }
}).then(function(value) {
    console.log('resolution => ' + value);
}, function(reason) {
    console.log('rejection => ' + reason);
});

/*p.then(function(result) {
    console.log("resolved 1 : " + result);

    return new Promesse(function(resolve, reject) {
        setTimeout(function() {
            resolve('result2')
        }, 1000);
    });
}).then(function(result) {
    console.log("resolved 2 : " + result);

    return new Promesse(function(resolve, reject) {
        setTimeout(function() {
            resolve('result3')
        }, 1000);
    });
}).then(function(result) {
    console.log("resolved 3 : " + result);
});

p.then(function(result) {
    console.log("resolved 1' : " + result);

    return new Promesse(function(resolve, reject) {
        setTimeout(function() {
            resolve("result4")
        }, 3000);
    });
}).then(function(result) {
    console.log("resolved 4 : " + result);

    return new Promesse(function(resolve, reject) {
        setTimeout(function() {
            reject("reason5")
        }, 1000);
    });
}).then(function(result) {
    console.log("resolved 5 : " + result);
}, function(reason) {
    console.log("rejected 5 : " + reason);
});*/