import fs from 'fs'
import path from 'path'

export const resetDir = (relativeDirPath, done) => {
  const dirPath = path.join(process.cwd(), 'file', relativeDirPath)
  fs.rm(
    dirPath,
    {
      recursive: true,
    },
    (err) => {
      if (err) {
        return done(err)
      }
      fs.mkdir(dirPath, { recursive: true }, (err) => {
        if (err) {
          return done(err)
        }
        done()
      })
    }
  )
}

export const prepareFile = (relativeFilePath, fileContent, done) => {
  const filePath = path.join(process.cwd(), 'file', relativeFilePath)
  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      return done(err)
    }
    done()
  })
}

export const prepareUploadFile = (relativeFilePath, fileContent, done) => {
  const filePath = path.join('/tmp', relativeFilePath)
  fs.writeFile(filePath, fileContent, (err) => {
    if (err) {
      return done(err)
    }
    done(null, filePath)
  })
}

export const prepareDir = (relativeDirPath, done) => {
  const dirPath = path.join(process.cwd(), 'file', relativeDirPath)
  fs.mkdir(
    dirPath,
    {
      recursive: true,
    },
    (err) => {
      if (err) {
        return done(err)
      }
      done()
    }
  )
}

export const getResolvedPath = (relativeFilePath) => {
  return path.resolve(process.cwd(), 'file', relativeFilePath)
}

export const getFileContent = (relativeFilePath, done) => {
  const filePath = path.join(process.cwd(), 'file', relativeFilePath)
  fs.readFile(filePath, (err, buffer) => {
    if (err) {
      done(err)
      return
    }
    done(null, buffer)
  })
}
