(function() {
var Puzzle = function(pieces, distance) {
	this.pieces = pieces;
	this.distance = distance;
	this.children = [];
	this.parent = null;
};
Puzzle.WIDTH = 3;
Puzzle.HEIGHT = 3;
Puzzle.SPACE = 9;
Puzzle.prototype = {
	f: function() {
		return this.g() + this.h2();
		//return this.g() + this.h2();
	},
	g: function() {
		return this.distance;
	},
	// 位置が正しくないタイルの数
	h1: function() {
		var fail = 0;
		for (var i=0;i<Puzzle.HEIGHT;++i) {
			for (var j=0;j<Puzzle.WIDTH;++j) {
				var correct = i * Puzzle.WIDTH + j + 1;
				this.pieces[i][j] !== correct && ++fail;
			}
		}
		return fail;
	},
	// マンハッタン距離
	h2: function() {
		var distance = 0;
		for (var i=0;i<Puzzle.HEIGHT;++i) {
			for (var j=0;j<Puzzle.WIDTH;++j) {
				var piece = this.pieces[i][j],
					correct = i * Puzzle.WIDTH + j + 1,
					currentPos = {
						x: (correct - 1) % 3,
						y: parseInt((correct - 1) / 3)
					},
					correctPos = {
						x: (piece - 1) % 3,
						y: parseInt((piece - 1) / 3)
					};
				distance += Math.abs(correctPos.x - currentPos.x) + Math.abs(correctPos.y - currentPos.y);
			}
		}
		return distance;
	},
	move: function(direction) {
		var prePos = this.getSpacePos(),
			nextPos = {
				x: prePos.x + direction.x,
				y: prePos.y + direction.y
			},
			nextPieces = [];
		for (var i=0;i<Puzzle.HEIGHT;++i) {
			nextPieces[i] = [];
			for (var j=0;j<Puzzle.WIDTH;++j) {
				nextPieces[i][j] = this.pieces[i][j];
			}
		}

		if (nextPos.x < 0 || nextPos.x >= Puzzle.WIDTH || nextPos.y < 0 || nextPos.y >= Puzzle.HEIGHT) {
			return false;
		}

		nextPieces[prePos.y][prePos.x] = this.pieces[nextPos.y][nextPos.x];
		nextPieces[nextPos.y][nextPos.x] = this.pieces[prePos.y][prePos.x];
		return nextPieces;
	},
	getSpacePos: function() {
		var pos = {};
		for (var i=0;i<Puzzle.HEIGHT;++i) {
			for (var j=0;j<Puzzle.WIDTH;++j) {
				if (this.pieces[i][j] === Puzzle.SPACE) {
					pos = {
						x: j,
						y: i
					};
				}
			}
		}
		return pos;
	},
	isFinished: function() {
		for (var i=0;i<Puzzle.HEIGHT;++i) {
			for (var j=0;j<Puzzle.WIDTH;++j) {
				var correct = i * Puzzle.WIDTH + j + 1;
				if (this.pieces[i][j] !== correct && this.pieces[i][j] !== Puzzle.SPACE) {
					return false;
				}
			}
		}
		return true;
	},
	matchPieces: function(pieces) {
		for (var i=0;i<Puzzle.HEIGHT;++i) {
			for (var j=0;j<Puzzle.WIDTH;++j) {
				if (this.pieces[i][j] !== pieces[i][j]) {
					return false;
				}
			}
		}
		return true;
	},
	draw: function(ctx, pos) {
		var x = pos * 110 + 40,
			y = this.distance * 80 + 10,
			width = 60,
			height = 60;
		this.center = {
			x: x + width / 2,
			y: y + height / 2
		};

		ctx.beginPath();
		ctx.strokeRect(x, y, width, height);

		ctx.moveTo(x + width / 3, y);
		ctx.lineTo(x + width / 3, y + height);
		ctx.stroke();
		ctx.moveTo(x + width * 2 / 3, y);
		ctx.lineTo(x + width * 2 / 3, y + height);
		ctx.stroke();
		ctx.moveTo(x, y + height / 3);
		ctx.lineTo(x + width, y + height / 3);
		ctx.stroke();
		ctx.moveTo(x, y + height * 2 / 3);
		ctx.lineTo(x + width, y + height * 2 / 3);
		ctx.stroke();

		for (var i=0;i<Puzzle.HEIGHT;++i) {
			for (var j=0;j<Puzzle.WIDTH;++j) {
				var text = this.pieces[i][j] === Puzzle.SPACE ? '' : this.pieces[i][j];
				ctx.fillText(text, x + width * (j+0.3) / Puzzle.WIDTH, y + height * (i+0.7) / Puzzle.HEIGHT);
			}
		}

		ctx.fillText(this.stepCount, x - 10, y);
		ctx.fillText('f(n)='+parseInt(this.f()), x - 40, y + 10);

		if (this.parent) {
			ctx.moveTo(this.center.x, this.center.y - width / 2);
			ctx.lineTo(this.parent.center.x, this.parent.center.y + width / 2);
			ctx.stroke();
		}

		if (this.isFinished()) {
			ctx.fillText('GOAL', x, y + height + 15);
		}
	}
};

var Astar = function(first) {
	var open = [],
		closed = [];
	open.push(first);
	
	var stepCount = 0;
	var step = function() {
		stepCount++;
		if (open.length === 0) {
			return true;
		}

		open.sort(function(a, b) {
			return a.f() - b.f();
		});
		var s = open.shift();
		closed.push(s);

		for (var i=0;i<4;++i) {
			var pieces = s.move({
				x: [-1, 0, 1, 0][i],
				y: [0, -1, 0, 1][i]
			});
			if (pieces && (!s.parent || !s.parent.matchPieces(pieces))) {
				var child = new Puzzle(pieces, s.distance + 1);
				child.stepCount = stepCount;
				child.parent = s;
				s.children.push(child);
				open.push(child);
				if (child.isFinished()) {
					return true;
				}
			}
		}

		return false;
	};
	
	while (!step()) {}
/*
	var timer = setInterval(function() {
		if (step()) {
			clearInterval(timer);
		}
		draw(first);
	}, 1000);
*/
};
var IDAstar = function(first) {
	var open = [],
		closed = [],
		cutoff = 0;
	
	var stepCount = 0;
	var step = function() {
		if (open.length === 0) {
			++cutoff;
			open = [first];
			return false;
		}

		var s;
		while (s = open.pop()) {
			if (s.isFinished()) {
				return true;
			}
			
			for (var i=0;i<4;++i) {
				var pieces = s.move({
					x: [-1, 0, 1, 0][i],
					y: [0, -1, 0, 1][i]
				});
				var child = new Puzzle(pieces, s.distance + 1);
				if (pieces && (!s.parent || !s.parent.matchPieces(pieces)) && child.f() <= cutoff) {
					child.stepCount = stepCount;
					child.parent = s;
					s.children.push(child);
					open.push(child);
				}
			}
		}
	};

	while (!step()) {}
/*
	var timer = setInterval(function() {
		if (step()) {
			clearInterval(timer);
		}
		draw(first);
	}, 100);
*/
};
var draw = function(first) {
	var nexts = [],
		currents,
		elm = document.getElementById('result'),
		ctx = elm.getContext('2d');
	ctx.clearRect(0, 0, elm.width, elm.height);
	nexts.push(first);
	
	while (nexts.length > 0) {
		currents = Array.apply(null, nexts);
		nexts = [];

		var pos = 0,
			current;
		while (current = currents.shift()) {
			current.draw(ctx, pos);
			++pos;

			for (var i=0,l=current.children.length;i<l;++i) {
				nexts.push(current.children[i]);
			}
		}
	}
};

// here is the first pieces
var first = new Puzzle([[1,3,Puzzle.SPACE],[4,2,8],[7,6,5]], 0);
Astar(first);

// draw how to solve the puzzle
window.addEventListener('load', function() {draw(first)});
})();
