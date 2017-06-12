const port = 5000,
	/*sqlite3 		= require('sqlite3').verbose(),
	db 				= new sqlite3.Database(':memory:'),*/
	credentials 	= require('./private/credentials'),
	passport 		= require('passport'),
	strategyFB 		= require('passport-facebook').Strategy,
	express 		= require('express'),
	session 		= require('express-session'),
	app 			= express();
/*
db.serialize(function() {
	db.run("CREATE TABLE users (id TEXT, name TEXT, token TEXT)");

	var stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?)");
	for (var i = 0; i < 10; i++) {
		stmt.run("Ipsum " + i, "Some name", "Token" + i*i);
	}
	stmt.finalize();
});

function doStuffWithLoggedInUser(profile) {
	console.log('APA!', profile);
}

function findOrCreateUser(profile) {
	db.each("SELECT count(*) as userExist, id, name FROM users WHERE id = 'Ipsum 10'", function(err, row) {
		console.log('hey!', row);
		if (row && row.userExist) {
			doStuffWithLoggedInUser({
				id: row.id,
				name: row.name
			});
		} else {
			var stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?)");
			stmt.run(profile.id, profile.name, 'randString');
			stmt.finalize();

			doStuffWithLoggedInUser({
				id: row.id,
				name: row.name
			});
		}
	});
}

//findOrCreateUser('Ipsum 9');
*/

passport.use(new strategyFB({
		profileFields: ['id', 'displayName'],
		clientID: credentials.facebook.id,
		clientSecret: credentials.facebook.secret,
		callbackURL: credentials.facebook.callback
	},
	function(accessToken, refreshToken, profile, done) {
		//console.log('A', profile);
		done(null, profile);
		/*
		User.findOrCreate(function(a) {
			console.log('APA!', a);
		}, function(err, user) {
			if (err) { return done(err); }
			done(null, user);
		});
		*/
		//doStuffWithLoggedInUser(profile);
	}
));

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});

app.use(express.static('public'));
app.use(session({ secret: 'supersecret', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (request, response, next) => {
		if (request.user) {
			console.log('Logged in', request.user);
			next();
		} else {
			console.log('Not logged in?');
			response.redirect('/login');
		}
	}, (request, response) => {
		localUser = request.user.displayName;
		response.sendFile(__dirname + '/index.htm');
	}
);

app.get('/login', function (req, res) {
	res.sendFile(__dirname + "/login.htm" );
});

app.get('/logout', function(request, response){
	request.logout();
	response.redirect('/');
});

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/callback',
	passport.authenticate('facebook', { successRedirect: '/',
		failureRedirect: '/login' })
);

app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/callback',
	passport.authenticate('google', { successRedirect: '/',
		failureRedirect: '/login' })
);

var io = require('socket.io').listen(app.listen(port));

var rooms = {
	'#All': {
		users: {},
		messages: [{
			message: 'Welcome to the chat',
			user: 'Chatbot'
		}]
	}
};

var users = {'uniqueuserid': '@kasper13'};

function tableTennis() {
	setTimeout(tableTennis, 8000);
	io.sockets.emit('ping');
}

