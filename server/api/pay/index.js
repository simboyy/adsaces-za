'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _express = require('express');

var _md5 = require('md5');

var _trim = require('trim-whitespace');

var _pay = require('./pay.controller');

var controller = _interopRequireWildcard(_pay);

var _auth = require('../../auth/auth.service');

var auth = _interopRequireWildcard(_auth);

var _paypalRestSdk = require('paypal-rest-sdk');

var _paypalRestSdk2 = _interopRequireDefault(_paypalRestSdk);

var _order = require('../order/order.model');

var _order2 = _interopRequireDefault(_order);

var _fastJsonPatch = require('fast-json-patch');

var _fastJsonPatch2 = _interopRequireDefault(_fastJsonPatch);

var _send = require('../sendmail/send');

var sendmail = _interopRequireWildcard(_send);

var _shared = require('../../config/environment/shared');

var config = _interopRequireWildcard(_shared);

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var request = require('request');
var shortId = require('shortid');
var sha512 = require('js-sha512');
var FormData = require('form-data');
var http = require('http');

var router = new _express.Router();

function toObject(arr) {
    var rv = {};
    for (var i = 0; i < arr.length; ++i)
      rv[i] = arr[i];
    return rv;
  }

function ParseMsg(msg) {

    var msg = msg + '';

    var parts = msg.split("&");
    var result = [];
    for (var key in parts) {
        var bits = parts[key].split("=", 2);
        result[bits[0]] = decodeURIComponent(bits[1]);
    }

    return result;
}

function UrlIfy(fields) {

    // console.log(fields);
    //url-ify the data for the POST
    var delim = "";
    var fields_string = "";
    for (var key in fields) {
        fields_string += delim + key + '=' + encodeURIComponent(_trim(fields[key].toString().replace(" ", "+")));
        //console.log(fields_string);
        delim = "&";
    }

    console.log(fields_string);

    return fields_string;
}

function CreateHash(values, MerchantKey) {
   // return hash.toUpperCase();
   return _md5(UrlIfy(values));
}

function CreateMsg(values, MerchantKey) {

    //CREATE GET STRING
    var fields = {};
    for (var key in values) {

        fields[key] = values[key];
    }

    fields["signature"] = CreateHash(fields, MerchantKey);

    var fields_string = fields;

    //console.log(fields["hash"]);
    return fields_string;
}

router.post('/stripe', function (req, res) {
    var data = req.body;
    var amount = Math.round(data.total * 100);
    var stripe = require("stripe")(process.env.STRIPE_APIKEY);

    stripe.charges.create({
        amount: amount,
        currency: "usd",
        source: data.stripeToken, // obtained with Stripe.js
        description: "Charge for mediabox.co.zw"
    }, function (err, charge) {
        var status;
        if (err) {
            status = 'Payment failed';
            return res.status(400).json({ id: err.requestId, message: err.message });
        } else {
            status = 'Paid';
            var address = { recipient_name: data.name, line1: data.address, city: data.city, postal_code: data.zip, state: data.state, country: data.country };
            var orderDetails = {
                orderNo: shortId.generate(),
                uid: data.uid,
                email: data.email,
                phone: data.phone,
                address: address,
                status: status,
                items: data.items,
                payment: { id: charge.id, state: charge.status, cart: null },
                amount: { total: amount / 100, currency: data.currency_code },
                exchange_rate: data.exchange_rate,
                created: charge.created,
                payment_method: 'Credit Card'

            };
            // Order.create is from order.model not from order.controller
            _order2.default.create(orderDetails, function (err, d) {
                var mailParams = orderDetails;
                mailParams.id = charge.id;
                mailParams.to = data.email;
                sendmail.send(config.mailOptions.orderPlaced(mailParams));
                return res.status(201).json({ id: charge.id, message: status });
            });
        }
    });
});

