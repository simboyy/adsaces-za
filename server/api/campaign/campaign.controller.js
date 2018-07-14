
/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /api/Campaigns              ->  index
 * POST    /api/Campaigns              ->  create
 * GET     /api/Campaigns/:id          ->  show
 * PUT     /api/Campaigns/:id          ->  update
 * DELETE  /api/Campaigns/:id          ->  destroy
 */

'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.myCampaigns = myCampaigns;
exports.pubCampaignsCalendar = pubCampaignsCalendar;
exports.pubCampaigns = pubCampaigns;
exports.index = index;
exports.show = show;
exports.create = create;
exports.update = update;
exports.destroy = destroy;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _campaign = require('./campaign.model');

var _campaign2 = _interopRequireDefault(_campaign);

var _shared = require('../../config/environment/shared');

var config = _interopRequireWildcard(_shared);

var _send = require('../sendmail/send');

var email = _interopRequireWildcard(_send);

var _product = require('../product/product.model');

var _product2 = _interopRequireDefault(_product);

var _order = require('../order/order.model');

var _order2 = _interopRequireDefault(_order);

var _inventory = require('../inventory/inventory.model');

var _inventory2 = _interopRequireDefault(_inventory);

var currentDate = require("current-date");

var randomInt = require('random-int');

const Invoice = require("../lib");

const path = require('path');
var fs      = require('fs');
const ABSPATH = path.dirname(process.mainModule.filename); // Absolute path to our app directory
var filePath = path.join(ABSPATH, '/api/campaign/my-invoice.pdf');
var filePath2 = path.join(ABSPATH, '/api/campaign/my-quote.pdf');


function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var telerivet = require('telerivet');

function sendSMS(contact) {

  var API_KEY = 'm8DRXIAiyHEajBMZ0Kf6mAb6ZfUwtK5d'; // from https://telerivet.com/api/keys
  var PROJECT_ID = 'PJ866bd4a877ff3d0e';

  var tr = new telerivet.API(API_KEY);

  var project = tr.initProjectById(PROJECT_ID);

  // send message

  project.sendMessage({
    to_number: '+263773439246',
    content: 'Hello from Adspaces!'
  }, function (err, message) {
    if (err) throw err;
    ////////////////////////////////console.log(message);
  });
}

function InventoryUpdate(res) {
  //console.log(res.req.body.items);
  var items = res.req.body.items;
  _lodash2.default.each(items, function (item) {

    var startDateTemp = new Date(item.startDate);
    var startDate = startDateTemp.toISOString();
    var endDateTemp = new Date(item.endDate);
    var endDate = endDateTemp.toISOString();

    var cdate = new Date();
    var yyyy = cdate.getFullYear();
    var q = { $and: [{ 'pname': item.publisher }, { 'vname': item.name }, { 'year': yyyy }, { 'startDate': { $lt: startDate } }, { 'endDate': { $gte: endDate } }] };

   // console.log(q);
    _inventory2.default.findOneAndUpdate(q, { $inc: { "available": -1 } }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec();
  });
}

function CampaignPlaced(req,res, statusCode,filePath,filePath2) {
         
   // console.log(req.body.items);
  
       res.req.body.to = res.req.body.email; 
  
  var items = res.req.body.items;
       items.forEach((item, index) => {
      email.send(config.mailOptions.CampaignPlacedPublisher(item)); 
      console.log("inside foreach");
      console.log(item.name);
    });
  
    
   email.send(config.mailOptions.CampaignPlaced(res.req.body));    

  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };      

}


