import express from 'express'
import fastFolderSizeSync from 'fast-folder-size/sync.js'
import fs from 'fs'
import path from 'path'
import upload from './upload.js'

export const getApp = (mountRoot) => {
  const app = express()

  app.use(express.urlencoded({ extended: true }))

  app.get('/file/:localSystemFilePath(*)', (req, res, next) => {
    const p = path.join(mountRoot, req.params.localSystemFilePath)
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
        fs.readdir(p, { withFileTypes: true }, (err, rawFiles) => {
          if (err) {
            next(err)
            return
          }
          let files = rawFiles
          if (req.query.filterByName) {
            files = files.filter((file) =>
              file.name
                .toLowerCase()
                .includes(req.query.filterByName.toLowerCase())
            )
          }
          if (req.query.orderBy) {
            const orderByDirection = req.query.orderByDirection || 'Ascending'
            const getSortKey = {
              lastModified: (file) => {
                const stats = fs.statSync(path.join(p, file.name))
                return stats.mtimeMs
              },
              size: (file) => {
                const q = path.join(p, file.name)
                if (file.isDirectory()) {
                  const bytes = fastFolderSizeSync(q)
                  return bytes
                } else {
                  const stats = fs.statSync(q)
                  return stats.size
                }
              },
              fileName: (file) => file.name,
            }[req.query.orderBy]
            let sorter
            if (orderByDirection === 'Ascending') {
              sorter = (file1, file2) => {
                const k1 = getSortKey(file1)
                const k2 = getSortKey(file2)
                if (k1 < k2) {
                  return -1
                } else if (k1 > k2) {
                  return 1
                } else {
                  return 0
                }
              }
            } else if (orderByDirection === 'Descending') {
              sorter = (file1, file2) => {
                const k1 = getSortKey(file1)
                const k2 = getSortKey(file2)
                if (k1 < k2) {
                  return 1
                } else if (k1 > k2) {
                  return -1
                } else {
                  return 0
                }
              }
            }
            files = files.sort(sorter)
          }
          files = files.map((file) =>
            file.isDirectory() ? `${file.name}/` : file.name
          )
          files = res.json({
            isDirectory: true,
            files,
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
      const p = path.join(mountRoot, req.params.localSystemFilePath)
      const dir = path.dirname(p)

      fs.stat(p, (err, stats) => {
        if (err && err.code !== 'ENOENT') {
          next(err)
          return
        }
        if (stats) {
          res.status(403).json({ error: 'Path exist' })
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

  app.patch(
    '/file/:localSystemFilePath(*)',
    upload.single('file'),
    (req, res, next) => {
      const p = path.join(mountRoot, req.params.localSystemFilePath)

      fs.stat(p, (err, stats) => {
        if (err && err.code !== 'ENOENT') {
          next(err)
          return
        }
        if (!stats) {
          res.status(404).json({ error: 'File not found' })
          return
        }
        if (stats.isDirectory()) {
          res.status(404).json({ error: 'File not found' })
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
    }
  )

  app.delete('/file/:localSystemFilePath(*)', (req, res, next) => {
    const p = path.join(mountRoot, req.params.localSystemFilePath)

    fs.stat(p, (err, stats) => {
      if (err && err.code !== 'ENOENT') {
        next(err)
        return
      }
      if (!stats) {
        res.status(404).json({ error: 'File not found' })
        return
      }
      if (stats.isDirectory()) {
        res.status(404).json({ error: 'File not found' })
        return
      }

      fs.unlink(p, (err) => {
        if (err) {
          next(err)
          return
        }
        res.json({})
      })
    })
  })

  return app
}
