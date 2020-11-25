// ************************************Extra***********************************
function framesPerSecond() { // Displays fps on canvas
//   // Extra: Display FPS on canvas                  
  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, 200, 100);
  ctx.font = '15px Arial';
  ctx.fillStyle = 'white';
  // ctx.fillText("Bullets: " +  shots.length);
  ctx.fillText("fps: " + fps, canvas.width - 50, canvas.height - 10);
  // ctx.fillText("playerBH: " + playerBH, canvas.width - 150, canvas.height - 50);
}