import { getAllUser, updateUserCount } from 'src/utils/user'

const AllUser = {}
// let lastReqData = 0

const updateUser = () => {
  // const now = (new Date()).valueOf()
  // if (now - lastReqData > 1000 * 60) {
  // lastReqData = now
  getAllUser((data) => {
    data.forEach((d) => {
      AllUser[d.key_name] = Number(d.value || 0)
    })
    console.log(AllUser)
  })
  // }
}
updateUser()

const auth = async (req, res, next) => {
  try {
    const Authorization = req.header('Authorization')
    if (!Authorization || !Object.keys(AllUser).includes(Authorization.replace('Bearer ', '').trim()))
      throw new Error('Error: 无访问权限 | No access rights')
    if (req.url.toLowerCase() === '/chat-process') {
      const key = Authorization.replace('Bearer ', '').trim()
      if (AllUser[key] <= 0)
        throw new Error('Error: 授权次数已用完 | No access rights')
      AllUser[key] = AllUser[key] - 1
      setTimeout(() => {
        updateUserCount(key, AllUser[key])
      })
      console.log(key, AllUser[key])
    }
    // updateUser()
    next()
  }
  catch (error) {
    res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
  }
}
const getUsers = () => {
  return AllUser
}

// const auth = async (req, res, next) => {
//   const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
//   if (isNotEmptyString(AUTH_SECRET_KEY)) {
//     try {
//       const Authorization = req.header('Authorization')
//       if (!Authorization || Authorization.replace('Bearer ', '').trim() !== AUTH_SECRET_KEY.trim())
//         throw new Error('Error: 无访问权限 | No access rights')
//       next()
//     }
//     catch (error) {
//       res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
//     }
//   }
//   else {
//     next()
//   }
// }
export { auth, getUsers, updateUser }
