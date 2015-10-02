var viewer = new Viewer("webGL");
viewer.LoadModel("model");
//viewer.ClearModel();
//viewer.SaveXML();
function Viewer(divID){
var _this = this;
var animator = undefined;
var loader = undefined;
var xmlGenerator = undefined;
var version = "2.0";
var sampleGraph = [{x:  0.0, y: -1.0},
    {x:  0.0, y: -1.0},
    {x:  1.0, y: -3.0},
    {x:  3.0, y: -1.5},
    {x:  5.0, y: -2.0},
    {x:  7.0, y: -3.0},
    {x: 10.0, y:  2.0},
    {x: 15.0, y: -4.0},
    {x: 22.0, y: -3.0},
    {x: 26.0, y: -1.0},
    {x: 27.0, y: -1.0}];

// <editor-fold desc="public functions">
this.Update = function(){
    _this.ClearModel();

    /*xmlparsed = parseXMLstring(solver.modelAsXml());
    actionsArray = [];
    sprites = [];
    gizmos = [];
    supportMeshes = [];
    loadMeshes = [];
    selectedGizmo = undefined;

    readXML();

    beamDetails.start = findBar.first().startX;
    beamDetails.length = Math.round((findBar.last().endX - beamDetails.start) * toMeter);//Math.round((findNode.last().getAttribute("x") / toMeter) * toMilimeter);
    beamDetails.mesh = undefined;
    beamDetails.fs_mesh = [];
    beamDetails.lastSelected = undefined;

    loadModel();
    centerCamToBeam();*/
};

this.GetVersion = function(){return "ThreeJS Viewer " + version;};

this.LoadModel = function (name) {
    loader.makeBeamMesh(0);
    loader.add_XML_LoadPoints();
    loader.add_XML_Supports();
    loader.MakeGraph(sampleGraph);
    var holder = loader.returnHolder();
    animator.scene.add(holder);
    animator.camera.lookAt(holder.position);
    animator.manageDistanceSprites(true);
    this.centerCamToBeam();
    //makeGraph(graphExample);
};

this.ZoomIn = function() {
    animator.camera.zoom += animator.zoomStepPercent * animator.cameraBaseZoom ;
    animator.CheckZoomLimits();
    animator.camera.updateProjectionMatrix();
};

this.ZoomOut = function() {
    animator.camera.zoom -= animator.zoomStepPercent * animator.cameraBaseZoom ;
    animator.CheckZoomLimits();
    animator.camera.updateProjectionMatrix();
};

this.ClearModel = function() {
    loader.gizmos = [];
    for (var i = animator.beamHolder.children.length - 1; i >= 0; i--)
        traverseChildren(animator.beamHolder.children[i]);
};

this.SaveXML = function(name){ xmlGenerator.GenerateXML(name); };

this.centerCamToBeam = function() {
    animator.controlsTarget = new THREE.Vector3(-loader.beamDetails.length / 2, 0, 0);
    animator.spriteRotationModel.position.copy(animator.controls.target);
    animator.controls.target.copy(animator.controlsTarget);
    animator.camera.lookAt(animator.controls.target);
    animator.gizmoCamera.lookAt(animator.controls.target);
};
// </editor-fold>

// <editor-fold desc="private functions">
function traverseChildren (obj) {
    if(obj.children.length > 0){
        for (var i = obj.children.length - 1; i >= 0; i--)
            traverseChildren(obj.children[i], false);
    }
    obj.parent.remove(obj);
    disposeObject(obj);
}

function disposeObject (obj) {
    if(obj.geometry) obj.geometry.dispose();
    if(obj.material){
        if(obj.material.materials){
            for (var j = obj.material.materials.length - 1; j >= 0; j--)
                obj.material.materials[j].dispose();
        }
        else obj.material.dispose();
    }
}

(function Init(){
    animator = new Animator(divID);

    loader = new Loader("test", animator.beamHolder);
    xmlGenerator = new XmlGenerator();

    animator.loaderComponent = loader;
    animator.viewerComponent = _this;
    animator.add_XYZ_Gizmo();
    loader.animatorComponent = animator;
    loader.viewerComponent = _this;
    xmlGenerator.loaderComponent = loader;
    animator.startAnimating();
}());
// </editor-fold>
}