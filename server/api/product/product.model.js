'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema,
    ObjectId = Schema.ObjectId;

var ProductSchema = new _mongoose2.default.Schema({
  sku: String,
  link:String,
  name: String,
  nameLower: String,
  phone: String,
  email: String,
  slug: String,
  website: String,
  terms: String,
  category: { type: _mongoose.Schema.Types.ObjectId, ref: 'Category' },
  status: String,
  brand: {  type: _mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  description: String,
  variants: [{ image: String, sku: String, name: String, price: Number, size: String, model: String, maxSize: String, formart: String, preview: Object, stockLevel: Number, UnitsInStock: Number, UnitsOnOrder: Number, ReorderLevel: Number, slots: Array }],
  features: Array,
  keyFeatures: Array,
  demographics: Array,
  stats: [{ key: String, val: String }],
  perfomanceHistory:Array,
  recommendations:Array,
  pastAdvertisers:Array,  
  targetAudience:Array,
  steps:Array,
  guidelines:Array,
  confirmation:String,
  info: String, 
  whyadspaces:String, 
  productionCalendar:Array,  
  active: { type: Boolean, default: true },
  uid: String,
  created_at: { type: Date },
  updated_at: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
}, { versionKey: false });

exports.default = _mongoose2.default.model('Product', ProductSchema);
//# sourceMappingURL=product.model.js.map
