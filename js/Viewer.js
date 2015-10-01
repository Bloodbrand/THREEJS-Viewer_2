var viewer = new Viewer();
viewer.LoadModel();
//viewer.ClearModel();
function Viewer(){
var _this = this;
var animator = undefined;
var loader = undefined;

// <editor-fold desc="public functions">
this.Update = function(){
    //this.ClearModel();
};

this.LoadModel = function () {
    loader.makeBeamMesh(0);
    loader.add_XML_LoadPoints();
    loader.add_XML_Supports();
    var holder = loader.returnHolder();
    animator.scene.add(holder);
    animator.manageDistanceSprites(true);
    animator.camera.lookAt(holder.position);
    this.centerCamToBeam();
    //makeGraph(graphExample);
};

this.ClearModel = function() {
    loader.gizmos = [];
    for (var i = animator.beamHolder.children.length - 1; i >= 0; i--)
        traverseChildren(animator.beamHolder.children[i]);
};

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
    animator = new Animator();
    loader = new Loader("test", animator.beamHolder);
    animator.loaderComponent = loader;
    loader.animatorComponent = animator;
    animator.viewerComponent = _this;
    animator.startAnimating();
    animator.add_XYZ_Gizmo();
}());
// </editor-fold>
}