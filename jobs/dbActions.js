const mongoose = require("mongoose")
const csv = require('csvtojson')
const {inventoryHistorySchema} = require('../models/dbActions')
const {inventoryImportSchema} = require('../models/dbActions')

//function for extracting warehouse file content into mongodb collection
//these collections are added weekly, and from them the main collection extracts the weekly data as an arrayelement
async function importInventoryHistoryFile(fileName) {
    console.time("import")
    console.log("importing " + fileName)
    const dataPath =  process.env.DATAWAREHOUSE_PATH + '/' + fileName + '.csv'
    const inventoryImportModel = mongoose.model(fileName, inventoryImportSchema, fileName)
    //create collection of model
    inventoryImportModel.createCollection()

    var jsonArray
    try{
        jsonArray = await csv({delimiter: ';', flatKeys: true}).fromFile(dataPath)
    }catch(error){
        console.log("file not found")
        console.log(error)
        return
    }
    //collect all relevant features of each row in "entries" array
    let entries = []
    for(var i = 0; i < jsonArray.length; i++){
        var obj = {}
        obj._id = jsonArray[i]['_id']
        obj.Sachnummer = jsonArray[i]['Sachnummer']
        obj.Regelkreis = jsonArray[i]['Regelkreis']
        obj.ist_Menge = Number(jsonArray[i]['Bestand\nNAVISION'])
        obj.Tagesbedarf = parseFloat(jsonArray[i]['Tagesbedarf'].replace(/,/g, '.'))
        obj.Reichweite = (obj.Tagesbedarf && obj.ist_Menge != "NaN") ? parseInt(obj.ist_Menge/obj.Tagesbedarf) : 0
        entries.push(obj)
    }

    try{
        await inventoryImportModel.bulkWrite(entries.map(entry => ({
            updateOne: {
                filter: {"Sachnummer": entry.Sachnummer},
                update: entry,
                upsert: true
            },
            
        })),{ordered: false}) 
        console.log("bulkwrite success")
    }catch(error){
        console.log(error)
    }
    console.timeEnd("import")
}

async function updateInventoryHistory(fileName, year, calendarWeek){
    console.time("update")
    console.log("updating InventoryHistory with " + fileName)
    const importData = mongoose.model('importData', inventoryImportSchema, fileName)
    //this imports the collection content from mongodb as an obj

    //Fetching the main InventoryHistory data. This contains all Articles once. Each entry has array containing the weekly InventoryImport data
    const mainData = mongoose.model('mainData', inventoryHistorySchema, 'InventoryHistory')
    //shows incomplete imports or old products that can be deleted from database
    missingInImport = []
    //shows mainData -> maybe new products
    missingInMain = []

    console.log("Creating updates from import")

    let updates = await createUpdates(importData, year, calendarWeek)
    try{
        await mainData.bulkWrite(
            updates,
            {ordered: true}
        )

    }catch(err){
        console.log(err)
    }
    console.log("Updates created")
    //console.log("Data missing in Main collection \n" + missingInMain + "\nData missing in Import collection \n" + missingInImport)
    //this.writeLogFile(pathMII, missingInImport, importData.filename + 'missingInImport')
    //this.writeLogFile(pathMIM, missingInMain, importData.filename + 'missingInMain')
    console.log(fileName + " data import finished")
    console.timeEnd("update")
}

