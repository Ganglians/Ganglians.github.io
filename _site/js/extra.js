// ************************************Extra***********************************
function framesPerSecond() { // Displays fps on canvas
//   // Extra: Display FPS on canvas                  
  // ctx.fillStyle = "rgba(0, 0, 0, 0)";
  // ctx.fillRect(0, 0, 200, 100);
  ctx.font = "15px Arial";
  ctx.fillStyle = "white";
  // ctx.fillText("Bullets: " +  shots.length);
  ctx.fillText("fps: " + fps, canvas.width - 50, canvas.height - 10);
  // ctx.fillText("playerBH: " + playerBH, canvas.width - 150, canvas.height - 50);
}

function score() { // Displays player score on canvas
  ctx.font = "15px" + " gamePixies"; // custom font
  ctx.fillStyle = "orange";
  ctx.fillText("score: " + gameArea.player1().score, canvas.width - 100, 0 + 20);
}

function objectsAreEqual(obj1, obj2) {
  /* quick & dirty way to do comparison between two objects of same type (if their collective strings match, then all their values, including deep nested ones, are all the same) */
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}

function objectIsEmpty(object){
   // var isEmpty=true;
   // if(JSON.stringify(object)==JSON.stringify({})){
   //   // Object is Empty
   //   isEmpty = true;
   // }
   // else{
   //   //Object is Not Empty
   //   isEmpty = false;
   // }
   // return isEmpty;

   return JSON.stringify(object) == JSON.stringify({});
}

function clearObject(object) {
  // The 'responsible' way to clear object (no worries about garbage collection from legacy browsers)
  for (let property in object) {
    delete object[property];
  }

}