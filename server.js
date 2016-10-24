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
    var predicateObject = {}
    
    if (queryParams.hasOwnProperty('title')) {
        predicateObject.title = {
            $like: '%' + queryParams.title + '%'
        }
    }
    
    if (queryParams.hasOwnProperty('author')) {
        predicateObject.author = {
            $like: '%' + queryParams.author + '%'
        }
    }
    
    if (queryParams.hasOwnProperty('publisher')) {
        predicateObject.publisher = {
            $like: '%' + queryParams.publisher + '%'
        }
    }
    
    // TRY TO IMPLEMENT SEARCH OF TRACKS COUNT AND PUBLISHED DATA
    
    if (queryParams.hasOwnProperty('ownLimitedEdition') && queryParams.ownLimitedEdition === 'true') {
        predicateObject.ownLimitedEdition = true
    } else if (queryParams.hasOwnProperty('ownLimitedEdition') && queryParams.ownLimitedEdition === 'false') {
        predicateObject.ownLimitedEdition = false
    }
    
    if (queryParams.hasOwnProperty('ownPhysicalCD') && queryParams.ownPhysicalCD === 'true') {
        predicateObject.ownPhysicalCD = true
    } else if (queryParams.hasOwnProperty('ownPhysicalCD') && queryParams.ownPhysicalCD === 'false') {
        predicateObject.ownPhysicalCD = false
    }
    
    if (queryParams.hasOwnProperty('ownDigital') && queryParams.ownDigital === 'true') {
        predicateObject.ownDigital = true
    } else if (queryParams.hasOwnProperty('ownDigital') && queryParams.ownDigital === 'false') {
        predicateObject.ownDigital = false
    }
        
    // jak to zrobić, żeby wyszukiwało tylko w jednym, a nie w trzech jednocześnie?
    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        predicateObject.title = {
            $like: '%' + queryParams.q + '%'
        }
        
        predicateObject.author = {
            $like: '%' + queryParams.q + '%'
        }
        
        predicateObject.publisher = {
            $like: '%' + queryParams.q + '%'
        }
    }
    
    db.musicalbums.findAll({where: predicateObject}).then(function (musicalbums) {
        res.json(musicalbums)
    }, function (e) {
        res.status(500).send()
    })
})

app.get('/musicalbums/:id', function (req, res) {
    var musicAlbumID = parseInt(req.params.id, 10)
    db.musicalbums.findById(musicAlbumID).then(function (musicAlbum) {
        if (!!musicAlbum) {
            res.json(musicAlbum.toJSON())
        } else {
            res.status(404).send()
        }
    }, function (e) {
        res.status(500).send()
    })
})

app.post('/musicalbums', function (req, res) {

    var body = _.pick(req.body, 'title', 'author', 'tracksCount', 'publisher',  'publishedDate', 'ownLimitedEdition', 'ownPhysicalCD', 'ownDigital')
    
    db.musicalbums.create(body).then(function (musicalbums) {
        res.json(musicalbums.toJSON())
    }, function (e) {
        res.status(400).json(e)
    })
})

app.post('/users/login', function (req, res) {
	var body = _.pick(req.body, 'email', 'password')
	var userInstance;

	db.user.authenticate(body).then(function (user) { // pass authenticated user
        // when we authenticate our user we want to create a token for him
		var token = user.generateToken('authentication');
        // we write it like this so we can pass user to another 'then' call
		userInstance = user;

		return db.token.create({
            // this will be coverted to hash and this hash will be stored - see token.js
			token: token
		});
	}).then(function (tokenInstance) {
        // this is where we send back our token in respond
		res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON()); // userInstance is an user from db and in user model You have method toPublicJSON()
	}).catch(function () {
		res.status(401).send();
	})
})

app.delete('/musicalbums/:id', function (req, res) {
    var musicAlbumId = parseInt(req.params.id, 10);
    
    db.musicalbums.destroy({
        where: {
            id: musicAlbumId
        }
    }).then(function (rowsDeleted) {
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: 'There is no music album with specified ID'
            })
        } else {
            res.status(204).send()
        }
    }, function (e) {
        res.status(500).send()
    })
})