async function createUpdates(importData, year, calendarWeek){
    let updates = []
    for await(const doc of importData.find()){
        //check if doc is in main 

        //console.log("doc: " + doc)
        let inventoryHistoryObject = { 
            date:{year: year, calendarWeek: calendarWeek},
            inventory: Number(doc.ist_Menge),
            dailyDemand: Number(doc.Tagesbedarf),
            reach: Number(doc.Reichweite)
        }
        //find array inside of mainData and upsert just one array entry...
        var upsertArrEntry = {
            updateOne:{
                "filter": {
                    $and: [
                        {'Sachnummer': doc.Sachnummer},
                        {'InventoryHistory.date': {$nin:[{"year": year, "calendarWeek": calendarWeek}]}},                       
                    ]   
                },
                //?
                "update": {$push: {"InventoryHistory": inventoryHistoryObject}}//{"InventoryHistory": {"date": {"year": year, "calendarWeek": calendarWeek}}}}
            }
        }
        await updates.push(upsertArrEntry)
    }
    //console.log("updates length = " + updates.length)
    return updates
}
async function sortArrays(){
    console.time("sort")
    console.log("sorting")
    const mainData = mongoose.model('mainData', inventoryHistorySchema, 'InventoryHistory')
    let result
    try{
        //console.log()
        result = await mainData.aggregate([
            { $project: {
                //_id: '649957e1cd32917adfca6a40',
                'InventoryHistory': {
                    $sortArray: {
                        input: "$InventoryHistory",
                        sortBy: { 'date.calendarWeek': 1}
                    } 
                }
            }},
            {$merge: {
                into: 'InventoryHistory',
                on: '_id',
                //let: 'specification(s)',
                whenMatched: 'merge',
                whenNotMatched: 'discard'
            }}
        ])

        
    }catch(err){
        console.log(err)
    }
    console.log("sorted")
    console.timeEnd("sort")
}
async function calculateMetrics(){
    console.time("metrics")
    console.log("calculating metrics")
    const mainData = mongoose.model('mainData', inventoryHistorySchema, 'InventoryHistory')
    let result
    try{
        //console.log()
        result = await mainData.aggregate([
            { $project: {
                "Metrics.inventory": {
                mean: {$avg: "$InventoryHistory.inventory"},
                min: {$min: "$InventoryHistory.inventory"},
                max: {$max: "$InventoryHistory.inventory"},
                stdDev: {$stdDevPop: "$InventoryHistory.inventory"},
                last: {$last: "$InventoryHistory.inventory"},
                },
                "Metrics.demand": {
                mean: {$avg: "$InventoryHistory.dailyDemand"},
                min: {$min: "$InventoryHistory.dailyDemand"},
                max: {$max: "$InventoryHistory.dailyDemand"},
                stdDev: {$stdDevPop: "$InventoryHistory.dailyDemand"},
                last: {$last: "$InventoryHistory.dailyDemand"},
                },
                "Metrics.reach": {
                mean: {$avg: "$InventoryHistory.reach"},
                min: {$min: "$InventoryHistory.reach"},
                max: {$max: "$InventoryHistory.reach"},
                stdDev: {$stdDevPop: "$InventoryHistory.reach"},
                last: {$last: "$InventoryHistory.reach"},
                },
            }},
            
            {$merge: {
                into: 'InventoryHistory',
                on: '_id',
                //let: 'specification(s)',
                whenMatched: 'merge',
                whenNotMatched: 'discard'
            }}
        ])

        
    }catch(err){
        console.log(err)
    }
    console.log("calculation complete")
    console.timeEnd("metrics")
}

//use once to populate InventoryHistory Collection
async function populateInventoryHistory(fileName) {
    console.time("populate")
    console.log("start populating InventoryHistory Collectio from " + fileName)
    const dataPath =  process.env.DATAWAREHOUSE_PATH + '/' + fileName + '.csv'
    const inventoryHistoryModel = mongoose.model(fileName, inventoryHistorySchema, 'InventoryHistory')
    //create collection of model
    inventoryHistoryModel.createCollection()

    var jsonArray
    try{
        jsonArray = await csv({delimiter: ';', flatKeys: true}).fromFile(dataPath)
    }catch(error){
        console.log("file not found")
        console.log(error)
        return
    }
    //collect all relevant features of each row in "entries" array
    let entries = []
    for(var i = 0; i < jsonArray.length; i++){
        var obj = {}
        obj._id = jsonArray[i]['_id']
        obj.Sachnummer = jsonArray[i]['Sachnummer']
        obj.Benennung = jsonArray[i]['Benennung']
        obj.Regelkreis = jsonArray[i]['Regelkreis']
        obj.InventoryHistory
        obj.InventoryVariance
        entries.push(obj)
        //console.log(obj)
    }
    
    try{
        //with bigger data uploads test speed with "ordered: false"
        await inventoryHistoryModel.bulkWrite(entries.map(entry => ({
            updateOne: {
                filter: {"Sachnummer": entry.Sachnummer},
                update: entry,
                upsert: true
            }
        })),{ordered: false}) 
        console.log("bulkwrite success")
    }catch(error){
        console.log(error)
    }
    console.timeEnd("populate")

}

