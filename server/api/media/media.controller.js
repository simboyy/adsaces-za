/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/media              ->  index
 * POST    /api/media              ->  create
 * GET     /api/media/:id          ->  show
 * PUT     /api/media/:id          ->  update
 * DELETE  /api/media/:id          ->  destroy
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.index = index;
exports.myMedia = myMedia;
exports.pubMedia = pubMedia;
exports.show = show;
exports.create = create;
exports.update = update;
exports.mediaUpdate = mediaUpdate;
exports.destroy = destroy;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _media = require('./media.model');

var _media2 = _interopRequireDefault(_media);

var fs = require('fs');

var BUCKET_NAME = 'mediabox-adverts';



   var aws = require('aws-sdk');
   aws.config.update({accessKeyId: 'AKIAID45Z2MGJGNU4U7Q', secretAccessKey: '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'});
   aws.config.update({region: 'us-east-1'});

   var s3 = new aws.S3();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function respondWithResult(res, statusCode) {
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

function saveUpdates(updates) {
  return function (entity) {
    var updated = _lodash2.default.merge(entity, updates);
    return updated.save().then(function (updated) {
      return updated;
    });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.remove().then(function () {
        var fs = require('fs');
        fs.unlink('client/' + entity.path, function (err) {
          if (err) {}
        });
        res.status(204).end();
      });
    }
  };
}

function handleEntityNotFound(res) {
  return function (entity) {
    if (!entity) {
      res.status(404).end();
      return null;
    }
    return entity;
  };
}

function handleError(res, statusCode) {
  statusCode = statusCode || 500;
  return function (err) {
    res.status(statusCode).send(err);
  };
}

// Gets a list of Medias
function index(req, res) {
  return _media2.default.find({ 'uid': req.user.email },null, {sort: {created_at: -1}}).exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a list of Medias
function myMedia(req, res) {
  return _media2.default.find({ 'uid': req.user.email },null, {sort: {created_at: -1}}).exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a list of Medias
function pubMedia(req, res) {
  return _media2.default.find({ 'pub': req.user.email },null, {sort: {created_at: -1}}).exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a single Media from the DB
function show(req, res) {
  return _media2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Creates a new Media in the DB
function create(req, res) {
   req.files.file.uid = req.user.email;
   req.files.file.path = req.files.file.path.replace("client\\", "").replace('client/', '').replace('client//', ''); 
  
   var str = req.files.file.path;
   
   var arr = str.split("\\");
   var tempPath = arr[4];
   console.log(tempPath);
   var fullPath = "https://s3.amazonaws.com/mediabox-adverts//resources/"+tempPath;  
    req.files.file.path = fullPath;
   
    var CODE_PATH = '/resources/';
    var fileList = getFileList(__dirname  + CODE_PATH);

    fileList.forEach(function(entry) {
      uploadFile(CODE_PATH + entry, __dirname  + CODE_PATH + entry);
      
      fs.unlink(__dirname  + CODE_PATH + entry, function(error) {
          if (error) {
              throw error;
          }
          console.log('Deleted dog.jpg!!');
      });
      
    }); 
  
  
  return _media2.default.create(req.files.file).then(respondWithResult(res, 201)).catch(handleError(res));
}


function getFileList(path) {
  var i, fileInfo, filesFound;
  var fileList = [];

  filesFound = fs.readdirSync(path);
  for (i = 0; i < filesFound.length; i++) {
    fileInfo = fs.lstatSync(path + filesFound[i]);
    if (fileInfo.isFile()) fileList.push(filesFound[i]);
  }

  return fileList;
}


function uploadFile(remoteFilename, fileName ) {
  var fileBuffer = fs.readFileSync(fileName);
  var metaData = getContentTypeByFile(fileName);

  s3.putObject({
    ACL: 'public-read',
    Bucket: BUCKET_NAME,
    Key: remoteFilename,
    Body: fileBuffer,
    ContentType: metaData
  }, function(error, response) {
    console.log('uploaded file[' + fileName + '] to [' + remoteFilename + '] as [' + metaData + ']');
    console.log(arguments);
  });
}

function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fileNameLowerCase = fileName.toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}
// Updates an existing Media in the DB
function update(req, res) {

  console.log(req.body);
  if (req.body._id) {
    delete req.body._id;
  }
  return _media2.default.update({ 'path': req.params.id }, { $push: { pub: req.body.pub } }).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Updates an existing Media in the DB with publishers
function mediaUpdate(req, res) {
  console.log(req.body);

  if (req.body._id) {
    delete req.body._id;
  }
  return _media2.default.findOne({ 'path': req.params.id }).exec().then(handleEntityNotFound(res)).then(saveUpdates(req.body)).then(respondWithResult(res)).catch(handleError(res));
}

// Deletes a Media from the DB
function destroy(req, res) {
  return _media2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(removeEntity(res)).catch(handleError(res));
}
//# sourceMappingURL=media.controller.js.map
