#! /usr/bin/env node

var userArgs = process.argv.slice(2);
var pulldown = require("../app.js");

if(userArgs[0] == "--help" || userArgs[0] == "-h") {
  console.log("-> VERSION", pulldown.VERSION);
  console.log("-> pulldown help");
  console.log("-> To upgrade to latest version: npm update pulldown -g");
  console.log("");
  console.log("-> USAGE: 'pulldown package_name [file_name]'");
  console.log("");
  console.log("-> BASIC USAGE");
  console.log("---> when you first run pulldown, a package.json file will be downloaded to ~/.pulldown.json.");
  console.log("---> This file contains a list of packages, which you can edit as you please");
  console.log("---> once you have this package.json, to install a library, type 'pulldown' followed by the library name.");
  console.log("---> for example: 'pulldown jquery' will install the latest jQuery");
  console.log("---> download multiple libraries at once: 'pulldown jquery backbone underscore'");
  console.log("");
  console.log("-> FURTHER OPTIONS");
  console.log("---> if you want to store the library to different filename than the one that it's called on the server");
  console.log("---> you can pass in an optional filename with the library name, colon separated");
  console.log("---> for example, 'pulldown jquery:foo.js' will download jQuery into foo.js");
  console.log("---> 'pulldown jquery:foo.js backbone underscore:u.js' downloads jQuery to foo.js, Backbone to default and Underscore to u.js");
  console.log("");
  console.log("-> any feedback, help or issues, please report them on Github: https://github.com/jackfranklin/pulldown/");
  console.log("");
  process.exit(1);
}

pulldown.getSettingsFile(function() {
  pulldown.readPackagesFromSettings();
  pulldown.processUserArgs(userArgs);
});
