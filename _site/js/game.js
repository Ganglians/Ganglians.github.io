"use strict";

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

//*****************************FUNCTIONS***************************************
// Renderer object
var renderer = (function() {
  // All sprite intances
  // let playerImgSrc = imgRepo.spaceship_token_img; 
  // let playerImgSrc = "/images/spaceship-demo.png";
  let _playerSprite = new Sprite("/images/spaceship-demo.png", 4, 1);
  
  // Account for different sprite widths - where each frame starts at and how
  // wide it is
  // NOTE: Hardcoded for now, but might find more efficient/readable way later
  _playerSprite.frameAt.push(0);
  _playerSprite.frameWidth.push(25);
  _playerSprite.frameAt.push(25);
  _playerSprite.frameWidth.push(20);
  _playerSprite.frameAt.push(46);
  _playerSprite.frameWidth.push(18);
  _playerSprite.frameAt.push(64);
  _playerSprite.frameWidth.push(18);



  // All sprites here
  let _sprites = [].concat(_playerSprite);

  function _writeText(token) {
    // style 
    ctx.fillStyle = token.color;
    ctx.textAlign = token.align;
    // format ex: "14vw consolas"
    ctx.font = token.fontSize + token.fontUnit + " " + token.font;

    ctx.fillText(token.text, token.position.x, token.position.y);
  }
  // methods to draw specific game tokens (they don't look through stored 
  // tokens)
                             // variable will be defined internally 
  function _drawRectangle(token) {
    ctx.fillStyle = token.color;
    ctx.globalAlpha = 0.7; // Opacity
    // Since drawing starts at upper-lefthand corner
    ctx.fillRect(token.position.x - token.width/2, 
      token.position.y - token.height/2, token.width, token.height); 
  }

  function _drawSprite(sprite, token) {
    ctx.drawImage(
    /*img*/        sprite.image, 
    // /*sx*/         (sprite.image.width/sprite.frames)*sprite.currentFrame,
    /*sx*/         sprite.frameAt[sprite.currentFrame], // x pos.
    /*sy*/         0,
    // /*swidth*/     sprite.image.width/sprite.frames,
    /*swidth*/     sprite.frameWidth[sprite.currentFrame], // how wide
    /*sheight*/    sprite.image.height,
    /*x*/          token.position.x-token.width/2,
    /*y*/          token.position.y-token.height/2,
    /*width*/      token.width,
    /*height*/     token.height);
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

    // Update sprite frames
    _sprites.forEach(function(sprite) {
      sprite.update(dt);
    });

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
      // Update sprites

      // if(entity instanceof textToken) {
      //   _writeText(entity);
      // }
      if(entity instanceof playerToken) {
        _drawSprite(_playerSprite, entity);
        _drawRectOutline(entity.hitbox()); // for TESTing HITBOX
      }
      else if(entity instanceof invaderToken) {
        _drawInvader(entity);
        _drawRectOutline(entity.hitbox()); // for TESTing HITBOX
      }
      else { // Default, draws rectangle
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
  let startLoop   = false; // Starts/stops gameloop

  // Title menu
  let titleCard   = true;
  let titleOpty   = 0; // Use for fade effects on game's title text
  let subMenuOpty = 0; // Use for fade effects on game's title submenu
  // --------------------------------------------------------------------------

  function _tog() {
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
    } 
    else { // End game, reset relevant variables
      timeStamp = 0; // TODO: Reset timeStamp(?)
      startLoop = false;
      // TODO: save game progress/score
      toggle(canvas); // Hide canvas
      for(let i = 0; i < nav.length; i ++) { // re-display nav links
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

  function _gameLoop(timeStamp) {
    if(!startLoop) { // Conditional that stops loop 
      return;
    }

    else if(titleCard) { // Display game title
      // Will also work for touchscreen since its listener takes an input and
      // maps to a key
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
      renderer.render(dt);
      score();
      framesPerSecond(); // Just a display, doesn't contribute to game 

      // TODO: Reset timeStamp(?) Not sure if possible
    }

    // Keep requesting further iterations of 'gameLoop' to animate game
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