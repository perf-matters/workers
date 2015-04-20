var performance = require('./performance');
var fs = require('fs');

module.exports = function (webdriver, proxy) {
    var filmstripTimeouts = {};

    function saveScreenshotToFile(name, dataString) {
        var data = new Buffer(dataString, 'base64');
        fs.writeFile('./filmstrips/' + name + '.jpg', data, function(err){});
    }

    return webdriver.addCommand("waitForLoadEvent", function(cb) {
        this.execute(function() {
            function addTestElement () {
                if (document.readyState !== "complete") {
                    setTimeout(addTestElement, 100);
                    return;
                }
                var testDiv = document.createElement('div');
                testDiv.className = 'load-event-end-element';
                document.querySelector('body').appendChild(testDiv);
            }
            addTestElement();
        }, 'load-event-end-element', function () {
            this.waitForExist('.load-event-end-element', 10000, function (err, result) {
                cb(err,result);
            });
        });
    }).addCommand("getPerformanceMetrics", function(cb) {
        this.execute(function() {
            return window.performance;
        }, function(err, ret) {
            var results = performance.getResults(ret.value.timing);
            proxy.getHAR(proxy.instancePort, function(err, data) {
                try {
                    var HAR = JSON.parse(data);
                    HAR = performance.decorateHAR(HAR, results);
                } catch (error) {
                    var HAR = {message: 'Error while generating HAR'};
                }
                proxy.stopPort(proxy.instancePort, function () {
                    cb(err, HAR);
                });
            });
        })
    }).addCommand("startHAR", function (pageRef, cb) {
        proxy.createHAR(proxy.instancePort, {
            'initialPageRef': pageRef,
            captureHeaders: true
        }, cb);
    }).addCommand("startFilmstrip", function (name, cb) {
        var i = 0;
        this.screenshot(function (err, response) {
            if (!err) {
                saveScreenshotToFile(name + ++i, response.value);
            }
        });
        filmstripTimeouts[name] = setInterval(function () {
            this.screenshot(function (err, response) {
                if (!err) {
                    saveScreenshotToFile(name + ++i, response.value);
                }
            });
        }.bind(this), 100);
        cb();
    }).addCommand("stopFilmstrip", function (name, cb) {
        clearInterval(filmstripTimeouts[name]);
        delete filmstripTimeouts[name];
        cb();
    });
};
