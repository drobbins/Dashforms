;(function(){

  var couchapp = require('couchapp');
  var path = require('path');
  var fs = require('fs');

  var ignore
      ,loadFileOptions
      ,validateDocUpdate
      ,ddoc
      ,loadAllAttachments

  loadAllAttachments = function loadAllAttachments (ddoc, dir) {
    var listings = fs.readdirSync(dir)
    listings.forEach(function(listing){
        var file = path.join(dir, listing)
            ,stat = fs.statSync(file)
            ,prefix = ""
        if(stat.isFile()){return }
        if(path.basename(file) === "_attachments"){
            prefix = path.dirname(file).slice(__dirname.length+1)
            couchapp.loadAttachments(ddoc, file, prefix)
        } else {
            loadAllAttachments(ddoc, file)
        }
    });
  }

  ignore = JSON.parse(fs.readFileSync(path.join(__dirname, ".couchappignore")).toString())
  loadFileOptions = {ignore: ignore}

  // To load a subdirectory: views : couchapp.loadFiles('./views', loadFileOptions)
  ddoc = { _id : '_design/DashForms'
    ,views : null
    ,evently : null
    ,lists : null
    ,shows : null
    ,vendor : null
    ,dashapp : couchapp.loadFiles('./dashapp', loadFileOptions)
  }

  loadAllAttachments(ddoc, __dirname);
  module.exports = ddoc
}());
