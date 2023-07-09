const express = require('express')
const router = express.Router()
//const uuid = require("uuid")
const mongoose = require('mongoose')
const {userSchema} = require('../models/data')
const {Users} = require('../models/data')
const {artistSchema} = require ('../models/data')
const {Artists} = require('../models/data')

router.get('/', (req,res)=>{
    res.send("data route")
})


//functions for outlier detection in production env:
/*
    take "start date" and "end date" and compare to usual time

    Databank needs general table of all Articles containing statistics
*/
/*
    monthly collections of all articles' stock (collect x times weekly)
    maybe don't calculate in frontend, but save monthly sums in these collections too
*/

//getter routes
router.get("/UserData/:user/:pw", async function (req, res) {
    console.log("findingUser")
    let pipeline = {
        'userName': req.params.user,
        'pw': req.params.pw
    }
    let result = await getUserSubData(pipeline)
     res.send(result)
})
async function getUserSubData(pipeline){
    console.log('getting user subs')
    let result = {artists:[]}
    let user
    try{ 
        user = await Users.find(pipeline)
        if(user != []){
            result.user = user[0]
        }
    }catch(err){
        console.log(err)
    }
    //console.log(user)

    for(let i=0; i<user[0].artistSubs.length; i++){
        try{
            artist = await Artists.find({artistName: user[0].artistSubs[i].artistName})
            if(artist != []){
                result.artists.push(artist[0])
            }
            //console.log(artist)
            
        }catch(err){
            console.log(err)
        }
    }
    console.log("results:")
    console.log(result)
    return result
}

router.get("/inventoryHistoryData/function/:function/metric/:metric/variable/:variable/amount/:amount/filters/:filters", function (req,res){
    let sortString = "Metrics." + req.params.variable + '.' + [req.params.metric]
    let sortParam = req.params.function == 'asc'? 1 : -1
    /*add all filter conditions from fronend to pipeline?
    should test this speedwise against frontend filtering,
    as the application needs to filter article categories frequently*/
    let pipeline = [
        {$match: {'Regelkreis': 'Rot'}},
        {$match: {'Benennung':  /Alu/}},
    ]
    pipeline.push({$sort:{ [sortString]: sortParam}})
    pipeline.push({$limit: Number(req.params.amount)})
    console.log(sortString)
    let result
    try{  
        InventoryHistory.find({}, async function(err, data){
            result = await InventoryHistory.aggregate(pipeline)
            res.send(result)
        })  
    }catch(err){
        console.log(err)
    }
})
//the exported mongoose models from ./models/data.js don't work for the dynamic backend pathing, that is implemented here
//that is why only the Schemas are imported

router.get("/ledgerEntries/:month-:year", (req, res) =>{
    //PlotPrnData.collection.name = 'ledgerEntries' + req.params.month + "-" + req.params.year
    const MonthData = mongoose.model('MonthData', ledgerSchema, 'LedgerEntries' + req.params.year + "-" + req.params.month)
    MonthData.find({}, async function(err){
        const filteredData = await MonthData.aggregate([
            {$addFields:{
                "Datum":{
                    "$toDate": "$Datum"
                }
            }}
        ])
        console.log(MonthData.collection.name)
        res.send(filteredData)
    })
})

module.exports = router
/*
router.get("/plotPrnDataSub1WeekRed", function(req, res) {
    PlotPrnData.find({}, async function(err, plotPrnData){
        
        const filterPlane = {Regelkreis: "Rot"}
        const filteredData = await PlotPrnData.aggregate([
            {$match: filterPlane},
            {$addFields:{
                "Datum":{
                    "$toDate": "$Datum"
                }
            }}
            /*{$project: {
                Datum: {
                    $dateFromString: {
                        dateString: '$date',
                        format: "%d.%m.%Y"
                    }
                }
            }}
        ])
        
        //console.log(plotPrnDataMap)
        res.send(filteredData)
    })
})
*/

//get requests for specific weeks / months
//"/dataEntries?Week=x&Month=y&Year=z"

//ONE GET REQUEST PER PLOT!!!
/*
    by configuring the get request params in frontend
*/

/*
router.get("/armorAll", function(req, res) {
    Armor.find({}, function(err, armor){
        var armorMap = []
        armor.forEach(function(armor){
            armorMap[armor._id] = armor
        })
        res.send(armorMap)
    })
})
*/


