(function () {
// <editor-fold desc="private variables">
    var body = $("body");
    var background = $("#background");
    var container = $("#webGL");
    var width = $(container).width();
    var height = $(container).height();
    var aspectRatio = width / height;
    var screenWidth = $(body).innerWidth();
    var screenHeight = $(body).innerHeight();
    var offsetLeft = $(container)[0].offsetLeft;
    var offsetTop = $(container)[0].offsetTop;
    var raycaster = new THREE.Raycaster();
    var spriteRotationModel = new THREE.Object3D;
    var mouse = new THREE.Vector2();
    var renderer;
// </editor-fold>
    (function Init(){
        /*
         -first function called
         -sets up all scene requirements
         -triggers animation loop
         -adds XML data to scene
         */

        addRenderer();
        /*addLight();
        addCamera();
        addControls();

        detectOrientationChange();
        controlsState("orbit");
        scene.add(beamHolder);
        addSolver("XML/test.xml");
        winResize = new THREEx.WindowResize(renderer, camera);
        //animate();*/
    }());

    function addRenderer(){

        /*
         -renderer auto clear disabled, managed in render(), because it draws two scenes
         */
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        //renderer.setClearColor( 0x333333 ); //0xe1e1e1
        renderer.setSize( width, height );
        renderer.autoClear = false;
        container.appendChild( renderer.domElement );
    }
})();