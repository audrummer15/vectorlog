var Promise = require("bluebird");
var SerialPort = Promise.promisifyAll(require("serialport"));
var fs = Promise.promisifyAll(require("fs"));

var vectorStream = null;
var serialPort = null;

function _isValidPort(port) {
    return Promise.try(function() {
        return module.exports.getSerialPortNames();
    }).then(function(serialPortNames) {
        if( serialPortNames.indexOf(port) == -1 ) {
            return false;
        } else {
            return true;
        }
    });
}

module.exports = {
    open: function(port, logFile, callback) {
                return Promise.try(function() {
                    return _isValidPort(port);
                }).then(function (result) {
                    if (!result) {
                        throw new Error("Port " + port + " does not exist.");
                    }

                    serialPort = new SerialPort.SerialPort(port,
                        {baudrate: 921600},
                        false
                    );

                    vectorStream = fs.createWriteStream(logFile);

                    return Promise.try(function(){
                        return serialPort.openAsync().then(
                            serialPort.on("error", function(e) {
                                console.error(e);
                            })
                        );
                    }).then(function () {
                        return new Promise(function(resolve, reject){
                            serialPort
                                .pipe(vectorStream)
                                .on("finish", function(){
                                    resolve();
                                })
                                .on("error", function(err){
                                    reject(err);
                                });
                        });
                    });
                }).nodeify(callback);
    },

    close: function() {
        return Promise.try(function() {
            if (serialPort != null) {
                serialPort.closeAsync().then(function () {
                    if (vectorStream != null) {
                        vectorStream.close();
                    }
                });
            }
        });
    },

    printSerialPorts: function() {
        return Promise.try(function() {
            return module.exports.getAvailableSerialPorts().then(function(serialPorts) {
                serialPorts.forEach(function(port) {
                    console.log(port.comName);
                });
            });
        });
    },

    getSerialPortNames: function() {
        return Promise.try(function() {
            return module.exports.getAvailableSerialPorts().then(function(serialPorts) {
                var portNames = [];
                serialPorts.forEach(function(port) {
                    portNames.push(port.comName);
                });

                return portNames;
            });
        });
    },

    getAvailableSerialPorts: function() {
        return Promise.try(function() {
            return SerialPort.listAsync().then(function(serialPorts) {
                return serialPorts;
            });
        });
    }
};