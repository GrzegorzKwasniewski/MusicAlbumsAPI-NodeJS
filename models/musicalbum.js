module.exports = function(sequelize, DataTypes) {
	return sequelize.define('musicalbum', {
		title: {
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250]
			}
		},
		author: {
			type: DataTypes.STRING,
			allowNull: false,
            validate: {
				len: [1, 250]
			}
		},
        tracksCount: {
            type: DataTypes.INTEGER,
			allowNull: false,
        },
        publisher: {
			type: DataTypes.STRING,
			allowNull: false,
            validate: {
				len: [1, 250]
			}
		},
        publishedDate: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
        ownLimitedEdition: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
            defaultValue: false
		},
        ownPhysicalCD: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
            defaultValue: false
		},
        ownDigital: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
            defaultValue: false
		}
	});
};
