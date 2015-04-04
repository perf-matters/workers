var url = require('url');
var http = require('http');
var amqpUtils = require('../commons/amqpUtils');

var channel;
var connection = amqpUtils.connect()
    .then(function(ch) {
        channel = ch;
        channel.assertQueue(amqpUtils.config.sendQueueName);
        channel.consume(amqpUtils.config.sendQueueName, sendHARData);
    }).then(null, console.warn);


function sendHARData (buffer) {
    var message = amqpUtils.getMessageContentFromBuffer(buffer);
    message.request.timing.hookDelivery = new Date().getTime();
    var hookUrl = url.parse(message.request.hookUrl);

    var options = {
        hostname: hookUrl.hostname,
        port: hookUrl.port,
        path: hookUrl.path,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(JSON.stringify(message))
        }
    };

    var req = http.request(options);
    req.write(JSON.stringify(message));
    req.end();
    channel.ack(buffer);
}

