"use strict";

/**
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop,
 * otherwise defaults to setTimeout().
 */
// window.requestAnimFrame = (function(){
//   return  window.requestAnimationFrame   ||
//       window.webkitRequestAnimationFrame ||
//       window.mozRequestAnimationFrame    ||
//       window.oRequestAnimationFrame      ||
//       window.msRequestAnimationFrame     ||
//       function(/* function */ callback, /* DOMElement */ element){
//         window.setTimeout(callback, 1000 / 60);
//       };
// })();

//*********************************LISTENERS***********************************
// Function that toggles an HTML element's visibility (used on canvas)
const toggle = (elem) => {
  // Adds or removes 'hidden' class to element
  elem.classList.toggle('hidden');
}

// Resizes game's canvas (A.K.A. 'gameArea') to dynamic page size (i.e. when 
// user changes their browser's size)
window.addEventListener("resize", function(event) {
  canvas = document.getElementById("game-canvas");

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Resize canvas from the get-go
window.addEventListener("load", function(event) { 
  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});  

// Player token's controls 
// 'node' = 'window' in this case
window.addEventListener('keydown', function(event) {
  activeKeys[event.keyCode] = true; // Player presses a key, true in array
});

window.addEventListener('keyup', function(event) {
  activeKeys[event.keyCode] = false; // Player stops pressing key, false in array
}); 


// *****************************GLOBAL VARIABLES*******************************
// TODO: Add a x and y velocity (invaders should have a difference in case of needing it later)

// Object list of key presses ('keydown'). False for unpressed or missing
var activeKeys = {};
var holding = '';

// Listeners' pertinent keycodes 
const Space      = 32; // i.e. The spacebar 
const ArrowLeft  = 37;
const ArrowUp    = 38;
const ArrowRight = 39;
const ArrowDown  = 40;

//BUG1 Keep track of frontmost player bullet's height
let playerBH = 0;
// let first = true;

// Stacked: Do not re-initialize invaders if already done before 
var invadersMem = false;
// Ensures game only starts every other click (start -> reset & stop -> start)
var go = true;

// Game canvas reference used throughout many object methods
// Canvas coordinates are as follows:
// (0,0) -- -- -- >(1,0)
//      |
//      |
//      |
//      V(0,1)

// Capture values when page loads
let canvas, ctx; // Set with 'init()' after page is loaded

// Keeps record of all shots/bullets

// Used to display frames per second
let timeStamp = 0;
let dt = 0, oldTimeStamp = 0, fps;
// TODO: Reset timeStamp(?)
let reqId; // Holds the requestId upon calling requestAnimationFrame

//*****************************OBJECTS/FUNCTIONS*******************************
// vectors for game mechanics and positioning (note: game is 2d for now)
function vector2d(x, y) {
  this.x = x;
  this.y = y;
}

// Vector functions
// Note: arguments used are unaltered
function vector2dAdd(v1, v2) {
  return new vector2d(v1.x + v2.x, v1.y + v2.y);
}

function vector2dSubtract(v1, v2) {
  return new vector2d(v1.x - v2.x, v1.y - v2.y);
}

function vector2dDot(v1, v2) { // dot product
  return v1.x * v2.x + v1.y * v2.y;
}

function vectorTimesScalar(v1, s) { // multiply vector parameters by a constant
  return new vector2d(v1.x * s, v2.x * s);
}

function vectorLength(v) { // apply distance formula √(x^2 + y^2)
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

// Images
// Load game sprites/images
var imgRepo = new function(nImages = 1) { // Class instance
  // IMAGE DEFINITIONS
  this.player_token = new Image();
  
  // IMAGE LOADING
  // Don't start game until all images are done loading
  this.nImages = nImages; 
  let nLoaded = 0;

  let imgLoaded = function() {
    if(nLoaded ++ == nImages) {
      // window.init(); // Start game TODO: Create a title screen (and only load
                        // game when all images are loaded)
    }
  }

  this.player_token.onload = function() {
    imgLoaded(); // Increment total loaded images by one
  }
  // SET IMAGE SOURCES
  this.player_token.src = "/images/token-player1.svg";
};

// Renderer object
//MOVE DOWN below gamearea
var renderer = (function() { // Note: context = ctx for now, later, the 'context' 
  // methods to draw specific game tokens (they don't look through stored 
  // tokens)
                             // variable will be defined internally 
  function _drawRectangle(token) { // Generic rectangle
    ctx.fillStyle = token.color;
    ctx.globalAlpha = 0.7; // Opacity
    // Since drawing starts at upper-lefthand corner
    ctx.fillRect(token.position.x - token.width/2, 
      token.position.y - token.height/2, token.width, token.height); 
  }

  function _drawPlayer(token) { // render player token
    ctx.drawImage(imgRepo.player_token, token.position.x - token.width/2, 
      token.position.y - token.height/2, token.width, token.height);
  }

  // WiP: No invader sprite yet. Draw as a plain token (a rectangle)
  function _drawInvader(token) { // render invader tokens
    _drawRectangle(token);
  }

  // Draw stroke of rectangle object's border 
  // TEST: Use to visualize game token's hitbox boundaries (rectangular) 
  function _drawRectOutline(hb) {
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.linewidth = "5";
    ctx.strokeStyle = "white";
    ctx.rect(hb.x, hb.y, hb.width, hb.height);
    ctx.stroke();
  }

  // method to draw all game tokens
  function _render(dt = 0) { // TODO: make blind to time (ask gameArea for it)
    // TODO: Move the gloval canvas variables here
    // var canvas = document.getElementById("game-canvas");
    //let ctx = canvas.getContext("2d"); // rendering in two dimensions

    // Example of a more C ++ approach to the loop:
    // var i,
    //     entity,
    //     entities = gameArea.entities(); // get tokens
    //
    //     for(i = 0; i < entities.length; i ++) { // Drawing loop
    //       entity = entities[i];
    //
    //       if(entity instanceof playerToken) {
    //         _drawPlayer(ctx, entity);
    //       }
    //     }

    // Draw all game tokens
    gameArea.entities().forEach(function(entity) {
      if(!entity.collided) { // Intact tokens only
        if(entity instanceof playerToken) {
          _drawPlayer(entity);
          _drawRectOutline(entity.hitbox()); // for TESTing HITBOX
        }
        else if(entity instanceof invaderToken) {
          _drawInvader(entity);
          _drawRectOutline(entity.hitbox()); // for TESTing HITBOX
        }
        else { // Default, rectangular polygon
          _drawRectangle(entity);
          _drawRectOutline(entity.hitbox()); // for TESTing HITBOX
        }
      }
    });

    gameArea.shots().forEach(function(shot) {
      _drawRectangle(shot);
    });

    // for TESTing HITBOX, draw invaders' collective hitbox
    let ifh = gameArea.invaderFieldHitbox();
    ctx.beginPath();
    ctx.globalAlpha = 1;
    ctx.linewidth = "5";
    ctx.strokeStyle = "white";
    ctx.rect(ifh.x, ifh.y, ifh.width, ifh.height);
    ctx.stroke();
  }

  function _clear() { // clear entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { // Accessors
    render: _render, // Public method(s)
    clear:  _clear
  };

})();

var physics = (function () {
  var _shotKeeper = new _shotKeeper(); // shotKeeper class instance

  // Updates 
  // TODO: Also handles collisions
  function _update(dt = 0) { // TODO: time blind (gameArea has time only)
    gameArea.entities.forEach(function(entity) {
      // TODO: Need to implement both X and Y directions (only use one of those atm)
      // entity.y += entity.direction.y * entity.speed.y * dt;
      //entity.x += entity.direction.x * entity.speed.x * dt;
    });
  }

  // Is there a better way to define an object with properties? Because this 
  // function will not be used as a data type or anything
  function _shotKeeper() { // class in charge of keeping tabs on all bullets
    this.addShot = function(position, width = 5, height = 15, direction, speed, collided  = false, color = "blue") {
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
      this.collided  = collided;
      this.color     = color;
     
      gameArea.shots().push(new gameToken(this.position, this.width, this.height, this.direction, this.speed, this.collided, this.color));
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
          gameArea.shots().splice(shot, 1);
        }
        // **********************************************************************
        else { // advance
          let yVelocity = shot.direction.y * shot.speed.y;
          shot.position.y += yVelocity * dt;
        }
        // **********************************************************************
      });
    }

    this.collisionCheck = function(token) {
      // STANDBY3: Only pay attention to front row for now
      // let thisVader = invadarr.a[1][index]; // get value of invader in question

      gameArea.shots().forEach(function(shot) {
        //let collides = intersect(shot, token); // Way to fix this (?)
        if (shot.hitbox().intersect(token.hitbox())) {
          shot.collided = true;
          // Bullet and invader cancel each other
          // T0D0 ###############################################################
          // [Bullet => Invader intact?]
          // if(!token.collided) { 
          // if(!_inv._getCollided(index)) {
          if(!token.collided) {
            gameArea.shots().splice(shot, 1); // Intact token disappears along with bullet
            // [Bullet => collision]
            // invadarr.a[1][index].collided = true;
            token.collided = true;
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

// ████████████████████████████████████████████████████████████████████████████
// ████████████████████████████████████████████████████████████████████████████
// ████████████████████████████████████████████████████████████████████████████
// ████████████████████████████████████████████████████████████████████████████
// Entirety of game's 'screen', where all the visible game pieces are
var gameArea = (function() { // Singleton
  // variables
  // game token variables:
  var _entities = []; // Holds all (generic) game tokens used in the game
  var _player1 = new playerToken(new vector2d(0, 0), 70, 70, new vector2d(1, 0), new vector2d(125, 5)); //5 isn't active atm since direction is x axis only

  // Manages invaders TODO: Any way to remove all invader array methods from invadarr? feel like gameArea should return values for it, then there wouldn't need to be as much nesting (clarity might decrease if not done right though)
  let _invadarr = (function() { // 2d invader array
    //  a: {},  // Associative array, doesn't have built-in methods (ex. length())
    let a = [],
        f = [], // Invaders in the frontline (those allowed to shoot) 
        r = 0;  // total rows in the 2d array

    let _invaderCount, _invaderWidth, _invaderHeight,
        _gapSpace,
        _velocity, _frameUpper, _invaderRows;

    let frameNum = 0; // Marks the current frame you're on

    let wait = false; // 'turns' (frameRate) invaders must wait before moving again

    function _totCols(rowIndex) { // Total number of columns for given row
      if(rowIndex < this.r) {
        return this.a[rowIndex].length;
      }
      else {
        return false; // Out of bounds
      }
    }

    function _addRows(numOf) { // Add specific number of rows
      for(let i = 0; i < numOf; i ++) {
        a[r ++] = [];
      }
    }

    function _clear() {
      a = []; // Reset entire array content
      r = 0; // No rows on empty array
    }

    // Initialize the properties of the array of invaders
    function _setup(invaderCount = 3, invaderWidth = 80, invaderHeight = 20, gapSpace = 30, velocity, frameRate = 50 /* makes invader movement blocky*/, invaderRows = 2) { 
      this._invaderCount = invaderCount;
      this._invaderWidth = invaderWidth;
      this._invaderHeight = invaderHeight;
      this._gapSpace = gapSpace;
      this._velocity = new vector2d(20, 10); // TODO: Make it so you can send custom velocity (maybe even for each individual invader if needed) 
      this._frameUpper = frameRate;
      this._invaderRows = invaderRows;

      if(!invadersMem) {
        //gameArea.invadarr().clear(); // Make sure invader array is clear (sanity check mostly)
        // invadarr.a = [];
        _clear();
      }

      this.frameNum = 0; // Start waiting time from 0
      //
      // SETUP AND SPACING
      // Relative space between each invader
      // x coordinate of next invader's left side, count for previous invader's
      // width and add the gap space
      let next = this._invaderWidth + this._gapSpace;
      // Space between leftmost & rightmost invader boundaries and the canvas 
      // boundary
      let edgeSpace = (canvas.width - this._invaderCount * (this._invaderWidth + this._gapSpace))/2 + this._gapSpace;
      // Where to begin drawing the invaders centered in the canvas' x axis
      let drawAt = edgeSpace;  
      // GRID
      let y = this._invaderHeight/2; // initial y positioning (at canvas boundary)
      let rowSpace = 100; // space between each row

      // EACH INDIVIDUAL INVADER
      if(!invadersMem) {
        _addRows(invaderRows);
        // Populate with invaderCount number of invaders
        for(let i = 0; i < invaderRows; ++ i) {
          for(let j = 0; j < invaderCount; ++ j) {
            a[i].push(
                                    new invaderToken(
                                      /*position*/   new vector2d (drawAt, y),
                                      /*width:*/     this._invaderWidth, 
                                      /*height:*/    this._invaderHeight,  
                                      /*direcion:*/  new vector2d(1, 0),
                                      /*speed:   */  new vector2d(10, 10),
                                      /*collided:*/  false,
                                      /*color:*/     "green",
                                      /*fireRate*/   1));
            gameArea.entities().push(a[i][j]);
            drawAt += next ;
          }
          drawAt = edgeSpace;
          y += rowSpace; // GRID
        }
        invadersMem = true;
      }

      else { // Recycle invader array if it already existed
        if(this._velocity.x < 0) { // make sure invaders initially moving to the right
          this._velocity.x *= -1;
        }

        a.forEach(function(row) {
          row.forEach(function(invader) {
            // Reset positioning and other pertinent values
            // invader.position = {drawAt, y};
            invader.position.x = drawAt;
            invader.position.y = y;
            drawAt += next;
            invader.collided = false; // All invaders intact
            invader.cooldown = 0; // Reset shot cooldown time
          });   
          drawAt = edgeSpace;
          y += rowSpace; // Y axis space for next row of invaders
        });
      }
      this.reset(); // Set (or reset, depending) frontliners array

      wait = false;
    }

    function _reset() {
      // Set up frontline invaders
      f = []; // erase previous values
      f = a[r - 1]; // Reset frontline to frontmost array
    }

    function _update(dt = 0) {
      // update positioning
      if (this.frameNum ++ >= this._frameUpper) { // causes a blink/flicker effect
        this.frameNum = 0; // Reset frame

        let vLeftmost = gameArea.invaderFieldHitbox().left();
        let vRightmost = gameArea.invaderFieldHitbox().right();

        if(wait) { // move 'forward' y axis by 10 pixels (? TODO: use yVelocity)
          a.forEach(function(row) {
            row.forEach(function(invader) {
              invader.position.y += 15;
            });
          });
          // Change directions after reaching canvas bound
          this._velocity.x *= -1;
          wait = false;
        }
        else {
          // Check left and right vader boundaries
          let dist  = this._velocity.x; //* dt; //TODO: same movement w/ seconds
          let distR = vRightmost + dist;
          let distL = vLeftmost + dist;

          // Movement based on canvas boundary collisions
          // Right boundary of canvas
          if(distR > canvas.width) { 
            // Calculate distance needed to reach rightmost canvas edge
            let toRightBound = canvas.width - vRightmost;

            // Move all invaders distance needed for rightmost invader to reach
            // canvas edge (and then move opposite direction in the next instance)
            a.forEach(function(row) {
              row.forEach(function(invader) {
                invader.position.x += toRightBound;
              });
            });

            wait = true; // invaders wait at corner for two 'turns' (frameRate)
          }

          // Left boundary of canvas
          else if(distL <= 0) { // left boundary, change direction  
            // make vaders touch left bound, same as distance of leftmost to bound
            let toLeftBound = 0 - vLeftmost;

            a.forEach(function(row) {
              row.forEach(function(invader) { // right boundary
                invader.position.x += toLeftBound;
              });
            });

            wait = true;
          }

          else a.forEach(function(row) { // default, move
            row.forEach(function(invader) {
              invader.position.x += dist;
            });
          });
        }
      }
    }

    function _shoot() {
      // if(!this.wait) {
      //   f.forEach(function(frontliner) { // Frontmost invaders will shoot
      //     if(!frontliner.collided) {
      //         frontliner.shoot();           
      //     }
      //   });
      // }
    }

    return {// accessors
      totCols: _totCols, // method accessors
      addRows: _addRows,
      clear:   _clear,
      setup:   _setup,
      reset:   _reset,
      update:  _update,
      shoot:   _shoot,

      a:             function() { return a; }, // data accessors 
      totRows:       function() { return r; },
      totFront:      function() { return f; },
      invaderCount:  function() { return _invaderCount;  },
      invaderWidth:  function() { return _invaderWidth;  },
      invaderHeight: function() { return _invaderHeight; },
      gapSpace:      function() { return _gapSpace;      },
      velocity:      function() { return _velocity;      },
      frameUpper:    function() { return _frameUpper;    },
      invaderRows:   function() { return _invaderRows;   }
    };
  })();

  let _invaderFieldHitbox = new rectangle(0, 0, 0, 0);
  let _shots  =  []; // Holds all bullets

  // gameArea variables:
  let startLoop = false; // Starts/stops gameloop
  // --------------------------------------------------------------------------
  function _tog() {
    //BUG1
    if (go == true) { // Initiate game    
      go = false;
      startLoop = true;
      toggle(canvas); // Make canvas visible
      // Make demo say game's running, make button say stop (toggles play/stop)
      document.getElementById("demo").innerHTML = "Game start";
      document.getElementById("play-button").innerHTML = "Stop";
      this.start(); // Set variables to start game
    } //BUG1 
    else { // End game, reset relevant variables
      // TODO: Reset timeStamp(?)
      timeStamp = 0;
      go = true;
      startLoop = false;
      // As of now, toggling button to end the game will lose all progress
      toggle(canvas); // Hide canvas
      document.getElementById("demo").innerHTML = "Game Over";
      document.getElementById("play-button").innerHTML = "Play";
      this.reset(); // Reset important variables
    }
  }

  function _start() {
    // PREP
    // Reset important variables
    // set/reset hitbox that covers all invaders
    _invaderFieldHitbox = new rectangle(0,0,0,0);

    // Update canvas
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    _player1.setup();

    //RELOCATION
    _entities.push(_player1);

    // Set up initial invader rows (use from stack if previous game played 
    // already)
    _invadarr.setup();
    // Initialize structure that displays bullets (clears array)
    //shotKeeper.setup();
    // LOOP
    // Initiate gameLoop, request function gives the browser some air while 
    // looping and time the game loop to be in-sync with the browser repaint
    startLoop = true;
    window.requestAnimationFrame(_gameLoop);
  }

  function _gameLoop(timeStamp) { // TODO: Reset timeStamp(?)
    if(!startLoop) {// Conditional that stops loop 
      return;
    }
    // [ 1 ] UPDATE
    // dt = delta t. the difference in time (seconds) between this and last frame
    dt = (timeStamp - oldTimeStamp)/1000;
    dt = Math.min(0.1, dt);
    oldTimeStamp  = timeStamp;

    // Calculate FPS (for the display)
    fps = Math.round(1/dt);

    // Calculate the hitbox surrounding every invader
    _invaderFieldHitbox = _invadarr.a().reduce(function(total, row) {
      return rectUnion(total, row.reduce(function(rowTotal, inv) {
        if(!inv.collided) {
          return rectUnion(rowTotal, inv.hitbox());
        }
        else {
          return rowTotal;
        }
      }, undefined));
    }, undefined);

    // physics.update(); // TODO: soon

    _player1.update(dt); // Time should only be observable on gameArea
    _player1.shoot(); // Update shotkeeper with any bullets player shot

    //WIP: Gonna edit invaders to move according to time passed
    // _inv.update(dt);
    //_inv.shoot();
    _invadarr.update(dt);
    _invadarr.shoot();

    physics.shotKeeper.update();
    document.getElementById("bull").innerHTML = "bullets: " + _shots.length;

    // [ 2 ] COLLISION DETECTION
    // [Bullet => Check for collision]
    // TODO: Cassie (i.e. player token collision)
    // _player1.intersect(); 
    // [Bullets => iterate invaders]

    // Invader collision check (only first row for now)
    //PLACEMAT
    _invadarr.a().forEach(function(row, rind) { // row index
      row.forEach(function(invader, cind) { // column index
        physics.shotKeeper.collisionCheck(invader);
        // WIP
        // If a backup invader exists, begins attacking after frontmost dies BULL1
        // if(invader.collision && rind > 0) {
        //   _inv.invadarr.f[rind][cind] = _inv.invadarr.a[rind - 1][cind];
        // }
      });
    });

    // [ 3 ] CLEAR
    renderer.clear();

    // [ 4 ] DRAW
    renderer.render();
    framesPerSecond(); // Just a display //BUG1 - Displaying bullets for now
    // TODO: Reset timeStamp(?) Not sure if possible

    // Keep requesting further iterations of 'gameLoop' to animate game
    // TODO: Reset timeStamp(?)
    window.requestAnimationFrame(_gameLoop);
  }

  //function _clear() { // Clears the whole canvas
  //  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //}

  function _reset() {
    // All settings and game components are at their starting values
    //this.clear(); // Might not need this here

    // clearInterval(this.interval); // nothing should be moving/responding
    // clearAnimationFrame(this.animationFrame);
    dt  = 0;
    oldTimeStamp   = 0;
    timeStamp      = 0; // TODO: Reset timeStamp(can it be done?)

    _shots    = [];
  }

  return {
    // method accessors:
    tog:      _tog,
    start:    _start,
    gameLoop: _gameLoop,
    //clear:    _clear,
    reset:    _reset,

    // data accessors:
    entities:           function() { return _entities; },
    player1:            function() { return _player1;  },
    invadarr:           function() { return _invadarr; },
    invaderFieldHitbox: function() { return _invaderFieldHitbox; },
    shots:              function() { return _shots;    }
  };
})();
// ████████████████████████████████████████████████████████████████████████████
// ████████████████████████████████████████████████████████████████████████████
// ████████████████████████████████████████████████████████████████████████████
// ████████████████████████████████████████████████████████████████████████████

// Abstract objects/classes
function rectangle(x = 0, y = 0, width = 1, height = 1) {
  // Constructor lines
  this.x      = x;
  this.y      = y;
  this.height = height;
  this.width  = width;
  // Rectangle objects exist in the 2D canvas, and canvas coordinates are as
  // follows:
  //       w i d t h
  // (0, 0) -- -- -- >(1,0)   x
  // h    | ████████    (top)
  // e    | ████████
  // i    | ████████    (bottom)
  // g    V(0,1)
  // h
  // t    y
  //
  // Meaning the y-axis is upside-down compared to y-axis in the standard
  // coordinate plane. Even though the canvas' positive y-axis lies on the 4th
  // quadrant (where the entire visible 2D canvas resides), the rectangle's top
  // will continue to be the top as we know it (i.e. in the real world, a box
  // has a top, and if we flip it over, it still has a side we'd call the top
  // even though its a different side of the box).

  // Methods return _x,_y coordinates of rectangle's corners
  this.left = function() {
    return this.x;
  }

  this.right = function() {
    return this.x + this.width;
  }

  this.top = function() {
    return this.y;
  }

  this.bottom = function() {
    return this.y + this.height;
  }

  // Meethod to check if two rectangles intersect
  this.intersect = function(thatRectangle) {
      if(thatRectangle.left() > this.right()  ||
         this.left() > thatRectangle.right()  ||
         thatRectangle.top() > this.bottom()  ||
         this.top() > thatRectangle.bottom()) {

        return false;
      }
        return true;
  }
}

// TODO: Conglomerate hitbox of all enemies (used to detect invaders' contact w/ canvas boundary to avoid having to re-calculate each time a leftmost or rightmost columns of invaders disappears entirely -> makes it easier to update a hitbox than to update each individually and easier to debug)
// rectUnion returns a rectangle that encompasses the two rectangles used as arguments in the r1, r2 parameters:
//       w i d t h
// (0, 0) -- -- -- > (n, 0)  _x
//      | (min x & y)
//      |*         [r1]
// h    |  ████████░░        ░░ = rectangle that covers both rectangles
// e    |  ████████░░
// i    |  ████████░░
// g    |  ░░░░░░░░░░
// h    |  ░░░░░░░███ [r2]
// t    |  ░░░░░░░███ * max height & width
//      |
//      V
//      (0, m)def m ∃ x s.t. when m1 < m2, f(m1) < f(m2) (strictly increasing)
//    _y
function rectUnion(r1, r2) {
  // Out of both rectangles, see which of their x and y's come first
  // Edge cases
  if(r1 == undefined) {
    return r2;
  }
  if(r2 == undefined) {
    return r1;
  }

  let x = Math.min(r1.x, r2.x);
  let y = Math.min(r1.y, r2.y);

  // Find absolute values of the max width and height you need for the dimensions of a rectangle that covers r1 and r2, sort of like the distance formula for the points that are furthest appart
  let width = Math.max(r1.right(), r2.right()) - Math.min(r1.left(), r2.left());

  let height = Math.max(r1.bottom(), r2.bottom()) - Math.min(r1.top(), r2.top());

  return new rectangle(x, y, width, height);          
}

// Generic game token
function gameToken(position, width = 50, height = 70, direction, speed, collided = false, color = "blue") {
  this.position   = position; // position vector (2d)
  this.width      = width;
  this.height     = height;
  // Object position in the (x, y) plane
  this.direction  = direction; // direction vector (2d)
  this.speed      = speed;     // speed vector (2d)
  // Set collision boolean
  this.collided   = collided;
  this.color      = color;

  this.setup = function() { // Stub

  }

  this.update = function() { // Stub

  }

  // Hitbox that covers entirety of token/sprite's 2D area
  this.hitbox = function() {
    return new rectangle(this.position.x - this.width/2, 
                         this.position.y - this.height/2, 
                         this.width, 
                         this.height);
    // Note: Hitbox's coordinates _x, _y are will be at the upper-left corner
    // of token's 2D area so that we can find the top, bottom, left, and
    // right sides of the game token itself that's drawn in the canvas
    //
    //     w i d t h
    //(_x,_y)-------->(1,0)
    //   |   » █████████  _x = x - width/2
    // h |     █  x,y  █  _y = y - height/2
    // e |     █████████ 
    // i V
    // g
    // h
    // t
    //
    // where x,y are coordinates of the game token's center
  }
}

function invaderToken(position, width, height, direction, speed, collided = false, color = "blue", fireRate =  1 /*BUG1 fireRate*/) { //BULL1 
  // Ref: javascript function call():
  // call gameToken with the instance that is 'this' invaderToken object, to
  // pass on the arguments invaderToken has in common with gameToken
  gameToken.call(this, position, width, height, direction, speed, collided,
    color); 
  // Inheritance:
  // prototype method lets us add specified properties and methods to the 
  // object that calls it. 
  //gives it the property to create gameToken objects along with any new properties or methods it wants to add (since gameToken.prototype is used as an argument)
  this.prototype = Object.create(gameToken.prototype);  

  this.fireRate  = fireRate;

  var cooldown   = 0; // Time until next shot is available
  var shotChance = 1; // % chance of firing a shot
  this.wait = false; // decides when invader can move

  this.shoot = function () {
      cooldown += dt;

      if(cooldown > this.fireRate) {
        cooldown = 0;

        // TODO: Reintroduce 'randomized' shots at a later time
        // laChance is French for luck
        //let laChance = Math.floor(Math.random()*101);
        //if(laChance < shotChance) { //@BULL1
          // this.y + height + 1 to ensure bullet doesn't kill origin point  
          //____ fixing this will probably fix program, but the bullets seem to flow nicely atm            
          physics.shotKeeper.addShot(
            /*position:*/     new vector2d(
            /*x*/               this.position.x,
            /*y*/               this.hitbox().bottom() + this.height + 11),
            /*width:*/        5, 
            /*height:*/       10, 
            /*direction:*/    new vector2d(1, 1),
            /*speed:   */     new vector2d(1, 125),
            /*collided:*/     false,
            /*color:*/        "orange");
        }
      //}
  }
}

// Optional: With inheritance, can add new properties at the end of 'fireRate'
// Made into 'class' in case multiplayer gets established later
function playerToken(position, width, height, direction, speed, /* BULL1->speed = 125,0*/ collided = false, color = "red", fireRate = .25) {
  // playerToken inherits from more generic gameToken class
  gameToken.call(this, position, width, height, direction, speed, collided, color);
  this.prototype = Object.create(gameToken.prototype);

  // this.position  = position;
  // this.width     = width;
  // this.height    = height;
  // this.direction = direction;
  // this.speed     = speed;
  // this.collided  = collided;
  // this.color     = color;
  this.fireRate  = fireRate;

  var cooldown = 0;

  this.setup = function() { // RELOCATION: Moving setup to renderer
    // Set up player token's positioning (bottom-center)
    // Subtracting(read: displacing) by player token dimensions to accomodate 
    // for token's size 
    this.position.x = canvas.width/2;
    this.position.y = canvas.height - this.height/2;
  }

  this.update = function(dt) {
    // Variables tell what arrow keys are being pressed
    // canvas = document.getElementById("game-canvas");
    let right = activeKeys[ArrowRight];
    let left = activeKeys[ArrowLeft];
    // Directions left gets 'closer' to zero while right moves 'away'
    let leftWards = -1;
    let rightWards = 1;


    // Player token direction based on arrow keys
    if (left && !right) {
      holding = 'left';
      this.direction.x = leftWards;
    }
    if(!left && right) {
      holding = 'right';
      this.direction.x = rightWards;
    }
    if(left && right) { // Special case: player holds both arrows
      if(holding == 'right') { // Was holding right first
        // movex = leftWards; // Choose left arbitrarily
        this.direction.x = leftWards;
      }
      if(holding == 'left') { // Was holding left first
        // movex = rightWards; // Most recent is right, so go right
        this.direction.x = rightwards;
      }
      if(holding == '') { // Edge case, pressed both at exact time, choose one
        holding = 'right';
        // movex = rightWards;
        this.direction.x = rightwards; 
      }
    }
    if(!right && !left) {
      holding = ''; // Reset, player is not holding either
      this.direction.x = 0;
    }

    let velocity = this.direction.x * this.speed.x;
    // (velocity = distance/time_passed) * time_passed * const =distance * const
    this.position.x += velocity * dt;

    if(this.hitbox().left() <= 0) { // Boundary (move no further)
      this.position.x = this.width/2;
    }
    else if(this.hitbox().right() >= canvas.width) { // Boundary (move back)
      this.position.x = canvas.width - this.width/2; 
    }
    else { // Move forward
    }
  }

  this.shoot = function() {
    let space = activeKeys[Space]; // Press < space > to shoot
    cooldown += dt; // Time until you can shoot again
    if (space && cooldown > fireRate) {
      cooldown = 0;
      let bHeight = 4;
      // (x,y) displacement accomodates for token's dimensions
      // Shot originates from middle of token and travels up
      // Negative velocity because player's bullets go up
      // physics.shotKeeper.addShot(5, 10, "yellow", this.x + width/2, this.y - height/2, 
      // Bullet spawns just above the player token 
      // 
      //  [ ]    Bullet height = Token height/2, spawns, a total distance of
      //         Token height/2 - 1 above player token without touching it
      // █████              |
      //   *(x, y) Center   | Token height 
      // █████              |
      // Code below ensures bullet spawns 1 unit above top of player's hitbox
      physics.shotKeeper.addShot(/*position*/      new vector2d(
                                            this.position.x,
                                            this.hitbox().top() - bHeight - 1),
                         /*width:*/        5, 
                         /*height:*/       bHeight,
                         /*direction:*/    new vector2d(0, -1),
                         /*speed:*/        new vector2d(0, 500),
                         /*collided:*/     false,
                         /*color*/         "yellow");
    }
  }
}