function Loader(fileName, beamHolder){
// <editor-fold desc="private variables">
    var _this = this;
    var veticalLineExtraY = 0.5;
    var lineHeight = 5;
    var lineColor = 0x777777, arrowYcolor = 0x00ff00, arrowZcolor = 0xff0000;
    var distanceBetweenUniformArrows = 0.21;
    var supportSide = 50;
    var supportMeshColor = { r: 0.2, g: 0.2, b: 0.2 };
    var fs_thickness = .3, fs_height = 8, fs_width = 3;
    var newUniformForceLength = 400;
// </editor-fold>

// <editor-fold desc="public variables">
    this.beamHolder = beamHolder;
    this.xmlparsed = parseXMLFile("XML/"+fileName+".xml");
    this.viewerBeamRequest = getBeamRequest();
    this.viewerNodes = getElementsByTagName("nodes");
    this.viewerLoads = getElementsByTagName("loads");
    this.viewerSupports = getElementsByTagName("supports");
    this.viewerMaterials = getElementsByTagName("materials");
    this.viewerSections = getElementsByTagName("sections");
    this.viewerExtractedSupports = extractSupports(
        this.viewerBeamRequest, this.viewerNodes);
    this.viewerLoadCases =  getLoadCases(this.viewerLoads);
    this.viewerLoadPoints = getLoadPoints(this.viewerLoads);
    this.viewerBars = getBars(this.viewerBeamRequest);
    this.loadMeshes = [];
    this.sprites = [];
    this.gizmos = [];
    this.viewerBeamMeshes = [];
    this.supportMeshes = [];
    this.validLoad_ID = 0;
    this.toMeter = 10;
    this.toMilimeter = 100;
    this.animatorComponent = undefined;
    this.viewerComponent = undefined;
    this.beamDetails = {
        width: 1,
        height: 1,
        wall: undefined,
        barMeshes: [],
        start: undefined,
        length: undefined,
        lastSelected: undefined
    };
// </editor-fold>

// <editor-fold desc="general preloading">
    function parseXMLFile (file) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", file,false);
        xmlhttp.send();
        return xmlhttp.responseXML;
    }

    function getElementsByTagName(tagName){
        return htmlCollectionToArray(_this.viewerBeamRequest.
            getElementsByTagName(tagName)[0].childNodes);
    }

    function htmlCollectionToArray (collection) {
        var array = [];

        for (var i = 0; i < collection.length; i++)
            if (checkValidNode(collection[i]))
                array.push(collection.item(i));

        return array;
    }

    function getNodeByID (id) {
        for (var i = 0; i < _this.viewerNodes.length; i++)
            if(Number(_this.viewerNodes[i].getAttribute("id")) == id)
                return _this.viewerNodes[i];
    }

    this.findBar = function(){
        return{
            first: function(){
                var smallestX = Infinity, firstBar = undefined;
                for (var i = 0; i < _this.viewerBars.length; i++){
                    var endID = _this.viewerBars[i].getAttribute("startNodeId");
                    var node = getNodeByID(endID);
                    if(!node) continue;
                    var x = node.getAttribute("x");
                    if(x < smallestX) {
                        smallestX = x;
                        _this.viewerBars[i].startX = x;
                        firstBar = _this.viewerBars[i];
                    }
                }
                return firstBar;
            }
            ,
            last: function(){
                var biggestX = 0, lastBar = undefined;
                for (var i = 0; i < _this.viewerBars.length; i++){
                    var endID = _this.viewerBars[i].getAttribute("endNodeId");
                    var node = getNodeByID(endID);
                    if(!node) continue;
                    var x = node.getAttribute("x");
                    if(x > biggestX) {
                        biggestX = x;
                        _this.viewerBars[i].endX = x;
                        lastBar = _this.viewerBars[i];
                    }
                }
                return lastBar;
            }
        }
    }();

    function getBarByID (id) {
        for (var i = 0; i < _this.viewerBars.length; i++)
            if(Number(_this.viewerBars[i].getAttribute("id")) == id)
                return _this.viewerBars[i];
    }

    this.getNodeByID = function(id) {
        for (var i = 0; i < _this.viewerNodes.length; i++)
            if(Number(_this.viewerNodes[i].getAttribute("id")) == id)
                return _this.viewerNodes[i];
    };

    this.CreateXML_Element = createXML_Element;
    function createXML_Element (args) {
        var ele = _this.xmlparsed.createElement(args.name);

        for (var key in args)
            if (args.hasOwnProperty(key))
                ele.setAttribute(key, args[key]);

        return ele;
    }

    this.CheckValidNode = checkValidNode;
    function checkValidNode (node) { if (!/^\s*$/.test(node.nodeValue)) return true; }
// </editor-fold>

// <editor-fold desc="specific preloading">
    function getBeamRequest () {
        return _this.xmlparsed.getElementsByTagName("beamRequest")[0];
    }

    function getLoadCases (viewerLoads) {
        for (var i = 0; i < viewerLoads.length; i++)
            if(viewerLoads[i].tagName == "loadCases")
                return viewerLoads[i];
    }

    function getLoadPoints (viewerLoads) {
        var viewerLoadPoints = [];
        var onePointChildVal = 3, uniformForceChildVal = 5;

        //all node data
        for (var i = 0; i < viewerLoads.length; i++)
        //only read "load points"
        if(viewerLoads[i].tagName == "loadPoints")
        //all load points data
        for (var j = 0; j < viewerLoads[i].childNodes.length; j++)
        //only read valid viewerNodes
        if (checkValidNode(viewerLoads[i].childNodes[j]))
        //all point data in valid node
        for (var k = 0; k < viewerLoads[i].childNodes[j].childNodes.length; k++)
        //only read valid points
        if (checkValidNode(viewerLoads[i].childNodes[j].childNodes[k]))
        //3 child notes denote 1 point (single point force)
        if(viewerLoads[i].childNodes[j].childNodes.length == onePointChildVal ||
            viewerLoads[i].childNodes[j].childNodes.length == 1){
        if (checkValidNode(viewerLoads[i].childNodes[j].childNodes[k]))
        viewerLoadPoints.push({point0: viewerLoads[i].childNodes[j].childNodes[k],
        barId: viewerLoads[i].childNodes[j].getAttribute("barId")});}
        //5 child notes denote 2 points (uniformly distributed viewerLoads)
        else if(viewerLoads[i].childNodes[j].childNodes.length == uniformForceChildVal ||
            viewerLoads[i].childNodes[j].childNodes.length == 2){
        var obj = {};
        switch(viewerLoads[i].childNodes[j].childNodes[k].nodeName){
        case "point0":
        obj.point0 = viewerLoads[i].childNodes[j].childNodes[k];
        viewerLoadPoints.push(obj);
        break;
        case "point1":
        viewerLoadPoints[viewerLoadPoints.length - 1].point1 = viewerLoads[i].childNodes[j].childNodes[k];
        viewerLoadPoints[viewerLoadPoints.length - 1].barId = viewerLoads[i].childNodes[j].getAttribute("barId");
        break;
        }
        }
        return viewerLoadPoints;
    }

    function extractSupports (viewerBeamRequest, viewerNodes) {
        var supportsArray = htmlCollectionToArray(viewerBeamRequest.getElementsByTagName("supports")[0].childNodes);
        var returnSupports = [];

        for (var i = 0; i < viewerNodes.length; i++) {
            var supName = viewerNodes[i].getAttribute("supportName");
            for (var j = 0; j < supportsArray.length; j++) {
                var sup = supportsArray[j];
                if(sup.getAttribute("name") == supName)
                {
                    var fixed = undefined;
                    //TODO: simplify
                    if (sup.getAttribute("ry") == "true" && sup.getAttribute("rz") == "true")
                        fixed = true; else fixed = false;

                    returnSupports.push({support: sup,
                        xPos: Number(viewerNodes[i].getAttribute("x")),
                        fixed: fixed,
                        node: viewerNodes[i]});
                    break;
                }
            }
        }
        return returnSupports;
    }

    function getBars (viewerBeamRequest) {
        var bars = htmlCollectionToArray(viewerBeamRequest.getElementsByTagName("bars")[0].childNodes);
        /*
         -loop bars and add start and end positions for meshes
         */
        for (var i = bars.length - 1; i >= 0; i--) {
            var startNode = getNodeByID(Number(bars[i].getAttribute("startNodeId")));
            var endNode = getNodeByID(Number(bars[i].getAttribute("endNodeId")));

            if(!startNode || !endNode){
                console.error("Can not find valid nodes for bar " + bars[i].getAttribute("id"));
                bars[i].invalidNodes = true;
                continue;
            }
            bars[i].startPosX = Number(startNode.getAttribute("x"));
            bars[i].endPosX = Number(endNode.getAttribute("x"));
        }
        return bars;
    }

    this.findNode = function () {
        var firstNode, lastNode, largestX = 0, smallestX = Infinity;

        return{
            last: function() {
                for (var i = 0; i < _this.viewerNodes.length; i++) {
                    var curX = Number(_this.viewerNodes[i].getAttribute("x"));
                    if(curX > largestX)
                    {
                        largestX = curX;
                        lastNode = _this.viewerNodes[i];
                    }
                }
                return lastNode;
            },
            first: function () {
                for (var i = 0; i < _this.viewerNodes.length; i++) {
                    var curX = Number(_this.viewerNodes[i].getAttribute("x"));
                    if(curX < smallestX)
                    {
                        smallestX = curX;
                        firstNode = _this.viewerNodes[i];
                    }
                }
                return firstNode;
            }
        }
    }();