//FILTER COLLECTION FUNCTION
/* should take jason obj as filter params and return every match
could be used in all of backend, to minimize the need for data transformation in frontend
*/

//TODO
/*
function writeLogFile(pathInDataWarehouse, content){}
function backupDataWarehouse(){
    //copy data in warehouse to backup location as backup file
}
*/

module.exports = {
    importInventoryHistoryFile,
    updateInventoryHistory,
    populateInventoryHistory,
    sortArrays,
    calculateMetrics
}

//gravejard
/*
async function updateInventoryHistory (fileName, year, calendarWeek){
    //Fetching the already existing InventoryImport data of a certain week
    //import the DB Collection specified by the func params
    //const importCollectionName = 'inventoryImport' + year + '-' + calendarWeek
    const importData = mongoose.model('importData', inventoryImportSchema, fileName)
    //this imports the collection content from mongodb as an obj
    //const importDataObj = importData.toObject()

    //Fetching the main InventoryHistory data. This contains all Articles once. Each entry has array containing the weekly InventoryImport data
    const mainData = mongoose.model('mainData', inventoryHistorySchema, 'InventoryHistory')
    //shows incomplete imports or old products that can be deleted from database
    missingInImport = []
    //shows mainData -> maybe new products
    missingInMain = []


    console.log("searching import")
    var query

    let i = 0
    for await (const doc of importData.find()){
        //check if doc is in main 
        console.log("doc: " + doc)
        let inventoryHistoryObject = { 
            date:{year: year, calendarWeek: calendarWeek},
            inventory: Number(doc.ist_Menge),
            dailyDemand: Number(doc.Tagesbedarf),
            reach: Number(doc.Reichweite)
        }
        //find array inside of mainData and upsert just one array entry...
        const filter = {
            "Sachnummer": doc.Sachnummer,
            "InventoryHistory.date.year": year,
            "InventoryHistory.date.calendarWeek": calendarWeek
        }
        
        var update// = { $push: {InventoryHistory: inventoryHistoryObject}}
        var updateFilter
        //1st possibility: new data import with new date params. Here the new obj should be pushed into InventoryHistory Array
        //2nd possibility: data with date params already in collection. Here the entry should be updated to new new importData
        mainData.findOne(filter, await function(err, obj){
            
            //console.log("filter " + filter.Sachnummer + "\ndoc " + doc.Sachnummer + "\nfunction " + obj)
            if(obj != null){
                //document exists
                //console.log("found")
                
                update = {$set: {'InventoryHistory.$': inventoryHistoryObject}}
                updateFilter = filter
            }else{
                //document with fitting entry missing
                
                //filter + update have to be changed here, to just search for the document containing the Article Nr, as date params are obv missing
                update ={ $push: {InventoryHistory: inventoryHistoryObject}}
                updateFilter = {"Sachnummer": doc.Sachnummer}
                
            }
        })
        //if not found, push new obj
        //console.log(updateFilter.Sachnummer + "update complete")
        mainData.findOneAndUpdate(updateFilter, update, {
            new: true,
        })
    }

    //console.log("Data missing in Main collection \n" + missingInMain + "\nData missing in Import collection \n" + missingInImport)
    //this.writeLogFile(pathMII, missingInImport, importData.filename + 'missingInImport')
    //this.writeLogFile(pathMIM, missingInMain, importData.filename + 'missingInMain')
    console.log(fileName + " data import finisehd")
}
*/