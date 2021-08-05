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

// Specific Objects/Classes
// function sprite(imgPath, frames, frameRate) {
//   this.frames = frames;
//   this.frameRate = frameRate;
//   let currentFrame = 0;
//   let time = 0;
  
//   let image = new Image();
//   // image.onload = function() {
//     image.src = imgPath;
//   // }

//   this.image = image;

//   this.update = function(dt) {
//     time += dt;
//     if(time >= 1/this.frameRate) {
//       time = 0;
//       currentFrame = (currentFrame + 1) % this.frames;
//     }
//   }
// }
//
// Sprite Object
//
function Sprite(imgPath, frames, frameRate, r=0, g=0, b=0) {
    let spriteImage = new Image();
    let image = new Image();

    spriteImage.onload = function () {
        let spriteCanvas = document.createElement("canvas");
        let spriteContext = spriteCanvas.getContext('2d');

        spriteCanvas.width = spriteImage.width;
        spriteCanvas.height = spriteImage.height;

        spriteContext.drawImage(spriteImage,
                                0, 0, spriteImage.width, spriteImage.height,
                                0, 0, spriteCanvas.width, spriteCanvas.height);

        let sourceData = spriteContext.getImageData(0, 0, spriteImage.width, spriteImage.height);

        let data = sourceData.data;
        // for (var i=0; i<data.length; i += 4) {
        //     data[i]  = r;
        //     data[i+1]= g;
        //     data[i+2]= b;
        //     // Leave the alpha channel alone
        // }
        spriteContext.putImageData(sourceData, 0, 0);

        image.src = spriteCanvas.toDataURL('image/png');
    };

    spriteImage.src = imgPath;

    this.frames = frames;
    this.frameRate = frameRate;
    this.timer = 0;
    this.currentFrame = 0;
    this.image = image;
    this.frameWidth = []; // Frames w/ varying widths
    this.frameAt = [];

    this.update = function (dt) {
        this.timer += dt;
        if( this.timer > 1/this.frameRate ) {
            this.timer = 0;

            this.currentFrame = (this.currentFrame+1)%this.frames;
        }
    }
}

function token(position, width, height, color="blue", type="") {
  this.position   = position; // position vector (2d)
  this.width      = width;
  this.height     = height;
  this.color      = color;
  this.type       = type; // game token, text token, etc
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
      this.position.y += 175 * dt;
    }
    else if(vTop > 0 && this.direction == idle) {
      this.direction = right;
    }

    if(vRightmost > canvas.width) {
      this.position.y += 30;
      this.direction = left;
    }

    // Left boundary of canvas
    else if(vLeftmost <= 0) {
      this.position.y += 30;
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
  this.setup = function(invaderCount = 3, invaderWidth = 30, invaderHeight = 20, gapSpace = 30, direction = idle, speed, frameRate = 50 /* makes invader movement blocky (every 50 unit 'seconds', move for 1 unit 'second' */, invaderRows = 2) { 
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
                                  /*speed:   */  new vector2d(this.speed.x, 
                                                              this.speed.y),
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