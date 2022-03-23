const User = require('./schemas/user')
const News = require('./schemas/news')
const Messages = require('./schemas/messages')
const { v4: uuidv4 } = require('uuid');

module.exports.getUserByName = async (userName) => {
  return User.findOne({ userName })
}

module.exports.getUserById = async (id) => {
  return User.findById({ _id: id })
}

module.exports.createUser = async (data) => {
  const { username, surName, firstName, middleName, password } = data
  const newUser = new User({
    id: uuidv4(),
    userName: username,
    surName,
    firstName,
    middleName,
    image: '',
    permission: {
      chat: { C: true, R: true, U: true, D: true },
      news: { C: true, R: true, U: true, D: true },
      settings: { C: true, R: true, U: true, D: true },
    },
  })
  newUser.setPassword(password)

  const user = await newUser.save()

  return user
}

module.exports.updateUserById = async (id, newUser) => {
  const oldUser = await User.findById({ _id: id });
  
  if (newUser.oldPassword !== "" && newUser.newPassword !== "") {
    if (!oldUser.validPassword(newUser.oldPassword)) {
      return null
    }
    oldUser.setPassword(newUser.newPassword)
  }
  await User.findOneAndUpdate({ _id: id }, { $set: { firstName: newUser.firstName, surName: newUser.surName, middleName: newUser.middleName, hash: oldUser.hash, image: newUser.image } })
  const user = await User.findOne({ _id: id })
  if (oldUser.image !== user.image) user.oldImage = oldUser.image
  return user
}

module.exports.getAllUsers = async () => {
  const users = await User.find()
  return users
}

module.exports.deleteUserById = async (id) => {
  const user = await User.findOneAndRemove({ _id: id })
  return user
}

module.exports.changeUserPermissions = async (id, permissions) => {
  await User.findOneAndUpdate({ _id: id }, { $set: { permission: permissions } })
  const user = await User.findOne({ _id: id })
  return user
}

module.exports.getAllNews = async () => {
  const news = await News.find()
  return news
}

module.exports.createNews = async (data) => {
  const { title, text } = data
  const newNews = new News({
    id: uuidv4(),
    title,
    text,
    created_at: "",
    user: {
      firstName: "",
      id: "",
      image: "",
      middleName: "",
      surName: "",
      username: ""
    }
  })

  const news = await newNews.save()

  return news
}

module.exports.deleteNewsById = async (id) => {
  await News.findOneAndRemove({ id: id })
  const news = await News.find()
  return news
}

module.exports.updateNewsById = async (id, data) => {
  await News.findOneAndUpdate({ id: id }, { $set: { title: data.title, text: data.text } })
  const news = await News.find()
  return news
}

module.exports.getAllMessages = async (data) => {
  const messages = await Messages.find().or([{ senderId: data.userId, recipientId: data.recipientId }, { senderId: data.recipientId, recipientId: data.userId }])
  console.log(messages);
  return messages
}

module.exports.createMessage = async (data) => {
  const newMessages = new Messages(data)
  const messages = await newMessages.save()
  return messages
}