io.sockets.on('connect', function (socket) {
	var player = true;

	users[socket.id] = socket;
socket.emit('init', {
	status: localUser
});
console.log('new connection', socket.id, socket.conn.remoteAddress);

	socket.join('#All', function() {
		socket.activeRoom = '#All';

		socket.emit('joinedChannel', {
			status: 'Joined ' + '#All',
			id: '#All',
			messages: rooms[socket.activeRoom].messages
		});
	});

	socket.on('host', function (data) {
		data.id = data.id.trim();
		data.id = data.id[0] === '#' || data.id[0] === '@' ? data.id : '#' + data.id;
//console.log('host data', data, users);
		if (data.id in rooms) {
			socket.emit('errorMessage', 'Room ' + data.id + ' already exists');
		} else if (data.id.length > 1) {
			if (data.id[0] === '@') {
				var result = Object.keys(users).filter(function(userid) { return users[userid] === data.id; });

				if (!result.length) {
					socket.emit('errorMessage', 'User does not exist');
					return false;
				}
			} else {
				data.id = data.id.toLowerCase();
			}
//console.log(data.id, result);
// USER GETS UPDATED TO !@
			rooms[data.id] = {
				users: {},
				messages: []
			};

			socket.join(data.id, function() {
				socket.activeRoom = data.id;

				socket.emit('joinedChannel', {
					status: 'Created ' + data.id,
					id: data.id
				});
			});
		}
	});

	socket.on('join', function (data) {
		data.id = data.id.trim();
		if (data.id == socket.activeRoom) {
			return;
		} else if (data.id[0] !== '@') {
			data.id = data.id.toLowerCase();
		}

		if (data.user[0] !== '@') {
			data.user = '@' + data.user;
		}
		if (users[socket.id] !== data.user) {
			users[socket.id] = data.user;
		}
console.log('Rooms:', Object.keys(rooms));
		if (data.id in rooms) {
			socket.join(data.id, function() {

				socket.activeRoom = data.id;
console.log('Join datainrooms', rooms[socket.activeRoom]);
				socket.emit('joinedChannel', {
					status: 'Joined ' + data.id,
					id: data.id,
					messages: rooms[socket.activeRoom].messages
				});
			});
		} else {
			if (data.id.length > 1) {
				rooms[data.id] = {
					users: {},
					messages: []
				};
console.log('Join Created?', rooms[data.id]);
				socket.join(data.id, function() {
					socket.activeRoom = data.id;

					socket.emit('joinedChannel', {
						status: 'Created ' + data.id,
						id: data.id
					});
				});
			}
		}
	});

	socket.on('list', function (data) {
		var pattern = data.string;
		if (!pattern.length) {
			return;
		}

		var allRooms = Object.keys(rooms);
		var socketRooms = socket.rooms;
		var result = allRooms.filter(function(room) { return socketRooms.hasOwnProperty(room) == false && room.indexOf(pattern) > -1; });

		if (result.length) {
			socket.emit('list', {
				list: result
			});
		}
	});

	socket.on('leave', function (room) {
		socket.leave(room);
	});

	socket.on('switch', function (data) {
		if (data.id === socket.activeRoom) {
			return;
		}

		socket.activeRoom = data.id;
console.log('Switch', rooms[data.id]);
		socket.emit('joinedChannel', {
			id: data.id,
			messages: rooms[data.id].messages
		});
	});

	socket.on('send', function (data) {
		if (!data.message) {
			return;
		} else if (!data.message.match(/^([#a-zA-Z0-9])+/)) {
			socket.emit('errorMessage', 'Invalid name!');
			return;
		}

		if (data.user[0] !== '@') {
			data.user = '@' + data.user;
		}
		if (users[socket.id] !== data.user) {
			users[socket.id] = data.user;
		}

		rooms[socket.activeRoom].messages.push(data);
//		data.id = socket.activeRoom;

		if (socket.activeRoom[0] === '@') {
			var targetUser = Object.keys(users).filter(function(userid) { return users[userid] === data.id; });

			if (targetUser && typeof io.sockets.connected[targetUser] !== 'undefined') {
				data.target = data.id;

				rooms[data.user].messages.push(data);
				io.sockets.connected[targetUser].emit('userMessage', data);
				io.sockets.connected[socket.id].emit('userMessage', data);
			} else {
console.log('undefined targetuser:', targetUser);
data.message = io.sockets.connected;
console.log('crash test 1');
//io.sockets.in('#All').emit('message', data);
console.log('crash test 2');
			}
		} else {
console.log('socket.activeRoom', socket.activeRoom);
			io.sockets.in(socket.activeRoom).emit('message', data);
		}
	});

	socket.on('pong', function(data) {
		console.log('Pong');
	});

	socket.on('disconnecting', function (data) {
console.log('disconnecting...', data, socket.id);
delete users[socket.id];
		setTimeout(function() {
			if (player) {
console.log('truly disconnected');
			} else {
console.log('NOT disconnected');
			}
		}, 3000);
	});
});

console.log("Listening on port " + port);
