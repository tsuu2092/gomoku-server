const K = 16

// Probability of rating 1 win against rating 2
function probability(r1, r2) {
    return 1 / (1 + 1 * Math.pow(10, (r2 - r1) / 400))
}

function calculateEloPreview({ r1, r2 }) {
    const p1 = probability(r1, r2)
    const p2 = probability(r2, r1)
    const highP = Math.max(p1, p2)
    const lowP = Math.min(p1, p2)
    let high = Math.round(K * highP)
    let low = Math.round(K * lowP)
    let draw = Math.round(K * (0.5 - lowP))
    return { high, low, draw }
}

function calculateElo({ r1, r2, w }) {
    const p1 = probability(r1, r2)
    const p2 = probability(r2, r1)
    let newR1 = r1
    let newR2 = r2
    if (w === 1) {
        newR1 += K * (1 - p1)
        newR2 += K * (0 - p2)
    } else if (w === 2) {
        newR1 += K * (0 - p1)
        newR2 += K * (1 - p2)
        // Draw
    } else if (w === 0) {
        newR1 += K * (0.5 - p1)
        newR2 += K * (0.5 - p2)
    }
    newR1 = Math.round(newR1)
    newR2 = Math.round(newR2)
    return { r1: newR1, r2: newR2 }
}

module.exports = { calculateElo, calculateEloPreview }