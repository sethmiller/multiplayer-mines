class Square {
	/**
	 * 
	 * @param {Number} number 
	 */
	constructor(number) {
		this.number = number;
		this.revealed = false;
		this.mine = {};
		this.count = "";
	}
}

class Row {
	/**
	 * 
	 * @param {Number} number 
	 * @param {Number} columnCount 
	 */
	constructor(number, columnCount) {
		this.number = number;
		this.squares = [];

		for (var i = 0; i < columnCount; i++) {
			this.squares.push(new Square(i));
		}
	}
}

class Mine {
	constructor(row, column) {
		this.row = row;
		this.column = column;
		this.player = null;
	}
}

class Board {
	/**
	 * 
	 * @param {Number} rowCount 
	 * @param {Number} columnCount 
	 * @param {Number} mineCount 
	 */
	constructor(rowCount, columnCount, mineCount) {
		this.mineCount = mineCount;

		this.rows = [];
		this.mines = [];

		for (var i = 0; i < rowCount; i++) {
			this.rows.push(new Row(i, columnCount));
		}

		this.checkSquare = function (socket, row, column) {
			socket.emit("game.check.square", { row: row, column: column });
		};
	}
}

/**
 * 
 * @param {Number} rowCount 
 * @param {Number} columnCount 
 * @param {NUmber} mineCount 
 * @returns 
 */
function builder(rowCount, columnCount, mineCount) {
	var board = new Board(rowCount, columnCount, mineCount);

	function rand(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	function withSquareBlock(row, column, callback) {
		var currentRow, currentColumn;

		[-1, 0, 1].forEach(function (rowOffset) {
			currentRow = board.rows[row + rowOffset];
			if (currentRow) {
				[-1, 0, 1].forEach(function (columnOffset) {
					currentColumn = currentRow.squares[column + columnOffset];
					callback(currentRow, currentColumn);
				});
			}
		});
	}

	function countSquare(row, column) {
		let count = 0;
		withSquareBlock(row, column, function (currentRow, currentColumn) {
			if (currentColumn && typeof (currentColumn.mine.row) !== "undefined") {
				count++;
			}
		});

		return count;
	}

	let row, column, mine;
	while (board.mines.length < mineCount) {
		row = rand(0, rowCount);
		column = rand(0, columnCount);

		if (typeof (board.rows[row].squares[column].mine.row) === "undefined") {
			mine = new Mine(row, column);
			board.rows[row].squares[column].mine = mine;
			board.mines.push(mine);
		}
	}

	board.rows.forEach(function (row, r) {
		row.squares.forEach(function (square, c) {
			if (typeof (square.mine.row) === "undefined") {
				square.count = countSquare(r, c) || "";
			}
		});
	});

	return board;
}

if (typeof exports !== "undefined") {
	exports.Board = Board;
	exports.builder = builder;
}

