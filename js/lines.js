var camera, scene, renderer;
var geometry, material, mesh;

var circlesRadius = 10;
var container = document.getElementById('container');
var linesControl = document.getElementById('lines-control');
var numLinesControl = document.getElementById('num-lines-control');
var numPointsControl = document.getElementById('num-points-control');
var numLines = 20;
var numPoints = 4;
numLinesControl.defaultValue = numLines;
numPointsControl.defaultValue = numPoints;
numLinesControl.addEventListener('input', function() {
    numLines = Number(numLinesControl.value);
    cancelAnimationFrame(animateId);
    if(scene.children[0]) {
        var quaternion = scene.children[0].quaternion.clone();
    }
    destroySceneObjects();
    initializeSceneObjects();
    if(scene.children[0]) {
        scene.children[0].applyQuaternion(quaternion);
    }
    animateId = requestAnimationFrame(animate);
});

numPointsControl.addEventListener('input', function() {
    numPoints = Number(numPointsControl.value);
    cancelAnimationFrame(animateId);
    if(scene.children[0]) {
        var quaternion = scene.children[0].quaternion.clone();
    }
    destroySceneObjects();
    initControlCircles();
    initializeSceneObjects();
    if(scene.children[0]) {
        scene.children[0].applyQuaternion(quaternion);
    }
    animateId = requestAnimationFrame(animate);
});



Raphael.el.is = function (type) { return this.type == (''+type).toLowerCase(); };
Raphael.el.x = function (val) { return this.is('circle') ? this.attr('cx', val) : this.attr('x', val); };
Raphael.el.y = function (val) { return this.is('circle') ? this.attr('cy', val) : this.attr('y', val); };
Raphael.el.pin = function() {
  this.data('ox', this.is('circle')? this.attr('cx') : this.attr('x'));
  this.data('oy', this.is('circle')? this.attr('cy') : this.attr('y'));
  return this;
};

Raphael.el.draggable = function(options) {
  var start = function() {
    this.pin();
    this.toFront();
  };
  var move = function(dx, dy, mx, my, ev) {
    //output.innerHTML = 'Moving: '+dx+', '+dy;
    this.x(this.data('ox')+dx);
    this.y(this.data('oy')+dy);
    if(this.pathStartsHere) {
        this.pathStartsHere.pathStart.x = this.data('ox')+dx;
        this.pathStartsHere.pathStart.y = this.data('oy')+dy;
        this.pathStartsHere.attr({ path: [
            'M',
            this.pathStartsHere.pathStart.x,
            this.pathStartsHere.pathStart.y,
            'L',
            this.pathStartsHere.pathEnd.x,
            this.pathStartsHere.pathEnd.y,
        ]});
    }

    if(this.pathEndsHere) {
        this.pathEndsHere.pathEnd.x = this.data('ox')+dx;
        this.pathEndsHere.pathEnd.y = this.data('oy')+dy;
        this.pathEndsHere.attr({ path: [
            'M',
            this.pathEndsHere.pathStart.x,
            this.pathEndsHere.pathStart.y,
            'L',
            this.pathEndsHere.pathEnd.x,
            this.pathEndsHere.pathEnd.y,
        ]});
    }
  };
  var end = function() {
  };
  this.drag(move, start, end);
};


Raphael.st.draggable = function(options) {
  for (var i in this.items) {
    this.items[i].draggable(options);
  }
  return this;
};

var paper = new Raphael('lines-control', linesControl.clientWidth, linesControl.clientHeight);

function initControlCircles() {
    var xStart = 40;
    var xIncrement = 350 / numPoints;
    paper.clear();
    circles = [];
    for(i = 0; i < numPoints; i ++) {
        circles.push(paper.circle(xStart + xIncrement * i, 200, circlesRadius));
    }
    for( var i = 0; i < circles.length; i++) {
        circles[i].attr({fill: 'lightblue', opacity:0.4})
        circles[i].draggable({margin: '10px'});
        if(i + 1 < circles.length) {
            var pathStart = {
                x: circles[i].attr('cx'),
                y: circles[i].attr('cy')
            };
            var pathEnd = {
                x: circles[i + 1].attr('cx'),
                y: circles[i + 1].attr('cy')
            };
            var path = paper.path([ 'M', pathStart.x, pathStart.y, 'L', pathEnd.x, pathEnd.y ]);
            path.pathStart = pathStart;
            path.pathEnd = pathEnd;
            circles[i].pathStartsHere = path;
            circles[i + 1].pathEndsHere = path;
        }
    }
}

initControlCircles();
init();
animate();

