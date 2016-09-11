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