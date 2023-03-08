import express from 'express'
import fs from 'fs'
import path from 'path'
import upload from './upload.js'

const app = express()

app.use(express.urlencoded({ extended: true }))

app.get('/file/:localSystemFilePath(*)', (req, res, next) => {
  const p = path.join(process.cwd(), 'file', req.params.localSystemFilePath)
  fs.stat(p, (err, stats) => {
    if (err) {
      if (err.code !== 'ENOENT') {
        next(err)
        return
      }
      if (!stats) {
        res.status(404).json({ error: 'Path not found' })
        return
      }
    }
    if (stats.isDirectory()) {
      fs.readdir(p, { withFileTypes: true }, (err, files) => {
        if (err) {
          next(err)
          return
        }
        res.json({
          isDirectory: true,
          files: files.map((file) =>
            file.isDirectory() ? `${file.name}/` : file.name
          ),
        })
      })
    } else {
      fs.createReadStream(p, { autoClose: true })
        .on('error', function (err) {
          res.end(err)
        })
        .pipe(res, { end: true })
    }
  })
})

app.post(
  '/file/:localSystemFilePath(*)',
  upload.single('file'),
  (req, res, next) => {
    const p = path.join(process.cwd(), 'file', req.params.localSystemFilePath)
    const dir = path.dirname(p)

    fs.stat(p, (err, stats) => {
      if (err && err.code !== 'ENOENT') {
        next(err)
        return
      }
      if (stats) {
        res.status(404).json({ error: 'Path exist' })
        return
      }
      fs.mkdir(dir, { recursive: true }, (err) => {
        if (err) {
          next(err)
          return
        }
        fs.rename(req.file.path, p, (err) => {
          if (err) {
            next(err)
            return
          }
          res.json({})
        })
      })
    })
  }
)

export default app
