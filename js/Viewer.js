var viewer = new Viewer("XML/test.xml", "webGL");
//viewer.LoadModel("model");
//viewer.ClearModel();
//viewer.SetModelOpacity(0.5);
//viewer.SaveXML();
function Viewer(fileName, divID){
var _this = this;
var animator = undefined;
this.loader = undefined;
var xmlGenerator = undefined;
var sampleGraph =
   [{x:  0.0, y: -1.0},
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

this.LoadModel = function () {
    _this.ClearModel();
    _this.loader = new Loader(animator.beamHolder);
    _this.loader.animatorComponent = animator;
    animator.loaderComponent = _this.loader;
    _this.loader.viewerComponent = _this;
    xmlGenerator.loaderComponent = _this.loader;

    _this.loader.makeBeamMesh(0);
    _this.loader.add_XML_LoadPoints();
    _this.loader.add_XML_Supports();
    _this.loader.MakeGraph(sampleGraph);
    var holder = _this.loader.returnHolder();
    animator.scene.add(holder);
    animator.camera.lookAt(holder.position);
    animator.manageDistanceSprites(true);
    _this.centerCamToBeam();
};

this.SetModelOpacity = function(newOpacity){
    if(newOpacity == undefined) {console.error("specify new opacity"); return;}
    for (var i = animator.beamHolder.children.length - 1; i >= 0; i--){
        traverseChildren(animator.beamHolder.children[i], function(obj){
            if(!obj.material) return;
            if(obj.material.materials){
                for (var j = obj.material.materials.length - 1; j >= 0; j--)
                    obj.material.materials[j].opacity = newOpacity;
            }
            else obj.material.opacity = newOpacity;
        });
    }
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
    for (var i = animator.beamHolder.children.length - 1; i >= 0; i--)
        traverseChildren(animator.beamHolder.children[i], disposeObject);
};

this.SaveXML = function(name){ xmlGenerator.GenerateXML(name); };

this.centerCamToBeam = function() {
    animator.controlsTarget = new THREE.Vector3(-_this.loader.beamDetails.length / 2, 0, 0);
    animator.spriteRotationModel.position.copy(animator.controls.target);
    animator.controls.target.copy(animator.controlsTarget);
    animator.camera.lookAt(animator.controls.target);
    animator.gizmoCamera.lookAt(animator.controls.target);
};
// </editor-fold>

// <editor-fold desc="private functions">
function traverseChildren (obj, fun) {
    if(obj.children.length > 0){
        for (var i = obj.children.length - 1; i >= 0; i--)
            traverseChildren(obj.children[i], fun);
    }
    fun(obj);
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
    obj.parent.remove(obj);
}

Init(fileName, divID);
function Init(fileName, divID){
    animator = new Animator(divID);
    xmlGenerator = new XmlGenerator();
    animator.viewerComponent = _this;
    solver.addFinishLoadHandler(_this.LoadModel);
    solver.addModelChangedHandler(_this.LoadModel);
    solver.loadXml(fileName);
    animator.Add_XYZ_Gizmo();
    animator.Animate();
}
// </editor-fold>
}