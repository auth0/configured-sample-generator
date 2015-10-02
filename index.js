var _     = require('lodash'),
  Promise = require('bluebird'),
  path    = require('path'),
  debug   = require('debug')('configurated-sample-generator'),
  fs      = Promise.promisifyAll(require('fs')),
  packer  = require('./packer'),
  util    = require('util');

function PackerConfigurer(options) {
  options = options || {};
  this.organization = options.organization;
  this.types = {
    noop: _.identity
  };
  this.infoLoader = _.identity;
}

PackerConfigurer.prototype.addTypeProcesor = function(name, fn) {
  this.types[name] = fn;
  return this;
}

PackerConfigurer.prototype.setInformationLoader = function(fn) {
  this.infoLoader = fn;
  return this;
}

PackerConfigurer.prototype.getPacker = function() {
  return _.partial(packer, this);
}

PackerConfigurer.fileWriter = function(fn) {
  return function fileWriter(context) {
    var fileDesc = fn(context);
    return fs.writeFileAsync(path.join(context.configurationFilePath || context.examplePath, fileDesc.name), fileDesc.content, {flags: 'w'}).then(function() {
      debug("File created");
      return context;
    });
  };
};


PackerConfigurer.envFileCreator = function(fn) {
  return PackerConfigurer.fileWriter(function(context) {
    var env = _.map(fn(context), function(value, key) {
      return util.format('%s=%s', key, value);
    }).join(' \n');
    return {
      name: '.env',
      content: env + '\n'
    };
  });
};


PackerConfigurer.fileReplacer = function(fn) {
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

module.exports = PackerConfigurer;
