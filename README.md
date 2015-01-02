# Configurated sample generator

Generates sample projects from a Github repository with some added user configuration. This package lets you create tailored samples for each of your users that have everything configured to just start using them. 

## Key Features

* Create a sample zip file with added configuration
* Sample project can be a sub folder of a Github repository
* Entirely customizable so that it fits yoour company's configuration format
* Makes your users happier ;)

## Installation

````bash
npm install configurated-sample-generator --save
````

## Usage

### Basic usage

First, we'll configure and create the Packer. It'll state how we'll configure the sample project we downloads from Github.

````js
var PackerConfigurer = require('configurated-sample-generator');

module.exports = new PackerConfigurer({
    // This is the Github organization
    organization: 'auth0'
  })
  .setInformationLoader(function(context) {
    // Here we'd go to the database and search for some configurations
    // based on some parameter we got from the request (accesable by context)
    return db.getSecret(context.clientId).then(function(secret) {
      context.secret = secret;
      return context;
    });
  })
  // This is for Server side samples. Creates a .env file
  .addTypeProcesor('server', Packager.envFileCreator(function(context) {
    return {
      // This we got from the request
      'CLIENT_ID': context.clientId,
      // This we loaded from DB in the information loader
      'CLIENT_SECRET': context.secret,
    };
  }))
  // This is for a .Net project for examle. It'll replace the `{CLIENT_ID}` from the 
  // app.config for the real value we got
  .addTypeProcesor('searchAndReplaceConfig', Packager.fileReplacer(function(context, contents) {
      return contents
        .replace('{CLIENT_ID}', context.clientId)
        .replace('{CLIENT_SECRET}', context.secret)
  }))
  .getPacker();
````

Now, we import the packer and serve the ZIP file from an URL

````js
// This is the file above
var Packer = require('./packer');

app.get('/download-server-sample', function(req, res) {

  var packer = new Packer({
    // Name of the Github repository
    repository: 'company-examples',
    // Github branch
    gitBranch: 'master',
    // Path to the example if it's not the entire repository
    examplePath: 'examples/server-sample',
    // This matches the types from the file above
    // We could have used searchAndReplaceConfig
    sampleType: 'server',
    // Add information to the `context` object
    contextInformation: {
      clientId: req.query.clientId
    }
  });

  // Downloads the Github repo
  // Adds needed configuration file
  // Returns a stream as a promise
  packer.create()
    .then(function(stream) {
      res.writeHead('200', {
        'Content-Type': 'application/zip',
        'Content-disposition': 'attachment; filename=' + req.params.repo + '-sample.zip'
      });
      res.end(stream,'binary');
    })
    .catch(function(error) {
      res.send(400, error);
    });
});
````

## API

### PackerConfigurer

This is the `index.js` object.

#### new PackerConfigurer(options)

**All constructor parameters are optionals**. They can be specified later on in the `Packer`.

* `organization`: Name of the Github organization.
* `repository`: Name of the Github repository.
* `gitBranch`: Name of the git branch to use
* `examplePath`: Path to the example if not the root folder
* `sampleType`: Sample type to use. Check [Type processors]() section
* `configurationFilePath`: Path of the file to be used to configure. This will be used if we're going to replace the content of a file instead of actually creating a new one.

#### setInformationLoader(loaderFunction)

The loaderFunction will load user configuration values from somewhere and add them to the context. The `loaderFunction` receives the context as a parameter and returns either a `context` or a promise of a `context` with all the new fields added.

````js
.setInformationLoader(function(context) {
  return db.getSecret(context.clientId).then(function(secret) {
    context.secret = secret;
    return context;
  });
})
````

#### addTypeProcesor(name, function)

This adds a new Type Processor. A type processor is a function that will create or modify an existing file from the example with user configuration values that were loaded with the [Information Loader](). The function sent as a parameter receives the `context` as a parameter and returns either the `context` itself or a promise of a `context`. It can leverage the `context.examplePath` and `context.configurationFilePath` to know where to create the configuration file or which file to modify. 

For example:

````js
function myConfigurator(context) {
    var fileContent = 'This is user content ' + context.someVariable;
    return fs.writeFileAsync(path.join(context.examplePath, 'file.config'), fileContent, {flags: 'w'}).then(function() {
      debug("File created");
      return context;
    });
  };
````

This library comes with 3 helper TypeProcessor creators which will work for most cases

##### fileWriter

Creates a new file in the example folder. Receives a `context` as a parameter and returns an object with the `name` and `content` fields for the file name and file contents respectively

````js
.addTypeProcesor('myType', Packager.fileWriter(function(context) {
  return {
    name: 'app.config',
    content: 'This is user content ' + context.someVariable
  }
}));
````

##### envFileCreator

Creates a new `.env`. Returns a key value object with the configurations to put in the `.env` file

````js
.addTypeProcesor('myType', Packager.envFileCreator(function(context) {
  return {
    myKey: context.keyValue
  }
}));
````

##### fileReplacer

Replaces the content of an existing configuration file. It receives the `context` and the content of the file specified in the `configurationFilePath` variable and returns the new content of the file.

````js
.addTypeProcesor('searchAndReplaceConfig', Packager.fileReplacer(function(context, contents) {
    return contents
      .replace('{CLIENT_ID}', context.clientId)
      .replace('{CLIENT_SECRET}', context.secret)
}))
````

##### getPacker

Returns the `Packer` prototype to be used to create the sample projects

### Packer

#### new Packer(options)

The packer constructor can receive the same options as the [PackerConfigurer constructor](). Besides that, it can receive an extra `contextInformation` property with any information that the `context` object should be bootstrapped with.

#### create

It returns a promise of an buffer of the Zip file with the sample. It can be used as follows for example:


````js
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
````

## License 

MIT

## Usages

This project is used throughout to generate samples for the [Auth0](https://auth0.com) documentation. For example, if you go to [AngularJS documentation](https://auth0.com/docs/client-platforms/angularjs) logged in, you'll see the sample is downloaded with your Auth0 keys already configured.

## Examples

Coming soon :D

