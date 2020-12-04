var physics = (function () {
  var _shotKeeper = new _shotKeeper(); // shotKeeper class instance

  // Updates 
  // TODO: Also handles collisions
  function _update(dt = 0) { // TODO: time blind (gameArea has time only)
    gameArea.entities().forEach(function(entity) {
      // TODO: Need to implement both X and Y directions (only use one of those atm)
      entity.position.x += entity.direction.x * entity.speed.x * dt;
      entity.position.y += entity.direction.y * entity.speed.y * dt;
    });
  }

  // Is there a better way to define an object with properties? Because this 
  // function will not be used as a data type or anything
  function _shotKeeper() { // class in charge of keeping tabs on all bullets
    this.addShot = function(position, width = 5, height = 15, direction, speed, color = "blue") {
      // Given where bullet should spawn (x, y) but need to center the bullet
      // TODO: Make bullet spawn without touching player, account for this 
      // Can possibly circumvent this by differentiating player and invader
      // bullets
      // GRID need to change shot depending on if player or invader shoot it 
      // (displacement/side it comes out from is different)
      // Can do this under the function call for each of them (TODO) then
      // won't have to specify the position here, but in the addShot call in
      // either the invader or the player
      this.position  = new vector2d(position.x, position.y - height/2);
      this.width     = width;
      this.height    = height;
      this.direction = direction;
      this.speed     = speed;
      this.color     = color;
     
      gameArea.shots().push(new gameToken(this.position, this.width, this.height, this.direction, this.speed, this.color));
    }

    // Redefine clear/draw to render all the bullets. Probably though can use the
    // same kind of approach as invaders, defining a 'move' property. If so, then
    // I can DRY out the methods' code into a single function, and use said 
    // function in each object class!! <- may be unable to due to how certain
    // things move, and movement is simply adding/subtracting x and y. The draws
    // are already DRYed out
    this.update = function() {
      //TODO: Add collision check, remove if collision
      // Delete individual shot if it leaves canvas (cleanup)
      // Movement
      gameArea.shots().forEach(function(shot) {
        // Check bounds
        if(shot.hitbox().top() > canvas.height || shot.hitbox().bottom() < 0) {
          // gameArea.shots().splice(shot, 1);
          gameArea.willDelete().push(shot);
        }
        // **********************************************************************
        else { // advance
          let ydirection = shot.direction.y * shot.speed.y;
          shot.position.y += ydirection * dt;
        }
        // **********************************************************************
      });
    }

    this.collisionCheck = function(token) {
      // let thisVader = invadarr.a[1][index]; // get value of invader in question

      gameArea.shots().forEach(function(shot) {
        if (shot.hitbox().intersect(token.hitbox())) {
          gameArea.willDelete().push(shot);
          gameArea.willDelete().push(token);
        }
      });
    }
  }

  return {
    update:     _update,
    shotKeeper: _shotKeeper
  };

})();

// vectors for game mechanics and positioning (note: game is 2d for now)
function vector2d(x, y) {
  this.x = x;
  this.y = y;
}

// vector operation functions
// Note: they don't alter the original arguments used
function vector2dAdd(v1, v2) {
  return new vector2d(v1.x + v2.x, v1.y + v2.y);
}

function vector2dSubtract(v1, v2) {
  return new vector2d(v1.x - v2.x, v1.y - v2.y);
}

function vector2dDot(v1, v2) { // dot product
  return v1.x * v2.x + v1.y * v2.y;
}

function vectorTimesScalar(v1, s) {
  return new vector2d(v1.x * s, v1.y * s);
}

function vectorLength(v) { // distance formula √(x^2 + y^2)
  return Math.sqrt(vector2dDot(v, v));
}

function vectorNormal(v) { // returns normalized vector (length = 1)
  let l = vectorLength(v);

  if(l == 0) { // note: if l == 0, then don't divide by zero, it's forbidden
    return null;
  }
  var reciprocal = 1 / vectorLength(v);

  return vectorTimesScalar(v, reciprocal);
}