$(document).ready(function() {
	var board = ko.mapping.fromJS(new Board()),
		playerId = ko.observable(""),
		joinGameId = ko.observable(),
		gameId = ko.observable(),
		scores = ko.observableArray([]),
		currentlyMoving = ko.observable();

	function updateGame(data) {
		currentlyMoving(data.board.currentlyMoving);
		board.rows().forEach(function(row) {
			row.squares().forEach(function(column) {
				var square = data.board.rows[row.number()][column.number()];
				column.mine = (square.mine || {});
				column.count(square.count || "");
				column.revealed(square.revealed);
			});
		});

		var _scores = [];
		for (var player in data.board.scores) {
			_scores.push({ id: player, score: data.board.scores[player] });
		}

		scores(_scores);
	}

	var socket = io.connect('http://localhost:9000')
		.on("connect", function(data) {
			playerId(socket.socket.sessionid);
		})
		.on("game.new", function(data) {
			console.log(data);

			gameId(data.id);
			ko.mapping.fromJS(new Board(data.board.rows.length, data.board.rows[0].length, data.mineCount), {}, board);
			updateGame(data);
		}).on("game.update", function(data) {
			console.log(data);
			updateGame(data);
		}).on("error", function(data) {
			console.log("something bad happened", data);
		});

	$("#create-game").on("click", function(event) {
		socket.emit("game.create", { type: "PUBLIC" });
	});

	$("#leave-game").on("click", function(event) {
		socket.emit("game.leave");
		gameId(null);
		scores([]);
		ko.mapping.fromJS(new Board(), {}, board);
	});

	$("#join-game").on("click", function(event) {
		socket.emit("game.join", joinGameId());
		joinGameId("");
	});

	var validateJoinGameId = ko.computed(function() {
		return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(joinGameId());
	});

	window.socket = socket;
	window.board = board;
	window.playerId = playerId;

	ko.applyBindings({
		board: board,
		currentlyMoving: currentlyMoving,
		gameId: gameId,
		joinGameId: joinGameId,
		playerId: playerId,
		scores: scores,
		validateJoinGameId: validateJoinGameId
	});
});
