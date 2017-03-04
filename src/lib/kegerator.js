'use strict';

const EventEmitter = require('events').EventEmitter;
const Promise = require('bluebird');
const serialport = require('serialport');


class Kegerator extends EventEmitter {
  constructor(opts) {
    super();

    this._opts = Object.assign({}, opts || {});
    this.initialize = this.initialize.bind(this);
  }

  // Discover all temperature probes connected to this pin
  initialize() {
    this._serialPort = new serialport.SerialPort(process.env.SERIAL_PORT, {
      baudrate: process.env.BAUDRATE || 9600,
      parser: serialport.parsers.readline('\n')
    });

    this._serialPort.on('open', () => {
      console.log('Kegerator online ;)');

      this._serialPort.on('data', (data) => {
        this.emit('data', data);
        console.log('Received data:', data);
      });
    });
  }
}

module.exports = Kegerator;
