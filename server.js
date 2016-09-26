var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var _ = require('underscore')
var db = require('./db.js')

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
    
    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        filteredMusicAlbums = _.filter(filteredMusicAlbums, function(musicAlbum) {
             return musicAlbum.title.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1 || musicAlbum.author.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1 || musicAlbum.publisher.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1
        });
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
        return res.status(400).send('Title field for music album must be in string format and can\'t be null or empty')
    }
    
    if (!_.isString(body.author) || body.author.trim().length === 0) {
        return res.status(400).send('Author field for music album must be in string format and can\'t be null or empty')
    }
    
    if (!_.isNumber(body.tracksCount) || !regexForTracksCount.test(body.tracksCount)) {
        return res.status(400).send('Number of tracks field for music album must be in int format (from 0 to 99) and can\'t be null or empty')
    }
    
    if (!_.isString(body.publisher) || body.publisher.trim().length === 0) {
        return res.status(400).send('Publisher field for music album must be in string format and can\'t be null or empty')
    }
    
    // TODO try to change this to one function with bool return
    if (!regexForDate.test(publishedDateFromString) || _.isEmpty(body.publishedDate)) {
        return res.status(400).send('Published date must have valid format \(yyyy-mm-dd\), must be in range of 1900-01-01 - 2099-12-31 and can\'t be null or empty')
    }
    
    if (!_.isBoolean(body.ownLimitedEdition)) {
        return res.status(400).send('Own Limited Edition field for music album must be in boolean format and can\'t be null')
    }
    
    if (!_.isBoolean(body.ownPhysicalCD)) {
        return res.status(400).send('Own Physical CD field for music album must be in boolean format and can\'t be null')
    }
    
    if (!_.isBoolean(body.ownDigital)) {
        return res.status(400).send('Own Digital field for music album must be in boolean format and can\'t be null')
    } else {
        body.id = musicAlbumNextID++;
        musicAlbums.push(body);
        res.json(musicAlbums);
    }
})

app.delete('/musicalbums/:id', function (req, res) {
    var musicAlbumId = parseInt(req.params.id, 10);
    var matchedMusicAlbum = _.findWhere(musicAlbums, {id: musicAlbumId});
    
    if (!matchedMusicAlbum) {
        res.status(404).json({"error": "No music album found with that ID"});
    } else {
        musicAlbums = _.without(musicAlbums, matchedMusicAlbum);
        res.json(matchedMusicAlbum);
    }
})

app.put('/musicalbums/:id', function (req, res) {
    
    // Try to add error message when some try to pass field that is not expected in the object - e.g "ownDigitallll"
    
    var regexForDate = new RegExp('^(19|20)[0-9][0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')
    var regexForTracksCount = new RegExp('^([0-9]|[0-9][0-9])$')
    
    var musicAlbumId = parseInt(req.params.id, 10)
    var matchedMusicAlbum = _.findWhere(musicAlbums, {id: musicAlbumId})
    var body = _.pick(req.body, 'title', 'author', 'tracksCount', 'publisher',  'publishedDate', 'ownLimitedEdition', 'ownPhysicalCD', 'ownDigital')
    var publishedDateFromString = body.publishedDate
    var validAttributes = {}
        
    if (!matchedMusicAlbum) {
        return res.status(404).json({"error": "No music album found with that id"});
    }
    
    if (body.hasOwnProperty('title') && _.isString(body.title) && body.title.trim().length > 0) {
        validAttributes.title = body.title
    } else if (body.hasOwnProperty('title')) {
        return res.status(400).json({"error": 'Title field for music album must be in string format and can\'t be null or empty'})
    }
    
    if (body.hasOwnProperty('author') && _.isString(body.author) && body.author.trim().length > 0) {
        validAttributes.author = body.author
    } else if (body.hasOwnProperty('author')) {
        return res.status(400).json({"error": 'Author field for music album must be in string format and can\'t be null or empty'})
    }
    
    if (body.hasOwnProperty('tracksCount') && _.isNumber(body.tracksCount) && regexForTracksCount.test(body.tracksCount)) {
        validAttributes.tracksCount = body.tracksCount
    } else if (body.hasOwnProperty('tracksCount')) {
        return res.status(400).json({"error": 'Number of tracks field for music album must be in int format (from 0 to 99) and can\'t be null or empty'})
    }
    
    if (body.hasOwnProperty('publisher') && _.isString(body.publisher) && body.publisher.trim().length > 0) {
        validAttributes.publisher = body.publisher
    } else if (body.hasOwnProperty('publisher')) {
        return res.status(400).json({"error": 'Publisher field for music album must be in string format and can\'t be null or empty'})
    }
    
    if (body.hasOwnProperty('publishedDate') && regexForDate.test(publishedDateFromString) && !_.isEmpty(body.publishedDate)) {
        validAttributes.publishedDate = body.publishedDate
    } else if (body.hasOwnProperty('publishedDate')) {
        return res.status(400).json({"error": 'Published date must have valid format \(yyyy-mm-dd\), must be in range of 1900-01-01 - 2099-12-31 and can\'t be null or empty'})
    }
                                    
    if (body.hasOwnProperty('ownLimitedEdition') && _.isBoolean(body.ownLimitedEdition)) {
        validAttributes.ownLimitedEdition = body.ownLimitedEdition
    } else if (body.hasOwnProperty('ownLimitedEdition')) {
        return res.status(400).json({"error": 'Own Limited Edition field for music album must be in boolean format and can\'t be null'})
    }
    
    if (body.hasOwnProperty('ownPhysicalCD') && _.isBoolean(body.ownPhysicalCD)) {
        validAttributes.ownPhysicalCD = body.ownPhysicalCD
    } else if (body.hasOwnProperty('ownPhysicalCD')) {
        return res.status(400).json({"error": 'Own Physical CD field for music album must be in boolean format and can\'t be null'})
    }
    
    if (body.hasOwnProperty('ownDigital') && _.isBoolean(body.ownDigital)) {
        validAttributes.ownDigital = body.ownDigital
    } else if (body.hasOwnProperty('ownDigital')) {
        return res.status(400).json({"error": 'Own Digital field for music album must be in boolean format and can\'t be null'})
    }
        
    // update musicsAlbums array because object under matchedMusicAlbum is passed by reference
    _.extend(matchedMusicAlbum, validAttributes)
    
    res.json(matchedMusicAlbum)
    
});

app.listen(PORT, function () {
    console.log('Express listening on port ' + PORT);
});