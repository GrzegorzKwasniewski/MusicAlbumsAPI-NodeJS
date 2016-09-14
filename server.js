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
    
    if (queryParams.hasOwnProperty('ownLimitedEdition') && queryParams.ownLimitedEdition === 'true') {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownLimitedEdition: true})
    } else if (queryParams.hasOwnProperty('ownLimitedEdition') && queryParams.ownLimitedEdition === 'false') {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownLimitedEdition: false})
    }
    
    if (queryParams.hasOwnProperty('ownPhysicalCD') && queryParams.ownPhysicalCD === 'true') {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownPhysicalCD: true})
    } else if (queryParams.hasOwnProperty('ownPhysicalCD') && queryParams.ownPhysicalCD === 'false') {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownPhysicalCD: false})
    }
    
    if (queryParams.hasOwnProperty('ownDigital') && queryParams.ownDigital === 'true') {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownDigital: true})
    } else if (queryParams.hasOwnProperty('ownDigital') && queryParams.ownDigital === 'false') {
        filteredMusicAlbums = _.where(filteredMusicAlbums, {ownDigital: false})
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

    var regexForDate = new RegExp('^(19|20)[0-9][0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')
    var regexForTracksCount = new RegExp('^([0-9]|[0-9][0-9])$')
    
    // filter JSON fields from body of the message
    var body = _.pick(req.body, 'title', 'author', 'tracksCount', 'publisher',  'publishedDate', 'ownLimitedEdition', 'ownPhysicalCD', 'ownDigital')
    var publishedDateFromString = body.publishedDate
    
    if (!_.isString(body.title) || body.title.trim().length === 0) {
        res.status(400).send('Title field for music album must be in string format and can\'t be null or empty')
    }
    
    if (!_.isString(body.author) || body.author.trim().length === 0) {
        res.status(400).send('Author field for music album must be in string format and can\'t be null or empty')
    }
    
    if (!_.isNumber(body.tracksCount) || !regexForTracksCount.test(body.tracksCount)) {
        res.status(400).send('Number of tracks field for music album must be in int format (from 0 to 99) and can\'t be null or empty')
    }
    
    if (!_.isString(body.publisher) || body.publisher.trim().length === 0) {
        res.status(400).send('Publisher field for music album must be in string format and can\'t be null or empty')
    }
    
    // TODO try to change this to one function with bool return
    if (!regexForDate.test(publishedDateFromString) || _.isEmpty(body.publishedDate)) {
        res.status(400).send('Published date must have valid format \(yyyy-mm-dd\), must be in range of 1900-01-01 - 2099-12-31 and can\'t be null or empty')
    }
    
    if (!_.isBoolean(body.ownLimitedEdition)) {
        res.status(400).send('Own Limited Edition field for music album must be in boolean format and can\'t be null')
    }
    
    if (!_.isBoolean(body.ownPhysicalCD)) {
        res.status(400).send('Own Physical CD field for music album must be in boolean format and can\'t be null')
    }
    
    if (!_.isBoolean(body.ownDigital)) {
        res.status(400).send('Own Digital field for music album must be in boolean format and can\'t be null')
    } else {
        body.id = musicAlbumNextID++;
        musicAlbums.push(body);
        res.json(musicAlbums);
    }
})

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT);
});