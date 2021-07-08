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

// Hold current width and height of the canvas, respectively
let w1, h1;
let nav; // holds  navigational links found in the home page (image links and otherwise)
//*********************************LISTENERS***********************************
// Function that toggles an HTML element's visibility (used on canvas)
const toggle = (elem) => {
  // Adds or removes 'hidden' class to element
  elem.classList.toggle('hidden');
}
// Resizes game's canvas (A.K.A. 'gameArea') to dynamic page size (i.e. when 
// user changes their browser's size)
window.addEventListener("resize", function(event) {
  // Grab the hidden canvas element in the home page
  canvas = document.getElementById("game-canvas");
  let w2 = window.innerWidth;
  let h2 = window.innerHeight;

  // Scale game elements accordingly if the game window (canvas in this case) gets resized. Done by multiplying entitie's area and positioning by the ratio of how much the newly resized window (with w2 = width, h2 = height) differs from the previous window size (with w1 = width, h1 = height)
  gameArea.entities().forEach(function(entity) {
    entity.width      *= w2/w1;
    entity.height     *= h2/h1;
    entity.position.x *= w2/w1;
    entity.position.y *= h2/h1;
    // entity.speed.x *= w2/w1; // Maybe rescale the speed as well, because a resized window will keep the speed the same as before the window's was resized
    // entity.speed.y *= h2/h1;
  });

  // Update gameArea's text objects so that their font sizes/positioning lines up with new canvas size
  gameArea.text().forEach(function(text) {
    // text.width      *= w2/w1;
    // text.height     *= h2/h1;
    text.fontSize   *= w2/w1;
    text.position.x *= w2/w1;
    text.position.y *= h2/h1;
  });

  // The resized window becomes the new current window (with w1 = width, h1 = height)
  h1 = h2;
  w1 = w2;

  // Canvas resizing (responsive canvas resizes to fit available space)
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Resize canvas from the get-go
window.addEventListener("load", function(event) {
  // get the href's in the main page used for navigation
  nav = document.getElementsByClassName("fadeOnStart");

  canvas = document.getElementById("game-canvas");
  ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  w1 = window.innerWidth;
  h1 = window.innerHeight;

  canvas.addEventListener("touchstart", touchStart);
  canvas.addEventListener("touchend", touchEnd);
  canvas.addEventListener("touchcancel", touchEnd);
});  

// Player token's controls 
// 'node' = 'window' in this case
window.addEventListener('keydown', function(event) {
  activeKeys[event.keyCode] = true; // Player presses a key, true in array
});

window.addEventListener('keyup', function(event) {
  activeKeys[event.keyCode] = false; // Player stops pressing key, false in array
}); 

// Touch
function getRelativeTouchCoords(touch) {
    function getOffsetLeft(elem) {
        var offsetLeft = 0;
        do {
            if(!isNaN(elem.offsetLeft)) {
                offsetLeft += elem.offsetLeft;
            }
        }
        while(elem = elem.offsetParent); // waits for touch
        return offsetLeft;
    }

    function getOffsetTop(elem) {
        var offsetTop = 0;
        do {
            if(!isNaN(elem.offsetTop)) {
                offsetTop += elem.offsetTop;
            }
        }
        while(elem = elem.offsetParent); // waits for touch
        return offsetTop;
    }

    var scale = canvas.width / canvas.clientWidth;
    // var scale = 1;
    // Get touch coordinates
    var x = touch.pageX - getOffsetLeft(canvas);
    var y = touch.pageY - getOffsetTop(canvas);

    return { x: x*scale,
             y: y*scale };
}

function touchStart(e) {
    var touches = e.changedTouches,
        touchLocation,
        playerAction;

    e.preventDefault();

    for( var i=touches.length-1; i>=0; i-- ) {
        touchLocation = getRelativeTouchCoords(touches[i]);
        // divide touchscreen into thirds
        if(touchLocation.x < canvas.width*(1/3)) {
            // playerAction = left;
            activeKeys[37] = true; // go left
        }
        else if(touchLocation.x > canvas.width*(2/3)) {
            // playerAction = "right";
            activeKeys[39] = true; // go right
        }
        else {
            // playerAction = fire;
            activeKeys[32] = true; // default is to fire (pressing the center)
        }
    }
}

function touchEnd(e) {
    var touches = e.changedTouches;
    e.preventDefault();

    // for( var i=touches.length-1; i>=0; i-- ) {
    //     playerActions.endAction(touches[i].identifier);
    // }
    for (var key in activeKeys) {
      activeKeys[key] = false;
    }
}
// *****************************GLOBAL VARIABLES*******************************
// Player listener variables
// Object list of key presses ('keydown'). False for unpressed or missing
var activeKeys = {};
var holding = '';

// Listeners' pertinent keycodes 
const Space      = 32; // the spacebar's keycode
const Enter      = 13;
const ArrowLeft  = 37;
const ArrowUp    = 38;
const ArrowRight = 39;
const ArrowDown  = 40;

// The four cardinal directional vectors
let up    = new vector2d( 0, -1),
    down  = new vector2d( 0,  1),
    left  = new vector2d(-1,  0),
    right = new vector2d( 1,  0),

    // 'zero' vector token doesn't move
    idle = new vector2d(  0,  0);

// Ensures game only starts every other click (start -> reset & stop -> start)
// var go = true;

// Game canvas reference used throughout many object methods
// Canvas coordinates are as follows:
// (0,0) -- -- -- >(1,0)
//      |
//      |
//      |
//      V(0,1)
// Capture values when page loads
let canvas, ctx; // Set with 'init()' after page is loaded

// Used to display frames per second
let timeStamp = 0;
let dt = 0, oldTimeStamp = 0, fps;

// TODO: Reset timeStamp(?)
let reqId; // Holds the requestId upon calling requestAnimationFrame

// Determines the color of an enemy token after it's dropped a hit point 
let hitColor = ["green", "yellow", "orange"];

//*****************************OBJECTS/FUNCTIONS*******************************

// Images
// Load game sprites/images
var imgRepo = new function(nImages = 1) { // Class instance
  // IMAGE DEFINITIONS
  this.player_token_img = new Image();
  
  // IMAGE LOADING
  // Don't start game until all images are done loading
  this.nImages = nImages; 
  let nLoaded = 0;

  let imgLoaded = function() {
    if(nLoaded ++ == nImages) {
      window.init(); // Start game TODO: Create a title screen (and only load
                        // game when all images are loaded)
      // Possible TODO: Set a boolean to only allow game to start, from the game title, when all game images have loaded                  
    }
  }

  this.player_token_img.onload = function() {
    // Increment total loaded images by one when player token has been sourced
    imgLoaded();
  }
  // SET IMAGE SOURCES
  this.player_token_img.src = "/images/token-player1.svg";
  // this.player_token_img.src = "/images/ship.png";
};

// Renderer object
var renderer = (function() {
  function _writeText(token) {
    // Set up text style and alignment 
    ctx.fillStyle = token.color;
    ctx.textAlign = token.align;
    // format looks like: 14vw consolas (for example)
    ctx.font = token.fontSize + token.fontUnit + " " + token.font;

    // Write the text at specified position
    ctx.fillText(token.text, token.position.x, token.position.y);
  }
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
    ctx.globalAlpha = 0.7; // Opacity
    ctx.drawImage(imgRepo.player_token_img, token.position.x - token.width/2, 
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
      // if(entity instanceof textToken) {
      //   _writeText(entity);
      // }
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
    });

    gameArea.shots().forEach(function(shot) {
      _drawRectangle(shot);
    });

    // Draw all text boxes
    gameArea.text().forEach(function(text) {
      _writeText(text);
    });

    // for TESTing HITBOX, draw invaders' collective hitbox
    // let ifh = gameArea.invaderFieldHitbox();
    // ctx.beginPath();
    // ctx.globalAlpha = 1;
    // ctx.linewidth = "5";
    // ctx.strokeStyle = "white";
    // ctx.rect(ifh.x, ifh.y, ifh.width, ifh.height);
    // ctx.stroke();
  }

  function _clear() { // clear entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return { // Accessors
    render: _render, // Public method(s)
    clear:  _clear
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
  let _entities = []; // Holds all (generic) game tokens used in the game
  let _player1  = new playerToken(new vector2d(0, 0), 70, 70, "red", "player", idle, new vector2d(200, 5)); // 5 isn't active atm since direction is x axis only

  let _text               = []; // Holds all text including menu
  let _invadarr           = new invaderArray();  // Manages enemy tokens 
  let _invaderFieldHitbox = new rectangle(0, 0, 0, 0);
  let _shots              = []; // Holds all bullets
  let _willDelete         = []; // Holds all tokens marked for deletion

  // gameArea variables:
  // Ensures game loop only starts running every other click (start -> reset & stop -> start)
  // let go = true;
  let startLoop   = false; // Starts/stops gameloop

  // Title menu
  let titleCard   = true;
  let titleOpty   = 0; // Use for fade effects on game's title text
  let subMenuOpty = 0; // Use for fade effects on game's title submenu
  // --------------------------------------------------------------------------

  function _tog() {
    //BUG1
    //if (go == true) { // Initiate game
    //  go = false;    
    if(startLoop == false) { // Initiate game
      startLoop = true;

      //renderer.clear(); // Make sure canvas is blank
      toggle(canvas);   // Make canvas visible
      // toggle(nav); // Hide navigational links
      // Hide navigational links
      for(let i = 0; i < nav.length; i ++) {
        // Hide navigation menu
        // toggle(nav[i]); // Doesn't quite work, bars shift because nav icons/links stop taking up space
        nav[i].style.visibility = "hidden";
      }
      // Make demo say game's running, make button say stop (toggles play/stop)
      document.getElementById("demo").innerHTML = "Game start";
      document.getElementById("play-button").innerHTML = "Stop";
      this.start(); // Set variables to start game
    } //BUG1 
    else { // End game, reset relevant variables
      timeStamp = 0; // TODO: Reset timeStamp(?)
      startLoop = false;
      // As of now, toggling button to end the game will lose all progress
      toggle(canvas); // Hide canvas
      // Display navigational links
      for(let i = 0; i < nav.length; i ++) {
        // toggle(nav[i]);
        nav[i].style.visibility = "visible";
      }
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

    // Make sure no active keys registered
    clearObject(activeKeys);


    // TODO: "LOADING" Card while everything loads

    _player1.setup();
    _entities.push(_player1); // Add player to list of total gameArea entities

    _invadarr.setup();

    // Load title dialogue
    // Make a text token, push it into the text array
    //_text.push(new textToken()) //***
    _text.push(new textToken( 
            /*position:*/     new vector2d(
                               canvas.width  / 2,
                               canvas.height / 2
                              ),
            /*width:*/        10,
            /*height:*/       10,
            /*color:*/        "orange",
            /*type:*/         "text",
            /*text:*/         "The Game",
            /*align:*/        "center",
            /*font:*/         "gamePixies",
            /*fontsize:*/     5,
            /*fontUnit*/      "vw"));

    // Title submenu text
    // y += 40;
    // ctx.font = "4vw" + " gamePixies";
    // ctx.globalAlpha = 1;
    // ctx.fillText("press any key to continue", x, y);
    _text.push(new textToken( 
            /*position:*/     new vector2d(
                               canvas.width  / 2,
                               canvas.height / 2 + 40
                              ),
            /*width:*/        10,
            /*height:*/       10,
            /*color:*/        "orange",
            /*type:*/         "text",
            /*text:*/         "press any key to continue",
            /*align:*/        "center",
            /*font:*/         "gamePixies",
            /*fontsize:*/     4,
            /*fontUnit*/      "vw"));

    // Initiate gameLoop, request function gives the browser some air while 
    // looping and time the game loop to be in-sync with the browser repaint
    oldTimeStamp = timeStamp; // Make relative time stamp start at zero
    startLoop = true;
    titleCard = true; // Game starts with title card
    window.requestAnimationFrame(_gameLoop);
  }

  function _gameLoop(timeStamp) { // TODO: Reset timeStamp(?)
    if(!startLoop) { // Conditional that stops loop 
      return;
    }

    else if(titleCard) { // Display game title
      // Will also work for touchscreen since its listener takes an input and 
      if(!objectIsEmpty(activeKeys)) { // Start game when user presses any key
        titleCard = false;
        // Mark all menu/title textboxes for deletion
        _text.forEach(function(text) {
          _willDelete.push(text);
        });
        
      }
      renderer.clear();
      renderer.render();
    }

    else {
      // [ 1 ] UPDATE
      //delta t. the difference in time (seconds) between this & last frame
      dt = (timeStamp - oldTimeStamp)/1000;
      dt = Math.min(0.1, dt);
      oldTimeStamp  = timeStamp;

      // Calculate FPS (for the display)
      fps = Math.round(1/dt);

      _invadarr.populated(dt);

      // A) Update Physics
      physics.update(dt); // time should only be observable on gameArea

      // B) Get the current hitbox surrounding every invader
      _invaderFieldHitbox = _invadarr.a.reduce(function(total, invader) {
        return rectUnion(total, invader.hitbox());
      }, undefined);

      // C) Update all tokens/game objects
      // TODO: Simplify by just using gameArea's _entities and iterating through that (after getting bullets over here)
      _invadarr.update(dt);
      _player1.update(dt);
      // PHY
      physics.shotKeeper.update(dt);


      _cleanup(); // Remove dead tokens
      _willDelete = []; // reset the list after cleaning up

      // attacks
      // TODO: Make this part of the _entity update
      // _invadarr.shoot();

      document.getElementById("bull").innerHTML = "bullets: " + _shots.length;

      // [ 2 ] COLLISION DETECTION
      // [Bullet => Check for collision]
      // TODO: Cassie (i.e. player token collision)
      // [Bullets => iterate invaders]

      // Invader collision check //TODO: Move to physics
      // Check if any player bullets have hit any invaders so that they can get deleted
      _invadarr.a.forEach(function(invader) {
        physics.shotKeeper.collisionCheck(invader);
      });

      // TODO: Check if any invader bullets have hit the player, if HP reaches zero, game over
      // physics.shotKeeper.collisionCheck(_player1);

      // [ 3 ] CLEAR (CANVAS)
      renderer.clear();

      // [ 4 ] DRAW  (CANVAS)
      renderer.render();
      score();
      framesPerSecond(); // Just a display, doesn't contribute to game 

      // Keep requesting further iterations of 'gameLoop' to animate game
      // TODO: Reset timeStamp(?) Not sure if possible
    }

    window.requestAnimationFrame(_gameLoop);
  }

  function _cleanup() { // remove dead tokens from the game
    if(_willDelete.length == 0) { // nothing to delete
      return;
    }

    // Returns true if a token isn't marked for deletion, false if it is
    function notIncluded(token) {
      return !_willDelete.includes(token);
    }
    // only let unmarked tokens filter through (tokens not in _willDelete arr)
    _entities   = _entities.filter(notIncluded);
    _text       = _text.filter(notIncluded);
    _invadarr.a = _invadarr.a.filter(notIncluded);

    _shots = _shots.filter(notIncluded);
    // if(_willDelete.includes(_player1)) { // TODO: game over
    //   _player1 = undefined;
    // }
  } 

  function _reset() {
    // All settings and game components are at their starting values
    //this.clear(); // Might not need this here

    // Reset title effect variable
    titleOpty = 0;

    // clearInterval(this.interval); // nothing should be moving/responding
    // clearAnimationFrame(this.animationFrame);
    dt  = 0;
    oldTimeStamp   = 0;
    timeStamp      = 0; // TODO: Reset timeStamp(can it be done?)

    _shots    = [];
    _entities = [];
  }

  return {
    // method accessors:
    tog:      _tog,
    start:    _start,
    gameLoop: _gameLoop,
    reset:    _reset,

    // data accessors:
    entities:           function() { return _entities; },
    player1:            function() { return _player1;  },
    text:               function() { return _text; },
    invadarr:           function() { return _invadarr; },
    invaderFieldHitbox: function() { return _invaderFieldHitbox; },
    shots:              function() { return _shots;    },
    willDelete:         function() { return _willDelete; }
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

  // Method to check if two rectangles intersect
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

// TODO: Conglomerate hitbox of all enemies (used to detect invaders' contact w/ canvas boundary to avoid having to re-calculate each time a leftmost or rightmost columns of invaders disappears entirely -> makes it easier to update a single hitbox than to update each individually and easier to debug)
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

function token(position, width, height, color="blue", type="") {
  this.position   = position; // position vector (2d)
  this.width      = width;
  this.height     = height;
  this.color      = color;
  // token type of an instance, right now has empty string because it's not any specific type of token (game token, text token, etc)
  this.type       = type;
}

function textToken(position, width, height, color="black", type = "text", text = "", align = "start", font = "monospace", fontSize = 5, fontUnit = "vw") {
  token.call(this, position, width, height, color, type);
  this.prototype = Object.create(token.prototype);

  this.text     = text;
  this.align    = align;
  this.font     = font;
  this.fontSize = fontSize;
  this.fontUnit = fontUnit;
}

// Generic game token
function gameToken(position, width = 50, height = 70, color = "blue", type = "", direction, speed) {
  // Ref: javascript function call():
  // call 'token' object with the instance that is 'this' gameToken object, to
  // pass on the arguments 'gameToken' has in common with 'token'
  token.call(this, position, width, height, color, type); 
  // Inheritance:
  // prototype method lets us add specified properties and methods to the 
  // object that calls it. 
  //gives it the property to create gameToken objects along with any new properties or methods it wants to add (since tokenoken.prototype is used as an argument)
  this.prototype = Object.create(token.prototype); 

  //this.position   = position;
  //this.width      = width;
  //this.height     = height;
  //this.color      = color;
  //this.type       = type;
  // Object position in the (x, y) plane
  this.direction  = direction; // direction vector (2d)
  this.speed      = speed;     // speed vector (2d)
  // Set collision boolean

  this.setup = function() { // Stub

  }

  this.update = function(dt = 0) { // Stub

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

function invaderToken(position, width, height, color = "blue", type = "enemy", direction, speed, hp = 3, fireRate =  1 /*BUG1 fireRate*/) { //BULL1 
  // Ref: javascript function call():
  // call gameToken with the instance that is 'this' invaderToken object, to
  // pass on the arguments invaderToken has in common with gameToken
  gameToken.call(this, position, width, height, color, type, direction, speed); 
  // Inheritance:
  // prototype method lets us add specified properties and methods to the 
  // object that calls it. 
  //gives it the property to create gameToken objects along with any new properties or methods it wants to add (since gameToken.prototype is used as an argument)
  this.prototype = Object.create(gameToken.prototype);  

  this.hp = hp; // hp, or hit points. number of bullets it can take before dying
  // Unique properties not in gameToken parent
  this.fireRate  = fireRate;

  // Local variables
  let cooldown   = 0; // Time until next shot is available
  let shotChance = 1; // % chance of firing a shot

  this.update = function(dt = 0) {
    this.color = hitColor[this.hp - 1];
    // update behavior according to positioning
    let vTop      =  gameArea.invaderFieldHitbox().top();
    let vLeftmost =  gameArea.invaderFieldHitbox().left();
    let vRightmost = gameArea.invaderFieldHitbox().right();

    // Movement based on canvas/group of enemies boundary collisions
    // Right boundary of canvas

    // Invaders descend from top of canvas, then move right
    if(vTop < 0) {
      this.position.y += 100 * dt;
    }
    else if(vTop > 0 && this.direction == idle) {
      this.direction = right;
    }

    if(vRightmost > canvas.width) {
      this.position.y += 10;
      this.direction = left;
    }

    // Left boundary of canvas
    else if(vLeftmost <= 0) {
      this.position.y += 10;
      this.direction = right;
    }   
  }

  this.shoot = function (dt = 0) {
    // barrel: coordinates from where bullet originates from (barrel of gun)
    // bullet comes out 1 unit in front of invader token (has to, else invader would destroy itself)
      let barrel = vector2dAdd(this.position, new vector2d(0, 40));
      cooldown += dt;

      function existsUnderneath(v) {
          let hb = v.hitbox();
          return barrel.y <= hb.top() && // true if there's invader below
                  hb.left() <= barrel.x && barrel.x <= hb.right();
      }

      if(cooldown > this.fireRate) {
        cooldown = 0;
        if(!gameArea.invadarr().a.find(existsUnderneath)) { // need to make 2D for find to work

        // TODO: Reintroduce 'randomized' shots at a later time
        // laChance is French for luck
        //let laChance = Math.floor(Math.random()*101);
        //if(laChance < shotChance) { //@BULL1
          // this.y + height + 1 to ensure bullet doesn't kill origin point  
          //____ fixing this will probably fix program, but the bullets seem to flow nicely atm

          // Since bullets have no other special properties (as of right now), they default to just ordinary game tokens
          gameArea.shots().push(new gameToken(
            /*position:*/     barrel,
            /*width:*/        5,
            /*height:*/       10,
            /*color:*/        "orange",
            /*type:*/         "enemyShot",
            /*direction:*/    new vector2d(0, 1),
            /*speed:   */     new vector2d(1, 125)));
      }
      //}
    }
  }
}

// Optional: With inheritance, can add new properties at the end of 'fireRate'
// Made into 'class' in case multiplayer gets established later
function playerToken(position, width, height, /* BULL1->speed = 125,0*/color = "red", type = "player", direction, speed, hp = 3, fireRate = .25) {
  // playerToken inherits from more generic gameToken class
  gameToken.call(this, position, width, height, color, type, direction, speed);
  this.prototype = Object.create(gameToken.prototype);

  // this.position  = position;
  // this.width     = width;
  // this.height    = height;
  // this.color     = color;
  // this.type      = type;
  // this.direction = direction;
  // this.speed     = speed;
  this.hp = hp; // hit points, number of bullets player can take, die = game over
  this.fireRate  = fireRate;

  let cooldown = 0;
  this.score   = 0;

  this.setup = function() { // RELOCATION: Moving setup to renderer
    // Set up player token's positioning (bottom-center)
    // Subtracting(read: displacing) by player token dimensions to accomodate 
    // for token's size 
    this.score = 0;
    this.position.x = canvas.width/2;
    this.position.y = canvas.height - this.height/2;
  }

  this.update = function(dt = 0) {
    // Variables tell what arrow keys are being pressed
    // canvas = document.getElementById("game-canvas");
    let rightKey = activeKeys[ArrowRight];
    let leftKey = activeKeys[ArrowLeft];

    // Player token direction based on arrow keys
    if (leftKey && !rightKey) {
      holding = 'left';
      this.direction = left;
    }
    if(!leftKey && rightKey) {
      holding = 'right';
      this.direction = right;
    }
    if(leftKey && rightKey) { // Special case: player holds both arrows
      if(holding == 'right') { // Was holding right first
        this.direction = left; // Choose left arbitrarily
      }
      if(holding == 'left') { // Was holding left first
        this.direction = right; // Most recent is right, so go right
      }
      if(holding == '') { // Edge case, pressed both at exact time, choose one
        holding = 'right';
        this.direction = right; 
      }
    }
    if(!rightKey && !leftKey) {
      holding = ''; // Reset, player is not holding either
      this.direction = idle;
    }

    if(this.hitbox().left() < 0) { // Boundary (move no further)
      this.position.x = this.width/2;
    }
    else if(this.hitbox().right() > canvas.width) { // Boundary(stay inside it)
      this.position.x = canvas.width - this.width/2; 
    }
    this.shoot(); // Invoke shooting action, to check if player pressed for fire
  }

  this.shoot = function() {
    let space = activeKeys[Space]; // Press < space > to shoot
    cooldown += dt; // Time until you can shoot again
    if (space && cooldown > fireRate) {
      cooldown = 0;
      let bHeight = 4;
      // (x,y) displacement accomodates for token's dimensions
      // Shot originates from middle of token and travels up
      // Negative direction because player's bullets go up
      // physics.shotKeeper.addShot(5, 10, "yellow", this.x + width/2, this.y - height/2, 
      // Bullet spawns just above the player token 
      // 
      //  [ ]    Bullet height = Token height/2, spawns, a total distance of
      //         Token height/2 - 1 above player token without touching it
      // █████              |
      //   *(x, y) Center   | Token height 
      // █████              |
      // Code below ensures bullet spawns 1 unit above top of player's hitbox

      // Add the bullet to existing game
      gameArea.shots().push(new gameToken(
                         /*position*/      new vector2d(
                                            this.position.x,
                                            this.hitbox().top() - bHeight - 1
                                           ),
                         /*width:*/        5, 
                         /*height:*/       bHeight,
                         /*color:*/        "yellow",
                         /*type:*/         "playerShot",
                         /*direction:*/    new vector2d(0, -1),
                         /*speed:*/        new vector2d(0, 500)));
    }
  }
}

function invaderArray() { // 2d invader array
  //  a: {},  // Associative array, doesn't have built-in methods (ex. length())
  let a    = [];

  let invaderCount, invaderWidth, invaderHeight,
      gapSpace,
      direction, speed, frameUpper, invaderRows;

  this.clear = function() {
    this.a = []; // Reset entire array content
  }

  // Initialize the properties of the array of invaders
  this.setup = function(invaderCount = 3, invaderWidth = 30, invaderHeight = 20, gapSpace = 30, direction = idle, speed, frameRate = 50 /* makes invader movement blocky (every 50 unit 'seconds', move for 1 unit 'second' */, invaderRows = 3) { 
    this.invaderCount  = invaderCount;
    this.invaderWidth  = invaderWidth;
    this.invaderHeight = invaderHeight;
    this.gapSpace      = gapSpace;
    this.direction     = direction;
    this.speed         = new vector2d(75, 100); // arbitrary for now
    this.frameUpper    = frameRate;
    this.invaderRows   = invaderRows;

    // Make sure invader array is clear (sanity check)
    this.clear();
    //
    // SETUP AND SPACING
    // Relative space between each invader
    // x coordinate of next invader's left side, count for previous invader's
    // width and add the gap space
    let next = this.invaderWidth + this.gapSpace;
    // Space between leftmost & rightmost invader boundaries and the canvas 
    // boundary
    // let edgeSpace = (canvas.width - this.invaderCount * (this.invaderWidth + this.gapSpace))/2 + this.gapSpace;
    let edgeSpace = canvas.width/2 - (((this.invaderWidth * invaderCount) + (this.gapSpace * (invaderCount - 1)))) + this.invaderWidth/2; 
    // Where to begin drawing the invaders centered in the canvas' x axis
    let drawAt = edgeSpace;  
    // GRID
    let y = this.invaderHeight/2 - 1000; // initial y positioning (at canvas boundary)
    let rowSpace = 100; // space between each row

    // let y = invaderRows * (invaderHeight + rowSpace) * -1;

    // EACH INDIVIDUAL INVADER
    // this.addRows(invaderRows);
    // Populate with invaderCount number of invaders
    for(let i = 0; i < invaderRows; ++ i) {
      for(let j = 0; j < invaderCount; ++ j) {
        this.a.push(
                                new invaderToken(
                                  /*position*/   new vector2d(drawAt, y),
                                  /*width:*/     this.invaderWidth,
                                  /*height:*/    this.invaderHeight,
                                  /*color:*/     "green",
                                  /*type:*/      "enemy",
                                  /*direcion:*/  idle,
                                  /*speed:   */  this.speed,
                                  /*hp:*/        3,
                                  /*fireRate*/   5));
        // Place game token in gameArea
        gameArea.entities().push(this.a[this.a.length - 1]);
        drawAt += next;
      }
      drawAt = edgeSpace;
      y += rowSpace; // GRID
    }
  }

  this.populated = function(dt = 0) {
    if(this.a.length == 0) {
       this.setup();
    }
  }

  this.update = function(dt = 0) {
    this.a.forEach(function(invader) {
        invader.update(dt);
        invader.shoot(dt);
    });
  }
}