function init() {

	camera = new THREE.PerspectiveCamera( 55, container.clientWidth / container.clientHeight, 1, 800 );
    camera.position.set(0, 0, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

	scene = new THREE.Scene();

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( container.clientHeight, container.clientHeight );
	container.appendChild( renderer.domElement );

    initializeSceneObjects();

    isDragging = false;
    var previousMousePosition = {
        x: 0,
        y: 0
    };
    container.addEventListener('mousedown', function(e) {
        isDragging = true;
    });

    container.addEventListener('mousemove', function(e) {
        var deltaMove = {
            x: e.offsetX-previousMousePosition.x,
            y: e.offsetY-previousMousePosition.y
        };

        if(isDragging) {

            var deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    toRadians(deltaMove.y * 1),
                    toRadians(deltaMove.x * 1),
                    0,
                    'XYZ'
                ));
            if(scene.children[0]) {
                scene.children[0].quaternion.multiply(deltaRotationQuaternion);
            }
        }

        previousMousePosition = {
            x: e.offsetX,
            y: e.offsetY
        };
    });
    container.addEventListener('mouseup', function(e) {
        isDragging = false;
    });
}

function animate() {
	animateId = requestAnimationFrame( animate );
    updateSceneObjects();
	renderer.render( scene, camera );
}

function initializeSceneObjects() {
    var circleCoordinates = getCircleCoordinates();
    var group = new THREE.Group();
    for(var i = 0; i < numLines; i++) {
        var angle = i * toRadians(360 / (numLines) );
        var quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), angle );
        var material = new THREE.LineBasicMaterial({ color: 'steelblue' });
        material.lineWidth = 10;
        var geometry = new THREE.Geometry();
        var mirrorGeometry = new THREE.Geometry();
        for(var j = 0; j < circleCoordinates.length; j++) {
            var vector = new THREE.Vector3(circleCoordinates[j].x, circleCoordinates[j].y, 0);
            var mirrorVector = new THREE.Vector3(circleCoordinates[j].x, -circleCoordinates[j].y, 0);
            vector.applyQuaternion(quaternion);
            geometry.vertices.push(vector);
            mirrorVector.applyQuaternion(quaternion);
            mirrorGeometry.vertices.push(mirrorVector);
        }
        line = new THREE.Line(geometry, material);
        mirrorLine = new THREE.Line(mirrorGeometry, material);
        group.add( line );
        group.add( mirrorLine );
    }
    scene.add(group);
}

function destroySceneObjects() {
    while(scene.children[0]) {
        var object = scene.children[0];
        scene.remove(scene.children[0]);
        // object.dispose();
    }
}

function updateSceneObjects() {
    var i = 0;
    var circleCoordinates = getCircleCoordinates();
    var group = scene.children[0];
    for( var i = 0; i < group.children.length; i += 2 ) {
        var angle = i * toRadians(360 / (numLines) );
        var quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), angle );
        for(var j = 0; j < circleCoordinates.length; j++) {
            var vector = new THREE.Vector3(circleCoordinates[j].x, circleCoordinates[j].y, 0);
            var mirrorVector = new THREE.Vector3(circleCoordinates[j].x, -circleCoordinates[j].y, 0);
            vector.applyQuaternion(quaternion);
            mirrorVector.applyQuaternion(quaternion);
            var distance = vector.distanceTo(group.children[i].geometry.vertices[j]);
            if(distance !== 0) {
                group.children[i].geometry.vertices[j].x = vector.x;
                group.children[i + 1].geometry.vertices[j].x = mirrorVector.x;
                group.children[i].geometry.vertices[j].y = vector.y;
                group.children[i + 1].geometry.vertices[j].y = mirrorVector.y;
                group.children[i].geometry.vertices[j].z = vector.z;
                group.children[i + 1].geometry.vertices[j].z = mirrorVector.z;
                group.children[i].geometry.verticesNeedUpdate = true;
                group.children[i + 1].geometry.verticesNeedUpdate = true;
            }
        }
    }
}

function getCircleCoordinates() {
    var canvas = document.querySelector('#container canvas');
    var xScale = linesControl.clientWidth / (canvas.clientWidth / 0.4);
    var yScale = -linesControl.clientHeight / (canvas.clientHeight / 0.4);
    var circleCoordinates = [];
    for(var i = 0; i < circles.length; i++) {
        var coordinates = {
            x: (circles[i].attr('cx') - circles[0].attr('cx')) * xScale,
            y: (circles[i].attr('cy') - circles[0].attr('cy')) * yScale
        };
        circleCoordinates.push(coordinates);
    }

    return circleCoordinates;
}

function toRadians(angle) {
	return angle * (Math.PI / 180);
}

function toDegrees(angle) {
	return angle * (180 / Math.PI);
}