const express = require('express')
const router = express.Router()
const db = require('../models')
const helper = require('../helper/serialize')
const passport = require('passport')
const tokens = require('../auth/tokens')
const formidable = require('formidable')
const fs = require('fs')
const path = require('path')

const auth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (!user || err) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized',
      })
    }

    req.user = user

    next()
  })(req, res, next)
}

router.post('/registration', async (req, res) => {
  const { username } = req.body

  const user = await db.getUserByName(username)

  if (user) {
    return res.status(409).json({ message: 'Пользователь уже существует!' })
  }

  try {
    const newUser = await db.createUser(req.body)

    res.status(201).json({
      ...helper.serializeUser(newUser),
    })
  } catch (e) {
    console.log(e)
    res.status(500).json({ message: e.message })
  }
})

router.post('/login', async (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    async (err, user, info) => {
      if (err) {
        return next(err)
      }

      if (!user) {
        return res.status(400).json({ message: 'Не верный логин или пароль' })
      }

      if (user) {
        const token = await tokens.createTokens(user)
        res.json({
          ...helper.serializeUser(user),
          ...token,
        })
      }
    },
  )(req, res, next)
})

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.headers['authorization']

  const data = await tokens.refreshTokens(refreshToken)
  res.json({ ...data })
})


router.get('/profile', auth, async (req, res) => {
  const user = req.user

  res.json({
    ...helper.serializeUser(user),
  })
})


const validation = (fields, files) => {
  if (fields.newPassword === "" && fields.oldPassword !== "") {
    return { status: 'Укажите новый пароль', err: true }
  }

  if (fields.newPassword !== "" && fields.oldPassword === "") {
    return { status: 'Укажите старый пароль', err: true }
  }

  if (fields.firstName === "") return { status: 'Заполните это поле', err: true }
  if (fields.surName === "") return { status: 'Заполните это поле', err: true }
  if (fields.middleName === "") return { status: 'Заполните это поле', err: true }

  return { status: 'Ok', err: false }
}

router.patch('/profile', auth, async (req, res) => {
  const user = req.user
  const form = new formidable.IncomingForm()
  form.uploadDir = path.join(process.cwd(), "upload")
  form.parse(req, async function (err, fields, files) {
    if (err) {
      // eslint-disable-next-line no-undef
      return next(err)
    }
    const valid = validation(fields, files)
    
    if (valid.err) {
      if (files.avatar) fs.unlinkSync(path.join(process.cwd(), "upload", files.avatar.newFilename))
      return res.status(409).json({ message: valid.status })
    }
    if (files.avatar) {
      const dirImage = path.join("./", files.avatar.newFilename)
      fields.image = dirImage
    } 
    const newUser = await db.updateUserById(user._id, fields)
    if (!newUser) {
      return res.status(409).json({ message: "Старый пароль неверен" })
    }

    if (newUser.oldImage) {
      fs.unlinkSync(path.join(process.cwd(), "upload", newUser.oldImage))
    }

    res.json({
      ...helper.serializeUser(newUser),
    })
  })

})

router.get('/users', auth, async (req, res) => {
  const users = await db.getAllUsers()
  const shortUsers = users.map(user => helper.serializeUser(user))
  res.json(shortUsers)
})


router.patch('/users/:id/:permission', auth, async (req, res, next) => {
  if (req.params.permission === 'permission') {
    const user = await db.changeUserPermissions(req.params.id, req.body.permission)
    res.json(user)
  } else next()
  
})

router.delete('/users/:id', auth, async (req, res) => {
  const user = await db.deleteUserById(req.params.id)
  res.json(user)
})

router.get('/news', auth, async (req, res) => {
  const news = await db.getAllNews()
  res.json(news)
})

router.post('/news', auth, async (req, res) => {
  await db.createNews(req.body)
  const news = await db.getAllNews()
  res.json(news)
})

router.patch('/news/:id', auth, async (req, res) => {
  const news = await db.updateNewsById(req.params.id, req.body)
  res.json(news)
})

router.delete('/news/:id', auth, async (req, res) => {
  const news = await db.deleteNewsById(req.params.id)
  res.json(news)
})

module.exports = router