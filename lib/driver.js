var webdriver = require("webdriverio");
var Proxy = require('browsermob-proxy-api');
var Q = require('q');
var config = require('../config');

Proxy.prototype.startPort = function(port, callback) {
    this.call('POST', '/proxy', port ? 'port=' + port : null, callback);
};

module.exports.startProxy = function (connectionType) {
    var proxy = new Proxy(config.proxy);

    var deferred = Q.defer();

    proxy.startPort(0, function(err, data) {
        if (err) {
            deferred.reject(new Error(err));
        }
        proxy.instancePort = JSON.parse(data).port;
        proxy.limit(proxy.instancePort, connectionType, function (err, resp) {
            deferred.resolve({
                browser: webdriver.remote({
                    desiredCapabilities: {
                        browserName: 'chrome',
                        proxy: {
                            proxyType: 'manual',
                            httpProxy: config.proxy.host + ':' + proxy.instancePort
                        },
                        host: config.selenium.host,
                        port: config.selenium.port
                    }
                }),
                proxy: proxy
            });
        })
    });

    return deferred.promise;
};