// </editor-fold>

// <editor-fold desc="sprite maker"
function makeSprite (text) {
    /*
     -returns a sprite plane parented to a THREE.Gyroscope
     -plane is pushed to sprites[] to be looped in animate call
     */
    var gyro = new THREE.Gyroscope();
    var sizeDivision = 200;
    var texture = makeSpriteTexture(text);

    var planeMesh = new THREE.Mesh(
        makeSpritePlane(texture.c.width / sizeDivision, texture.c.height / sizeDivision),
        new THREE.MeshBasicMaterial({ map: texture.t, side: THREE.DoubleSide}));
    planeMesh.position.y += (texture.c.height / sizeDivision) / 2;
    gyro.add(planeMesh);
    planeMesh.text = text;
    planeMesh.type = "sprite";
    _this.sprites.push(planeMesh);
    return gyro;
}

function makeSpritePlane (x, y) { return new THREE.PlaneGeometry(x, y); }

function makeSpriteTexture (text) {
    /*
     -returns a texture extracted from a new canvas element
     -can customize font, size and color
     */
    var font = "Trebuchet MS", size = 100, color = "#000000";
    font = size + "px " + font;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    context.font = font;

    var metrics = context.measureText(text), textWidth = metrics.width;
    canvas.width = textWidth + 3;
    canvas.height = size + 3;

    context.font = font;
    context.fillStyle = color;
    context.fillText(text, 0, size);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    return {c: canvas, t: texture, text: text};
}

this.changeSpriteText = function(sprite, text) {
    sprite.material.map = makeSpriteTexture(text).t;
    scaleSpritePlane(sprite.geometry, text);
};

function scaleSpritePlane (geom, text) {
    /*
     -change sprite size from geometry to properly scale text
     */

    var division = 7.5;
    var length = text.toString().length / division;
    if (text % 1 == 0) length = ((text.toString().length) + 0.3) / division;
    geom.vertices[0].x = -length;
    geom.vertices[1].x = length;
    geom.vertices[2].x = -length;
    geom.vertices[3].x = length;
    geom.verticesNeedUpdate = true;
}
// </editor-fold>

