class GameManager {
	constructor(id, board) {
		let self = this, maxPlayers = 2, gameType = "PUBLIC";

		this.players = [];
		this.id = id;
		this.currentlyMoving = null;

		function getScores() {
			let scores = {};

			self.players.forEach(function (player) {
				scores[player.id] = 0;
			});

			board.mines.forEach(function (mine) {
				if (mine.player) {
					scores[mine.player]++;
				}
			});

			return scores;
		}

		function withSquareBlock(row, column, callback) {
			let currentRow, currentColumn;

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

		function checkSquare(row, column) {
			let square = board.rows[row].squares[column];

			square.revealed = true;

			if (!square.count) {
				withSquareBlock(row, column, function (currentRow, currentColumn) {
					if (currentColumn && !currentColumn.revealed) {
						checkSquare(currentRow.number, currentColumn.number);
					}
				});
			}
		}

		this.checkSquare = function (player, row, column) {
			if ((row < 0 || row >= board.rows.length) || (column < 0 || column >= board.rows[row].squares.length)) {
				return true;
			}

			let square = board.rows[row].squares[column];

			if (square.revealed) {
				return true;
			} else if (typeof (square.mine.row) !== "undefined") {
				square.mine.player = player.id;
				square.revealed = true;
				return true;
			} else {
				checkSquare(row, column);
				return false;
			}
		};

		this.move = function (player, row, column) {
			if (player !== this.currentlyMoving) {
				return;
			} else if (!this.checkSquare(player, row, column)) {
				this.currentlyMoving = (this.players[0] === player ? this.players[1] : this.players[0]);
			}
		};

		this.joinGame = function (player) {
			if (this.players.length < maxPlayers) {
				player.join(this.id);
				this.players.push(player);
				if (!this.currentlyMoving) {
					this.currentlyMoving = player;
				}

				return true;
			}

			return false;
		};

		this.leaveGame = function (player) {
			let index = this.players.indexOf(player);
			if (index >= 0) {
				player.leave(this.id);
				this.players.splice(index, 1);
				if (this.currentlyMoving === player) {
					this.currentlyMoving = null;
				}
			}
		};

		this.isOpen = function () {
			return this.players.length < maxPlayers && gameType === "PUBLIC";
		};

		this.forJSON = function () {
			let b = { rows: [], currentlyMoving: this.currentlyMoving ? this.currentlyMoving.id : null, scores: getScores() };

			board.rows.forEach(function (row) {
				let squares = [];
				row.squares.forEach(function (square) {
					let s = {};
					if (square.revealed) {
						s.count = square.count;
						s.mine = square.mine;
						s.revealed = square.revealed;
					}
					squares.push(s);
				});
				b.rows.push(squares);
			});

			return { id: this.id, board: b, mineCount: board.mines.length };
		};
	}
}

class LobbyManager {
	constructor() {
		let games = {};

		this.addGame = function (manager) {
			games[manager.id] = manager;
		};

		this.removeGame = function (manager) {
			delete games[manager.id];
		};

		this.findGame = function (id) {
			return games[id];
		};

		this.listGames = function () {
			var openGames = [];

			for (var game in games) {
				if (games[game].isOpen()) {
					openGames.push(games[game]);
				}
			}

			return openGames;
		};
	}
}

if (typeof exports !== "undefined") {
	exports.GameManager = GameManager;
	exports.LobbyManager = LobbyManager;
}
