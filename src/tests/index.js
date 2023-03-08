import { expect } from 'chai'
import request from 'supertest'
import app from '../app.js'
import {
  getFileContent,
  prepareDir,
  prepareFile,
  prepareUploadFile,
  resetDir,
} from './utils.js'

beforeEach((done) => {
  resetDir('/', done)
})

describe('Test get empty directory path', () => {
  it('should read directory successfully', (done) => {
    request(app)
      .get('/file/')
      .expect(200, (err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.body).to.deep.equal({ isDirectory: true, files: [] })
        done()
      })
  })
})

describe('Test get non-empty directory path', () => {
  beforeEach((done) => {
    prepareFile('./dummyFile1.txt', '', () => {
      prepareFile('./dummyFile2.txt', '', () => {
        prepareDir('./dummyDir', done)
      })
    })
  })

  it('should read directory with files and dirs successfully', (done) => {
    request(app)
      .get('/file/')
      .expect(200, (err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.body.isDirectory).to.be.true
        expect(res.body.files).to.include.members([
          'dummyFile1.txt',
          'dummyFile2.txt',
          'dummyDir/',
        ])
        done()
      })
  })
})

describe('Test get existing file path', () => {
  const FILE_NAME = 'some_file.txt'
  const FILE_CONTENT = 'lorem\nipsum'

  beforeEach((done) => {
    prepareFile(`./${FILE_NAME}`, FILE_CONTENT, (err) => {
      if (err) {
        return done(err)
      }
      done()
    })
  })

  it('should retrieve file content', (done) => {
    request(app)
      .get(`/file/${FILE_NAME}`)
      .responseType('blob')
      .expect(200, (err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.body.toString()).equal(FILE_CONTENT)
        done()
      })
  })
})

describe('Test post non-existing file path', () => {
  const FILE_NAME = 'some_file.txt'
  const FILE_CONTENT = 'lorem\nipsum'
  let uploadFilePath

  beforeEach((done) => {
    prepareUploadFile(`./${FILE_NAME}`, FILE_CONTENT, (err, p) => {
      if (err) {
        return done(err)
      }
      uploadFilePath = p
      done()
    })
  })

  it('should create non-existing file successfully', (done) => {
    request(app)
      .post(`/file/${FILE_NAME}`)
      .attach('file', uploadFilePath)
      .expect(200, (err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.body).to.deep.equal({})
        getFileContent(FILE_NAME, (err, buffer) => {
          if (err) {
            return done(err)
          }
          expect(buffer.toString()).equal(FILE_CONTENT)
          done()
        })
      })
  })
})

describe('Test post existing file path', () => {
  const FILE_NAME = 'some_file.txt'
  const FILE_CONTENT = 'lorem\nipsum'
  let uploadFilePath

  beforeEach((done) => {
    prepareFile(`./${FILE_NAME}`, '', (err) => {
      if (err) {
        return done(err)
      }
      prepareUploadFile(`./${FILE_NAME}`, FILE_CONTENT, (err, p) => {
        if (err) {
          return done(err)
        }
        uploadFilePath = p
        done()
      })
    })
  })

  it('should fail due to path confliction', (done) => {
    request(app)
      .post(`/file/${FILE_NAME}`)
      .attach('file', uploadFilePath)
      .expect(403, done)
  })
})

describe('Test patch existing file path', () => {
  const FILE_NAME = 'some_file.txt'
  const OLD_FILE_CONTENT = 'lorem\nipsum\nv1'
  const NEW_FILE_CONTENT = 'lorem\nipsum\nv2'
  let uploadFilePath

  beforeEach((done) => {
    prepareFile(`./${FILE_NAME}`, OLD_FILE_CONTENT, (err) => {
      if (err) {
        return done(err)
      }
      prepareUploadFile(`./${FILE_NAME}`, NEW_FILE_CONTENT, (err, p) => {
        if (err) {
          return done(err)
        }
        uploadFilePath = p
        done()
      })
    })
  })

  it('should replace file content successfully', (done) => {
    request(app)
      .patch(`/file/${FILE_NAME}`)
      .attach('file', uploadFilePath)
      .expect(200, (err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.body).to.deep.equal({})
        getFileContent(FILE_NAME, (err, buffer) => {
          if (err) {
            return done(err)
          }
          expect(buffer.toString()).equal(NEW_FILE_CONTENT)
          done()
        })
      })
  })
})

describe('Test delete existing file path', () => {
  const FILE_NAME = 'some_file.txt'

  beforeEach((done) => {
    prepareFile(`./${FILE_NAME}`, '', (err) => {
      if (err) {
        return done(err)
      }
      done()
    })
  })

  it('should delete file successfully', (done) => {
    request(app)
      .delete(`/file/${FILE_NAME}`)
      .expect(200, (err, res) => {
        if (err) {
          return done(err)
        }
        expect(res.body).to.deep.equal({})
        getFileContent(FILE_NAME, (err, _buffer) => {
          expect(err.code).equal('ENOENT')
          done()
        })
      })
  })
})
