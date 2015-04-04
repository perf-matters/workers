var amqp = require('amqplib');

module.exports.config = require('./amqp');

module.exports.connect = function () {
    return amqp.connect(this.config.url, {heartbeat: 3})
        .then(function(conn) {
            return conn.createConfirmChannel();
        });
};

module.exports.getMessageContentFromBuffer = function (buffer) {
    return JSON.parse(new Buffer(JSON.parse(JSON.stringify(buffer)).content.data).toString());
};

module.exports.jsonToBuffer = function (json) {
    return new Buffer(JSON.stringify(json));
};
