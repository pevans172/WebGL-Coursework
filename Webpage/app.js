var VSHADER_SOURCE =
	"attribute vec4 a_Position;\n" +
	"attribute vec4 a_Color;\n" +
	"attribute vec4 a_Normal;\n" + // Normal
	//
	"uniform mat4 u_ModelMatrix;\n" +
	"uniform mat4 u_NormalMatrix;\n" +
	"uniform mat4 u_ViewMatrix;\n" +
	"uniform mat4 u_ProjMatrix;\n" +
	//
	"varying vec4 v_Color;\n" +
	"varying vec3 v_Normal;\n" +
	"varying vec3 v_Position;\n" +
	//
	"void main() {\n" +
	"  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n" +
	"  v_Position = vec3(u_ModelMatrix * a_Position);\n" +
	"  v_Color = a_Color;\n" +
	"  v_Normal = normalize((u_NormalMatrix * a_Normal).xyz);\n" +
	"}\n";

// Fragment shader program
var FSHADER_SOURCE =
	"#ifdef GL_ES\n" +
	"precision mediump float;\n" +
	"#endif\n" +
	//
	"varying vec4 v_Color;\n" +
	"varying vec3 v_Normal;\n" +
	"varying vec3 v_Position;\n" +
	//
	"uniform vec3 lightColors[6];\n" + // Light color array
	"uniform vec3 lightPositions[6];\n" + // Light color array
	"uniform vec3 AmbientLight;\n" + // Light color
	//
	"void main() {\n" +
	"  vec3 diffuse = vec3(0,0,0);\n" +
	"  vec3 normal = normalize(v_Normal);\n" +
	// "  vec3 normal = v_Normal;\n" +
	"  for (int i = 0; i < 6; i++){\n" +
	"    float lightDistance = length(lightPositions[i] - v_Position);\n" +
	"    vec3 lightDirection = normalize(lightPositions[i] - v_Position);\n" +
	"    float nDotL = max(dot(normal, lightDirection), 0.0);\n" +
	"    diffuse = diffuse + lightColors[i] * v_Color.rgb * nDotL * inversesqrt(lightDistance);\n" +
	"  }\n" +
	"  vec3 ambient = v_Color.rgb * AmbientLight;\n" +
	"  gl_FragColor = vec4(diffuse, v_Color.a);\n" +
	"}\n";

var modelMatrix = new Matrix4(); // The model matrix
var viewMatrix = new Matrix4(); // The view matrix
var projMatrix = new Matrix4(); // The projection matrix
var g_normalMatrix = new Matrix4(); // Coordinate transformation matrix for normals

// for moving the camera
var lookAtVector = glMatrix.vec3.create();
lookAtVector[0] = 13;
lookAtVector[1] = 10;
lookAtVector[2] = -13;
var origin = glMatrix.vec3.create();
origin[0] = 0;
origin[1] = 1;
origin[2] = 0;
var u_ViewMatrix = 0;
var ANGLE_STEP = 3.0;

// chair and table animation switches
var isChairShifted = false;
var isTableShifted = false;

// Lighting
var lightBulbLightColor1 = 0;
var lightBulbLightColor2 = 0;
var lightBulbLightColor3 = 0;
var lightBulbLightColor4 = 0;

var windowLightColor = 0;
var tvLightColor = 0;

