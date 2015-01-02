var _     = require('lodash'),
  Promise = require('bluebird'),
  path    = require('path'),
  debug   = require('debug')('configurated-sample-generator'),
  fs      = Promise.promisifyAll(require('fs')),
  packer  = require('./packer'),
  util    = require('util');

function Configurer(options) {
  this.organization = options.organization;
  this.types = {
    noop: _.identity
  };
  this.infoLoader = _.identity;
}

Configurer.prototype.addTypeProcesor = function(name, fn) {
  this.types[name] = fn;
  return this;
}

Configurer.prototype.setInformationLoader = function(fn) {
  this.infoLoader = fn;
  return this;
}

Configurer.prototype.getPacker = function() {
  return _.partial(packer, this);
}

Configurer.fileWriter = function(fn) {
  return function fileWriter(context) {
    var fileDesc = fn(context);
    return fs.writeFileAsync(path.join(context.examplePath, fileDesc.name), fileDesc.content, {flags: 'w'}).then(function() {
      debug("File created");
      return context;
    });
  };
};


Configurer.envFileCreator = function(fn) {
  return Configurer.fileWriter(function(context) {
    var env = _.map(fn(context), function(value, key) {
      return util.format('%s=%s', key, value);
    }).join(' \n');
    return {
      name: '.env',
      content: env
    };
  });
};


Configurer.fileReplacer = function(fn) {
  return function searchAndReplaceConfig(context) {
    return fs.readFileAsync(context.configurationFilePath)
      .then(function(contents) {
        debug("Reading content of existing file to replace");
        var finalContent = fn(context, contents.toString());

        debug("Content replaced");
        return fs.writeFileAsync(context.configurationFilePath, finalContent, {flags: 'w'})
          .then(function() {
            debug("New content written");
            return context;
          });
      });
    };
}

module.exports = Configurer;
