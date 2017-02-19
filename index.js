const five = require('johnny-five');
const TempSensor = require('./lib/onewire-temp-sensor');
const board = new five.Board();

board.on('ready', () => {
  const temp = new TempSensor(board, 4);
  temp.initialize();

  temp.on('initialized', (sensors) => {
    console.log('Initialized sensors', sensors)
    temp.readTemperatures();
  });
  temp.on('changed', (sensor, newTemp, oldTemp) => {
    console.log('Temperature changed on sensor', sensor, '\n  Old:', oldTemp, '\n  New:', newTemp);
  });
});