// <editor-fold desc="gizmo maker">
this.MakeGizmo = makeGizmo;
function makeGizmo (type, text, xPos, justMesh) {
    var holder = new THREE.Object3D();
    holder.Xmat = new THREE.MeshLambertMaterial({color: 0x0000ff});
    holder.Ymat = new THREE.MeshLambertMaterial({color: 0x00ff00});
    holder.Zmat = new THREE.MeshLambertMaterial({color: 0xff0000});
    holder.helperMat = new THREE.MeshLambertMaterial({color: 0xffffff});

    switch (type){
        case "position":
        {
            var radius = 0.10, height = 3, heightSeg = 3, topSeg = 0,
                arrowRadius = 0.2, arrowHeight = 0.5, arrowHeightSeg = 8, arrowTopSeg = 0;

            var arrowGeom = new THREE.CylinderGeometry(0, arrowRadius, arrowHeight, arrowHeightSeg, arrowTopSeg);
            var cylinderGeom = new THREE.CylinderGeometry(radius, radius, height, heightSeg, topSeg);
            cylinderGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, (height / 2), 0));
            arrowGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, height + (arrowHeight / 2), 0));
            cylinderGeom.merge(arrowGeom);
            //X
            var cylinderX = new THREE.Mesh(cylinderGeom, new THREE.MeshBasicMaterial({color: 0x00ff00}));
            cylinderX.rotation.set(0, 0, -Math.PI / 2);
            holder.add(cylinderX);
            //Y
            var cylinderY = new THREE.Mesh(cylinderGeom, new THREE.MeshBasicMaterial({color: 0xff0000}));
            cylinderY.rotation.set(0, 0, 0);
            holder.add(cylinderY);
            //Z
            var cylinderZ = new THREE.Mesh(cylinderGeom, new THREE.MeshBasicMaterial({color: 0x0000ff}));
            cylinderZ.rotation.set(Math.PI / 2, 0, 0);
            holder.add(cylinderZ);
            //sphere
            var radius = 0.2, segments = 6, rings = 6;
            var sphereGeom =  new THREE.SphereGeometry( radius, segments, rings );
            var sphere = new THREE.Mesh( sphereGeom, new THREE.MeshBasicMaterial({color: 0xffffff}));
            holder.add(sphere);
            if (justMesh == true) return holder;
        }
            break;
        case "rotation":{
            var radius = 25, tube = 0.3, radialSegments = 6, tubularSegments = 36;
            var torusGeom = new THREE.TorusGeometry( radius, tube, radialSegments, tubularSegments );
            //X
            var torusX = new THREE.Mesh(torusGeom, holder.Xmat);
            torusX.rotation.set(0, 0, Math.PI / 2);
            holder.add(torusX);
            //Y
            var torusY = new THREE.Mesh(torusGeom, holder.Ymat);
            torusY.rotation.set(0, Math.PI / 2, 0);
            holder.add(torusY);
            //Z
            var torusZ = new THREE.Mesh(torusGeom, holder.Zmat);
            torusZ.rotation.set(Math.PI / 2, 0, 0);
            holder.add(torusZ);
            if (justMesh == true) return holder;
        }
            break;
        case "scale":
        {
            var radius = 0.5, height = 25, heightSeg = 16, topSeg = 0, boxSide = 2;
            var boxGeom = new THREE.BoxGeometry(boxSide, boxSide, boxSide);
            var cylinderGeom = new THREE.CylinderGeometry(radius, radius, height, heightSeg, topSeg);
            cylinderGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, (height / 2), 0));
            boxGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, height + (boxSide / 2), 0));
            cylinderGeom.merge(boxGeom);
            //X
            var cylinderX = new THREE.Mesh(cylinderGeom, holder.Xmat);
            cylinderX.rotation.set(0, 0, -Math.PI / 2);
            holder.add(cylinderX);
            //Y
            var cylinderY = new THREE.Mesh(cylinderGeom, holder.Ymat);
            cylinderY.rotation.set(0, 0, 0);
            holder.add(cylinderY);
            //Z
            var cylinderZ = new THREE.Mesh(cylinderGeom, holder.Zmat);
            cylinderZ.rotation.set(Math.PI / 2, 0, 0);
            holder.add(cylinderZ);
            //box
            var smallBoxSide = 1;
            var smallBoxGeom = new THREE.BoxGeometry(smallBoxSide, smallBoxSide, smallBoxSide);
            var smallBox = new THREE.Mesh( smallBoxGeom, holder.helperMat );
            holder.add(smallBox);
            if (justMesh == true) return holder;
        }
            break;
        case "arrowDown":
        {
            var radius = 0.05, height = 3, heightSeg = 5, topSeg = 0, arrowRadius = 0.1,
                arrowHeight = 1, arrowHeightSeg = heightSeg, arrowTopSeg = 0;
            var arrowGeom = new THREE.CylinderGeometry(arrowRadius, 0, arrowHeight,
                arrowHeightSeg, arrowTopSeg);
            arrowGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, arrowHeight / 2, 0));

            var cylinderGeom = new THREE.CylinderGeometry(radius, radius, height - arrowHeight,
                heightSeg, topSeg);
            cylinderGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, height / 2, 0));
            cylinderGeom.merge(arrowGeom);

            var cylinder = new THREE.Mesh(cylinderGeom, holder.Zmat);
            holder = cylinder;

            if(!justMesh){
                var aboveSprite = makeSprite(text);
                aboveSprite.position.y += height;
                holder.aboveSprite = aboveSprite;
                holder.add(aboveSprite);

                var belowSprite = makeSprite(' ');
                holder.belowSprite = belowSprite;
                _this.beamHolder.add(belowSprite);
            }

            holder.add(returnLineBelow(holder));
            if (justMesh == true) return holder;
        }
            break;
        case "circle":
        {
            var radius = 1, diam = 0.1, radSeg = 5, tubeSeg = 14;
            var arrowRadius = 0.2, arrowHeight = 0.5, arrowHeightSeg = 8, arrowTopSeg = 0;
            var arrowGeom = new THREE.CylinderGeometry(0, arrowRadius, arrowHeight,
                arrowHeightSeg, arrowTopSeg);
            arrowGeom.applyMatrix( new THREE.Matrix4().makeRotationZ( -Math.PI/2));
            arrowGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, -radius, 0));

            var torusCapGeom = new THREE.CircleGeometry( diam, radSeg );
            torusCapGeom.applyMatrix( new THREE.Matrix4().makeRotationX( Math.PI/2));
            torusCapGeom.applyMatrix( new THREE.Matrix4().makeTranslation(radius, 0, 0));
            arrowGeom.merge(torusCapGeom);

            var torusGeom = new THREE.TorusGeometry( radius, diam, radSeg, tubeSeg ,
                Math.PI * 1.5 );
            torusGeom.merge(arrowGeom);
            torusGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0,
                -_this.beamDetails.height / 2, -_this.beamDetails.width));

            var torus = new THREE.Mesh( torusGeom, holder.Ymat);
            holder = torus;


            var aboveSprite = makeSprite(text);
            aboveSprite.position.y += 1;
            aboveSprite.position.z -= 1;
            holder.aboveSprite = aboveSprite;
            holder.add(aboveSprite);

            var belowSprite = makeSprite(' ');
            holder.belowSprite = belowSprite;
            _this.beamHolder.add(belowSprite);

            holder.add(returnLineBelow(holder));
            if (justMesh == true) return holder;
        }
            break;
        case "arrowHead":
        {
            var arrowRadius = 0.1, arrowHeight = 0.3, arrowHeightSeg = heightSeg, arrowTopSeg = 0;
            var arrowGeom = new THREE.CylinderGeometry(arrowRadius, 0, arrowHeight,
                arrowHeightSeg, arrowTopSeg);
            arrowGeom.applyMatrix( new THREE.Matrix4().makeTranslation(0, arrowHeight / 2, 0));
            var arrow = new THREE.Mesh(arrowGeom, holder.Ymat);
            arrow.arrowHeight = arrowHeight;
            return arrow;
        }
            break;
        default: console.error("invalid gizmo type");
    }

    holder.axisPlanes = makeAxisPlane(holder);
    _this.gizmos.push(holder);
    if(xPos != undefined) holder.position.setX(-xPos);
    return holder;
}

