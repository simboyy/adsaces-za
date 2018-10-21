'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var CampaignSchema = new _mongoose2.default.Schema({
  uid: String,
  email: String,
  phone: String,
  cartName: String,
  checkoutParameters: Object,
  skuArray: Array,
  totalWeight: String,
  taxRate: String,
  tax: String,
  objective: String,
  startDate: { type: Date },
  endDate: { type: Date },
  products: String,
  totalSpend: String,
  spendStats: String,
  age: Array,
  income: Array,
  campaignNo: String,
  campaignName: String,
  campaignDate: { type: Date, default: Date.now },
  items: [{ sku: String, name: String, size: String, dateRange: String, quantity: String, mrp: String, price: String, image: String, category: String, startDate: { type: Date }, endDate: { type: Date }, advertiser: Object, publisher: String, publisheruid: String, uid: String, status: Object({ name: String, val: Number }), creative: Object,AltText:String,DestinationUrl:String, request: [{ startDate: { type: Date }, endDate: { type: Date }, dueDate: { type: Date }, budget: String, objective: String, contactName: String, contactEmail: String }], messages: [{ id: String, text: String, avatar: String, date: { type: Date } }] }],
  status: { type: String, default: 'Campaign Placed' },
  active: { type: Boolean, default: true },
  payment_method: String,
  created_at: { type: Date },
  updated_at: { type: Date }
});

CampaignSchema.pre('save', function (next) {

  var now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

exports.default = _mongoose2.default.model('Campaign', CampaignSchema);
//# sourceMappingURL=campaign.model.js.map
