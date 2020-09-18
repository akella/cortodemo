import * as THREE from "three";
import './CORTOLoader';
import CortoDecoder from './corto.em'
import 'regenerator-runtime/runtime'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
console.log(CortoDecoder,'CortoDecoder');
var camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.z = 4;

// var controls = new TrackballControls( camera );
// controls.rotateSpeed = 10.0;
// controls.zoomSpeed = 1.5;
// controls.panSpeed = 0.8;
// controls.noZoom = false;
// controls.noPan = false;
// controls.staticMoving = true;
// controls.dynamicDampingFactor = 0.3;
// controls.keys = [ 65, 83, 68 ];
// controls.addEventListener( 'change', render );

var scene = new THREE.Scene();
scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
var ambient = new THREE.AmbientLight( 0xffffff, 0.3 );
scene.add( ambient);

var light1 = new THREE.DirectionalLight( 0xffffff, 1.0 );
light1.position.set( 1, 1, -0.5 );
scene.add( light1 );

var light2 = new THREE.DirectionalLight( 0xffffff, 1.0 );
light2.position.set( -1, -0.5, 1 );
scene.add( light2 );

var renderer = new THREE.WebGLRenderer( { antialias: false } );
renderer.setClearColor( scene.fog.color );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight);

var container = document.getElementById( 'container');
container.appendChild( renderer.domElement );

function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

var model = getURLParameter('model');
var path = getURLParameter('path');
if(!path) path = 'models/';
if(!model) model = 'mesh.00010.crt';

var loader = new THREE.CORTOLoader({ path: path }); //can pass a material or a multimaterial if you know whats' in the model.

var decode_times = [];
var em_times = [];

var blob = null;
var em_ready = false;

loader.load(model, function(mesh) {
	decode_times.push(loader.decode_time);
	blob = loader.blob;

	mesh.addEventListener("change", render);

	mesh.geometry.computeBoundingBox();
	if(!mesh.geometry.attributes.normal) {
		if(!mesh.geometry.attributes.uv) {
			mesh.geometry.computeVertexNormals();
		}
		else ambient.intensity = 1.0;
	}


	mesh.geometry.center();
	mesh.scale.divideScalar(mesh.geometry.boundingBox.getSize().length());
	scene.add(mesh); 

	render();

	setTimeout(profile, 1000);
} );


window.addEventListener( 'resize', onWindowResize, false );
render();


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	// controls.handleResize();
	// controls.update();
	render();
}

function animate() {
	requestAnimationFrame( animate );
	// controls.update();
}

function render() {
	renderer.render( scene, camera );
}

function profile() {
	if(!blob || !em_ready)
		return;

	var now = performance.now();
	var decoder = new CortoDecoder(blob);
	var model = decoder.decode();
	var ms = performance.now() - now;
	decode_times.push(ms);
	console.log((model.nvert/1024.0).toFixed(1) + "KV", ms.toFixed(1) + "ms", ((model.nvert/1000)/ms).toFixed(2) + "MV/s");
	console.log("js:", ms);

	// now = performance.now();
	// var geometry = CortoDecoderEm.decode(blob);
	// console.log(geometry,'my');
	// ms = performance.now() - now;
	// em_times.push(ms);
	// console.log("em:", ms);

	var nvert = document.getElementById("nvert");
	nvert.innerHTML= model.nvert;

	var nface = document.getElementById("nface");
	nface.innerHTML= model.nface;

	var timing = document.getElementById("timing");
	if(decode_times.length == 2)
		timing.innerHTML += " " + decode_times[0].toFixed(0) + "ms";
	timing.innerHTML += " " + decode_times[decode_times.length-1].toFixed(0) + "ms";

	var emtiming = document.getElementById("emtiming");
	if(em_times.length == 2)
		emtiming.innerHTML += " " + em_times[0].toFixed(0) + "ms";
	emtiming.innerHTML += " " + em_times[em_times.length-1].toFixed(0) + "ms";

	if(decode_times.length < 10) {
		setTimeout(profile, 10);
	} else {
		var avg = 0;
		for(var i = 0; i < decode_times.length; i++)
			avg += decode_times[i];
		avg /= decode_times.length;
		timing.innerHTML += "<br/ >Avg: " + avg.toFixed(0) + "ms";
		if(model.nface > 0)
			timing.innerHTML += "<br/ >Million Triangles per second: " + ((model.nface/1000)/avg).toFixed(2);
		else
			timing.innerHTML += "<br/ >Million Vertices per second: " + ((model.nvert/1000)/avg).toFixed(2);

	}
}

animate();

async function sync() {
	await CortoDecoder.ready;
	em_ready = true;
	console.log('em ready')
	// profile();
}

sync();