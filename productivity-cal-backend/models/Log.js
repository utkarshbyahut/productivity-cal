const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Log', LogSchema)