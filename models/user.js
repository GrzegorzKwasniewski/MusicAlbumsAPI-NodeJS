var bcrypt = require('bcryptjs')
var _ = require('underscore')
var cryptojs = require('crypto-js')
var jsonWebToken = require('jsonwebtoken')

module.exports = function(sequelize, DataTypes) {
	var user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
            validate: {
                isEmail: true
            }
		},
        // we will use becrypt to generate salt
        // we will appednd salt to the of password for more security
        salt: {
            type: DataTypes.STRING  
        },
        password_hash: {
            type: DataTypes.STRING  
        },
		password: {
			type: DataTypes.VIRTUAL, // password won't be stored in database
			allowNull: false,
            validate: {
				len: [7, 100]
			},
            // this is setter for password field
            // value will be password specified by sender
            set: function(value) {
                // the default cost of proceesing data is 10
                var salt = bcrypt.genSaltSync(12)
                var hashedPassword = bcrypt.hashSync(value, salt)
                
                this.setDataValue('password', value)
                this.setDataValue('salt', salt)
                this.setDataValue('password_hash', hashedPassword)
            }
		}
	}, {
        hooks: {
            // run this before validating user data
            beforeValidate: function (user, options) {
                if (typeof user.email === 'string') {
                    user.email = user.email.toLowerCase()
                }
            }
        },
        // from Docs 'Provide functions that are added to the model (Model)'
        classMethods: {
            // body will be passed later - when You will call this method
            authenticate: function (body) {
                return new Promise(function (resolve, reject) {
                        
                    if (typeof body.email !== 'string' || typeof body.password !== 'string') {
                        return reject()
                    }
                    user.findOne({
                        where: {
                            email: body.email // check if email form database is equal to request email
                        }
                    }).then(function (user) {
                        if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
                            return reject()
                        }
                        resolve(user)
                    }, function (e) {
                        reject()
                    })  
                })
            },
            // token will be passed later - when You will call this method
            findByToken: function (passedToken) {
                return new Promise(function (resolve, reject) {
                    try {
                        // get data from header with token
                        // check aginst token that is generated with generateToken method below
                        var decodedJWT = jsonWebToken.verify(passedToken, '#$rte!@23') // second argument is secretOrPublicKey
                        var bytes = cryptojs.AES.decrypt(decodedJWT.token, '#$rte!@23')
                        var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8))
                        
                        user.findById(tokenData.id).then(function (user) {
                            if (user) {
                                resolve(user)
                            } else {
                                reject()
                            }
                        }, function (e) {
                            console.error(e)
                            reject()
                        })
                    } catch (e) {
                        console.error(e)
                        reject()
                    }
                })
            } 
        },
        // from Docs 'Provide functions that are added to each instance (DAO)'
        instanceMethods: {
            toPublicJSON: function() {
                var json = this.toJSON() // by this we mean user
                return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt')
            },
            generateToken: function (type) {
                if (!_.isString(type)) {
                    undefined
                } 
                
                try {
                    // this.get('id') will get id from actual instance
                    // in this case type wiil 'Authentication' as we will pass it to our call from server.js
                    var stringData = JSON.stringify({id: this.get('id'), type: type}) // we are creating object in line
                    // TESTING
                    console.log("README ********************" + stringData)
                    var encryptedData = cryptojs.AES.encrypt(stringData, '#$rte!@23').toString()
                    var token = jsonWebToken.sign({
                        token: encryptedData
                    }, '#$rte!@23')
                    
                    return token
                    
                } catch (e) {
                    return undefined
                }
            }
        }
    });
    
    return user
};