function main() {
	// Retrieve <canvas> element
	var canvas = document.getElementById("canvas");
	// Get the rendering context for WebGL
	var gl = getWebGLContext(canvas);
	if (!gl) {
		console.log("Failed to get the rendering context for WebGL");
		return;
	}
	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log("Failed to intialize shaders.");
		return;
	}
	// Set clear color and enable hidden surface removal
	gl.clearColor(0.9, 0.9, 0.9, 1);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

	// Clear color and depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Get the storage locations of uniform attributes
	var u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
	u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
	var u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
	var u_ProjMatrix = gl.getUniformLocation(gl.program, "u_ProjMatrix");
	// check all asignments above are working
	if (!u_ModelMatrix || !u_ViewMatrix || !u_NormalMatrix || !u_ProjMatrix) {
		console.log("Failed to Get the storage locations of u_ModelMatrix, u_ViewMatrix, and/or u_ProjMatrix");
		return;
	}

	// set up the camera
	var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	var zNear = 1;
	var zFar = 100;
	projMatrix.setPerspective(100, aspect, zNear, zFar);
	viewMatrix.setLookAt(lookAtVector[0], lookAtVector[1], lookAtVector[2], 0, 3, 0, 0, 1, 0);

	// Pass the model, view, and projection matrix to the uniform variable respectively
	gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
	gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

	// set the lights
	lightBulbLight1 = gl.getUniformLocation(gl.program, "lightPositions[0]");
	lightBulbLightColor1 = gl.getUniformLocation(gl.program, "lightColors[0]");
	gl.uniform3f(lightBulbLightColor1, 1.0, 1.0, 1.0);
	gl.uniform3f(lightBulbLight1, 0.3, 7.8, 0.3);
	lightBulbLight2 = gl.getUniformLocation(gl.program, "lightPositions[1]");
	lightBulbLightColor2 = gl.getUniformLocation(gl.program, "lightColors[1]");
	gl.uniform3f(lightBulbLightColor2, 1.0, 1.0, 1.0);
	gl.uniform3f(lightBulbLight2, 0.3, 7.8, -0.3);
	lightBulbLight3 = gl.getUniformLocation(gl.program, "lightPositions[2]");
	lightBulbLightColor3 = gl.getUniformLocation(gl.program, "lightColors[2]");
	gl.uniform3f(lightBulbLightColor3, 1.0, 1.0, 1.0);
	gl.uniform3f(lightBulbLight3, -0.3, 7.8, 0.3);
	lightBulbLight4 = gl.getUniformLocation(gl.program, "lightPositions[3]");
	lightBulbLightColor4 = gl.getUniformLocation(gl.program, "lightColors[3]");
	gl.uniform3f(lightBulbLightColor4, 1.0, 1.0, 1.0);
	gl.uniform3f(lightBulbLight4, -0.3, 7.8, -0.3);

	// windowLight = gl.getUniformLocation(gl.program, "lightPositions[4]");
	// windowLightColor = gl.getUniformLocation(gl.program, "lightColors[4]");
	// gl.uniform3f(windowLightColor, 1.0, 1.0, 1.0);
	// gl.uniform3f(windowLight, -12, 2, 0);

	tvLight = gl.getUniformLocation(gl.program, "lightPositions[5]");
	tvLightColor = gl.getUniformLocation(gl.program, "lightColors[5]");
	gl.uniform3f(tvLightColor, 1.0, 1.0, 1.0);
	gl.uniform3f(tvLight, 0, 1.6, 9.5);

	// check for keyboard input
	document.onkeydown = function(ev) {
		keydown(ev, gl, u_ModelMatrix, u_NormalMatrix);
	};

	requestAnimationFrame(draw(gl, u_ModelMatrix, u_NormalMatrix));
}