function genereteQuote(req,res){
  
   let myInvoice = new Invoice({
            config: {
                template: __dirname + "/template/index2.html"
              , tableRowBlock: __dirname + "/template/blocks/row2.html"
            }
          , data: {
                currencyBalance: {
                    main: 1
                  , secondary: 3.67
                }
              , invoice: {
                    number: {
                        series: "2018"
                      , separator: "-"
                      , id: randomInt(10, 100)
                    }
                  , date: currentDate('date')
                  , dueDate: currentDate('date')
                  , explanation: "Thank you for your business!"
                  , currency: {
                        main: "R"
                      , secondary: "R"
                    }
                }
              , tasks:req.req.body.items
            }
          , seller: {
                company: "Adspaces Pvt LTD"
              , registrationNumber: "F05/XX/YYYY"
              , taxId: "0200092224"
              , address: {
                    street: "40 Basden Road"
                  , number: "8"
                  , zip: ""
                  , city: "Littleton"
                  , region: "Centurion"
                  , country: "South Africa"
                }
              , phone: "+2779 246 5216"
              , email: "info@adspaces.co.za"
              , website: "www.adspaces.co.za"
              , bank: {
                    name: "Absa Bank Limited"
                  , swift: "ABSAZAJJ"
                  , currency: "R"
                  , iban: "6101"
                }
            }
          , buyer: {
                company:  req.user.company

              , taxId: "00000000"
              , address: {
                    street: "The Street Name"
                  , number: "00"
                  , zip: "000000"
                  , city: "Some City"
                  , region: "Some Region"
                  , country: "Nowhere"
                }
              , phone: req.user.phone
              , email:  req.user.email
              , website: req.user.website
              , bank: {
                    name: "Some Bank Name"
                  , swift: "XXXXXX"
                  , currency: "XXX"
                  , iban: "..."
                }
            }
        });

   //console.log(myInvoice);

        // Render invoice as HTML and PDF
        myInvoice.toHtml(__dirname + "/my-quote.html", (err, data) => {
            //console.log("Saved HTML file");
        }).toPdf(__dirname + "/my-quote.pdf", (err, data) => {
           // console.log("Saved pdf file");


            var api_key = 'key-a2cb48ef184b3e02e563b2d3a521aa48';
            var domain = 'mg.mediabox.co.zw';
            var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});


           
            var filename = 'my-invoice.html';           
             
            var data = {
              from: 'Adspaces Advertising<billing@adspaces.co.za>',
              to: 'smkorera@gmail.com',
              subject: 'Advertising Quote',
              text: 'Thank you for booking your advert using Adspaces!',
              html:"<html><p>Dear "+updated.items[0].advertiser.name+" </p><p>This is a  notice that your quotation which was generated on&nbsp;<span class='aBn' tabindex='0' data-term='goog_1714329927'><span class='aQJ'>"+currentDate('date')+"</span></span>&nbsp;is now available.</p><p>You can login to your client area to view more details at&nbsp;<a href='http://www.adspaces.co.zw/campaign' target='_blank' >http://www.adspaces.co.zw/campaign</a></p><p>Mediabox Advertising  (PVT) LTD</p></html>",
              attachment:filePath2
            };
             
            mailgun.messages().send(data, function (error, body) {
              //console.log(body);
            });


        });

        // Serve the pdf via streams (no files)
        //require("http").createServer((req, res) => {
           // myInvoice.toPdf({ output: res });
        //}).listen(8000);
        }

function CampaignUpdated(res, statusCode) {
  email.send(config.mailOptions.CampaignUpdated(res.req.body));

  //genereteInvoice(res,res);

 
  statusCode = statusCode || 200;
  return function (entity) {
    if (entity) {
      res.status(statusCode).json(entity);
    }
  };
}

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
    var itemsArray = [];    
    var total = 0;
    
    itemsArray = updated.items;

    for (var i = 0; i < itemsArray.length; i++) {
      total = parseInt(itemsArray[i].price )* parseInt(itemsArray[i].quantity);
    }

    
    
     total = total.toFixed(2);
      if(updates.status!="Campaign Rejected"){
      ///console.log(updated.items);  

      var invoiceno = randomInt(10, 100);
      
      let myInvoice = new Invoice({
            config: {
                template: __dirname + "/template/index.html"
              , tableRowBlock: __dirname + "/template/blocks/row.html"
            }
          , data: {
                currencyBalance: {
                    main: 1
                  , secondary: 3.67
                }
              , invoice: {
                    number: {
                        series: "2018"
                      , separator: "-"
                      , id: invoiceno
                    }
                  , date: currentDate('date')
                  , dueDate: currentDate('date')
                  , explanation: "Thank you for your business!"
                  , currency: {
                        main: "$"
                      , secondary: "$"
                    }
                }
              , tasks:updated.items
            }
          , seller: {
                company: "Adspaces Pvt Ltd."
              , registrationNumber: "F05/XX/YYYY"
              , taxId: "0200092224"
               , address: {
                    street: "40 Basden Road"
                  , number: "8"
                  , zip: ""
                  , city: "Littleton"
                  , region: "Centurion"
                  , country: "South Africa"
                }
              , phone: "+2779 246 5216"
              , email: "info@adspaces.co.za"
              , website: "www.adspaces.co.za"
              , bank: {
                    name: "Absa Bank Limited"
                  , swift: "ABSAZAJJ"
                  , currency: "R"
                  , iban: "6101"
                }
            }
          , buyer: {
                company:  updated.items[0].advertiser.company

              , taxId: "00000000"
              , address: {
                    street: "The Street Name"
                  , number: "00"
                  , zip: "000000"
                  , city: "Some City"
                  , region: "Some Region"
                  , country: "Nowhere"
                }
              , phone: updated.items[0].advertiser.phone
              , email:  updated.items[0].advertiser.email
              , website: updated.items[0].advertiser.website
              , bank: {
                    name: "Some Bank Name"
                  , swift: "XXXXXX"
                  , currency: "XXX"
                  , iban: "..."
                }
            }
        });

   //console.log(myInvoice);

        // Render invoice as HTML and PDF
        myInvoice.toHtml(__dirname + "/my-invoice.html", (err, data) => {
            //console.log("Saved HTML file");
        }).toPdf(__dirname + "/my-invoice.pdf", (err, data) => {
            //console.log("Saved pdf file");


            var api_key = 'key-a2cb48ef184b3e02e563b2d3a521aa48';
            var domain = 'mg.mediabox.co.zw';
            var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});


            var dataimage = fs.readFileSync(filePath);

            var filename = 'my-invoice.html';
            var attch = new mailgun.Attachment({ dataimage, filename, contentType: 'application/pdf' });

            var file = fs.readFileSync(filePath);
             
            var data = {
              from: 'Adspaces<billing@adspaces.co.zw>',
              to: 'smkorera@gmail.com',
              subject: 'Invoice Notice',
              text: 'Thank you for booking your advert using Adspaces!',
              html:"<html><p>Dear "+updated.items[0].advertiser.name+" </p><p>This is a billing notice that your invoice no. "+invoiceno+" which was generated on&nbsp;<span class='aBn' tabindex='0' data-term='goog_1714329927'><span class='aQJ'>"+currentDate('date')+"</span></span>&nbsp;is now available.</p><p>Your payment method is: Ecocash / Telecash / MasterCard / Visa / VPayments</p><p>Invoice: "+invoiceno+"<br />Balance Due: $"+total+" USD<br />Due Date:&nbsp;<span class='aBn' tabindex='0' data-term='goog_1714329928'><span class='aQJ'>"+currentDate('date')+"</span></span></p><p>You can login to your client area to view and pay the invoice at&nbsp;<a href='http://www.adspaces.co.zw/campaign' target='_blank' >http://www.adspaces.co.zw/campaign</a></p><p>Mediabox Advertising  (PVT) LTD</p></html>",
              attachment:filePath
            };
             
            mailgun.messages().send(data, function (error, body) {
              //console.log(body);
            });
        });      

     }

    return updated.save().then(function (updated) {
      return updated;
    });
  };
}

