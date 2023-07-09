const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    "userName": String,
    "pw": String,
    "mail": String,
    "locationLatLng": Array,
    "distMetric": String,
    "artistSubs": Array

})
const Users = mongoose.model('Users', userSchema, 'Users')

const artistSchema = new mongoose.Schema({
    "artistName": String,
    "artistMarker": String,
    "gigData":Array
})
const Artists = mongoose.model('Artists', artistSchema, 'Artists')

module.exports = {userSchema, Users, artistSchema, Artists}