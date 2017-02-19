'use strict';

const EventEmitter = require('events').EventEmitter;

const OneWireIdentifiers = {
  TemperatureProbe: 0x28
};

const OneWireFunctions = {
  ConvertT: 0x44,
  ReadT: 0xBE
};

const defaultDelay = 500;

const defaultBytesToRead = 9;

class OneWireTempSensor extends EventEmitter {
  constructor(board, pin) {
    super();

    this._board = board;
    this._pin = pin;
    this._delay = defaultDelay;
    this._bytesToRead = defaultBytesToRead;

    // Bind all methods
    this.initialize = this.initialize.bind(this);
    this.readTemperatures = this.readTemperatures.bind(this);
  }

  // Discover all temperature probes connected to this pin
  initialize() {
    this._board.io.sendOneWireConfig(this._pin, true);

    this._board.io.sendOneWireSearch(this._pin, (err, sensors) => {
      if (err)
        return this.emit('error', err);

      // Filter out other 1-wire devices connected to this bus
      this._sensors = (sensors || []).filter((s) => s[0] == OneWireIdentifiers.TemperatureProbe);

      // Initialize temperatures (as 0)
      this._temps = {}
      this._sensors.forEach((s) => {
        this._temps[s] = 0;
      });

      // All good :D
      return this.emit('initialized', this._sensors, sensors);
    });
  }

  // Read temperature from all sensors in the bus
  readTemperatures() {
    // Already initialized?
    if (this._sensors) {
      // Send ConvertT message (read voltage from ADC, convert into a temperature and store in the scratchpad register)
      this._sensors.forEach((s) => {
        this._board.io.sendOneWireReset(this._pin);
        this._board.io.sendOneWireWrite(this._pin, s, OneWireFunctions.ConvertT);

        // Next step is to send ReadT (get information from scratchpad register)
        process.nextTick(() => {
          this._board.io.sendOneWireReset(this._pin);
          this._board.io.sendOneWireWriteAndRead(this._pin, s, OneWireFunctions.ReadT, this._bytesToRead, (err, temp) => {
            if (err)
              return this.emit('error', err);

            // Get the temperature and convert to Celsius (TODO: make this configurable, i.e. Farenheit, Kelvin, etc)
            const newTemp = ((temp[1] << (this._bytesToRead - 1)) | temp[0]) / 16.0;

            // Check if temperature changed since last cycle
            if (newTemp !== this._temps[s]) {
              this.emit('changed', s, newTemp, this._temps[s]);
              this._temps[s] = newTemp;
            }
          });
        });
      });
    }

    // Read again later :)
    setTimeout(this.readTemperatures, this._delay)
  }
}

module.exports = OneWireTempSensor;
