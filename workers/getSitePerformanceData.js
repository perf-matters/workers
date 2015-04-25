var webdriverDecorator = require('../lib/webdriverDecorator');
var amqpUtils = require('../commons/amqpUtils');
var validate = require('har-validator');

var driver = require('../lib/driver');

var limiter = 0;
var channel;

var connection = amqpUtils.connect()
    .then(function(ch) {
        channel = ch;
        ch.assertQueue(amqpUtils.config.getQueueName);
        ch.consume(amqpUtils.config.getQueueName, getHARData);
    }).then(null, console.warn);

function getHARData (buffer) {
    var message = amqpUtils.getMessageContentFromBuffer(buffer);
    if (limiter < amqpUtils.config.getHARconcurencyLimit) {
        limiter++;
        channel.ack(buffer);
    } else {
        channel.nack(buffer);
        return;
    }
    driver.startProxy(message.connectionType).then(function (config) {
        webdriverDecorator(config.browser, config.proxy)
            .init()
            .startHAR(message.serviceUrl)
            .url(message.serviceUrl)
            .waitForLoadEvent()
            .getPerformanceMetrics(function (err, data) {
                message.timing.performanceMetricsDone = new Date().getTime();
                var results = {
                    request: message,
                    HAR: data,
                    HARerrors: null
                };

                validate(data, function (e, valid) {
                    if (e) {
                        results.HARerrors = e.errors;
                    }

                    channel.sendToQueue(
                        buffer.properties.replyTo,
                        amqpUtils.jsonToBuffer(results)
                    );
                    limiter--;
                    console.log([e, valid]);
                });
            })
            .end();
    });
}
