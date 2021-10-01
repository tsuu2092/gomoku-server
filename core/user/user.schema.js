const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: {
        type: String,
        unique: [true, "Username is taken."],
        required: [true, "Username is required."],
        minlength: [6, "Username must have at least 6 characters"],
        maxlength: [100, "Username cannot have more than 16 characters"],
        validate: [/^[A-Za-z0-9]+$/,'Username must only contain characters and numbers']

    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false,
        minlength: [6, "Password must have at least 6 characters"],
        maxlength: [100, "Password cannot have more than 100 characters"],
    },
    elo: {
        type: Number,
        default: 1200,
        validate: {
            validator: Number.isInteger,
            message: '{VALUE} is not an integer'
        }
    }
})
const User = mongoose.model('user', UserSchema, 'users')
module.exports = User