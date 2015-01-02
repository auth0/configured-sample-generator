var express = require('express');
var logger = require('morgan');
var http = require('http');
var debug = require('debug')('server');
var PackerConfigurer = require('configurated-sample-generator');
var bodyParser = require('body-parser');

var app = express();

// Prettify HTML
app.locals.pretty = true;

app.use(logger('dev'));



// Request body parsing middleware should be above methodOverride
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// Packer configuration
var Packer = new PackerConfigurer()
  .setInformationLoader(function(context) {
    context.otherConfigId = 'other configuration id from db';
    return context;
  })
  .addTypeProcesor('server', PackerConfigurer.envFileCreator(function(context) {
    return {
      'CONFIG_ID': context.configId,
      'OTHER_CONFIG_ID': context.otherConfigId
    };
  }))
  .getPacker();

app.get('/:org/:repo/:branch/create-package', function(req, res) {

  var packer = new Packer({
    organization: req.params.org,
    repository: req.params.repo,
    gitBranch: req.params.branch,
    examplePath: req.query.path,
    sampleType: 'server',
    configurationFilePath: req.query.filePath,
    contextInformation: {
      configId: req.query.configId
    }
  });

  packer.create()
    .then(function(stream) {
      debug("Got the stream OK");
      res.writeHead('200', {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=' + req.params.repo + '-sample.zip'
      });
      res.end(stream,'binary');
    })
    .catch(function(error) {
      debug('There is an error', error);
      res.send(400, error);
    });
});

http.createServer(app).listen(3000, function (err) {
  console.log('listening in http://localhost:3000');
});
