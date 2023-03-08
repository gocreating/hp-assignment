import { getApp } from './app.js'

const app = getApp(process.cwd())
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`The server is listening on port ${port}`)
})