function removeEntity(res) {
  return function (entity) {
    if (entity) {
      return entity.remove().then(function () {
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

// Get all Campaigns by a user
function myCampaigns(req, res) {
  function isJson(str) {
    try {
      str = JSON.parse(str);
    } catch (e) {
      str = str;
    }
    return str;
  }
  var q = isJson(req.query.where);
  //console.log(q);

  _campaign2.default.find(q, function (err, campaigns) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(campaigns);
  });
}

// Get all campaigns for a publisher
// List all advertising spaces

function pubCampaignsCalendar(req, res) {
  return 0;
  // _order2.default.aggregate([{ $unwind: "$items" }, { $project: {  title: "name", start: "$items.startDate", end: "$items.endDate", allDay: false } }], function (err, result) {
  //   if (err) {
  //     console.log(err);
  //     return;
  //   }

  //   return res.status(200).json(result);
  // });
}

// Get all Campaigns by a publisher
function pubCampaigns(req, res) {
  function isJson(str) {
    try {
      str = JSON.parse(str);
    } catch (e) {
      str = str;
    }
    return str;
  }
  var q = isJson(req.query.where);
  //console.log(q);

  _campaign2.default.find(q, function (err, campaigns) {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(campaigns);
  });
}

// Gets a list of Campaigns
function index(req, res) {
  return _campaign2.default.find().exec().then(respondWithResult(res)).catch(handleError(res));
}

// Gets a single Campaign from the DB
function show(req, res) {
  return _campaign2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(respondWithResult(res)).catch(handleError(res));
}

// Creates a new Campaign in the DB
function create(req, res) {
  req.body.uid = req.user.email; // id change on every user creation hence email is used
  var shortId = require('shortid');
  req.body.campaignNo = shortId.generate();

  // When Campaign.status is null, the client will replace with the Array[0] of Campaign status at Settings page
  return _campaign2.default.create(req.body).then(sendSMS(res)).then(InventoryUpdate(res)).then(CampaignPlaced(req,res, 201,filePath,filePath2)).catch(handleError(res));
}

// Updates an existing Campaign in the DB
function update(req, res) {

  if (req.body._id) {
    delete req.body._id;
  }
  if (req.body.__v) {
    delete req.body.__v;
  }
  //console.log(req.body);

  if (!req.body.status) {

    _campaign2.default.update({ _id: req.params.id, "items.name": req.body.items.name }, { $set: { "items.$.price": req.body.items.price, "items.$.category": req.body.items.category, "items.$.quantity": req.body.items.quantity } }).exec().then(handleEntityNotFound(res)).then(CampaignUpdated(res)).catch(handleError(res));
  } else if (req.body.status) {
    return _campaign2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(saveUpdates(req.body)).then(CampaignUpdated(res)).catch(handleError(res));
  }
}

// Deletes a Campaign from the DB
function destroy(req, res) {
  return _campaign2.default.findById(req.params.id).exec().then(handleEntityNotFound(res)).then(removeEntity(res)).catch(handleError(res));
}
//# sourceMappingURL=campaign.controller.js.map
