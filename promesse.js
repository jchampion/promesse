'use strict';

var counter = 0;

var Promesse = function(p) {
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.deferred = [];

    p((function(value) {
        if ('pending' !== this.state) return;
        this.state = 'fulfilled';
        this.value = value;
        this._fulfill();
    }).bind(this), (function(reason) {
        if ('pending' !== this.state) return;
        this.state = 'rejected';
        this.reason = reason;
        this._reject();
    }).bind(this));
};

Promesse.prototype.then = function(onFulfilled, onRejected) {
    var deferred = this.defer();
    deferred.onFulfilled = onFulfilled;
    deferred.onRejected = onRejected;

    this.deferred.push(deferred);

    if ('fulfilled' === this.state) {
        this._fulfill();
    } else if ('rejected' === this.state) {
        this._reject();
    }

    return deferred.promise;
};

Promesse.prototype._fulfill = function() {
    this.deferred.forEach((function(deferred) {
        if ('function' !== typeof deferred.onFulfilled) {
            // TBC
            deferred.resolve(this.value);
        } else {
            setImmediate((function() {
                try {
                    var x = deferred.onFulfilled.call(undefined, this.value);
                    this._resolve(deferred, x);
                } catch (e) {
                    deferred.reject(e);
                }
            }).bind(this));
        }
    }).bind(this));
    this.deferred = [];
};

Promesse.prototype._reject = function() {
    this.deferred.forEach((function(deferred) {
        if ('function' !== typeof deferred.onRejected) {
            deferred.reject(this.reason);
        } else {
            setImmediate((function() {
                try {
                    var x = deferred.onRejected.call(undefined, this.reason);
                    this._resolve(deferred, x);
                } catch (e) {
                    deferred.reject(e);
                }
            }).bind(this));
        }
    }).bind(this));
    this.deferred = [];
};

Promesse.prototype.defer = function() {
    var deferred = {};

    deferred.uniqid = counter++;
    deferred.promise = new Promesse(function(resolveFct, rejectFct) {
        deferred.resolve = resolveFct;
        deferred.reject = rejectFct;
    });

    return deferred;
};

/**
 * Promise resolution procedure
 *
 * @param deferred
 * @param x
 * @private
 */
Promesse.prototype._resolve = function(deferred, x) {
    if (x === deferred.promise) {
        // 2.3.1
        deferred.reject(new TypeError('Uh'));
    } else if (x instanceof Promesse) {
        // 2.3.2
        x.then(function (result) {
            // 2.3.2.2
            deferred.resolve(result);
        }, function (reason) {
            // 2.3.2.3
            deferred.reject(reason);
        });
    } else if ('object' === typeof x || 'function' === typeof x) {
        // 2.3.3
        try {
            // 2.3.3.1
            var then = x.then;
            if ('function' === typeof then) {
                // 2.3.3.3
                then.call(x, function (y) {
                    // 2.3.3.3.1
                    this._resolve(deferred, y);
                }.bind(this), function (r) {
                    // 2.3.3.3.2
                    deferred.promise.reject(r);
                }.bind(this));
            } else {
                // 2.3.3.4
                deferred.resolve(x);
            }
        } catch (e) {
            // 2.3.3.2
            deferred.reject(e);
        }
    } else {
        // 2.3.4
        deferred.resolve(x);
    }
};

module.exports = Promesse;