function clone2D(arr = []) {
    return arr.map(inner => [...inner])
}

module.exports = clone2D