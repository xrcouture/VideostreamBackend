const mongoose = require('mongoose')

const oneTimeLinkSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide a valid email"],
  },
  accessToken: {
    type: String,
  },
  click: {
    type: Number,
    default:0
  }
})

module.exports = mongoose.model('oneTimeLink', oneTimeLinkSchema, 'oneTimeLink')