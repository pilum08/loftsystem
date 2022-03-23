const mongoose = require('mongoose')

const Schema = mongoose.Schema

const messagesSchema = new Schema(
  {
    senderId: {
      type: String,
      required: [true, 'id required'],
    },
    recipientId: {
      type: String,
      required: [true, 'id required'],
    },
    roomId: {
      type: String,
    },
    text: {
      type: String,
    },
  }
)

const Messages = mongoose.model('messages', messagesSchema)

module.exports = Messages