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