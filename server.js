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
    
    res.json(filteredMusicAlbums);
})

app.get('/musicalbums/:id', function (req, res) {
    var musicAlbumID = parseInt(req.params.id, 10)
    var matchedMusicAlbums = _.findWhere(musicAlbums, {id: musicAlbumID})
    
    if (matchedMusicAlbums) {
        res.json(matchedMusicAlbums);
    } else {
        res.status(404).send();
    }
})

app.post('/musicalbums', function (req, res) { 
    // filter JSON fields from body of the message
    var body = _.pick(req.body, 'publishedDate');
    var publishedDateFromString = new Date(body.publishedDate) 
    
    if (!_.isDate(publishedDateFromString) || _.isEmpty(body.publishedDate)) {
        res.status(400).send
    }
    
    //body.title = body.title.trim();    
    body.id = musicAlbumNextID++;
    musicAlbums.push(body);
    res.json(musicAlbums);
})

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT);
});