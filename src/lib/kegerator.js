'use strict';

const EventEmitter = require('events').EventEmitter;
const Promise = require('bluebird');
const serialport = require('serialport');

const messageTypes = {
  unknown: {
    code: 0,
    event: 'unknown'
  },
  temperatureChange: {
    code: 1,
    event: 'temperature-change'
  },
  relayOpen: {
    code: 2,
    event: 'relay-open'
  },
  relayClose: {
    code: 3,
    event: 'relay-close'
  },
  changeUpperTempLimit: {
    code: 4,
    event: 'change-upper-temp-limit'
  },
  changeLowerTempLimit: {
    code: 5,
    event: 'change-lower-temp-limit'
  },
  circuitReady: {
    code: 6,
    event: 'ready'
  }
};

const messageTypeNames = Object.keys(messageTypes);

class Kegerator extends EventEmitter {
  constructor(opts) {
    super();

    this._opts = Object.assign({}, opts || {});
    this.messageTypes = messageTypes;
    this.initialize = this.initialize.bind(this);
    this.changeTempLimits = this.changeTempLimits.bind(this);
  }

  // Discover all temperature probes connected to this pin
  initialize() {
    this._serialPort = new serialport.SerialPort(process.env.SERIAL_PORT, {
      baudrate: process.env.BAUDRATE || 9600,
      parser: serialport.parsers.readline('\n')
    });

    this._serialPort.on('open', () => {
      this._serialPort.on('data', (data) => {
        const startIndex = 2; // {[_ <- start here
        const endType = data.indexOf(']');
        const type = data.substr(startIndex, endType - startIndex);
        const message = data.substr(endType + 1, data.length - endType - startIndex - 1);

        const messageType = messageTypeNames.map((name) => messageTypes[name]).filter((t) => t.code == type)[0];

        if (messageType) {
          this.emit(messageType.event, message);
        } else {
          this.emit(messageTypes.unknown.event, message);
        }
      });
    });
  }

  changeTempLimits(lower, upper) {
    return this._serialPort.write(`{[${messageTypes.changeUpperTempLimit.code}]${lower}}`, (err) => {
      if (err)
        return console.log('ERROR', err);

      setTimeout(() => {
        return this._serialPort.write(`{[${messageTypes.changeLowerTempLimit.code}]${upper}}`);
      }, 1000);
    });
  }
}

module.exports = Kegerator;
