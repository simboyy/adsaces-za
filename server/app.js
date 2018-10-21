/**
 * Main application file
 */

'use strict';

var _setImmediate2 = require('babel-runtime/core-js/set-immediate');

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _mongoose = require('mongoose').set('debug', true);

var _mongoose2 = _interopRequireDefault(_mongoose);

var _environment = require('./config/environment');

var _environment2 = _interopRequireDefault(_environment);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_mongoose2.default.Promise = require('bluebird');


// Connect to MongoDBmongodb://simba:1994kingsss@ds135797.mlab.com:35797/mediaboxzim
//_mongoose2.default.connect('mongodb://simboyy:1994King1204@ds143907.mlab.com:43907/mediaboxzwdemo',{ useMongoClient: true });
// _mongoose2.default.connect('mongodb://simba:1994kingsss@ds135797.mlab.com:35797/mediaboxzim');
_mongoose2.default.connect("mongodb://127.0.0.1/mediaboxzwdemo",{ useMongoClient: true });
_mongoose2.default.connection.on('error', function (err) {
  console.error('MongoDB connection error: ' + err);
  process.exit(-1);
});

// Populate databases with sample data
if (_environment2.default.seedDB) {
  require('./config/seed');
}

// Setup server
var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.PORT || "80";
var app = (0, _express2.default)();
var server = _http2.default.createServer(app);
var socketio = require('socket.io')(server, {
  serveClient: _environment2.default.env !== 'production',
  path: '/socket.io-client'
});
require('./config/socketio').default(socketio);
require('./config/express').default(app);
require('./routes').default(app);

// Start server
function startServer() {
  app.angularFullstack = server.listen(port, function () {
    server.keepAliveTimeout = 0;
    console.log('Express server listening on %d, in %s mode', process.env.PORT, app.get('env'));
  });
}

(0, _setImmediate3.default)(startServer);

// Expose app
exports = module.exports = app;
//# sourceMappingURL=app.js.map
