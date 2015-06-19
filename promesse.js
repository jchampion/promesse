'use strict';

var Promesse = function (p) {
    this.state = 'pending';
    this.value = undefined;
    this.deferred = [];

    var self = this, resolve = function (state, value) {
        self.state = state;
        self.value = value;
        self._resolveDeferred();
    }, reject = function (reason) {
        resolve('rejected', reason);
    }, frozen = false;

    p(function (value) {
        if (frozen) {
            return;
        }
        frozen = true;

        self._resolve({promise: self, resolve: function (value) {
            resolve('fulfilled', value);
        }, reject: reject}, value);
    }, function (reason) {
        if (frozen) {
            return;
        }
        frozen = true;
        reject(reason);
    });
};

Promesse.prototype.then = function (onFulfilled, onRejected) {
    var deferred = this.defer();
    deferred.onFulfilled = onFulfilled;
    deferred.onRejected = onRejected;

    this.deferred.push(deferred);

    this._resolveDeferred();

    return deferred.promise;
};

Promesse.prototype._resolveDeferred = function () {
    if ('pending' === this.state) {
        return;
    }

    var self = this, thenMethod = 'fulfilled' === this.state ? 'onFulfilled' : 'onRejected';
    this.deferred.forEach(function (deferred) {
        if ('function' !== typeof deferred[thenMethod]) {
            deferred['fulfilled' === self.state ? 'resolve' : 'reject'](self.value);
        } else {
            setImmediate(function () {
                try {
                    var x = deferred[thenMethod].call(undefined, self.value);
                    self._resolve(deferred, x);
                } catch (e) {
                    deferred.reject(e);
                }
            });
        }
    });
    this.deferred = [];
};

Promesse.prototype.defer = function () {
    var deferred = {};

    deferred.promise = new Promesse(function (resolveFct, rejectFct) {
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
Promesse.prototype._resolve = function (deferred, x) {
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
    } else if (null !== x && ('object' === typeof x || 'function' === typeof x)) {
        // 2.3.3
        try {
            // 2.3.3.1
            var then = x.then, frozen = false;
            if ('function' === typeof then) {
                // 2.3.3.3
                try {
                    then.call(x, function (y) {
                        // 2.3.3.3.1
                        if (frozen) {
                            return;
                        }
                        frozen = true;
                        this._resolve(deferred, y);
                    }.bind(this), function (r) {
                        // 2.3.3.3.2
                        if (frozen) {
                            return;
                        }
                        frozen = true;
                        deferred.reject(r);
                    }.bind(this));
                } catch (e) {
                    if (!frozen) {
                        throw e;
                    }
                }
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

Promesse.prototype.toString = function () {
    return "[object Promise]";
};

module.exports = Promesse;