// this is one function for keyboard input thats called
function keydown(ev, gl, u_ModelMatrix, u_NormalMatrix) {
	switch (ev.keyCode) {
		// CAMERA
		case 87: // Up w key -> the positive rotation of arm1 around the y-axis
			glMatrix.vec3.scale(lookAtVector, lookAtVector, 0.9);
			viewMatrix.setLookAt(lookAtVector[0], lookAtVector[1], lookAtVector[2], 0, 3, 0, 0, 1, 0);
			gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
			break;
		case 83: // Down s key -> the negative rotation of arm1 around the y-axis
			glMatrix.vec3.scale(lookAtVector, lookAtVector, 1.1);
			viewMatrix.setLookAt(lookAtVector[0], lookAtVector[1], lookAtVector[2], 0, 3, 0, 0, 1, 0);
			gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
			break;
		case 68: // Right 'd' key -> the positive rotation of arm1 around the y-axis
			var rad = glMatrix.glMatrix.toRadian(3);
			glMatrix.vec3.rotateY(lookAtVector, lookAtVector, origin, rad);
			viewMatrix.setLookAt(lookAtVector[0], lookAtVector[1], lookAtVector[2], 0, 3, 0, 0, 1, 0);
			gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
			break;
		case 65: // Left 'a' key -> the negative rotation of arm1 around the y-axis
			var rad = glMatrix.glMatrix.toRadian(3);
			glMatrix.vec3.rotateY(lookAtVector, lookAtVector, origin, -rad);
			viewMatrix.setLookAt(lookAtVector[0], lookAtVector[1], lookAtVector[2], 0, 3, 0, 0, 1, 0);
			gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
			break;

		// ANIMATIONS
		case 67: // move the chairs back or forth
			if (isChairShifted) {
				isChairShifted = false;
			} else if (!isChairShifted) {
				isChairShifted = true;
			}
			break;
		case 84: // move the tables back or forth
			if (isTableShifted) {
				isTableShifted = false;
			} else if (!isTableShifted) {
				isTableShifted = true;
			}
			break;

		// lighting
		case 80: // p to turn the tv light off
			if (typeof keydown.counter_TV == "undefined") {
				keydown.counter_TV = false;
			}

			if (keydown.counter_TV == false) {
				gl.uniform3f(tvLightColor, 0, 0, 0);
				keydown.counter_TV = true;
			} else if (keydown.counter_TV == true) {
				gl.uniform3f(tvLightColor, 1.0, 1.0, 1.0);
				keydown.counter_TV = false;
			}
			break;
		case 79: // o to turn the tv light bulb off
			if (typeof keydown.counter_light == "undefined") {
				keydown.counter_light = false;
			}
			if (keydown.counter_light == false) {
				gl.uniform3f(lightBulbLightColor1, 0, 0, 0);
				gl.uniform3f(lightBulbLightColor2, 0, 0, 0);
				gl.uniform3f(lightBulbLightColor3, 0, 0, 0);
				gl.uniform3f(lightBulbLightColor4, 0, 0, 0);
				keydown.counter_light = true;
			} else if (keydown.counter_light == true) {
				gl.uniform3f(lightBulbLightColor1, 1.0, 1.0, 1.0);
				gl.uniform3f(lightBulbLightColor2, 1.0, 1.0, 1.0);
				gl.uniform3f(lightBulbLightColor3, 1.0, 1.0, 1.0);
				gl.uniform3f(lightBulbLightColor4, 1.0, 1.0, 1.0);
				keydown.counter_light = false;
			}
			break;

		default:
			return; // Skip drawing at no effective action
	}

	// Draw the scene
	draw(gl, u_ModelMatrix, u_NormalMatrix);
}

// Creates a cube
// prettier-ignore
function initVertexBuffers(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);
  
  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, num, type) {
	// Create a buffer object
	var buffer = gl.createBuffer();
	if (!buffer) {
		console.log("Failed to create the buffer object");
		return false;
	}
	// Write date into the buffer object
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
	// Assign the buffer object to the attribute variable
	var a_attribute = gl.getAttribLocation(gl.program, attribute);
	if (a_attribute < 0) {
		console.log("Failed to get the storage location of " + attribute);
		return false;
	}
	gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
	// Enable the assignment of the buffer object to the attribute variable
	gl.enableVertexAttribArray(a_attribute);

	gl.bindBuffer(gl.ARRAY_BUFFER, null);

	return true;
}

// Array for storing a matrix
var g_matrixStack = [];
function pushMatrix(m) {
	// Store the specified matrix to the array
	var m2 = new Matrix4(m);
	g_matrixStack.push(m2);
}

function popMatrix() {
	// Retrieve the matrix from the array
	return g_matrixStack.pop();
}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n) {
	pushMatrix(modelMatrix);

	// Pass the model matrix to the uniform variable
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

	// Calculate the normal transformation matrix and pass it to u_NormalMatrix
	g_normalMatrix.setInverseOf(modelMatrix);
	g_normalMatrix.transpose();
	gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

	// Draw the cube
	gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

	modelMatrix = popMatrix();
}