function makeUniformForce (start, end, barID, obj) {
    //make and add a uniform force at a supplied position
    if(barID.hasOwnProperty("barID1")){}
    else barID = barID.barID;

    var points = 0, lineLength = 0;
    if (end == undefined){
        points = 20;
        lineLength = (points - 1) * distanceBetweenUniformArrows;
    } else {
        points = (end - start) / (distanceBetweenUniformArrows * _this.toMilimeter);
        lineLength = (end - start) / _this.toMilimeter;
    }

    var lineHeight = 3.5;
    var geom = new THREE.Geometry();
    var oneGeom = makeGizmo("arrowDown", undefined, 0, true).geometry;
    var mesh = new THREE.Mesh(geom, new THREE.MeshLambertMaterial({color: 0xff0000}));

    for (var i = 0; i < points; i++) {
        var offset = 0;
        if(i > 0) offset = i + 1;
        oneGeom.applyMatrix(new THREE.Matrix4().makeTranslation(
            -( (offset * distanceBetweenUniformArrows ) / (i + 1) ), 0, 0));
        mesh.updateMatrix();
        geom.merge( oneGeom, mesh.matrix );
    }

    _this.gizmos.push(mesh);
    _this.loadMeshes.push(mesh);

    mesh.axisPlanes = makeAxisPlane(mesh);
    var aboveSprite = makeSprite("FZ"+findAppropriateSpriteTitle(obj));
    aboveSprite.position.setY(2.5);
    if(end != undefined) aboveSprite.position.setX(-((end - start) / _this.toMilimeter) / 2);
    else aboveSprite.position.setX(-2);
    mesh.aboveSprite = aboveSprite;
    mesh.add(aboveSprite);

    var belowSprite = makeSprite(' ');
    mesh.belowSprite = belowSprite;
    _this.beamHolder.add(belowSprite);

    mesh.gizmoType = "linear";
    mesh.add(returnLineBelow(mesh));
    mesh.position.setX(-(start / _this.toMilimeter));
    var sprite = makeSprite((Math.ceil(lineLength * _this.toMilimeter)).toString());
    sprite.position.set(-lineLength / 2, lineHeight, 0);
    sprite.children[0].type = "lengthSprite";
    mesh.add(sprite);

    //length line
    var beamLengthStartV3 = new THREE.Vector3(0, lineHeight, 0);
    var beamLengthEndV3 = new THREE.Vector3(-lineLength, lineHeight, 0);
    var lineVectors = [beamLengthStartV3, beamLengthEndV3];
    var lengthLine = makeDistanceLine(lineVectors, lineColor);
    mesh.add(lengthLine);

    //length arrows
    var arrowHeadLeft = makeGizmo("arrowHead");
    arrowHeadLeft.position.setY(lineHeight);
    arrowHeadLeft.rotation.z = Math.PI / 2;
    arrowHeadLeft.material.color.set(lineColor);
    mesh.add(arrowHeadLeft);
    //right arrow
    var arrowHeadRight = arrowHeadLeft.clone();
    arrowHeadRight.position.setX(-lineLength);
    arrowHeadRight.rotation.z = -Math.PI / 2;
    mesh.add(arrowHeadRight);

    //vertical line left
    var beamHeightStartV3Left = new THREE.Vector3(0, lineHeight - 1, 0);
    var beamHeightEndV3Left = new THREE.Vector3(0, lineHeight, 0);
    lineVectors = [beamHeightStartV3Left, beamHeightEndV3Left];
    var heightBarLeft = makeDistanceLine(lineVectors, lineColor);
    mesh.add(heightBarLeft);
    //vertical line right
    var beamHeightStartV3Right = new THREE.Vector3(-lineLength, lineHeight - 1, 0);
    var beamHeightEndV3Right = new THREE.Vector3(-lineLength, lineHeight, 0);
    lineVectors = [beamHeightStartV3Right, beamHeightEndV3Right];
    var heightBarRight = makeDistanceLine(lineVectors, lineColor);
    mesh.add(heightBarRight);

    mesh.parentNode = (obj.loadPoint0.point0.parentNode);
    var selectedID = barID;

    for (var i = 0; i < 2; i++) {
        var point = "point" + i.toString();
        if(barID.hasOwnProperty("barID1")) selectedID = barID["barID" + i.toString()];

        mesh[point] = {
            dist: obj["loadPoint"+ i.toString()][point].getAttribute("dist"),
            angX: obj.loadPoint0[point].getAttribute("angX"),
            angY: obj.loadPoint0[point].getAttribute("angY"),
            angZ: obj.loadPoint0[point].getAttribute("angZ"),
            fx: obj.loadPoint0[point].getAttribute("fx"),
            fy: obj.loadPoint0[point].getAttribute("fy"),
            fz: obj.loadPoint0[point].getAttribute("fz"),
            mx: obj.loadPoint0[point].getAttribute("mx"),
            my: obj.loadPoint0[point].getAttribute("my"),
            mz: obj.loadPoint0[point].getAttribute("mz"),
            barID: selectedID
        };
        if(i == 1){
            mesh[point].length = end - start;
            mesh[point].end = end;
        }
    }
    mesh.points = 2;
    mesh.barID = barID;

    if(Number(obj.loadPoint0.point0.getAttribute("fy")) > 0)
        _this.rotateGizmo(mesh, true, true);
    else if(Number(obj.loadPoint0.point0.getAttribute("fy")) < 0)
        _this.rotateGizmo(mesh, false, true);

    if(Number(obj.loadPoint0.point0.getAttribute("fz")) > 0) {
        _this.rotateGizmo(mesh, false, true);
        _this.rotateGizmo(mesh, false, true);}

    _this.beamHolder.add(mesh);

    function findAppropriateSpriteTitle(obj){
        var possible = ['fx', 'fy', 'fz', 'mx', 'my', 'mz'];
        for(var i = 0; i < possible.length; i++){
            var potential = obj.loadPoint0.point0.attributes[possible[i]].nodeValue;
            if(potential != 0) return potential;
        }
    }
}

function returnLineBelow (holder) {
    /*
     -returns a line and an associated distance sprite
     -adds both to a THREE.Gyroscope to assist lookAt functionality after
     the gyro's parent has been rotated
     */
    var lineBegin = new THREE.Vector3(holder.position.x, holder.position.y -
        _this.beamDetails.height - veticalLineExtraY, holder.position.z);
    var lineEnd = new THREE.Vector3().copy(lineBegin);
    lineEnd.y = -lineHeight - _this.beamDetails.height + veticalLineExtraY;

    var gyro = new THREE.Gyroscope();
    var belowDistanceLine = makeDistanceLine([lineBegin, lineEnd], lineColor);
    gyro.add(belowDistanceLine);

    var arrowhead = makeGizmo("arrowHead");
    arrowhead.position.setY(-lineHeight - _this.beamDetails.height + veticalLineExtraY);
    arrowhead.rotation.z = Math.PI / 2;
    arrowhead.material.color.set(lineColor);
    holder.rightArrow = arrowhead;
    belowDistanceLine.add(arrowhead);

    arrowhead = arrowhead.clone();
    arrowhead.rotation.z -= Math.PI;
    arrowhead.material.color.set(lineColor);
    holder.leftArrow = arrowhead;
    belowDistanceLine.add(arrowhead);
    return gyro;
}

function makeDistanceLine (vectorArray, color) {
    var material = new THREE.LineBasicMaterial({color: color});
    var geometry = new THREE.Geometry();

    for (var i = 0; i < vectorArray.length; i++)
        geometry.vertices.push(vectorArray[i]);

    return new THREE.Line( geometry, material );
}

function makeAxisPlane (mesh) {
    /*
     -returns an axis plane that will be parented to a gizmo for raycasting
     and extracting movement
     */
    var planes = [];
    var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, visible: true,
        wireframe: false} );

    var geometryX = new THREE.PlaneBufferGeometry ( 1000, 1000 );
    var planeX = new THREE.Mesh(geometryX, material);
    planes.push(planeX);

    var geometryY = geometryX.clone();
    geometryY.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI/2));
    var planeY = new THREE.Mesh(geometryY, material);
    //mesh.add(planeY)
    //planes.push(planeY);
    return planes;
}

this.addSupport = function() {
    /*
     -called from the UI, adds a support
     */
    var newX = prompt("Support position in mm");
    if(newX == null) return;
    makeSupport(newX, undefined, true);
    _this.animatorComponent.manageDistanceSprites(true);
};

