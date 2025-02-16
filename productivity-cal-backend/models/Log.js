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
    description: {
        type: String,  // New field (Optional)
        default: ""
    },
    startTime: {
        type: String,  // Storing time as a string (e.g., "14:00" for 2 PM)
        default: ""
    },
    endTime: {
        type: String,  // Storing time as a string (e.g., "15:00" for 3 PM)
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Log', LogSchema);
