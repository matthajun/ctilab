const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
let config = require('../config/config')[env];
const fs = require('fs');
const path = require('path');
const winston = require('../config/winston')(module);

//config.logging = msg => winston.info(msg);
config.logQueryParameters = false;
config.logging = false;
// test
const db = {};

let sequelize = new Sequelize(
    config.database, config.username, config.password ,config
);

db.sequelize = sequelize;


fs
    .readdirSync(__dirname)
    .filter(function(file) {
        return (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js' );
    }).forEach(function(file) {
    try{
        const Model = require(path.join(__dirname, file));
        db[Model.name] = Model;
        Model.init(sequelize);
        if(Model.name !=='User')Model.removeAttribute('id');
    }catch (e) {
        console.log(e);
    }
});

Object.keys(db).forEach(modelName => {
    try{
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    }catch (e) {
        console.error(e);
    }
});

module.exports = db;
