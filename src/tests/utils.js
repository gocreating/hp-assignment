import fs from 'fs'
import path from 'path'

export const getUtils = (mountRoot) => {
  const resetDir = (relativeDirPath, done) => {
    const dirPath = path.join(mountRoot, relativeDirPath)
    fs.rm(
      dirPath,
      {
        recursive: true,
      },
      (err) => {
        if (err && err.code !== 'ENOENT') {
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

  const prepareFile = (relativeFilePath, fileContent, done) => {
    const filePath = path.join(mountRoot, relativeFilePath)
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        return done(err)
      }
      done()
    })
  }

  const prepareUploadFile = (relativeFilePath, fileContent, done) => {
    const filePath = path.join('/tmp', relativeFilePath)
    fs.writeFile(filePath, fileContent, (err) => {
      if (err) {
        return done(err)
      }
      done(null, filePath)
    })
  }

  const prepareDir = (relativeDirPath, done) => {
    const dirPath = path.join(mountRoot, relativeDirPath)
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

  const getResolvedPath = (relativeFilePath) => {
    return path.resolve(mountRoot, relativeFilePath)
  }

  const getFileContent = (relativeFilePath, done) => {
    const filePath = path.join(mountRoot, relativeFilePath)
    fs.readFile(filePath, (err, buffer) => {
      if (err) {
        done(err)
        return
      }
      done(null, buffer)
    })
  }

  return {
    resetDir,
    prepareFile,
    prepareUploadFile,
    prepareDir,
    getResolvedPath,
    getFileContent,
  }
}
