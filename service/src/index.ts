import express from 'express'
import session from 'express-session'
import type { RequestProps } from './types'
import type { ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel } from './chatgpt'
import { auth, getUsers, updateUser } from './middleware/auth'
import { limiter } from './middleware/limiter'
import { addUser, updateUserCount } from './utils/user'

const app = express()
app.use(express.static('public'))
app.use(express.json())
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: true, // don't create session until something stored
  secret: 'keyboard cat123545423',
  cookie: { maxAge: 1000 * 60 * 60 },
}))
const router = express.Router()

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
  res.setHeader('Content-type', 'application/octet-stream')
  try {
    const { prompt, options = {}, systemMessage, temperature, top_p } = req.body as RequestProps
    let firstChunk = true
    await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
      temperature,
      top_p,
    })
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/balance', auth, async (req, res) => {
  try {
    const Authorization = req.header('Authorization')
    const key = Authorization.replace('Bearer ', '').trim()
    const AllUser = getUsers()
    res.send({ status: 'Success', message: '', data: AllUser[key] })
  }
  catch (error) {
    res.send(error)
  }
})

router.get('/addtoken', async (req, res) => {
  try {
    if (/^simon[0-9]{6}$/.test(String(req.query.key || '')) && req.query.token) {
      const time = String(req.query.key).replace('simon', '')
      const times = Array.from(time)
      const today = new Date()
      const min = String(today.getMinutes())
      const date = String(today.getDate())
      const hour = String(today.getHours())
      if (times[0] + times[1] === (min.length === 2 ? min : `0${min}`)
      && times[2] + times[3] === (date.length === 2 ? date : `0${date}`)
      && times[4] + times[5] === (hour.length === 2 ? hour : `0${hour}`)) {
        const allUser = getUsers()
        if (Object.keys(allUser).includes(String(req.query.token))) {
          updateUserCount(req.query.token, Number(req.query.count || 50), () => {
            updateUser()
            res.send({ status: 'Success', message: '', data: null })
          })
        }
        else {
          addUser(req.query.token || '', Number(req.query.count || 50), () => {
            updateUser()
            res.send({ status: 'Success', message: '', data: null })
          })
        }
      }
      else {
        res.send({ status: 'Fail', message: '11', data: null })
      }
    }
    else {
      res.send({ status: 'Fail', message: '10', data: null })
    }
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req: any, res) => {
  try {
    // if (req.session.views)
    //   req.session.views = req.session.views + 1
    // else
    //   req.session.views = 1

    // const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
    // const hasAuth = isNotEmptyString(AUTH_SECRET_KEY)
    res.send({ status: 'Success', message: '', data: { auth: true, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')
    const AllUser = getUsers()
    console.log(Object.keys(AllUser), token)
    if (!Object.keys(AllUser).includes(token))
      throw new Error('密钥无效 | Secret key is invalid')
    if (AllUser[token] <= 0)
      throw new Error('授权次数不足, 密钥已失效 | 如有需要联系juju')

    // if (process.env.AUTH_SECRET_KEY !== token)
    //   throw new Error('密钥无效 | Secret key is invalid')

    res.send({ status: 'Success', message: 'Verify successfully', data: AllUser[token] })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