function setColorOfBox(gl, colors, r, g, b) {
	for (var i = 0; i < 54; i++) {
		colors[i] = r;
		i++;
		colors[i] = g;
		i++;
		colors[i] = b;
	}
	if (!initArrayBuffer(gl, "a_Color", colors, 3, gl.FLOAT)) return -1;
}

function drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, shiftX, shiftY, shiftZ) {
	// Rotate, and then translate
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)
	///////////////
	///// Main Body
	///////////////

	// Model the chair seat
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 0 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(2.0, 0.5, 2.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair back
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 1.25 + shiftY, -0.75 + shiftZ); // Translation
	modelMatrix.scale(2.0, 2.0, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////////
	///// legs
	///////////////
	// Model the chair left front leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(-0.75 + shiftX, -1 + shiftY, 0.75 + shiftZ); // Translation
	modelMatrix.scale(0.5, 2, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair left back leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(-0.75 + shiftX, -1 + shiftY, -0.75 + shiftZ); // Translation
	modelMatrix.scale(0.5, 2, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair right front leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(0.75 + shiftX, -1 + shiftY, 0.75 + shiftZ); // Translation
	modelMatrix.scale(0.5, 2, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair right back leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(0.75 + shiftX, -1 + shiftY, -0.75 + shiftZ); // Translation
	modelMatrix.scale(0.5, 2, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();
}

function drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, shiftX, shiftY, shiftZ) {
	// Rotate, and then translate
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)

	// Table Top
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 1.5 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(3.0, 0.3, 3.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////////
	///// legs
	///////////////
	// Model the chair left front leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(-1.0 + shiftX, -0.25 + shiftY, 1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 3.25, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair left front leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.0 + shiftX, -0.25 + shiftY, 1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 3.25, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair left front leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(-1.0 + shiftX, -0.25 + shiftY, -1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 3.25, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// Model the chair left front leg
	pushMatrix(modelMatrix);
	modelMatrix.translate(1.0 + shiftX, -0.25 + shiftY, -1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 3.25, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();
}

function drawRoom(gl, u_ModelMatrix, u_NormalMatrix, n, colors, shiftX, shiftY, shiftZ) {
	setColorOfBox(gl, colors, 0.388, 0.572, 0.792);
	// Rotate, and then translate
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)

	///////////////
	///// floor
	///////////////
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, -2, 0); // Translation
	modelMatrix.scale(30, 0.1, 30); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////////
	///// Wall 1 back
	///////////////
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 2, -15); // Translation
	modelMatrix.scale(30, 8, 0.1); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////////
	///// Wall 2 left
	///////////////
	pushMatrix(modelMatrix);
	modelMatrix.translate(-15, 2, 0); // Translation
	modelMatrix.scale(0.1, 8, 30); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////////
	///// Wall 3 right
	///////////////
	pushMatrix(modelMatrix);
	modelMatrix.translate(15, 2, 0); // Translation
	modelMatrix.scale(0.1, 8, 30); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////////
	///// Wall 4 front
	///////////////
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 2, 15); // Translation
	modelMatrix.rotate(180, 0, 1, 0); // Rotate along y axis
	modelMatrix.scale(30, 8, 0.1); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();
}

function drawWindow(gl, u_ModelMatrix, u_NormalMatrix, n, colors, shiftX, shiftY, shiftZ) {
	// Rotate, and then translate
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)

	setColorOfBox(gl, colors, 1, 1, 1);

	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.9, 2, 0); // Translation
	modelMatrix.scale(0.1, 4, 10); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	setColorOfBox(gl, colors, 0.627, 0.227, 0.054);

	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.8, 2, 0); // Translation
	modelMatrix.scale(0.1, 0.3, 10); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.8, 2, 0); // Translation
	modelMatrix.scale(0.1, 4, 0.3); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// left frame
	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.8, 2, 5.1); // Translation
	modelMatrix.scale(0.1, 4, 0.3); // Scale
	modelMatrix.rotate(1, 0, 0); // Rotate along x axis
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// right frame
	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.8, 2, -5.1); // Translation
	modelMatrix.scale(0.1, 4, 0.3); // Scale
	modelMatrix.rotate(1, 0, 0); // Rotate along x axis
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.8, -0.1, 0); // Translation
	modelMatrix.scale(0.1, 0.3, 10); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(-14.8, 4.1, 0); // Translation
	modelMatrix.scale(0.1, 0.3, 10); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();
}

