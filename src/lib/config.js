'use strict';

const db = require('sqlite');
const Promise = require('bluebird');

const defaultOpts = {
  databaseFile: './database.sqlite',
  refreshEvery: 6e4 // 1 minute
};

class Config {
  constructor(opts = {}) {
    this.opts = Object.assign({}, defaultOpts, opts);
    this._config = {}
    
    this._useDb = this._useDb.bind(this);
    this.migrate = this.migrate.bind(this);
    this.refreshConfig = this.refreshConfig.bind(this);
  }

  initialize() {
    return this.migrate().then(() => {
      return this.refreshConfig();
    });
  }

  _useDb(cb) {
    return Promise.resolve().then(() => {
      return db.open(this.opts.databaseFile, {
        Promise: Promise
      });
    }).then(() => {
      return cb(db);
    }).finally(() => {
      return db.close();
    });
  }

  migrate() {
    return this._useDb((db) => {
      return db.migrate();
    });
  }

  refreshConfig() {
    return this._useDb((db) => {
      return db.all('SELECT key, value FROM configs')
    }).then((configs) => {
      return configs.reduce((acc, curr) => {
        return Object.assign({}, acc, {
          [curr.key]: curr.value
        });
      }, {});
    }).then((config) => {
      this._config = config;
      return config;
    }).finally(() => {
      setTimeout(this.refreshConfig, this.opts.refreshEvery);
    });
  }
  
  get config() {
    return Object.assign({}, this._config);
  }
}

module.exports = Config;
