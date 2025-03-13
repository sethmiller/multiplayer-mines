var boardjs = require("../js/board.js"),
	managerjs = require("../js/manager.js"),
	uuid = require("uuid"),
	io = require("socket.io")(9000, {
		cors: {
			origin: "*"
		}
	});

var rowCount = 16,
	columnCount = 16,
	mineCount = 20,
	lobbyManager = new managerjs.LobbyManager();

io.sockets.on("connection", function (socket) {
	function error(error) {
		socket.emit("error", error);
	}

	socket.on("game.create", function (options) {
		var board = boardjs.builder(rowCount, columnCount, mineCount);
		var manager = new managerjs.GameManager(uuid.v4(), board);
		lobbyManager.addGame(manager);
		manager.joinGame(socket);

		socket.data.manager = manager;
		socket.emit("game.new", manager.forJSON());
	});

	socket.on("game.join", function (id) {
		var manager = lobbyManager.findGame(id);
		if (manager && manager.joinGame(socket)) {
			socket.data.manager = manager;
			socket.emit("game.new", manager.forJSON());
			socket.broadcast.to(manager.id).emit("game.update", manager.forJSON());
		} else {
			error("could not join game");
		}
	});

	socket.on("game.check.square", function (square) {
		const manager = socket.data.manager;
		if (manager) {
			manager.move(socket, square.row, square.column);
			io.sockets["in"](manager.id).emit("game.update", manager.forJSON());
		} else {
			error("Not in a game");
		}
	});

	socket.on("game.leave", function () {
		const manager = socket.data.manager;
		if (manager) {
			manager.leaveGame(socket);
			socket.del("manager");
		}
	});

	socket.on("disconnect", function () {
		const manager = socket.data.manager;
		if (manager) {
			manager.leaveGame(socket);
		}
	});
});