router.get('/prepare', function (req, res) {

    console.log(req.query);

    var items = [];
    var data = JSON.parse(req.query.data);
    var options = JSON.parse(req.query.options);
    var total = 0;
    var subtotal = 0;
    var discount = 0;
    var shipping = Math.round(options.shipping * 100) / 100;
    if (isNaN(options.exchange_rate) || options.exchange_rate === '') // If exchange rate is not a float value, force this to 1
        options.exchange_rate = 1;
    for (var k = 0; k < data.length; k++) {
        var i = data[k];
        var price = Math.round(i.price * 100) / 100;
        subtotal = subtotal + price * i.quantity;
        items.push({ sku: i.sku, name: i.name, url: i.image, description: i.slug, price: price, quantity: i.quantity, currency: options.currency_code });
    }

    if (options.discount > 0) {
        discount = -Math.round(options.discount * 100) / 100;
        items.push({ sku: '#', name: 'Coupon Discount', url: '-', description: '-', price: discount, quantity: 1, currency: options.currency_code });
    }
    subtotal = subtotal + discount;
    total = subtotal;

    //configure for sandbox environment
    if (req.query.cmd) {

        _paypalRestSdk2.default.configure({
            'mode': 'sandbox', //sandbox or live
            'client_id': 'ARYkOSdmccmnPqcbTmpPF6TA-AQS7zIEt7NCBNEY--Y1doAnulMTGLb4fdIB4x5xCyckqhhIc92568fu',
            'client_secret': 'EBnfwROb_fv8YcqN_Nwm9mjLVnEloHaKpVLJbc4RTdkKLB4KdAp1fdRdHO3paf1_Kovnj-BgnZLW5iJd'
        });

        var shortId = require('shortid');
        var orderNo = shortId.generate();
        //build PayPal payment request
        var payReq = {
            'intent': 'sale',
            'redirect_urls': {
                'return_url': process.env.DOMAIN + '/api/pay/process',
                'cancel_url': process.env.DOMAIN + '/api/pay/cancel'
            },
            'payer': {
                'payment_method': 'paypal',
                'payer_info': {
                    'email': options.email,
                    'payer_id': options.uid
                }
            },
            "transactions": [{
                "amount": {
                    "total": total, //Math.round(options.total*options.exchange_rate*100)/100,
                    "currency": options.currency_code,
                    "details": {
                        "subtotal": subtotal, //Math.round(options.subtotal*options.exchange_rate*100)/100,
                        "shipping": shipping
                    }
                },
                "invoice_number": orderNo,
                "custom": options.phone,
                "item_list": {
                    "items": items,
                    "shipping_address": {
                        "recipient_name": options.recipient_name,
                        "line1": options.line1,
                        "city": options.city,
                        "postal_code": options.postal_code,
                        "state": "-",
                        "country_code": options.country_code
                    }
                }
            }]
        };

        _paypalRestSdk2.default.payment.create(payReq, function (error, payment) {
            if (error) {
                console.log('########################## Error', error);
                // string = encodeURIComponent(error.response.details[0].issue);
                var msg = '',
                    id = '',
                    code = '';
                if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
                    msg = 'Not connected to internet';
                } else {
                    code = '404';
                    msg = (0, _stringify2.default)(error.response.details);
                }
                res.redirect('/checkout?id=' + id + '&msg=' + msg);
            } else {
                // console.log('paymentinfooooooooooooooooooooooooo',JSON.stringify(payment));
                var orderDetails = { uid: payment.payer.payer_info.payer_id, email: options.email,
                    phone: payment.transactions[0].custom,
                    orderNo: payment.transactions[0].invoice_number,
                    address: payment.transactions[0].item_list.shipping_address,
                    status: 'Payment Initiated',
                    items: payment.transactions[0].item_list.items,
                    payment: { id: payment.id, state: payment.state, cart: payment.cart, email: payment.payer.payer_info.email },
                    amount: payment.transactions[0].amount,
                    exchange_rate: options.exchange_rate,
                    created: payment.created_time,
                    payment_method: payment.payer.payment_method
                };
                // When order.status is null, the client will replace with the Array[0] of order status at Settings page
                // Order.create is from order.model not from order.controller
                _order2.default.create(orderDetails);

                //capture HATEOAS links
                var links = {};
                payment.links.forEach(function (linkObj) {
                    links[linkObj.rel] = {
                        'href': linkObj.href,
                        'method': linkObj.method
                    };
                });

                //if redirect url present, redirect user
                if (links.hasOwnProperty('approval_url')) {
                    res.redirect(links.approval_url.href);
                } else {
                    console.error('no redirect URI present');
                }
            }
        });
    } else {
        var shortId;
        var data;
        var amount;
        var orderNo;
        var payfastJSONObject;
        var formData;

        (function () {
            shortId = require('shortid');
            //console.log(req.query.data);

            data = JSON.parse(req.query.data);
            amount = Math.round(data.total * 100);
            orderNo = shortId.generate();

            /**Define constants ***/

            var PS_ERROR = "Error";
            var PS_OK = "Ok";
            var SITE_URL = "http://www.adspaces.co.za";
            
            var  PF_ERR_AMOUNT_MISMATCH='Amount mismatch';
            var  PF_ERR_BAD_SOURCE_IP='Bad source IP address';
            var  PF_ERR_CONNECT_FAILED='Failed to connect to PayFast' ;
            var  PF_ERR_BAD_ACCESS='Bad access of page';
            var  PF_ERR_INVALID_SIGNATURE='Security signature mismatch' ;
            var  PF_ERR_CURL_ERROR='An error occurred executing cURL' ;
            var  PF_ERR_INVALID_DATA='The data received is invalid' ;
            var  PF_ERR_UKNOWN='Unkown error occurred' ;
             
            // General Messages
            var  PF_MSG_OK='Payment was successful' ;
            var  PF_MSG_FAILED='Payment has failed' ;

            var headers = {
                'User-Agent':       'Super Agent/0.0.1',
                'Content-Type':     'application/x-www-form-urlencoded'
            }

            payfastJSONObject = {
                merchant_id: 10009878,
                merchant_key:'53n487tsfoacm',
                return_url: 'http://adspaces.com/api/pay/gettingbackfrompayfast',               
                cancel_url:'http://adspaces.com/api/pay/gettingbackfrompayfast',
                notify_url: 'http://adspaces.com/api/pay/payfastupdatingus',
                //Buyer Details
                name_first: 'Simbarashe',
                name_last: 'Mukorera',
                email_address: 'smkorera@gmail.com',
                //Transaction Details
                m_payment_id: orderNo,
                //Ammount in ZAR
                amount: total,
                item_name: 'Adspaces',
                item_description: 'campaign',
                custom_int1: '9866',
                custom_str1: 'Custom'               

            };


           // formData = CreateMsg(paynowJSONObject, 'b717de9d-d716-49ae-abae-df8279ceda9b');

           

            formData = CreateMsg(payfastJSONObject, 'b717de9d-d716-49ae-abae-df8279ceda9b');
            console.log(formData);
              request.post({ url: 'https://sandbox.payfast.co.za/eng/process', formData: formData }, function (err, httpResponse, body) {
                if (err) {
                    console.log('########################## Error', err);
                    var status = 'Payment failed';
                    //return res.status(400).json({id: error.requestId, message: error.message});
                    var string = encodeURIComponent('Payment Failed');
                    res.redirect('/checkout?msg=' + string);
                } else {

                    var msg =body ;
                    console.log('########################## We got Responds',httpResponse.caseless);
                    var theProcessUrl = httpResponse.caseless.dict.location;

                    if(theProcessUrl){

                     /***** IMPORTANT ****
                            On User has approved paying you, maybe they are awaiting delivery etc
                            
                                Here is where you
                                1. Save the PollURL that we will ALWAYS use to VERIFY any further incoming Paynow Notifications FOR THIS PARTICULAR ORDER
                                1. Update your local shopping cart of Payment Status etc and do appropriate actions here, Save any other relavant data to DB
                                2. Email, SMS Notifications to customer, merchant etc
                                3. Any other thing
                            
                            *** END OF IMPORTANT ****/

                           var status = 'Payment Initiated';
                           var address = { recipient_name: options.recipient_name, line1: options.line1, city: options.city, postal_code: options.postal_code, state: '-', country: options.country_code };
                           var orderDetails = {
                               orderNo: orderNo,
                               uid: options.uid,
                               email: options.email,
                               phone: options.phone,
                               address: address,
                               status: status,
                               items: data,
                               payment: { id: orderNo, state: "Created", cart: null, pollurl:theProcessUrl , email: options.email },
                               amount: { total: subtotal / 100, currency: options.currency_code },
                               exchange_rate: options.exchange_rate,
                               created: Date.now(),
                               payment_method: 'PayFast'

                           };
                           // Order.create is from order.model not from order.controller
                           _order2.default.create(orderDetails);
                           
                    res.redirect(theProcessUrl);

                        }else{

                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.write(body);
                            res.end();
                        }

                    //first check status, take appropriate action


                }
            }); //end request

        })();
    }
});

