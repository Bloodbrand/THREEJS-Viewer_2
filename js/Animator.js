function Animator(){
// <editor-fold desc="public variables">
    this.body = $("body");
    this.background = $("#background");
    this.container = $("#webGL")[0];
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;
    this.aspectRatio = this.width / this.height;
    this.screenWidth = $(this.body).innerWidth();
    this.screenHeight = $(this.body).innerHeight();
    this.offsetLeft = this.container.offsetLeft;
    this.offsetTop = this.container.offsetTop;
    this.raycaster = new THREE.Raycaster();
    this.spriteRotationModel = new THREE.Object3D;
    this.beamHolder = new THREE.Object3D();
    this.scene = new THREE.Scene();
    this.gizmoScene = new THREE.Scene();
    this.XYZgizmo = undefined;
    this.camNear = 0.1;
    this.camFar = 1000;
    this.loaderComponent = undefined;
    this.viewerComponent = undefined;
    this.controls = undefined;
    this.controlsTarget = undefined;
    this.directionalLight = undefined;
    this.camera = undefined;
    this.gizmoCamera = undefined;
    this.renderer = undefined;
// </editor-fold>

// <editor-fold desc="private variables">
    var _this = this;
    var cameraHomePos = new THREE.Vector3(10, 15, -34);
    var cameraBaseZoom = 25;
    var minZoom = 4;
    var maxZoom = 80;
    var frameID = 0;
    var gizmoViewportHeightPercentage = 0.1;
    var mouseDown = false;
    var holdingCtrl = false;
    var mouseXmark = 0;
    var mouse = new THREE.Vector2();
    var selectedGizmo = undefined;
    var gizmoSelectedColor = {r: 0.3, g: 0.3, b: 0.3};
    var rmbZoomSens = 30;
    var arrowHideDistance = 100;
    var gizmoRotateStep = 50;
    var lineHeight = 5;
    var veticalLineExtraY = 0.5;
    var toFixedDecimals = 3;
    var actionsArray = [];
    //var canvas =
// </editor-fold>

// <editor-fold desc="Initialization">
(function Init(){
    /*
     -first function called
     -sets up all scene requirements
     -triggers animation loop
     -adds XML data to scene
     */
    addRenderer();
    addLight();
    addCamera();
    addControls();
    controlsState("orbit");
    /*
    addControls();
    detectOrientationChange();
    addSolver("XML/test.xml");
    winResize = new THREEx.WindowResize(renderer, camera);
    */
}());

function addRenderer(){
    _this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    _this.renderer.setSize( _this.width, _this.height );
    //_this.renderer.setClearColor( 0x333333 );
    _this.renderer.autoClear = false;
    _this.container.appendChild( _this.renderer.domElement );
}

function addLight(){
    /*
     -also adds an ambient light to the gizmo scene
    */
    var ambientLight = new THREE.AmbientLight( 0x333333 );
    _this.scene.add( ambientLight );
    ambientLight = new THREE.AmbientLight( 0x888888 );
    _this.gizmoScene.add(ambientLight);

    _this.directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    _this.directionalLight.position.copy(cameraHomePos);
    _this.scene.add( _this.directionalLight );
}

function addCamera(){
    //detect initial orientation
    if (window.matchMedia("(orientation: portrait)").matches){}
    else {}
    /*
     - two cameras: one for the main scene, one for the bottom left XYZ gizmo
    */
    _this.camera = new THREE.OrthographicCamera( _this.width / - 2, _this.width / 2,
        _this.height / 2, _this.height / - 2, _this.camNear, _this.camFar);
    _this.camera.position.copy(cameraHomePos);

    _this.gizmoCamera = new THREE.OrthographicCamera( _this.width / - 2, _this.width / 2,
        _this.height / 2, _this.height / - 2, _this.camNear, _this.camFar);
    _this.gizmoCamera.position.copy(cameraHomePos);

    _this.scene.add(_this.camera);
    _this.gizmoScene.add(_this.gizmoCamera);

    //new THREEx.WindowResize(renderer, camera);
    //new THREEx.WindowResize(renderer, gizmoCamera);

    resetCameraZoom();
}

this.add_XYZ_Gizmo = function() {
    /*
     -positions, scales and adds bottom left XYZ gizmo in another scene
     */
    //if(_this.XYZgizmo) return;
    _this.XYZgizmo = _this.loaderComponent.MakeGizmo("position", undefined, 0, true);
    _this.XYZgizmo.position.set(-_this.loaderComponent.beamDetails.length / 2, 0, 0);
    _this.XYZgizmo.rotation.set(0, -Math.PI / 2, 0);
    _this.XYZgizmo.scale.set(3, 3, 3);
    _this.gizmoScene.add(_this.XYZgizmo);
};
// </editor-fold>

// <editor-fold desc="Animation">
this.startAnimating = function(){
    animate();
};
function animate(time) {
    /*
     -the main animation loop that handles:
     -XYZ gizmo camera position and rotation
     -sprites orientation to always face camera
     -render loop
     -tween updates
     */

    updateGizmoCamera();
    spritesLookAt();

    /*
     -frameID variable can be used to stop rendering
     */
    frameID = requestAnimationFrame(animate);

    render();


    //-TWEEN updating disabled, currently unused
    //TWEEN.update(time);
}

function render () {
    /*
     -clears the previous frame
     -maximises the viewport
     -draws the main scene
     -clears the depth buffer
     -sets the viewport to a percentage of the screen and snaps it to
     0,0 screen space (bottom left) for the XYZ gizmo
     -renders the secondary scene
     -loops to beginning
    */
    _this.renderer.clear();
    _this.renderer.setViewport( 0, 0, _this.width, _this.height );
    _this.renderer.render(_this.scene, _this.camera);

    _this.renderer.clearDepth();
    _this.renderer.setViewport( 0, 0, _this.width * gizmoViewportHeightPercentage,
        _this.height * gizmoViewportHeightPercentage );
    _this.renderer.render( _this.gizmoScene, _this.gizmoCamera );
}

function spritesLookAt () {
    /*
     -loops sprites and rotates them to face the main camera
     */
    _this.spriteRotationModel.position.copy(_this.controls.target);
    _this.spriteRotationModel.lookAt( _this.camera.position );
    for (var i = 0; i < _this.loaderComponent.sprites.length; i++)
        _this.loaderComponent.sprites[i].rotation.copy(_this.spriteRotationModel.rotation);
}
// </editor-fold>

// <editor-fold desc="Scene utils"
function resetCameraZoom () {
    _this.camera.zoom = cameraBaseZoom;
    _this.camera.updateProjectionMatrix();

    _this.gizmoCamera.zoom = cameraBaseZoom;
    _this.gizmoCamera.updateProjectionMatrix();
}

function updateGizmoCamera () {
    /*
     -updates the gizmo camera to correspond to main camera position and rotation
     */
    _this.gizmoCamera.position.copy(_this.camera.position);
    _this.gizmoCamera.lookAt(_this.controls.target);
    if(_this.XYZgizmo)_this.XYZgizmo.position.copy(_this.controls.target);
}

function addControls() {
    /*
     -creates orbit controls
     -adds event listeners for mouse events and key up and down
     */
    _this.controls = new THREE.OrbitControls( _this.camera, _this.renderer.domElement );
    //controls.noPan = true;
    _this.controls.maxZoom = maxZoom;
    _this.controls.minZoom = minZoom;
    //centerCamToBeam();
    var $canvas = $("canvas");
    $canvas.mousedown(function(event) {onMouseDown(event)});
    $canvas.mousemove(function(event) {onMouseMove(event);});
    $canvas.mouseup(function(event) {onMouseUp(event)});
    $canvas.dblclick(function(event) {onDoubleClick(event)});
    $(window).keydown(function(event) {onKeyDown(event)});
    $(window).keyup(function(event) {onKeyUp(event)});


    $("#zoomIn").mousedown(function(){zoomIn()});
    $("#zoomOut").mousedown(function(){zoomOut()});

    $("#home").mousedown(function(){snapCamera('home')});
    $("#left").mousedown(function(){snapCamera('left')});
    $("#right").mousedown(function(){snapCamera('right')});
    $("#front").mousedown(function(){snapCamera('front')});
    $("#back").mousedown(function(){snapCamera('back')});
    $("#top").mousedown(function(){snapCamera('top')});
    $("#bottom").mousedown(function(){snapCamera('bottom')});

    $("#addSupport").mousedown(function(){_this.loaderComponent.addSupport()});
    $("#addVerticalLoad").mousedown(function(){_this.loaderComponent.addPointForce(0, 0, -1400)});
    $("#addHorizontalLoad").mousedown(function(){_this.loaderComponent.addPointForce(0, 1400, 0)});

    $("#addUniformForce").mousedown(function(){_this.loaderComponent.addUniformForce()});
    $("#addBendForce1").mousedown(function(){addPointForce(1, 0)});
    $("#addBendForce2").mousedown(function(){addPointForce(-1, 0)});

    $("#setBeamLength").mousedown(function(){setBeamLength(0)});
    $("#rotateBeam").mousedown(function(){rotateBeam()});
    $("#toggleWall").mousedown(function(){toggleWall()});

    $("#undo").mousedown(function(){manageActions.undo()});
    $("#redo").mousedown(function(){manageActions.redo()});
    $("#remove").mousedown(function(){removeGizmo()});

    $("#orbit").mousedown(function(){controlsState('orbit')});
    $("#pan").mousedown(function(){controlsState('pan')});
    $("#zoom").mousedown(function(){controlsState('zoom')});
}
// </editor-fold>

// <editor-fold desc="Events">
function onMouseDown (event) {
    /*
     -sets a new mouse vector for measuring distance since mouse down
     */
    mouseDown = true;
    //updateMousePos(event);
    mouseXmark = event.clientX;
    var obj = castRay(_this.loaderComponent.gizmos);
    if (obj){
        /*
         -casts a ray and checks if it hit anything valid
         -selects a valid gizmo
         -resets emissive color for all gizmos
         -sets selected emissive color for selected gizmo
         */
        selectedGizmo = obj.object;
        //controlsState("orbit");
        toggleInput(false);

        if(holdingCtrl)
            _this.addActionProperty(selectedGizmo,
                {before: _this.loaderComponent.copyEuler(selectedGizmo.rotation)});
        else
            _this.addActionProperty(selectedGizmo,
                {before: _this.loaderComponent.copyV3(selectedGizmo.position)});

        resetGizmoEmissive();
        selectedGizmo.material.emissive = gizmoSelectedColor;
    }
    /*
     -if nothing valid is hit, resets all gizmo emisive colors
     */
    else resetGizmoEmissive();
}

function onMouseMove (event) {
    /*
     -method is called when the mouse is moved
     -rotates the directional light to always match the normalized camera rotation vector,
     thus always shining a light where the user is looking
     -if a valid gizmo is selected, and the user is holding CTRL, rotate that gizmo;
     if CTRL is not pressed, just move it
     */
    switch(event.buttons){
        case 1:
            //spritesLookAt();
            break;
        case 2:
            manageMouseZoom(event);
            break;
    }

    updateMousePos(event);
    moveLightWithCamera();
    if(selectedGizmo/*mouseDown*/) {
        if(holdingCtrl && (selectedGizmo.gizmoType == "loadPoint"
            ||selectedGizmo.gizmoType == "linear")) detectMouseMoveDirection(event);
        else moveGizmo();
    }
}

function onMouseUp (event) {
    /*
     -deselects gizmo
     -re-enables user input
     */
    mouseDown = false;
    if(selectedGizmo){
        var gizmoPos = _this.loaderComponent.twoDecVec3(selectedGizmo.position);
        if(!holdingCtrl)
            _this.addActionProperty(selectedGizmo, {after: _this.loaderComponent.copyV3(gizmoPos)});
        updateNode(selectedGizmo, gizmoPos.x);

        addAction(selectedGizmo);
        _this.loaderComponent.beamDetails.lastSelected = selectedGizmo;
        selectedGizmo = undefined;
        toggleInput(true);
    }
}

function onKeyUp (event) { detectCTRLkey(event, false) }

function onKeyDown (event) { detectCTRLkey(event, true) }

function onDoubleClick (event) {
    //-handles double clicking
    updateMousePos(event);
    var all = _this.loaderComponent.gizmos.concat(_this.loaderComponent.sprites);
    var obj = castRay(all);
    if (obj){
        /*
         -casts a ray and checks if it hit anything valid
         -selects a valid gizmo
         -prompts the user for a new position
         -positions the selected gizmo to the new value
         */
        selectedGizmo = obj.object;

        if(selectedGizmo.type == "sprite") selectedGizmo = selectedGizmo.parent.parent;
        else if (selectedGizmo.type == "lengthSprite") { setBeamLength(); onMouseUp(); return; }

        var newX = prompt("new position");
        if(newX != undefined || isNaN(newX)) selectedGizmo.position.setX(
            -newX / _this.loaderComponent.toMilimeter);
        onMouseUp();
    }
    else resetGizmoEmissive();
}

function setBeamLength () {
    /*
     -ask for a new beam length
     -replace the current beam
     -set a new length in the beamDetails object
     -make the new beam and beam gizmos
     */
    var newLength = prompt("new length in mm");
    if(newLength == undefined || isNaN(newLength)) return;

    _this.viewerComponent.ClearModel();
    //bigger than last
    if(newLength > _this.loaderComponent.beamDetails.length
        * _this.loaderComponent.toMilimeter){
        var lastNode = _this.loaderComponent.findNode.last();
        lastNode.setAttribute("x", (newLength / _this.loaderComponent.toMilimeter
        / _this.loaderComponent.toMeter).toString());
        _this.loaderComponent.beamDetails.length = newLength / _this.loaderComponent.toMilimeter;
        _this.viewerComponent.LoadModel();
        return;
    }
    //else
    for (var i = _this.loaderComponent.viewerBars.length - 1; i >= 0; i--) {
        var curBar = _this.loaderComponent.viewerBars[i];
        var startNode = _this.loaderComponent.getNodeByID(curBar.getAttribute("startNodeId"));
        var endNode = _this.loaderComponent.getNodeByID(curBar.getAttribute("endNodeId"));
        if(newLength > curBar.startPosX * _this.loaderComponent.toMilimeter *
            _this.loaderComponent.toMeter){
            //bigger than last start
            endNode.setAttribute("x", (newLength / _this.loaderComponent.toMilimeter
            / _this.loaderComponent.toMeter).toString());
            _this.viewerComponent.LoadModel();
            break;
        }
        else {
            startNode.setAttribute("x", 0);
            _this.viewerComponent.LoadModel();
            break;
        }

        //console.log(viewerBars[i].startPosX)
    }
    _this.loaderComponent.beamDetails.length = newLength / _this.loaderComponent.toMilimeter;
    //center the camera to the beam (this is optional and can be commented out)
    _this.viewerComponent.centerCamToBeam();
}

function detectCTRLkey (event, bool) {
    if(bool == holdingCtrl) return;
    if(selectedGizmo && selectedGizmo.Action &&
        selectedGizmo.Action.arg.before.constructor == THREE.Vector3)
        selectedGizmo.Action = undefined;

    if (event.keyCode == 17) holdingCtrl = bool;
}

function detectMouseMoveDirection (event) {
    /*
     -detects if the mouse is moved left or right
     -if the mouse is moved beyond a threshold, rotate the gizmo
     */
    if(event.clientX > mouseXmark + gizmoRotateStep)
    {
        mouseXmark = event.clientX;
        _this.loaderComponent.rotateGizmo(selectedGizmo, true);
    }

    if(event.clientX < mouseXmark - gizmoRotateStep)
    {
        mouseXmark = event.clientX;
        _this.loaderComponent.rotateGizmo(selectedGizmo, false);
    }
}

function updateMousePos (event) {
    var offset = $(_this.container).offset();
    mouse.x = ((event.clientX - (offset.left - $(window).scrollLeft())) / _this.width ) * 2 - 1;
    mouse.y = -((event.clientY - (offset.top - $(window).scrollTop())) / _this.height) * 2 + 1;
}

function moveLightWithCamera () {
    _this.directionalLight.position.copy(_this.camera.position).normalize();
}

function manageMouseZoom (event) {
    var y = -( event.clientY / window.innerHeight ) * 2 + 1;
    if(y > mouse.y) _this.camera.zoom += Math.abs(y - mouse.y) * rmbZoomSens;
    else _this.camera.zoom -= Math.abs(y - mouse.y) * rmbZoomSens;
    if(_this.camera.zoom <= minZoom)  _this.camera.zoom = minZoom;
    if(_this.camera.zoom >= maxZoom)  _this.camera.zoom = maxZoom;
    _this.camera.updateProjectionMatrix();
}

function castRay (array) {
    /*
     -perform a raycast to an array received as an argument
     -if a valid mesh is found, its returned. if not, return undefined
     */
    _this.raycaster.setFromCamera(mouse, _this.camera);
    var intersects = _this.raycaster.intersectObjects(array, false);
    if (intersects[0]){
        toggleInput(false);
        return intersects[0];
    }
    else return undefined;
}

function toggleInput (bool) {_this.controls.enabled = bool;}

function resetGizmoEmissive () {
    /*
     -resets emissive color for ALL gizmos
     */
    for (var i = 0; i < _this.loaderComponent.gizmos.length; i++)
        _this.loaderComponent.gizmos[i].material.emissive = {r: 0, g: 0, b: 0};
}

function moveGizmo (x, obj) {
    /*
     -moves a gizmo (not support) to a valid x position extracted from a raycast to a plane
     on the X axis of the mesh
     -may not move a gizmo outside of the beam
     */
    _this.manageDistanceSprites();
    if(selectedGizmo) obj = selectedGizmo;
    if(!obj) return;
    if(x == undefined) x = castRay(obj.axisPlanes).point.x;
    if (checkOutOfBounds(x) == "min" && obj.gizmoType != "support")
    { obj.position.setX(-_this.loaderComponent.beamDetails.start * _this.loaderComponent.toMeter); return; }
    if (checkOutOfBounds(x) == "max" && obj.gizmoType != "support"){
        obj.position.setX(-_this.loaderComponent.beamDetails.start *
            _this.loaderComponent.toMeter + -_this.loaderComponent.beamDetails.length);
        return;
    }

    /*
     -perform aditional calcualtions to prevent support gizmos from passing through each other
     */
    if(obj.gizmoType == "support"){ if ( _this.loaderComponent.checkSupportProximity(x, obj) ) return };

    /*
     -if all checks are passed, move the gizmo on the X axis
     */
    if(!updateNode(obj, x)) return;
    obj.position.setX(x);
    if(obj != undefined) obj = undefined;
}

this.manageDistanceSprites = function(loop) {
    /*
     -arranged distance sprites below all gizmos
     -change their texture to reflect various distances
     -change their size to properly scale text
     */
    var gizmos =  _this.loaderComponent.gizmos;
    if(loop == true) loop = gizmos.length;
    else loop = 0;
    for (var l = 0; l <= loop; l++) {
        manageDistanceGizmoOrder();
        for (var i = 0; i < gizmos.length; i++) {
            var gizmoBefore = gizmos[i - 1];
            if(!gizmoBefore) gizmoBefore = { position: new THREE.Vector2(0, 0) };

            var vector2Before = new THREE.Vector2( gizmoBefore.position.x, gizmoBefore.position.z);
            var vector2Cur = new THREE.Vector2( gizmos[i].position.x, gizmos[i].position.z);
            var posVec = interpolateVector2(vector2Before, vector2Cur, 0.5);

            gizmos[i].belowSprite.position.set(posVec.x, -lineHeight -
                _this.loaderComponent.beamDetails.height +
                veticalLineExtraY - 1, posVec.y);

            var text = -(Math.round(((gizmos[i].position.x - gizmoBefore.position.x) *
                _this.loaderComponent.toMilimeter) * 10) / 10);
            _this.loaderComponent.changeSpriteText(gizmos[i].belowSprite.children[0], text);
        }
    }
}

function checkOutOfBounds (x) {
    if(x > -_this.loaderComponent.beamDetails.start *_this.loaderComponent.toMeter)
        return "min";
    if(x < (-_this.loaderComponent.beamDetails.start * _this.loaderComponent.toMeter) +
        -_this.loaderComponent.beamDetails.length)
        return "max";
}

this.getBarByDistance = function(x) {
    var viewerBars = _this.loaderComponent.viewerBars;
    for (var i = 0; i < viewerBars.length; i++) {
        var barStart_ID = viewerBars[i].getAttribute("startNodeId");
        var barEnd_ID = viewerBars[i].getAttribute("endNodeId");

        var start = Number(_this.loaderComponent.getNodeByID(barStart_ID).getAttribute("x"));
        var end = Number(_this.loaderComponent.getNodeByID(barEnd_ID).getAttribute("x"));
        if(x <= end) {
            return {bar: viewerBars[i], dist: (x - start) / (end - start)};
        }
    }
};

function updateNode (obj, x) {
    if(!obj.point0) return updateSupport(obj, x);
    var point0bar = _this.getBarByDistance(-x / _this.loaderComponent.toMeter),
        barId0 = Number(point0bar.bar.getAttribute("id"));
    obj.point0.dist = point0bar.dist;
    obj.point0.barID = barId0;

    if(obj.point1){
        obj.point1.end = (-x * _this.loaderComponent.toMilimeter +
            obj.point1.length) / _this.loaderComponent.toMilimeter /
            _this.loaderComponent.toMeter;
        var point1bar = _this.getBarByDistance(obj.point1.end);
        if(!point1bar)return true;
        obj.point1.barID = Number(point1bar.bar.getAttribute("id"));
        obj.point1.dist = point1bar.dist;
    }
    obj.parentNode.setAttribute("barId", barId0.toString());
    return true;
}

function updateSupport (obj, x) {
    if(!obj.node) return;
    var newX = ((-x / _this.loaderComponent.toMeter).toFixed(toFixedDecimals))
    //obj.node.setAttribute("x", newX);
    return true;
}

function snapCamera (pos) {
    /*
     -called by the UI, moves the camera to fixed positions
     -after that, snaps the light position and rotation to match main camera
     */
    switch (pos){
        case "right":
            _this.camera.position.set(-_this.loaderComponent.beamDetails.length/2, 0, -cameraHomePos.y);
            break;
        case "left":
            _this.camera.position.set(-_this.loaderComponent.beamDetails.length/2, 0, cameraHomePos.y);
            break;
        case "front":
            _this.camera.position.set(cameraHomePos.x, 0, 0);
            break;
        case "back":
            _this.camera.position.set(-(_this.loaderComponent.beamDetails.length +
            cameraHomePos.x), 0, 0 );
            break;
        case "top":
            _this.camera.position.set(-_this.loaderComponent.beamDetails.length / 2 , cameraHomePos.y, 0.01 );
            break;
        case "bottom":
            _this.camera.position.set(-_this.loaderComponent.beamDetails.length / 2 , -cameraHomePos.y, 0.01 );
            break;
        case "home":
            _this.camera.position.copy(cameraHomePos);
            _this.controls.target.copy(_this.controlsTarget);
            break;
    }

    moveLightWithCamera();
    resetCameraZoom();
    _this.camera.lookAt(_this.controls.target);
}

function manageDistanceGizmoOrder () {
    /*
     -reorders gizmo array by position
     */
    var gizmos =  _this.loaderComponent.gizmos;
    for (var i = 0; i < gizmos.length; i++) {
        if (gizmos[i-1] && gizmos[i].position.x > gizmos[i - 1].position.x)
        {
            var temp = gizmos[i - 1];
            gizmos[i - 1] = gizmos[i];
            gizmos[i] = temp;
        }
        manageArrowVisibility(i);
    }
}

function manageArrowVisibility (i) {
    /*
     -manage arrow visibility if they get too close to each other
     -checks the arrows before and after the current one
     -has ability to hide left, right or both arrows
     */
    var gizmos = _this.loaderComponent.gizmos;
    if(gizmos[i-1] && Math.abs(gizmos[i].position.x - gizmos[i - 1].position.x) <
        arrowHideDistance / _this.loaderComponent.toMilimeter)
        gizmos[i].leftArrow.visible = false;
    else gizmos[i].leftArrow.visible = true;

    if(gizmos[i+1] && Math.abs(gizmos[i].position.x - gizmos[i + 1].position.x) <
        arrowHideDistance / _this.loaderComponent.toMilimeter)
        gizmos[i].rightArrow.visible = false;
    else gizmos[i].rightArrow.visible = true;

    if(gizmos[i].position.x > -arrowHideDistance / _this.loaderComponent.toMilimeter) gizmos[i].leftArrow.visible = false;
    if(gizmos[i].position.x < -(_this.loaderComponent.beamDetails.length - arrowHideDistance /
        _this.loaderComponent.toMilimeter))
        gizmos[i].rightArrow.visible = false;
}

function interpolateVector2 (vector1, vector2, alignment) {
    /*
     -returns a vector between the first two arguments
     -starts at first and advances to second
     -distance is determined by 'alignment' argument
     */
    var interpolation = new THREE.Vector2();
    interpolation.x = vector1.x * (1-alignment) + vector2.x * alignment;
    interpolation.y = vector1.y * (1-alignment) + vector2.y * alignment;
    return interpolation;
}

function controlsState (state) {
    switch(state){
        case "orbit":
            _this.controls.noRotate = false;
            _this.controls.noPan = true;
            _this.controls.noZoom = true;
            break;
        case "pan":
            _this.controls.noPan = false;
            _this.controls.noZoom = true;
            _this.controls.noRotate = true;
            //gizmoCamera.add(XYZgizmo);
            break;
        case "zoom":
            _this.controls.noZoom = false;
            _this.controls.noRotate = true;
            _this.controls.noPan = true;
            break;
    }
}
// </editor-fold>

// <editor-fold desc="Actions">
var manageActions = {
    index: -1,
    undo: function () {
        manageActions.undo_redo(-1);
    },
    redo: function () {
        manageActions.undo_redo(1);
    },
    undo_redo: function (index) {
        checkArrayExtremes(index);
        var action = actionsArray[manageActions.index];
        if(action){
            if(checkState(action, index)) action.fun(action, index);
            manageDistanceSprites(true);
        }
    }
};

function checkArrayExtremes (index) {
    if(index == 1 && manageActions.index < 0)
        manageActions.index++;
    if(index == -1 && manageActions.index >= actionsArray.length)
        manageActions.index--;
}

function checkState (action, index) {
    if(index == -1) {
        if(action.undone){
            manageActions.index--;
            return false;
        }
        else {
            manageActions.index--;
            action.undone = true;
            action.redone = false;
        }
    }
    else{
        if(action.redone){
            manageActions.index++;
            return false;
        }
        else{
            manageActions.index++;
            action.undone = false;
            action.redone = true;
        }
    }
    return true;
}

function Action(obj, fun, arg) {
    this.obj = obj;
    this.fun = fun;
    this.arg = arg;
    this.undone = false;
    this.redone = false;
}

function setPosAction (action, index) {
    var store = {before: action.arg.before, after: action.arg.after};

    moveGizmo(action.arg.before.x, action.obj);
    action.arg.before = store.after;
    action.arg.after = store.before;
}

function setRotAction (action, index) {
    var store = {before: action.arg.before, after: action.arg.after};
    _this.loaderComponent.rotateGizmoDeg(action.obj, action.arg.before, true);
    action.arg.before = store.after;
    action.arg.after = store.before;
}

function addAction (gizmo) {
    action = gizmo.Action;
    //constant stream of actions
    if(manageActions.index == actionsArray.length - 1)
    {
        actionsArray.push(action);
        manageActions.index = actionsArray.length - 1;
    }
    //action taken after an undo or redo that isn't the last index
    else
    {
        actionsArray = actionsArray.slice(0, manageActions.index + 1);
        actionsArray.push(action);
        manageActions.index = actionsArray.length - 1;
    }
    gizmo.Action = undefined;
}

this.addActionProperty = function(obj, prop) {
    var propName = Object.keys( prop )[0];
    var fun = undefined;

    switch (prop[propName].constructor){
        case THREE.Vector3:
            fun = setPosAction;
            break;
        case THREE.Euler:
            fun = setRotAction;
            break;
    }

    if(obj.Action == undefined) obj.Action = new Action(obj, fun, prop);
    else obj.Action.arg[propName] = prop[propName];
};
// </editor-fold>
}