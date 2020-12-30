var physics = (function () {
  var _shotKeeper = new _shotKeeper(); // shotKeeper class instance

  // Updates coordinates of game tokens according to their velocities and the 
  // game time
  // Also handles collisions
  function _update(dt = 0) { // TODO: time "blind" (gameArea has time only)
    gameArea.entities().forEach(function(entity) {
      entity.position.x += entity.direction.x * entity.speed.x * dt;
      entity.position.y += entity.direction.y * entity.speed.y * dt;
    });
  }

  // Is there a better way to define an object with properties? Because this 
  // function will not be used as a data type or anything
  function _shotKeeper() { // class in charge of keeping tabs on all bullets
    // This is basically what the renderer does.
    this.update = function() {
      //TODO: Add collision check, remove if collision
      // Delete individual shot if it leaves canvas (cleanup)
      // Movement
      gameArea.shots().forEach(function(shot) {
        // Check bounds
        if(shot.hitbox().top() > canvas.height || shot.hitbox().bottom() < 0) {
          gameArea.willDelete().push(shot);
        }
        // ********************************************************************
        else { // advance the shot
          let ydirection = shot.direction.y * shot.speed.y;
          shot.position.y += ydirection * dt;
        }
        // ********************************************************************
      });
    }

    this.collisionCheck = function(token) {
      // let thisVader = invadarr.a[1][index]; // get value of invader in question

      gameArea.shots().forEach(function(shot) {
        if (shot.hitbox().intersect(token.hitbox())) {
          if(shot.type == "enemyShot" && token.type == "player" || shot.type == "playerShot" && token.type == "enemy") {
            gameArea.willDelete().push(shot);
            gameArea.willDelete().push(token);
          }
        }
      });
    }
  }

  return {
    update:     _update,
    shotKeeper: _shotKeeper
  };

})();

// ----------------------------------------------------------------------------
//                                      Vector
// ----------------------------------------------------------------------------
// vectors for game mechanics and positioning (note: game is 2d for now)
function vector2d(x, y) {
  this.x = x;
  this.y = y;
}

// vector operation methods
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

