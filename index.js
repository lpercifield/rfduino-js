// RFduino Node Example
// Discover and read temperature from RFduinos running the Temperature Sketch
// https://github.com/RFduino/RFduino/blob/master/libraries/RFduinoBLE/examples/Temperature/Temperature.ino
//
// (c) 2014 Don Coleman
var noble = require('noble'),
    rfduino = require('./rfduino'),
    _ = require('underscore');

// TODO why does this need to be wrapped?
var stop = function() {
    noble.stopScanning();
};

noble.on('scanStart', function() {
    console.log('Scan started');
    setTimeout(stop, 5000);
});

noble.on('scanStop', function() {
    console.log('Scan stopped');
});

var onDeviceDiscoveredCallback = function(peripheral) {
    console.log('\nDiscovered Peripherial ' + peripheral.uuid);

    if (_.contains(peripheral.advertisement.serviceUuids, rfduino.serviceUUID)) {
        // here is where we can capture the advertisement data from the rfduino and check to make sure its ours
        console.log('RFduino is advertising \'' + rfduino.getAdvertisedServiceName(peripheral) + '\' service.');
        console.log("serviceUUID: "+peripheral.advertisement.serviceUuids);

        peripheral.on('connect', function() {
            console.log("got connect event");
            peripheral.discoverServices();
        });

        peripheral.on('disconnect', function() {
            console.log('Disconnected');
        });

        peripheral.on('servicesDiscover', function(services) {

            var rfduinoService;

            for (var i = 0; i < services.length; i++) {
                if (services[i].uuid === rfduino.serviceUUID) {
                    rfduinoService = services[i];
                    console.log("Found RFduino Service");
                    break;
                }
            }

            if (!rfduinoService) {
                console.log('Couldn\'t find the RFduino service.');
                return;
            }

            rfduinoService.on('characteristicsDiscover', function(characteristics) {
                console.log('Discovered ' + characteristics.length + ' service characteristics');

                var receiveCharacteristic;

                for (var i = 0; i < characteristics.length; i++) {
                    if (characteristics[i].uuid === rfduino.receiveCharacteristicUUID) {
                        receiveCharacteristic = characteristics[i];
                        break;
                    }
                }

                if (receiveCharacteristic) {
                    receiveCharacteristic.on('read', function(data, isNotification) {
                        // temperature service sends a float
                        var marker = data.readInt16LE(0);
                        //console.log(marker);
                        // switch (marker) {
                        //   case 11:
                        //     console.log("1-16: ")
                        //     break;
                        //   case 12:
                        //     console.log("17-32: ")
                        //     break;
                        //   case 99:
                        //     console.log("READING COMPLETE")
                        //     break;
                        //   default:
                        //     console.log(data.readFloatLE(0) + " PSI");
                        // }
                        // if(data.readInt16LE(0) == 11){
                        //   console.log("1-16: ")
                        // }else if
                        // console.log(data.readInt16LE(0));

                    });

                    console.log('Subscribing for data notifications');
                    receiveCharacteristic.notify(true);
                }

            });

            rfduinoService.discoverCharacteristics();

        });
        console.log("Calling connect");
        peripheral.connect();

    }
};

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
        noble.startScanning([rfduino.serviceUUID], false);
    }
});

noble.on('discover', onDeviceDiscoveredCallback);