this.addPointForce = function (my, fy, fz) {
    /*
     -called from the UI, adds a point force
     */
    var newX = prompt("Force position in mm");
    if(newX == null) return;

    var bar = _this.animatorComponent.getBarByDistance(newX / _this.toMilimeter /  _this.toMeter);
    var barID = bar.bar.getAttribute("id");
    var dist = bar.dist;
    var parentNode = createXML_Element({
        name: "loadPoint",
        id: 0,
        barId: barID,
        caseId: 1
    });

    var childNode = {
        point0: createXML_Element({
            name: "point0",
            dist: dist.toFixed(3),
            barId: barID,
            angX: 0, angY: 0, angZ: 0,
            fx: 0, fy: fy, fz: fz,
            mx: 0, my: my, mz: 0,
            points: 1
        }),
        barId: barID
    };
    parentNode.appendChild(childNode.point0);

    makeLoadPoint(undefined, {x: newX / _this.toMilimeter}, my, fy, fz, barID, childNode);
    _this.animatorComponent.manageDistanceSprites(true);
};

this.addUniformForce = function() {
    /*
     -called from the UI, adds a uniform force
     */
    var newX = prompt("Force position in mm");
    if(newX == null) return;

    var start = Number(newX);
    var end = start + newUniformForceLength;

    var bar0 = _this.animatorComponent.getBarByDistance(start /
        _this.toMilimeter / _this.toMeter);
    var barID0 = bar0.bar.getAttribute("id");
    var dist0 = bar0.dist;

    var bar1 = _this.animatorComponent.getBarByDistance(end /
        _this.toMilimeter / _this.toMeter);
    var barID1 = bar1.bar.getAttribute("id");
    var dist1 = bar1.dist;

    var parentNode = createXML_Element({
        name: "linear",
        id: 0,
        barId: barID0,
        caseId: 1
    });

    var childNode = {
        point0: createXML_Element({
            name: "point0",
            dist: dist0.toFixed(3),
            barId: barID0,
            angX: 0, angY: 0, angZ: 0,
            fx: 0, fy: 0, fz: -1200,
            mx: 0, my: 0, mz: 0,
            points: 2
        }),
        point1: createXML_Element({
            name: "point1",
            dist: dist1.toFixed(3),
            barId: barID1,
            angX: 0, angY: 0, angZ: 0,
            fx: 0, fy: 0, fz: 0,
            mx: 0, my: 0, mz: 0,
            points: 2
        }),
        barId: barID0
    };

    parentNode.appendChild(childNode.point0);
    parentNode.appendChild(childNode.point1);
    makeUniformForce(start, end, {barID: barID0},
        {loadPoint0: childNode, loadPoint1: childNode});
    _this.animatorComponent.manageDistanceSprites(true);
};
// </editor-fold>

// <editor-fold desc="manage gizmos"
this.rotateGizmo = function(gizmo, ccw, doNotRecord) {
    /*
     -rotates a valid gizmo in 90° incremens
     -repositions the arrows below
     -sets a custom color to new reflect axis
     */
    if(!doNotRecord && gizmo.Action == undefined)
        _this.animatorComponent.addActionProperty(gizmo,{before: _this.copyEuler(gizmo.rotation)});

    if(ccw)gizmo.rotateX(-Math.PI/2);
    else gizmo.rotateX(Math.PI/2);

    var rotation = (Math.round(_this.radiansToDegrees(gizmo.rotation.x)));

    _this.rotateGizmoDeg(gizmo, rotation);

    if(!doNotRecord) _this.animatorComponent.addActionProperty(gizmo, {after: _this.copyEuler(gizmo.rotation)});
};

this.rotateGizmoDeg = function(gizmo, rotation, action) {
    var sprite = gizmo.aboveSprite.children[0];
    var dir, newText;
    var name = sprite.text;
    var arrowBelow = gizmo.children[1];

    var negIndex = name.indexOf("-");
    if(negIndex != -1) dir = name.slice(0, negIndex + 1);
    else dir = name.slice(0, 2);
    var val = name.slice(dir.length, name.length);

    if(action)
    {
        gizmo.rotation.copy(rotation);
        rotation = Math.round(_this.radiansToDegrees(rotation.x));
    }

    switch(rotation){
        case -90:
            gizmo.position.setY(-_this.beamDetails.height / 2);
            gizmo.position.setZ(-_this.beamDetails.width / 2);
            arrowBelow.position.setY(-_this.beamDetails.width / 2);
            arrowBelow.position.setZ(_this.beamDetails.height / 2);
            gizmo.material.color.setHex(arrowYcolor);
            newText = "FY" + val;
            break;
        case -180:
        case 180:
            gizmo.position.setY(-_this.beamDetails.height);
            gizmo.position.setZ(0);
            arrowBelow.position.setY(-_this.beamDetails.height);
            arrowBelow.position.setZ(0);
            gizmo.material.color.setHex(arrowZcolor);
            newText = "FZ" + val;
            break;
        case 90:
            gizmo.position.setY(-_this.beamDetails.height / 2);
            gizmo.position.setZ(_this.beamDetails.width / 2);
            arrowBelow.position.setY(-_this.beamDetails.width / 2);
            arrowBelow.position.setZ(-_this.beamDetails.height / 2);
            gizmo.material.color.setHex(arrowYcolor);
            newText = "FY-" + val;
            break;
        case 0:
            gizmo.position.setY(0);
            gizmo.position.setZ(0);
            arrowBelow.position.setY(0);
            arrowBelow.position.setZ(0);
            gizmo.material.color.setHex(arrowZcolor);
            newText = "FZ-" + val;
            break;
    }

    //update data for saving
    if(gizmo.point0){
        gizmo.point0.fx = gizmo.point0.fy = gizmo.point0.fz = 0;
        gizmo.point0[newText.slice(0, 2).toLowerCase()] = newText.slice(2, newText.length);
    }

    if(action) _this.animatorComponent.addActionProperty(gizmo, {after: _this.copyEuler(gizmo.rotation)});
    if(newText) _this.changeSpriteText(gizmo.aboveSprite.children[0], newText);
}
// </editor-fold>

// <editor-fold desc="model loading">
this.add_XML_LoadPoints = function() {
    /*
     -add load points from XML
     */
    for (var i = 0; i < _this.viewerLoadPoints.length; i++) {
        var barID = Number(_this.viewerLoadPoints[i].barId);
        var bar = getBarByID(barID);
        if(!bar) {console.error("No bar with id " + barID + " found."); continue;}
        if(bar.invalidNodes) {
            console.error("Can not add loads for bar " + barID + ". Invalid nodes.");
            continue;
        }

        var beginVec = new THREE.Vector2(bar.startPosX * _this.toMeter, 0);
        var endVec = new THREE.Vector2(bar.endPosX * _this.toMeter, 0);
        var dist0 = interpolateVector2(beginVec, endVec,
            _this.viewerLoadPoints[i].point0.getAttribute("dist"));
        if(_this.viewerLoadPoints[i].hasOwnProperty("point1")) {
            var p = _this.viewerLoadPoints[i];

            //check multi bar uniform force
            if(p.point1.getAttribute("dist") == "1.000") continue;
            if(p.point0.getAttribute("dist") == "0.000"){
                var bar0ID = Number(_this.viewerLoadPoints[i - 1].barId);
                var bar0 = getBarByID(bar0ID);
                var beginVec0 = new THREE.Vector2(bar0.startPosX * _this.toMeter, 0);
                var endVec0 = new THREE.Vector2(bar0.endPosX * _this.toMeter, 0);
                dist0 = interpolateVector2(beginVec0, endVec0,
                    _this.viewerLoadPoints[i - 1].point0.getAttribute("dist"));

                var dist1 = interpolateVector2(beginVec, endVec,
                    p.point1.getAttribute("dist"));
                makeUniformForce(dist0.x * _this.toMilimeter, dist1.x * _this.toMilimeter,
                    {barID0: bar0ID, barID1: barID},
                    {loadPoint0: _this.viewerLoadPoints[i - 1],
                     loadPoint1: _this.viewerLoadPoints[i]});
                continue;
            }

            dist1 = interpolateVector2(beginVec, endVec, p.point1.getAttribute("dist"));
            makeUniformForce(dist0.x * _this.toMilimeter, dist1.x *
                _this.toMilimeter, {barID: barID},
                {loadPoint0: _this.viewerLoadPoints[i], loadPoint1: _this.viewerLoadPoints[i]});
            continue;
        }

        //is single load
        var my = Number(_this.viewerLoadPoints[i].point0.getAttribute("my"));
        var fy = Number(_this.viewerLoadPoints[i].point0.getAttribute("fy"));
        var fz = Number(_this.viewerLoadPoints[i].point0.getAttribute("fz"));
        makeLoadPoint(i, dist0, my, fy, fz, {barID: barID}, _this.viewerLoadPoints[i]);
    }
};

