const five = require('johnny-five');
const Oled = require('oled-js');
const TempSensor = require('./lib/onewire-temp-sensor');
const Config = require('./lib/config');

const config = new Config();
const board = new five.Board();

config.initialize();

board.on('ready', () => {
  const temp = new TempSensor(board, 4);
  temp.initialize();

  temp.on('initialized', (sensors) => {
    temp.readTemperatures();
  });
  temp.on('changed', (sensor, newTemp, oldTemp) => {
    console.log('Temperature changed on sensor', sensor, '\n  Old:', oldTemp, '\n  New:', newTemp);
  });
});