router.get('/process', function (req, res) {
    var paymentId = req.query.paymentId;
    var payerId = { 'payer_id': req.query.PayerID };
    var string = "";
    _paypalRestSdk2.default.payment.execute(paymentId, payerId, function (error, payment) {
        if (error) {
            // console.log('payment process error', error);
            _order2.default.findOneAndUpdate({ 'payment.id': paymentId }, { status: 'Payment Error' }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec();
            string = encodeURIComponent('Error occured while receiving payment');
            res.redirect('/checkout?id=' + paymentId + '&msg=' + string);
        } else {
            var mailParams = {
                id: payment.id,
                to: payment.payer.payer_info.email,
                orderNo: payment.transactions[0].invoice_number,
                status: payment.state,
                payment_method: payment.payer.payment_method,
                amount: payment.transactions[0].amount,
                address: payment.payer.payer_info.shipping_address
            };
            // console.log('payment success', payment);
            if (payment.state === 'approved') {
                // Save order details so that if no response received, status will Awaiting Payment
                _order2.default.findOneAndUpdate({ 'payment.id': payment.id }, { status: 'Paid' }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec().then(function (doc) {
                    sendmail.send(config.mailOptions.orderPlaced(mailParams));
                    string = encodeURIComponent("Order Placed");
                    res.redirect('/order?id=' + paymentId + '&msg=' + string);
                }).then(function (err) {
                    if (err) {
                        // console.log('Could not find the payment reference',err);
                        sendmail.send(config.mailOptions.orderPlaced(mailParams));
                        string = encodeURIComponent("Payment Received");
                        res.redirect('/order?id=' + paymentId + '&msg=' + string);
                    }
                });
            } else {
                _order2.default.findOneAndUpdate({ 'payment.id': payment.id }, { status: 'Payment Not Approved' }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec();
                string = encodeURIComponent('Payment Not Approved');
                res.redirect('/checkout?id=' + paymentId + '&msg=' + string);
            }
        }
    });
});

router.get('/gettingbackfrompayfast', function (req, res) {

    //Get locally saved  order settings
    //get latest order from db
    //
    //***Todo add userid in query***

    console.log(res.body);

    _order2.default.findOne({}, { $sort: { 'created_at': -1 } }).exec().then(function (doc) {

        console.log('#################getting back from payfast##############');
        console.log(doc);

        var paymentId = doc.payment.id;
        var pollurl = doc.payment.pollurl;

        //poll paynow for payment update

        request({
            url: pollurl,
            method: "POST",
            json: true, // <--Very important!!!
            body: ''
        }, function (error, response, body) {

            if (response) {

                //close connection  
                var msg = ParseMsg(response.body);

                var MerchantKey = 'b717de9d-d716-49ae-abae-df8279ceda9b';
                var validateHash = CreateHash(msg, MerchantKey);

                if (validateHash != msg["hash"]) {
                    console.log('Invalid hash detected');
                    //header("Location: $checkout_url");  
                } else {
                    /***** IMPORTANT **** 
                    On Paynow, payment status has changed, say from Awaiting Delivery to Delivered 
                     
                        Here is where you 
                        1. Update your local shopping cart of Payment Status etc and do appropriate actions here, Save data to DB 
                        2. Email, SMS Notifications to customer, merchant etc 
                        3. Any other thing 
                     
                    *** END OF IMPORTANT ****/

                    // console.log('payment success', payment);
                    if (msg["status"] === PS_PAID || msg['status'] === PS_AWAITING_DELIVERY || msg['status'] === PS_DELIVERED) {
                        // Save order details so that if no response received, status will Awaiting Payment
                        _order2.default.findOneAndUpdate({ 'orderNo': msg["reference"] }, { status: 'Paid' }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec().then(function (doc) {

                            var mailParams = doc;

                            mailParams.id = msg["paynowreference"];
                            mailParams.to = doc.email;

                            sendmail.send(config.mailOptions.orderUpdated(mailParams));

                            var string = encodeURIComponent("Payment Received");
                            res.redirect('/order?id=' + msg["paynowreference"] + '&msg=' + string);
                        }).then(function (err) {
                            if (err) {
                                // console.log('Could not find the payment reference',err);
                                var string = encodeURIComponent("Payment Received");
                                res.redirect('/order?id=' + msg["paynowreference"] + '&msg=' + string);
                            }
                        });
                    }if (msg['status'] === PS_CANCELLED) {

                        _order2.default.findOneAndUpdate({ 'orderNo': msg["reference"] }, { status: msg["status"] }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec();
                        var string = encodeURIComponent('Payment Cancelled');

                        res.redirect('/checkout?id=' + msg["paynowreference"] + '&msg=' + string);
                    } else {
                        _order2.default.findOneAndUpdate({ 'orderNo': msg["reference"] }, { status: msg["status"] }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec();
                        var string = encodeURIComponent('Payment Not Approved');

                        res.redirect('/checkout?id=' + msg["paynowreference"] + '&msg=' + string);
                    }
                }
            }
        }); //end poll request

    }).then(function (err) {
        if (err) {
            // console.log('Could not find the payment reference',err);
            sendmail.send(config.mailOptions.orderPlaced(mailParams));
            string = encodeURIComponent("Payment Received");
            res.redirect('/order?id=' + msg["paynowreference"] + '&msg=' + string);
        }
    });
});

router.get('/payfastupdatingus', function (req, res) {

    var paymentId = req.query.paynowreference;
    var pollurl = req.query.pollurl;

    request({
        url: pollurl,
        method: "POST",
        json: true, // <--Very important!!!
        body: ''
    }, function (error, response, body) {

        if (response) {

            //close connection  
            var msg = ParseMsg(response.body);

            var MerchantKey = 'b717de9d-d716-49ae-abae-df8279ceda9b';
            var validateHash = CreateHash(msg, MerchantKey);

            if (validateHash != msg["hash"]) {
                //header("Location: $checkout_url");  
            } else {
                /***** IMPORTANT **** 
                On Paynow, payment status has changed, say from Awaiting Delivery to Delivered 
                 
                    Here is where you 
                    1. Update your local shopping cart of Payment Status etc and do appropriate actions here, Save data to DB 
                    2. Email, SMS Notifications to customer, merchant etc 
                    3. Any other thing 
                 
                *** END OF IMPORTANT ****/

                // console.log('payment success', payment);
                if (msg["status"] === PS_PAID) {
                    // Save order details so that if no response received, status will Awaiting Payment
                    _order2.default.findOneAndUpdate({ 'orderNo': msg["reference"] }, { status: 'Paid' }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec().then(function (doc) {

                        var mailParams = doc;

                        mailParams.id = msg["paynowreference"];
                        mailParams.to = doc.email;

                        sendmail.send(config.mailOptions.orderPlaced(mailParams));
                    }).then(function (err) {
                        if (err) {
                            // console.log('Could not find the payment reference',err);
                            sendmail.send(config.mailOptions.orderPlaced(mailParams));
                            string = encodeURIComponent("Payment Received");
                            res.redirect('/order?id=' + msg["paynowreference"] + '&msg=' + string);
                        }
                    });
                } else {
                    _order2.default.findOneAndUpdate({ 'orderNo': msg["reference"] }, { status: msg["status"] }, { upsert: false, setDefaultsOnInsert: true, runValidators: true }).exec();
                    var string = encodeURIComponent('Payment Not Approved');

                    //res.redirect('/checkout?id='+msg["paynowreference"]+'&msg=' + string);
                }
            }
        }
    });
});

router.get('/cancel', function (req, res) {
    var string = encodeURIComponent('Payment Cancelled');
    res.redirect('/checkout?msg=' + string);
});

module.exports = router;
//# sourceMappingURL=index.js.map
