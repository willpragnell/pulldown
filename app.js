//some dependencies
var url = require('url');
var fs = require('fs');
var request = require('request');
var unzip = require('unzip');
var shell = require('shelljs');
var isTest = false;

//terminal output colours!
//via http://roguejs.com/2011-11-30/console-colors-in-node-js/
var red, green, reset;
red   = '\033[31m';
green = '\033[32m';
reset = '\033[0m';


var pulldown = {
  VERSION: "0.1.2",
  packages: {},
  userHome: function() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
  },
  getLocalFileJson: function() {
    var file = JSON.parse(fs.readFileSync(".pulldownrc").toString());
    try {
    } catch(e) {
      return false;
    }
    return file;
  },
  settingsFileExists: function() {
    try {
      fs.lstatSync(this.userHome() + '/.pulldown.json');
    } catch(e) {
      return false;
    }
    return true;
  },
  getSettingsFile: function(cb) {
    if(this.settingsFileExists()) {
      if(!isTest) console.log("-> " + green + "Settings file found", reset);
      (cb && typeof cb == "function" && cb());
      return;
    }
    var url = "https://raw.github.com/jackfranklin/dotfiles/master/.pulldown.json";
    if(!isTest) console.log("-> " + red + "No settings file detected.", reset, "Downloading default from " + url);
    this.getFile(url, this.userHome() + "/.pulldown.json", function() {
      (cb && typeof cb == "function" && cb());
    });
  },
  readPackagesFromSettings: function() {
    if(Object.keys(this.packages).length > 0) return this.packages;
    try {
      this.packages = JSON.parse(fs.readFileSync(this.userHome() + '/.pulldown.json').toString());
    } catch (e) {
      throw new Error("Invalid JSON", e);
    }
    return this.packages;
  },
  updateSettings: function() { this.packages = {}; },
  processUserArgs: function(userArgs) {
    if(userArgs.length) {
      for(var i = 0; i < userArgs.length; i++) {
        var argResponse = this.parsePackageArgument(userArgs[i])
        if(argResponse.packages) {
          for(var j = 0; j < argResponse.packages.length; j++) {
            this.getFile(argResponse.packages[j].url, argResponse.packages[j].output);
          }
        } else {
          this.getFile(argResponse.url, argResponse.output);
        }
      }
    } else {
      // check for a local file and download from that
      var local = this.getLocalFileJson();
      if(local) {
        if(!isTest) console.log("-> " + green + "Found local .pulldownrc to download dependencies from", reset);
        for(var i = 0; i < local.dependencies.length; i++) {
          var nextDep = local.dependencies[i];
          if(nextDep.source.indexOf("http") > -1) {
            if(!isTest) console.log("-> " + "Downloading URL dependency: " + nextDep.source, reset);
            output = ( nextDep.output === undefined ? url.parse(nextDep.source).pathname.split('/').pop() : nextDep.output);
            console.log(output);
            this.getFile(nextDep.source, (local.destination ? local.destination + "/" : "") + output);
          } else {
            if(!isTest) console.log("-> " + "Downloading dependency: " + nextDep.source + " from ~/.pulldown.json", reset);
            var argResponse = this.parsePackageArgument(local.dependencies[i].source);
            this.getFile(argResponse.url, (local.destination ? local.destination + "/" : "") + nextDep.output || argResponse.output);
          }
        }
      }
    }
  },
  parsePackageArgument: function(arg) {
    var args = arg.split(":");

    if(args[0] === "set") {
      if(!isTest) console.log("-> " + green + "Downloading set", args[1], reset);
      // a set of packages
      var packages = this.packages.sets[args[1]];
      var response = [];
      for(var i = 0; i < packages.length; i++) {
        response.push(this.parsePackageArgument(packages[i]));
      }
      return { packages: response };
    } else {
      // just a regular package
      var fileUrl = this.packages[args[0]];
      if(!fileUrl) {
        throw new Error(red + " ERROR " + args[0] + " does not exist" + reset);
      }

      return {
        url: fileUrl,
        output: args[1] || url.parse(fileUrl).pathname.split('/').pop()
      };
    }
  },
  getFile: function(fileUrl, output, cb) {
    var self = this;
    var splitUrl = fileUrl.split(".");
    var isZip = !!(splitUrl[splitUrl.length-1] === "zip");
    var slashOutput = output.split("/");
    slashOutput.pop();
    // make sure the folder exists
    if(slashOutput.length > 0) {
      shell.mkdir('-p', slashOutput.join("/"));
    }

    var requestOpts;
    if(isZip) {
      requestOpts = {
        uri: fileUrl,
        encoding: null
      };
    } else {
      requestOpts = fileUrl;
    }
    request(requestOpts).pipe(fs.createWriteStream(output).on("close", function() {
      if(!isTest) console.log("-> " + green + "SUCCESS: " + fileUrl + " has been written to " + output, reset);
      if(isZip && !isTest) {
        self.extractZip(output, cb);
      } else {
        (cb && typeof cb == "function" && cb());
      }
    }));
  },
  extractZip: function(fileName, cb) {
    var output = fileName.split(".")[0];
    fs.createReadStream(fileName).pipe(unzip.Extract({ path: './' })).on("close", function() {
      shell.rm(fileName);
      if(!isTest) console.log("-> " + green + "SUCCESS: " + fileName + " has been unzipped to /" + output, reset);
      (cb && typeof cb == "function" && cb());
    });
  },
  pull: function(userArgs) {
    pulldown.getSettingsFile(function() {
      pulldown.readPackagesFromSettings();
      pulldown.processUserArgs(userArgs);
    });
  }
};

module.exports = pulldown;
