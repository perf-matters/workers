module.exports.getResults = function (timing) {
    var performance = {
        'onContentLoad': (timing.domContentLoadedEventEnd - timing.requestStart),
        'onLoad': (timing.loadEventEnd - timing.requestStart)
    };

    return performance;
};

module.exports.decorateHAR = function (HAR, results) {
    HAR.log.pages[0].pageTimings = results;
    HAR.log.pages[0].title = HAR.log.pages[0].id;
    HAR.log.creator = {
        'name':'Perf matters',
        'version':'1.0'
    };

    return this.normalizeRequestsStartTimes(HAR);
};

module.exports.normalizeRequestsStartTimes = function (HAR) {
    var HARStart = new Date(HAR.log.pages[0].startedDateTime);
    var firstRequestStart = new Date(HAR.log.entries[0].startedDateTime);
    var delta = firstRequestStart.getTime() - HARStart.getTime();

    HAR.log.pages[0].startedDateTime = HARStart.toISOString();

    for (var i = 0; i < HAR.log.entries.length; i++) {
        var timestamp = new Date(HAR.log.entries[i].startedDateTime) - delta;
        HAR.log.entries[i].startedDateTime = new Date(timestamp).toISOString();
    }

    return HAR;
};
