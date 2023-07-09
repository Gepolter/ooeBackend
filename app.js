const express = require("express")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const cors = require("cors")
const path = require("path")

require('dotenv').config()
// create our express app
const app = express()

const environment = process.env.NODE_ENV
console.log(environment)
const PORT = 0

const uri = process.env.MONGO_URL
console.log(uri)
const connection = mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'OutOfEarshot'
})
.then(() => {
  console.log('MongoDB Connected - OutOfEarshot')
})
.catch(err => console.log(err))

// middleware
app.use(bodyParser.json())
app.use(cors())


//require and use route files
const dataRoute = require("./routes/data")
// routes
app.use("/data", dataRoute)

// routes correspond with middleware functions implemented here
//this design seems to couple all functions defined in the backend / API
//to uri addresses...
//have to write custom method

app.get("/", (req,res)=>{
    res.send('backend app connected')
    console.log(`listening at port:${portNum}`)
})

//start jobs
require("./jobs/cronJobs")

//start server
let portNum = process.env.PORT || 3000
app.listen(portNum, ()=>{
  console.log(`listening at port:${portNum}`)
}) 