function drawLight(gl, u_ModelMatrix, u_NormalMatrix, n, colors, shiftX, shiftY, shiftZ) {
	// Rotate, and then translate
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)

	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 10, 0); // Translation
	modelMatrix.scale(5, 0.1, 5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 9, 0); // Translation
	modelMatrix.scale(0.05, 2, 0.05); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	setColorOfBox(gl, colors, 1, 1, 1);
	// lightbulb
	pushMatrix(modelMatrix);
	modelMatrix.translate(0, 8, 0); // Translation
	modelMatrix.scale(0.25, 0.25, 0.25); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();
}

function drawTVandTable(gl, u_ModelMatrix, u_NormalMatrix, n, colors, shiftX, shiftY, shiftZ) {
	setColorOfBox(gl, colors, 0.474, 0.247, 0.184);
	// Rotate, and then translate
	modelMatrix.setTranslate(0, 0, 0); // Translation (No translation is supported here)

	// Table Top
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 0 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(5.0, 0.3, 4.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// legs
	pushMatrix(modelMatrix);
	modelMatrix.translate(-2.0 + shiftX, -1 + shiftY, 1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 1, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(2.0 + shiftX, -1 + shiftY, 1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 1, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(-2.0 + shiftX, -1 + shiftY, -1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 1, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	pushMatrix(modelMatrix);
	modelMatrix.translate(2.0 + shiftX, -1 + shiftY, -1.0 + shiftZ); // Translation
	modelMatrix.scale(0.5, 1, 0.5); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	///////////// tv
	setColorOfBox(gl, colors, 0.588, 0.588, 0.588);
	// top
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 3 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(4.0, 0.3, 3.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// bottom
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 0.2 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(4.0, 0.3, 3.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// left
	pushMatrix(modelMatrix);
	modelMatrix.translate(2 + shiftX, 1.6 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(0.3, 2.8, 3.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// right
	pushMatrix(modelMatrix);
	modelMatrix.translate(-2 + shiftX, 1.6 + shiftY, 0 + shiftZ); // Translation
	modelMatrix.scale(0.3, 2.8, 3.0); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	// back
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 1.6 + shiftY, 1.5 + shiftZ); // Translation
	modelMatrix.scale(4.0, 2.8, 0.3); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();

	/// screen
	setColorOfBox(gl, colors, 0.7, 0.7, 0.7);
	pushMatrix(modelMatrix);
	modelMatrix.translate(0 + shiftX, 1.6 + shiftY, -1.3 + shiftZ); // Translation
	modelMatrix.rotate(180, 0, 1, 0); // Rotate along y axis
	modelMatrix.scale(4.0, 2.8, 0.3); // Scale
	drawbox(gl, u_ModelMatrix, u_NormalMatrix, n);
	modelMatrix = popMatrix();
}

function drawAllChairs(gl, u_ModelMatrix, u_NormalMatrix, n, colors, shiftX, shiftY, shiftZ) {
	setColorOfBox(gl, colors, 0.737, 0.49, 0.423);
	var xs = 0;
	var ys = 0;
	var zs = 0;

	// Chair 1
	xs = -7 + shiftX;
	ys = 0 + shiftY;
	zs = -12 + shiftZ;
	drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	/// Chair 2
	xs = 0 + shiftX;
	ys = 0 + shiftY;
	zs = -12 + shiftZ;
	drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	/// Chair 3
	xs = 7 + shiftX;
	ys = 0 + shiftY;
	zs = -12 + shiftZ;
	drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	/// Chair 4
	xs = -7 + shiftX;
	ys = 0 + shiftY;
	zs = 0 + shiftZ;
	drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	/// Chair 5
	xs = 0 + shiftX;
	ys = 0 + shiftY;
	zs = 0 + shiftZ;
	drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	/// Chair 6
	xs = 7 + shiftX;
	ys = 0 + shiftY;
	zs = 0 + shiftZ;
	drawChair(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);
}

function drawAllTables(gl, u_ModelMatrix, u_NormalMatrix, n, colors, shiftX, shiftY, shiftZ) {
	setColorOfBox(gl, colors, 0.474, 0.247, 0.184);
	var xs = 0;
	var ys = 0;
	var zs = 0;

	// 1
	xs = -7 + shiftX;
	ys = 0 + shiftY;
	zs = -9 + shiftZ;
	drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	// 2
	xs = 0 + shiftX;
	ys = 0 + shiftY;
	zs = -9 + shiftZ;
	drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	// 3
	xs = 7 + shiftX;
	ys = 0 + shiftY;
	zs = -9 + shiftZ;
	drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	// 4
	xs = -7 + shiftX;
	ys = 0 + shiftY;
	zs = 3 + shiftZ;
	drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	// 5
	xs = 0 + shiftX;
	ys = 0 + shiftY;
	zs = 3 + shiftZ;
	drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);

	// 6
	xs = 7 + shiftX;
	ys = 0 + shiftY;
	zs = 3 + shiftZ;
	drawTable(gl, u_ModelMatrix, u_NormalMatrix, n, xs, ys, zs);
}

// the main drawing function
function draw(gl, u_ModelMatrix, u_NormalMatrix) {
	return function() {
		// Clear color and depth buffer
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Calculate the view matrix and the projection matrix
		modelMatrix.setTranslate(0, 0, 0);
		// Pass the model matrix to the uniform variable
		gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

		var n = initVertexBuffers(gl);
		if (n < 0) {
			console.log("Failed to set the vertex information");
			return;
		}
		var colors = new Float32Array(54);

		// the variables we use to posiotion the objects
		var shiftX = 0;
		var shiftY = 0;
		var shiftZ = 0;

		// Room and Window and light and tv
		drawRoom(gl, u_ModelMatrix, u_NormalMatrix, n, colors, 0, 0, 0);
		drawWindow(gl, u_ModelMatrix, u_NormalMatrix, n, colors, 0, 0, 0);
		drawTVandTable(gl, u_ModelMatrix, u_NormalMatrix, n, colors, 0, 0, 12);
		drawLight(gl, u_ModelMatrix, u_NormalMatrix, n, colors, 0, 0, 0);

		// Chairs
		if (typeof draw.counter_C == "undefined") {
			draw.counter_C = 1;
		}
		if (isChairShifted) {
			if (draw.counter_C < 1) {
				draw.counter_C += 0.1;
			} else if (draw.counter_C == -1) {
				draw.counter_C += 0.1;
			}
		} else if (!isChairShifted) {
			if (draw.counter_C > -1) {
				draw.counter_C -= 0.1;
			} else if (draw.counter_C == 1) {
				draw.counter_C -= 0.1;
			}
		}
		drawAllChairs(gl, u_ModelMatrix, u_NormalMatrix, n, colors, 0, 0, draw.counter_C);

		// Tables
		if (typeof draw.counter_T == "undefined") {
			draw.counter_T = 1;
		}
		if (isTableShifted) {
			if (draw.counter_T > 1) {
				draw.counter_T -= 0.1;
			} else if (draw.counter_T == 3 || draw.counter_T == 1) {
				draw.counter_T -= 0.1;
			}
		} else if (!isTableShifted) {
			if (draw.counter_T < 3) {
				draw.counter_T += 0.1;
			} else if (draw.counter_T == 3 || draw.counter_T == 1) {
				draw.counter_T += 0.1;
			}
		}
		drawAllTables(gl, u_ModelMatrix, u_NormalMatrix, n, colors, 0, 0, draw.counter_T);

		requestAnimationFrame(draw(gl, u_ModelMatrix, u_NormalMatrix));
	};
}
