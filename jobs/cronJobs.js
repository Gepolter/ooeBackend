const CronJob = require('cron').CronJob
const {DateTime} = require("luxon")

//IMPATIENT TEST SECTION
const jobDate = DateTime.now()
//jobs.populateInventoryHistory("inventoryImport2023-26")
//jobs.importInventoryHistoryFile("inventoryImport2023-24")
//jobs.updateInventoryHistory("inventoryImport2023-20", 2023, 20)
//jobs.sortArrays()

//instantiating jobs - Wait for automated data warehouse drops
/*
const inventoryHistoryImport = new CronJob(
    //at 12:00 each Monday   
    '0 12 * * 1',
    function(){
        console.log("Starting inventoryHistoryImport Job")
        const jobDate = DateTime.now()
        const fileName = "inventoryImport" + jobDate.year + "-" + jobDate.weekNumber-1
        jobs.importInventoryHistoryFile(fileName)
        console.log("job finished")
    },
    null,
    true,
    'Europe/Berlin'
)

const inventoryHistoryUpdate = new CronJob(
    //at 12:00 each Tuesday
    '0 12 * * 2',
    function(){
        console.log("Starting inventoryHistoryUpdate Job")
        const jobDate = DateTime.now()
        const fileName = "inventoryImport" + jobDate.year + "-" + jobDate.weekNumber-1
        jobs.updateInventoryHistory(fileName, jobDate.year, jobDate.weekNumber-1)
        console.log("job finished")
    },
    null,
    true,
    'Europe/Berlin'
)

module.exports = {inventoryHistoryImport, inventoryHistoryUpdate}
*/



