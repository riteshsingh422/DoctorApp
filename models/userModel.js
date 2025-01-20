const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    isDoctor: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    seenNotification: {
        type: Array,
        default: [],
    },
    unseenNotification: {
        type: Array,
        default: [],
    },

},
    {
        timestamps: true
    })

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;