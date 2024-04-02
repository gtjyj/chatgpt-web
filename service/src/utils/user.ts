import mysql from 'mysql'
import { dbconfig } from './conn'

export function getAllUser(callback) {
  const conn = mysql.createConnection(dbconfig)
  conn.query('select key_name,value from cache_chatgpt_def', (err, results) => {
    if (err)
      throw err
    callback && callback(results)
  })
  conn.end((err) => {
    if (err) {
      console.log(err)
      throw err
    }
  })
}

// export function getUserCount(user, callback) {
//   const conn = mysql.createConnection(dbconfig)
//   conn.query(`select value from cache_chatgpt_def where key_name='count${user}'`, (err, results) => {
//     if (err)
//       throw err
//     callback(results)
//   })
//   conn.end((err) => {
//     if (err) {
//       console.log(err)
//       throw err
//     }
//   })
// }

export function addUser(user, count = 0, callback) {
  const conn = mysql.createConnection(dbconfig)
  conn.query(`insert into cache_chatgpt_def(key_name,value)values('${user}','${count}')`, (err) => {
    if (err)
      throw err
    callback && callback()
  })
  conn.end((err) => {
    if (err) {
      console.log(err)
      throw err
    }
  })
}

export function updateUserCount(user, count = 0, callback) {
  const conn = mysql.createConnection(dbconfig)
  conn.query(`update cache_chatgpt_def set value='${count}' where key_name='${user}'`, (err) => {
    if (err)
      throw err
    callback && callback()
  })
  conn.end((err) => {
    if (err) {
      console.log(err)
      throw err
    }
  })
}
