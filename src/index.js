const Kegerator = require('./lib/kegerator');
const Config = require('./lib/config');
const Promise = require('bluebird');
const request = require('simple_request');

const kegerator = new Kegerator();
const msg = kegerator.messageTypes;

console.log('Initializing kegerator');
kegerator.initialize();

kegerator.on(msg.circuitReady.event, () => {
  console.log('Kegerator ready! Yay!');

  const config = new Config();
  return config.migrate().then(() => {
    return config.refreshConfig();
  }).then(() => {
    return setTimeout(() => kegerator.changeTempLimits(config.config.lowerTemp, config.config.upperTemp), 2000);
  });
});

kegerator.on(msg.temperatureChange.event, (temp) => {
  request.put('https://qr6atys5pc.execute-api.us-east-1.amazonaws.com/dev/temperature', {
    json: { temperature: temp }
  }).then((res) => {
    if (res[0].statusCode !== 200)
      console.log('ERROR: could not post temperature change');
  });
});

kegerator.on(msg.relayOpen.event, () => postStateChange('off'));
kegerator.on(msg.relayClose.event, () => postStateChange('on'));

const postStateChange = (state) => {
  return request.put('https://qr6atys5pc.execute-api.us-east-1.amazonaws.com/dev/state', {
    json: { state: state }
  }).then((res) => {
    if (res[0].statusCode !== 200)
      console.log('ERROR: could not post state change');
  });
};
