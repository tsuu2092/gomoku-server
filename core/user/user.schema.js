const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
    username: {
        type: String,
        unique: [true, "Username is taken."],
        required: [true, "Username is required."]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false,
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