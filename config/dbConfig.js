const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const connection = mongoose.connection;

connection.on('connected', () => {
});

connection.on('error', (error) => {
});

module.exports = mongoose;