this.add_XML_Supports = function() {
    /*
     -add support points from XML
     */
    for (var i = 0; i < _this.viewerExtractedSupports.length; i++)
        makeSupport(_this.viewerExtractedSupports[i].xPos * _this.toMeter * _this.toMilimeter,
            _this.viewerExtractedSupports[i].fixed, false,
            _this.viewerExtractedSupports[i]);
    _this.supportMeshes.sort(sortSupports);
};

function makeSupport (xPos, fixed, userSupport, obj) {
    /*
     -makes a support mesh
     -first checks if mobile / fixed
     */
    if(fixed) {makeFixedSupport(true, xPos); return;}

    var supportShape = new THREE.Shape();
    var extrude = _this.beamDetails.width * 2;
    var sideMm = supportSide / _this.toMilimeter;
    supportShape.moveTo( -sideMm, -sideMm );
    supportShape.lineTo( 0, sideMm );
    supportShape.lineTo( sideMm, -sideMm );
    supportShape.lineTo( -sideMm, -sideMm );

    var supportMesh = extrudeShape(supportShape, extrude);
    supportMesh.axisPlanes = makeAxisPlane(supportMesh);
    supportMesh.geometry.applyMatrix( new THREE.Matrix4().makeTranslation(0, -_this.beamDetails.height -
        sideMm, -_this.beamDetails.width));
    supportMesh.add(returnLineBelow(supportMesh));
    _this.gizmos.push(supportMesh);

    var belowSprite = makeSprite(' ');
    supportMesh.belowSprite = belowSprite;
    _this.beamHolder.add(belowSprite);
    if(xPos != undefined) supportMesh.position.setX(-(xPos / _this.toMilimeter));
    supportMesh.gizmoType = "support";
    supportMesh.material.color = supportMeshColor;
    _this.supportMeshes.push(supportMesh);
    _this.supportMeshes.sort(sortSupports);

    if(userSupport) {
        supportMesh.node = addNode((xPos / _this.toMilimeter / _this.toMeter).toFixed(3));
    }
    else supportMesh.node = obj.node;

    _this.beamHolder.add(supportMesh);
}

function addNode (x) {
    var newNode = cloneNode(_this.viewerNodes[0]);
    newNode.setAttribute("x", x);
    newNode.setAttribute("id", _this.viewerNodes.length + 1);
    _this.viewerNodes.push(newNode);
    return newNode;
}

this.rotateBeam = function(dir) {
    if(dir == undefined) dir = 1;
    for (var i = 0; i < _this.viewerBars.length; i++){
        _this.viewerBars[i].mesh.rotateZ(-(Math.PI / 2) * dir);
        var curRot = Number(_this.viewerBars[i].getAttribute("gamma"));
        curRot += 90;
        if(curRot == 360) curRot = 0;
        _this.viewerBars[i].setAttribute("gamma", curRot.toString());
    }
};

this.setBeamLength = function() {
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
    if(newLength > _this.beamDetails.length * _this.toMilimeter){
        var lastNode = _this.findNode.last();
        lastNode.setAttribute("x", (newLength / _this.toMilimeter / _this.toMeter).toString());
        _this.beamDetails.length = newLength / _this.toMilimeter;
        _this.viewerComponent.LoadModel();
        return;
    }
    //else
    for (var i = _this.viewerBars.length - 1; i >= 0; i--) {
        var curBar = _this.viewerBars[i];
        var startNode = _this.getNodeByID(curBar.getAttribute("startNodeId"));
        var endNode = _this.getNodeByID(curBar.getAttribute("endNodeId"));
        if(newLength > curBar.startPosX * _this.toMilimeter * _this.toMeter){
            //bigger than last start
            endNode.setAttribute("x", (newLength / _this.toMilimeter / _this.toMeter).toString());
            _this.viewerComponent.LoadModel();
            break;
        }
        else {
            startNode.setAttribute("x", 0);
            _this.viewerComponent.LoadModel();
            break;
        }
    }
    _this.beamDetails.length = newLength / _this.toMilimeter;
    //center the camera to the beam (this is optional and can be commented out)
    _this.viewerComponent.centerCamToBeam();
};

this.toggleWall = function () {
    //if no fixed support, and user clicks, make one
    if(!_this.beamDetails.wall) _this.beamDetails.wall = makeFixedSupport(false, 0);
    _this.beamDetails.wall.visible = !_this.beamDetails.wall.visible;
};

this.removeGizmo = function() {
    if(!_this.beamDetails.lastSelected /*|| !_this.animatorComponent.selectedGizmo*/) return;
    var g = _this.beamDetails.lastSelected;
    var index = _this.gizmos.indexOf(g);
    _this.gizmos.splice(index, 1);

    switch(g.gizmoType){
        case "support":
            var i = _this.supportMeshes.indexOf(g);
            _this.supportMeshes.splice(i, 1);
            _this.supportMeshes.sort(sortSupports);
            break;
        case "loadPoint":
        case "linear":
        case "bending":
            var i = _this.loadMeshes.indexOf(g);
            _this.loadMeshes.splice(i, 1);
            break;
    }

    g.belowSprite.parent.remove(g.belowSprite);
    g.parent.remove(g);
    _this.beamDetails.lastSelected = undefined;
    _this.animatorComponent.manageDistanceSprites(true);
};

function cloneNode (node) { return node.cloneNode(); }

function makeFixedSupport (visible, xPos) {
    //console.log(xPos)
    var fs_geometry = new THREE.BoxGeometry( fs_thickness, fs_height, fs_width ),
        fs_material = new THREE.MeshLambertMaterial( {color: "supportMeshColor"} ),
        fs_mesh = new THREE.Mesh( fs_geometry, fs_material );
    fs_mesh.visible = visible;
    //beamDetails.fs_mesh.push(fs_mesh);
    fs_mesh.position.set(-(xPos / _this.toMilimeter), -fs_height / 40, 0);
    //findNode.first().setAttribute("supportName", "support2");
    beamHolder.add(fs_mesh);
    return fs_mesh;
}

