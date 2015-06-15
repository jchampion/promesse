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
                    var candidate = deferred.onFulfilled.call(undefined, this.value);
                    if (candidate === deferred.promise) {
                        deferred.reject(new TypeError('Uh'));
                    } else if (candidate instanceof Promesse) {
                        candidate.then(function (result) {
                            deferred.resolve(result);
                        }, function (reason) {
                            deferred.reject(reason);
                        });
                    } else {
                        // TBC
                        deferred.resolve(candidate);
                    }
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
            // TBC
            deferred.reject(this.reason);
        } else {
            setImmediate((function() {
                try {
                    var candidate = deferred.onRejected.call(undefined, this.reason);
                    if (candidate === deferred.promise) {
                        deferred.reject(new TypeError('Uh'));
                    } else if (candidate instanceof Promesse) {
                        candidate.then(function (result) {
                            deferred.resolve(result);
                        }, function (reason) {
                            deferred.reject(reason);
                        });
                    } else {
                        // TBC
                        deferred.resolve(candidate);
                    }
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

module.exports = Promesse;