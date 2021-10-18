const clone2D = require("./helpers/clone2D")

const X = 'X'
const O = 'O'
const E = ''
const SIZE = 19

const emptyBoard = [
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
    [E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E, E,],
]

function isValidPosition(n) {
    return n >= 0 && n < SIZE
}

function clampPosition(n) {
    return Math.max(0, Math.min(n, SIZE - 1))
}


class Board {
    constructor({ player1, player2 }) {
        this.player1 = player1
        this.player2 = player2
        this.data = clone2D(emptyBoard)
        const randomNumber = Math.floor(Math.random() * 2)
        this.xPlayer = randomNumber === 1 ? player1 : player2
        this.oPlayer = randomNumber === 0 ? player1 : player2
        this.currentTurn = this.xPlayer
        this.winner = null
        this.loser = null
        this.moveCount = 0
        this.timeoutHandler = null
    }

    addMove({ playerId, r, c }) {
        if (this.currentTurn !== playerId) return false
        if (this.data[r][c] !== E) return false
        const stone = this.getCurrentStone()
        this.data[r][c] = stone
        this.moveCount++
        if (this.isDraw()) return true
        this.checkWinner({ stone, r, c })
        // console.log(`Winner ${this.winner}`)
        if (this.winner) return true
        this.switchTurn()
        return true
    }

    isDraw() {
        return this.moveCount === SIZE * SIZE
    }

    checkWinner({ stone, r, c }) {
        if (!this.hasWin({ stone, originR: r, originC: c })) return
        this.winner = this.currentTurn
        this.loser = this.winner === this.player1 ? this.player2 : this.player1
    }

    getCurrentStone() {
        return this.currentTurn === this.xPlayer ? X : O
    }

    switchTurn() {
        this.currentTurn = this.currentTurn === this.xPlayer ? this.oPlayer : this.xPlayer
    }


    hasWin({ originR, originC, stone }) {
        return this.hasWinByRow({ originR, originC, stone }) || this.hasWinByColumn({ originR, originC, stone }) || this.hasWinByMainDiagonal({ originR, originC, stone }) || this.hasWinByCounterDiagonal({ originR, originC, stone })
    }

    hasWinByRow({ originR, originC, stone }) {
        const colStart = clampPosition(originC - 4)
        const colEnd = clampPosition(originC + 4)
        let currentStreak = 0
        let maxStreak = 0
        for (let c = colStart; c <= colEnd; c++) {
            // Reset to 0 if the cell is not the desired stone
            if (this.data[originR][c] !== stone) {
                maxStreak = Math.max(currentStreak, maxStreak)
                currentStreak = 0
                continue
            }
            currentStreak++
        }
        maxStreak = Math.max(currentStreak, maxStreak)
        return maxStreak === 5
    }

    hasWinByColumn({ originR, originC, stone }) {
        const rowStart = clampPosition(originR - 4)
        const rowEnd = clampPosition(originR + 4)
        let currentStreak = 0
        let maxStreak = 0
        for (let r = rowStart; r <= rowEnd; r++) {
            // Reset to 0 if the cell is not the desired stone
            if (this.data[r][originC] !== stone) {
                maxStreak = Math.max(currentStreak, maxStreak)
                currentStreak = 0
                continue
            }
            currentStreak++
        }
        maxStreak = Math.max(currentStreak, maxStreak)
        return maxStreak === 5
    }

    hasWinByMainDiagonal({ originR, originC, stone }) {
        let currentStreak = 0
        let maxStreak = 0
        for (let i = -4; i <= 4; i++) {
            const r = originR + i
            const c = originC + i
            if (!isValidPosition(r) || !isValidPosition(c)) continue
            if (this.data[r][c] !== stone) {
                maxStreak = Math.max(currentStreak, maxStreak)
                currentStreak = 0
                continue
            }
            currentStreak++
        }
        maxStreak = Math.max(currentStreak, maxStreak)
        return maxStreak === 5
    }

    hasWinByCounterDiagonal({ originR, originC, stone }) {
        let currentStreak = 0
        let maxStreak = 0
        for (let i = -4; i <= 4; i++) {
            const r = originR + i
            const c = originC - i
            if (!isValidPosition(r) || !isValidPosition(c)) continue
            if (this.data[r][c] !== stone) {
                maxStreak = Math.max(currentStreak, maxStreak)
                currentStreak = 0
                continue
            }
            currentStreak++
        }
        maxStreak = Math.max(currentStreak, maxStreak)
        return maxStreak === 5
    }
}

module.exports = { Board, X, O }