this.checkSupportProximity = function(x, gizmo) {
    /*
     -calcualte support gizmo positions and prevent them from passing through each other
     -check the support gizmo before and after the selected one (if they exist) and see if the
     selected gizmo can move or not.
     */
    var index = _this.supportMeshes.indexOf(gizmo);

    if (checkOutOfBounds(x) == "min") {
        if (!_this.supportMeshes[index - 1]) gizmo.position.setX(-_this.beamDetails.start * _this.toMeter);
        else snapToPrev();

        return true;
    }
    if (checkOutOfBounds(x) == "max") {
        if (!_this.supportMeshes[index + 1]) gizmo.position.setX(-_this.beamDetails.start *
            _this.toMeter + -_this.beamDetails.length);
        else snapToNext();
        return true;
    }

    /*
     -gizmo after the selected one
     */
    if (proxToNext()) {
        snapToNext();
        return true;
    }

    /*
     -gizmo before the selected one
     */
    if (proxToPrev()) {
        snapToPrev();
        return true;
    }

    function proxToNext() {
        if (_this.supportMeshes[index + 1] && x <= _this.supportMeshes[index + 1].position.x +
            ((supportSide * 2) / _this.toMilimeter)) return true;
    }

    function proxToPrev() {
        if (_this.supportMeshes[index - 1] && x >= _this.supportMeshes[index - 1].position.x -
            ((supportSide * 2) / _this.toMilimeter)) return true;
    }

    function snapToPrev() {
        var snap = undefined;
        var prev =  _this.supportMeshes[index - 1].position.x -((supportSide * 2) / _this.toMilimeter);
        if(prev > -_this.beamDetails.start * _this.toMeter)
            snap = -_this.beamDetails.start * _this.toMeter;
        else snap = prev;
        gizmo.position.setX(snap);
    }

    function snapToNext() {
        gizmo.position.setX(_this.supportMeshes[index + 1].position.x +
            ((supportSide * 2) / _this.toMilimeter));
    }
};

function checkOutOfBounds (x) {
    if(x > -_this.beamDetails.start * _this.toMeter) return "min";
    if(x < (-_this.beamDetails.start * _this.toMeter) + -_this.beamDetails.length) return "max";
}

function sortSupports (a,b) {
    //reverse sorts
    if (a.position.x < b.position.x)
        return 1;
    if (a.position.x > b.position.x)
        return -1;
    return 0;
}

this.makeBeamMesh = function(i) {
    _this.beamDetails.start = _this.findBar.first().startX;
    if(i == _this.viewerBars.length) { /*animate(); */return; }
    var rectLength = _this.beamDetails.width, rectWidth = _this.beamDetails.height;
    var curBar = _this.viewerBars[i], prevBar = _this.viewerBars[i-1];
    if(curBar.invalidNodes){_this.makeBeamMesh(i + 1); return;}
    loadObject("beam", undefined, [addBeamDetails, function(mesh){
        curBar.mesh = mesh.mesh;
        manageBeamRotation(curBar);
        manageBeamPositionScale(mesh.mesh, curBar, prevBar);
        _this.makeBeamMesh(i + 1);
    }]);
    _this.beamDetails.length = Math.round((_this.findBar.last().endX -
        _this.beamDetails.start) * _this.toMeter);
};

function manageBeamRotation (bar) {
    var dir = 1, gamma = bar.getAttribute("gamma"),
        rotations = Math.abs(gamma) / 90;

    if(gamma < 0) dir = -1;

    for (var i = 0; i < rotations; i++) //rotateBeam(dir);
        bar.mesh.rotateZ(-(Math.PI / 2) * dir);
}

function manageBeamPositionScale (mesh, bar, prevBar) {
    var prevEnd = 0;
    if(prevBar != undefined)
        prevEnd = Number(getNodeByID(prevBar.getAttribute("endNodeId")).getAttribute("x"));
    else prevEnd = bar.startPosX;
    var start = Number(getNodeByID(bar.getAttribute("startNodeId")).getAttribute("x")),
        end = Number(getNodeByID(bar.getAttribute("endNodeId")).getAttribute("x"));
    var scale = 0.03, length = (end - start) * _this.toMeter;//beamDetails.length;
    mesh.scale.set(scale, scale, length);
    mesh.position.set(-(start) * _this.toMeter + length / 2,  -0.3, 0)
}

function addBeamDetails (beamMesh) {
    var lineAndSpriteHolder = new THREE.Object3D();
    var scale = 0.03, length = _this.beamDetails.length;
    var start = -_this.findBar.first().startX * _this.toMeter;
    var end = -_this.findBar.last().endX * _this.toMeter;
    beamMesh = beamMesh.mesh;
    beamMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-(_this.beamDetails.width / 2),
        -_this.beamDetails.height, 0));
    beamMesh.geometry.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI / 2));
    //line above
    //sprite
    var sprite = makeSprite((length * 100).toString());
    sprite.position.set(start + (end - start) / 2, lineHeight + 1, 0);
    sprite.children[0].type = "lengthSprite";
    lineAndSpriteHolder.add(sprite);

    //length line
    var beamLengthStartV3 = new THREE.Vector3(start, lineHeight, 0);
    var beamLengthEndV3 = new THREE.Vector3(end, lineHeight, 0);
    var lineVectors = [beamLengthStartV3, beamLengthEndV3];
    var lengthLine = makeDistanceLine(lineVectors, lineColor);
    lineAndSpriteHolder.add(lengthLine);

    //length arrows
    var arrowHeadLeft = makeGizmo("arrowHead");
    arrowHeadLeft.position.setX(start);
    arrowHeadLeft.position.setY(lineHeight);
    arrowHeadLeft.rotation.z = Math.PI / 2;
    arrowHeadLeft.material.color.set(lineColor);
    lineAndSpriteHolder.add(arrowHeadLeft);
    //right arrow
    var arrowHeadRight = arrowHeadLeft.clone();
    arrowHeadRight.position.setX(end);
    arrowHeadRight.rotation.z = -Math.PI / 2;
    lineAndSpriteHolder.add(arrowHeadRight);

    //vertical line left
    var beamHeightStartV3Left = new THREE.Vector3(0, 1, 0);
    var beamHeightEndV3Left = new THREE.Vector3(0, lineHeight, 0);
    lineVectors = [beamHeightStartV3Left, beamHeightEndV3Left];
    var heightBarLeft = makeDistanceLine(lineVectors, lineColor);
    heightBarLeft.position.setX(start);
    lineAndSpriteHolder.add(heightBarLeft);
    //vertical line right
    var beamHeightStartV3Right = new THREE.Vector3(0, 1, 0);
    var beamHeightEndV3Right = new THREE.Vector3(0, lineHeight, 0);
    lineVectors = [beamHeightStartV3Right, beamHeightEndV3Right];
    var heightBarRight = makeDistanceLine(lineVectors, lineColor);
    heightBarRight.position.setX(end);
    lineAndSpriteHolder.add(heightBarRight);

    //line below (clones and repositions line above)
    lengthLine = lengthLine.clone();
    lengthLine.position.y -= lineHeight * 2 + _this.beamDetails.height - veticalLineExtraY;
    lineAndSpriteHolder.add(lengthLine);

    arrowHeadLeft = arrowHeadLeft.clone();
    arrowHeadLeft.position.y = -(lineHeight + _this.beamDetails.height - veticalLineExtraY);
    lineAndSpriteHolder.add(arrowHeadLeft);

    arrowHeadRight = arrowHeadRight.clone();
    arrowHeadRight.position.y = -(lineHeight + _this.beamDetails.height - veticalLineExtraY);
    lineAndSpriteHolder.add(arrowHeadRight);

    heightBarLeft = heightBarLeft.clone();
    heightBarLeft.position.y = -(lineHeight + _this.beamDetails.height + veticalLineExtraY);
    lineAndSpriteHolder.add(heightBarLeft);

    heightBarRight = heightBarRight.clone();
    heightBarRight.position.y = -(lineHeight + _this.beamDetails.height + veticalLineExtraY);
    lineAndSpriteHolder.add(heightBarRight);

    beamMesh.rotation.y = Math.PI / 2;
    beamMesh.material.materials[0].ambient = {r: 1, g:1, b:1};
    beamMesh.material.materials[0].color = {r: 1, g:1, b:1};
    beamMesh.lineAndSpriteHolder = lineAndSpriteHolder;
    _this.beamDetails.barMeshes.push(beamMesh);

    beamHolder.add(lineAndSpriteHolder);
    _this.viewerBeamMeshes.push(beamMesh);
    _this.beamHolder.add(beamMesh);
}

