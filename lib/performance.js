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

    return this.fixSessionStartTime(HAR);
};

module.exports.fixSessionStartTime = function (HAR) {
    HAR.log.pages[0].startedDateTime = HAR.log.entries[0].startedDateTime;
    return HAR;
};
