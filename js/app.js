import * as THREE from "three";
import './CORTOLoader';
import CortoDecoderEm from './corto.em'
import CortoDecoder from './cortodecoder'
import 'regenerator-runtime/runtime'
import model from '../models/mesh.00001.crt';
import model1 from '../models/mesh.00001.obj';
import texture from '../models/tex.00001.png';
import basistexture from '../models/tex.00001.basis';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { BasisTextureLoader } from 'three/examples/jsm/loaders/BasisTextureLoader.js';
var camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.1, 100 );
camera.position.z = 2;
camera.position.y = 2;

var renderer = new THREE.WebGLRenderer( { antialias: false } );

var controls = new OrbitControls( camera,renderer.domElement );

controls.addEventListener( 'change', render );

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


renderer.setClearColor( scene.fog.color );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight);

var container = document.getElementById( 'container');
container.appendChild( renderer.domElement );

function getURLParameter(name) {
	return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}

// var model = getURLParameter('model');
// var path = getURLParameter('path');
// if(!path) path = 'models/';
// if(!model) model = 'mesh.00010.crt';

var loader = new THREE.CORTOLoader(); //can pass a material or a multimaterial if you know whats' in the model.
var loader1 = new OBJLoader(); //can pass a material or a multimaterial if you know whats' in the model.

var decode_times = [];
var em_times = [];

var blob = null;
var em_ready = false;

let material = new THREE.ShaderMaterial({
uniforms: {
},
// wireframe: true,
// transparent: true,
vertexShader: `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,
fragmentShader: `
varying vec2 vUv;
void main()  {
	gl_FragColor = vec4(vUv,0.0,1.);
}`
});

material = new THREE.MeshBasicMaterial({
	map: new THREE.TextureLoader().load(texture)
})

var basisLoader = new BasisTextureLoader();
basisLoader.setTranscoderPath( 'basis/' );
basisLoader.detectSupport( renderer );

basisLoader.load( basistexture, function ( tt ) {
	// texture.magFilter = THREE.NearestFilter;
	// texture.minFilter = THREE.NearestFilter;
	// texture.encoding = THREE.sRGBEncoding;
	tt.wrapS = THREE.RepeatWrapping;
	tt.wrapT = THREE.RepeatWrapping;
	tt.repeat.y = -1;
	tt.anisotropy = 16;
	// tt.generateMipmaps = true;
	console.log(tt);
	material.map = tt;
	material.needsUpdate = true;
});

let debug = new THREE.Mesh(
	new THREE.PlaneBufferGeometry(1,1),
	material
)
scene.add(debug)



// crt file
loader.load(model, function(mesh) {
	decode_times.push(loader.decode_time);
    blob = loader.blob;

	



	// mesh.scale.set(0.015,0.015,0.015)
	//mesh.geometry.center();
	//mesh.scale.divideScalar(mesh.geometry.boundingBox.getSize().length());
	scene.add(mesh); 
	
	mesh.material = material

	render();

	// setTimeout(profile, 1000);
} );

// obj file
loader1.load(model1,(md)=>{
	let mesh = md.children[0]
	mesh.geometry.center();
	// mesh.scale.set(0.015,0.015,0.015)
	mesh.material = material;
	// mesh.material = new THREE.MeshBasicMaterial({color:'red'});
	scene.add(mesh)
	mesh.position.x = -6.3;
	mesh.position.y = -1.3;
	console.log('obj',mesh.geometry);
})


window.addEventListener( 'resize', onWindowResize, false );
render();


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

	controls.handleResize();
	controls.update();
	render();
}

function animate() {
	requestAnimationFrame( animate );
	render()
	controls.update();
}

function render() {
	renderer.render( scene, camera );
}

function profile() {
    // console.log(blob,em_ready,'prof');
	if(!blob || !em_ready)
		return;
    var now = performance.now();
    // console.log(CortoDecoder,'prof');
    var decoder = new CortoDecoder(blob,null,null);
    // console.log(blob,'blablabla');
    // console.log(decoder,'prof');
	var model = decoder.decode();
	var ms = performance.now() - now;
	decode_times.push(ms);
	// console.log((model.nvert/1024.0).toFixed(1) + "KV", ms.toFixed(1) + "ms", ((model.nvert/1000)/ms).toFixed(2) + "MV/s");
	// console.log("js:", ms);

	now = performance.now();
	var geometry = CortoDecoderEm.decode(blob);
	ms = performance.now() - now;
	em_times.push(ms);
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
	// console.log('em ready')
    // profile();
    // console.log(CortoDecoder,'ready');
}

sync();