function loadObject (name, variable, callback, initiallyVisible, initialOpacity) {
    var mesh;
    var loader = new THREE.JSONLoader();
    var materialsArray = [];

    loader.load( "media/" + name + ".js", function( geometry, materials ) {
        materialsArray = materials;
        for (var i = materialsArray.length - 1; i >= 0; i--) {
            if(initialOpacity != undefined) materialsArray[i].opacity = initialOpacity;
        }
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();

        var faceMaterial = new THREE.MeshFaceMaterial( materialsArray );
        mesh = new THREE.Mesh( geometry, faceMaterial );
    });

    loader.onLoadComplete = function(){
        mesh.name = name;
        if(initiallyVisible != undefined) mesh.visible = initiallyVisible;
        if(variable) variable.mesh = mesh;
        else variable = {mesh: mesh};
        if(callback) {
            if(callback.constructor === Array)
                for (var i = 0; i < callback.length; i++) callback[i](variable);
            else callback(variable);
        }
        else return variable.mesh;
    };
}

function addToScene (obj, parent) {
    if(!parent) parent = beamHolder;
    parent.add(obj.mesh);
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

function makeLoadPoint (i, dist, my, fy, fz, barID, obj) {
    /*
     -make and return the different types of load points
     -can be downward, or circular (both directions)
     */
    var loadPoint;
    var name = undefined;
    //mesh generation
    if(fz == undefined) fz = "-230";

    if(fy != 0) name = "FY" + fy;
    if(fz != 0) name = "FZ" + fz;

    if (name != undefined){
        loadPoint = makeGizmo("arrowDown", name, dist.x);
        loadPoint.gizmoType = "loadPoint";
    }

    if (my > 0){
        if(my == 1) my = 210;
        loadPoint = makeGizmo("circle", "MY" + my, dist.x);
        loadPoint.gizmoType = "bending";
    }
    else if(my < 0){
        if(my == -1) my = 210;
        loadPoint = makeGizmo("circle", "MY" + my, dist.x);
        loadPoint.geometry.applyMatrix(new THREE.Matrix4().makeRotationY(-Math.PI));
        loadPoint.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0,
            0, -(_this.beamDetails.width + _this.beamDetails.width / 2 + 0.5)));
        loadPoint.gizmoType = "bending";
    }

    if(fy > 0) _this.rotateGizmo(loadPoint, true, true);
    else if(fy < 0) _this.rotateGizmo(loadPoint, false, true);

    if(fz > 0) { _this.rotateGizmo(loadPoint, false, true);
        _this.rotateGizmo(loadPoint, false, true);}

    loadPoint.parentNode = (obj.point0.parentNode);
    loadPoint.parentNode.setAttribute("id", _this.validLoad_ID.toString());
    _this.validLoad_ID++;
    loadPoint.point0 = {
        dist: obj.point0.getAttribute("dist"),
        angX: obj.point0.getAttribute("angX"),
        angY: obj.point0.getAttribute("angY"),
        angZ: obj.point0.getAttribute("angZ"),

        fx: obj.point0.getAttribute("fx"),
        fy: obj.point0.getAttribute("fy"),
        fz: obj.point0.getAttribute("fz"),

        mx: obj.point0.getAttribute("mx"),
        my: obj.point0.getAttribute("my"),
        mz: obj.point0.getAttribute("mz"),

        barID: barID
    };

    loadPoint.points = 1;
    loadPoint.barID = barID;

    _this.loadMeshes.push(loadPoint);
    _this.beamHolder.add(loadPoint);
}

this.MakeGraph = function(points) {
    //extrudes a mesh, problems when self intersecting
    /*
     var graphShape = new THREE.Shape();
     graphShape.moveTo(points[0].x, points[0].y);
     for (var i = 0; i < points.length; i++) {
     graphShape.lineTo(points[i].x, points[i].y);
     };
     graphShape.lineTo(points[0].x, points[0].y);
     var graphMesh = extrudeShape(graphShape, beamDetails.width / 2);
     graphMesh.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, -beamDetails.height,
     -beamDetails.width / 4));
     graphMesh.material = new THREE.MeshLambertMaterial({transparent: true, opacity: 0.3});
     beamHolder.add(graphMesh);
     */

    //makes a line graph
    var material = new THREE.LineBasicMaterial({color: lineColor});
    var geometry = new THREE.Geometry();

    for (var i = 0; i < points.length; i++) {
        var vec3 = new THREE.Vector3(-points[i].x, points[i].y, 0);
        geometry.vertices.push(vec3);
    }

    var line = new THREE.Line( geometry, material );
    _this.beamHolder.add(line);
}
// </editor-fold>
function extrudeShape (shape, amount) {
    var extrusionSettings = {amount: amount, bevelEnabled: false,
        uvGenerator: THREE.ExtrudeGeometry.WorldUVGenerator};
    var geometry = new THREE.ExtrudeGeometry( shape, extrusionSettings );
    var material = new THREE.MeshLambertMaterial({color: 0xffffff});
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

this.radiansToDegrees = function (rads) { return rads * (180 / Math.PI); };
this.degreesToRadians = function (deg) { return deg * (Math.PI / 180); };
this.copyV3 = function(vec) { return new THREE.Vector3().copy(vec); };
this.copyEuler = function (euler) {return new THREE.Euler().copy(euler);};
this.twoDec = function (num) { return Number(num.toFixed(2)); };
this.twoDecVec3 = function (vec) { return new THREE.Vector3(
    _this.twoDec(vec.x), _this.twoDec(vec.y), _this.twoDec(vec.z))};
this.returnHolder = function(){return _this.beamHolder};
}