// README: 
// Functions and objects removed from main project because unneeded for now

// Attempt to ensure animation frames run optimally in any browser even 
// outdated ones
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

// Images
// Load game sprites/images
var imgRepo = new function(nImages = 2) { // Class instance
  // IMAGE DEFINITIONS
  let player_token_img           = new Image();
  let spaceship_token_img        = new Image();
  
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

  player_token_img.onload = function() {
    // Increment total loaded images by one when player token has been sourced
    imgLoaded();
  }
  spaceship_token_img.onload = function() {
    imgLoaded();
  }

  // SET IMAGE SOURCES
  player_token_img.src           = "/images/token-player1.svg";
  spaceship_token_img.src        = "/images/spaceship-demo.png";
};

// Belonged in renderer, no longer needed because player is now being drawn as a sprite object (as will every other token)
function _drawPlayer(token) { // render player token
  ctx.globalAlpha = 0.7; // Opacity
  //ctx.drawImage(imgRepo.player_token_img, token.position.x - token.width/2, 
    // token.position.y - token.height/2, token.width, token.height);
  ctx.drawImage(_playerSprite.spriteImage, _playerSprite)
}
