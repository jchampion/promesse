var Promesse = require('../promesse');

module.exports = {
    resolved: Promesse.prototype.resolve,
    rejected: Promesse.prototype.reject,
    deferred: Promesse.prototype.defer
};