app.put('/musicalbums/:id', function (req, res) {
    
    // Try to add error message when someone try to pass field that is not expected in the object - e.g "ownDigitallll"
    
    var regexForDate = new RegExp('^(19|20)[0-9][0-9]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$')
    var regexForTracksCount = new RegExp('^([0-9]|[0-9][0-9])$')
    
    var musicAlbumId = parseInt(req.params.id, 10)
    var body = _.pick(req.body, 'title', 'author', 'tracksCount', 'publisher',  'publishedDate', 'ownLimitedEdition', 'ownPhysicalCD', 'ownDigital')
    //var publishedDateFromString = body.publishedDate
    var validAttributes = {}
    
    if (body.hasOwnProperty('title')) {
		validAttributes.title = body.title;
	}

	if (body.hasOwnProperty('author')) {
		validAttributes.author = body.author;
	}

	db.musicalbums.findById(musicAlbumId).then(function(musicAlbum) {
		if (musicAlbum) {
			musicAlbum.update(validAttributes).then(function(musicAlbum) {
				res.json(musicAlbum.toJSON());
			}, function(e) {
				res.status(400).json(e); // 400 error is invalid syntax
			});
		} else {
			res.status(404).send();
		}
	}, function() {
		res.status(500).send();
	})
        
//    if (!matchedMusicAlbum) {
//        return res.status(404).json({"error": "No music album found with that id"});
//    }
//    
//    if (body.hasOwnProperty('title') && _.isString(body.title) && body.title.trim().length > 0) {
//        validAttributes.title = body.title
//    } else if (body.hasOwnProperty('title')) {
//        return res.status(400).json({"error": 'Title field for music album must be in string format and can\'t be null or empty'})
//    }
//    
//    if (body.hasOwnProperty('author') && _.isString(body.author) && body.author.trim().length > 0) {
//        validAttributes.author = body.author
//    } else if (body.hasOwnProperty('author')) {
//        return res.status(400).json({"error": 'Author field for music album must be in string format and can\'t be null or empty'})
//    }
//    
//    if (body.hasOwnProperty('tracksCount') && _.isNumber(body.tracksCount) && regexForTracksCount.test(body.tracksCount)) {
//        validAttributes.tracksCount = body.tracksCount
//    } else if (body.hasOwnProperty('tracksCount')) {
//        return res.status(400).json({"error": 'Number of tracks field for music album must be in int format (from 0 to 99) and can\'t be null or empty'})
//    }
//    
//    if (body.hasOwnProperty('publisher') && _.isString(body.publisher) && body.publisher.trim().length > 0) {
//        validAttributes.publisher = body.publisher
//    } else if (body.hasOwnProperty('publisher')) {
//        return res.status(400).json({"error": 'Publisher field for music album must be in string format and can\'t be null or empty'})
//    }
//    
//    if (body.hasOwnProperty('publishedDate') && regexForDate.test(publishedDateFromString) && !_.isEmpty(body.publishedDate)) {
//        validAttributes.publishedDate = body.publishedDate
//    } else if (body.hasOwnProperty('publishedDate')) {
//        return res.status(400).json({"error": 'Published date must have valid format \(yyyy-mm-dd\), must be in range of 1900-01-01 - 2099-12-31 and can\'t be null or empty'})
//    }
//                                    
//    if (body.hasOwnProperty('ownLimitedEdition') && _.isBoolean(body.ownLimitedEdition)) {
//        validAttributes.ownLimitedEdition = body.ownLimitedEdition
//    } else if (body.hasOwnProperty('ownLimitedEdition')) {
//        return res.status(400).json({"error": 'Own Limited Edition field for music album must be in boolean format and can\'t be null'})
//    }
//    
//    if (body.hasOwnProperty('ownPhysicalCD') && _.isBoolean(body.ownPhysicalCD)) {
//        validAttributes.ownPhysicalCD = body.ownPhysicalCD
//    } else if (body.hasOwnProperty('ownPhysicalCD')) {
//        return res.status(400).json({"error": 'Own Physical CD field for music album must be in boolean format and can\'t be null'})
//    }
//    
//    if (body.hasOwnProperty('ownDigital') && _.isBoolean(body.ownDigital)) {
//        validAttributes.ownDigital = body.ownDigital
//    } else if (body.hasOwnProperty('ownDigital')) {
//        return res.status(400).json({"error": 'Own Digital field for music album must be in boolean format and can\'t be null'})
//    }
//        
//    // update musicsAlbums array because object under matchedMusicAlbum is passed by reference
//    _.extend(matchedMusicAlbum, validAttributes)
//    
//    res.json(matchedMusicAlbum)
//    
});

db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log('Express listening on port ' + PORT);
    });
})