var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var _ = require('underscore')

// port for Heroku or local
var PORT = process.env.PORT || 3000

var musicAlbums = []
var musicAlbumNextID = 1

// parse incoming requests as json
app.use(bodyParser.json())

// setting GET method

app.get('/', function (req, res) {
    res.send('Music Albums API Root')
})

app.get('/musicalbums', function (req, res) {
    res.send('You are in Music Albums Collection end point')
    var queryParams = req.query
    var filteredMusicAlbums = musicAlbums
    
    if (queryParams.hasOwnProperty('ownLimitedEdition') && queryParams.ownLimitedEdition === true) {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownLimitedEdition: true})
    }
    
    if (queryParams.hasOwnProperty('ownPhysicalCD') && queryParams.ownPhysicalCD === true) {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownPhysicalCD: true})
    } 
    
    if (queryParams.hasOwnProperty('ownDigital') && queryParams.ownDigital === true) {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownDigital: true})
    } 
})

app.get('/musicalbums/:id', function (res, req) {
    var musicAlbumID = parseInt(req.params.id, 10)
    var matchedMusicAlbums = _.findWhere(musicAlbums, {id: musicAlbumID})
    
    if (matchedMusicAlbums) {
        res.json(matchedMusicAlbums);
    } else {
        res.status(404).send();
    }
})

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT);
});