const mongoose = require('mongoose')

const Schema = mongoose.Schema

const newsSchema = new Schema(
  {
    id: {
      type: String,
      required: [true, 'id required'],
      unique: true
    },
    created_at: {
      type: Date,
    },
    text: {
      type: String,
    },
    title: {
      type: String,
    },
    user: {
      firstName: String,
      id: String,
      image: String,
      middleName: String,
      surName: String,
      username: String
    }
  }
)

const News = mongoose.model('news', newsSchema)

module.exports = News