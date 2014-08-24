// Our Javascript will go here.
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, (window.innerWidth) / (window.innerHeight), 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setClearColorHex(0xFFFFFF, 1);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

// Get the DIV element from the HTML document by its ID and append the renderers DOM
// object to it
document.getElementById("WebGLCanvas").appendChild(renderer.domElement);

camera.position.set(0,-70,50);
camera.up = new THREE.Vector3(0,0,1);
camera.lookAt(new THREE.Vector3(0,0,0));

function render() {
	requestAnimationFrame(render);
	//base.rotation.z += 0.003;	
	renderer.render(scene, camera);
}
render();
	
// @brief Draws a base and the points array	path
function draw3dRose(radius){
	console.log(rose_array);
	removePreviousBase();
	addNewBase(radius);
	removePreviousPath();
	addNewPath();
}

function removePreviousBase(){
	var obj, i;
	var base = scene.getObjectByName( "base" );
	for ( i = scene.children.length - 1; i >= 0 ; i -- ) {
		obj = scene.children[ i ];
		if ( obj == base ) {
			scene.remove(obj);
		}
	}
}

function addNewBase(rad){
	var radius = rad + 2;
	var segments = 50;

	var circleGeometry = new THREE.CircleGeometry( radius, segments );	
	var circleMaterial = new THREE.MeshBasicMaterial( {color: 0xBBFFFF, side: THREE.DoubleSide} );
	var base = new THREE.Mesh( circleGeometry, circleMaterial );
	base.name = "base";
	scene.add( base );
}

// @brief add the new path to the base
function addNewPath(){	
	// http://threejs.org/docs/#Reference/Objects/Line			
	var material = new THREE.LineBasicMaterial({
		color: 0x0000ff,
		linewidth : 2
	});
	
	var geometry = new THREE.Geometry();
	for(var i = 0; i<rose_array.length; i++)
		geometry.vertices.push( new THREE.Vector3(  rose_array[i][0],  rose_array[i][1], rose_array[i][2]) );
	
	var line = new THREE.Line( geometry, material );
	var base = scene.getObjectByName( "base" );
	base.add( line );
}

// @brief Sweeps all objects within scene and deletes base object
function removePreviousPath(){
	var obj, i;
	var base = scene.getObjectByName( "base" );
	for ( i = base.children.length - 1; i >= 0 ; i -- ) {
		obj = base.children[ i ];
		if ( obj !==base) {
			base.remove(obj);
		}
	}
}