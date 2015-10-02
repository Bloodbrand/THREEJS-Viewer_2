function XmlGenerator(){
    var _this = this;
    this.loaderComponent = undefined;

    this.GenerateXML = function(name) {
        _this.loaderComponent.validLoad_ID = 0;
        var s = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n"+
            "<beamRequest>\r\n"+
            "\t<model>\r\n"+
            "\t\t<calculationParameters>\r\n"+
            "\t\t\t<limitDisplacement id=\"\" dispLimit1=\"\" dispLimit2=\"\" relative=\"\"/>\r\n"+
            "\t\t\t<resultsDivision>14</resultsDivision>\r\n"+
            "\t\t</calculationParameters>\r\n"+
            "\t\t<nodes>\r\n"+
            returnNodesString()+
            "\t\t</nodes>\r\n"+
            "\t\t<bars>\r\n"+
            returnBarsString()+
            "\t\t</bars>\r\n"+
            "\t\t<materials>\r\n"+
            returnMaterialsString()+
            "\t\t</materials>\r\n"+
            "\t\t<sections>\r\n"+
            returnSectionsString()+
            "\t\t</sections>\r\n"+
            "\t\t<supports>\r\n"+
            returnSupportsString()+
            "\t\t</supports>\r\n"+
            "\t\t<loads>\r\n"+
            returnLoadsString()+
            "\t\t</loads>\r\n"+
            "\t</model>\r\n"+
            "</beamRequest>";

        saveXML(s,name);
    };

    function saveXML (s,name) {
        if(name == undefined) name = "XML_file";
        _this.loaderComponent.validLoad_ID = 0;
        var blob = new Blob([s], {type: "XML;charset=utf-8"});
        saveAs(blob, name + ".xml");
    }

    function returnNodesString () {
        var nodes_s = "";

        for (var i = 0; i < _this.loaderComponent.viewerNodes.length; i++) {
            var curNode = _this.loaderComponent.viewerNodes[i],
                id = curNode.getAttribute("id"),
                x = curNode.getAttribute("x"),
                y = curNode.getAttribute("y"),
                z = curNode.getAttribute("z");
            var supportName = curNode.getAttribute("supportName");

            nodes_s += "\t\t\t<node id=\""+id+"\" x=\""+x+"\" y=\""+y+"\" z=\""+z+"\" supportName=\""+
                supportName+"\"/>\r\n";
        }

        return nodes_s;
    }

    function returnBarsString () {
        var bars_s = "";

        for (var i = 0; i < _this.loaderComponent.viewerBars.length; i++) {
            var curBar = _this.loaderComponent.viewerBars[i],
                id = curBar.getAttribute("id"),
                startNodeId = curBar.getAttribute("startNodeId"),
                endNodeId = curBar.getAttribute("endNodeId"),
                materialName = curBar.getAttribute("materialName"),
                sectionName = curBar.getAttribute("sectionName"),
                gamma = curBar.getAttribute("gamma");

            bars_s += "\t\t\t<bar id=\""+id+"\" startNodeId=\""+startNodeId+"\" endNodeId=\""+endNodeId+
                "\" materialName=\""+materialName+"\" sectionName=\""+sectionName+"\" gamma=\""+gamma+"\"";

            var limitDisplacementId = curBar.getAttribute("limitDisplacementId");
            if(limitDisplacementId != null) bars_s += " limitDisplacementId=\""+limitDisplacementId+"\"";

            bars_s += "/>\r\n";
        }
        return bars_s;
    }

    function returnMaterialsString () {
        var mats_s = "";

        for (var i = 0; i < _this.loaderComponent.viewerMaterials.length; i++) {
            var curMat = _this.loaderComponent.viewerMaterials[i],
                name = curMat.getAttribute("name"),
                young = curMat.getAttribute("young"),
                poisson = curMat.getAttribute("poisson"),
                density = curMat.getAttribute("density"),
                allowableStress = curMat.getAttribute("allowableStress");

            mats_s += "\t\t\t<material name=\""+name+"\" young=\""+young+"\" poisson=\""+poisson+
                "\" density=\""+density+"\" allowableStress=\""+allowableStress+"\"/>\r\n";
        };

        return mats_s;
    }

    function returnSectionsString () {
        var secs_s = "";

        for (var i = 0; i < _this.loaderComponent.viewerSections.length; i++) {
            var curSec = _this.loaderComponent.viewerSections[i],
                name = curSec.getAttribute("name"),
                area = curSec.getAttribute("area"),
                lx = curSec.getAttribute("lx"),
                ly = curSec.getAttribute("ly"),
                lz = curSec.getAttribute("lz"),
                gamma = curSec.getAttribute("gamma"),
                wy = curSec.getAttribute("wy"),
                wz = curSec.getAttribute("wz");

            secs_s += "\t\t\t<section name=\""+name+"\" area=\""+area+"\" lx=\""+lx+"\" ly=\""+ly+
                "\" lz=\""+lz+"\" gamma=\""+gamma+"\" wy=\""+wy+"\" wz=\""+wz+"\"/>\r\n";
        };

        return secs_s;
    }

    function returnSupportsString () {
        var sups_s = "";

        for (var i = 0; i < _this.loaderComponent.viewerSupports.length; i++) {
            var curSup = _this.loaderComponent.viewerSupports[i];
            var name = curSup.getAttribute("name");

            var angX = curSup.getAttribute("angX"),
                angY = curSup.getAttribute("angY"),
                angZ = curSup.getAttribute("angZ"),
                ux = curSup.getAttribute("ux"),
                uy = curSup.getAttribute("uy"),
                uz = curSup.getAttribute("uz"),
                rx = curSup.getAttribute("rx"),
                ry = curSup.getAttribute("ry"),
                rz = curSup.getAttribute("rz"),
                sux = curSup.getAttribute("sux"),
                suy = curSup.getAttribute("suy"),
                suz = curSup.getAttribute("suz"),
                srx = curSup.getAttribute("srx"),
                sry = curSup.getAttribute("sry"),
                srz = curSup.getAttribute("srz");

            sups_s += "\t\t\t<support name=\""+name+
                "\" angX=\""+angX+"\" angY=\""+angY+"\" angZ=\""+angZ+
                "\" ux=\""+ux+"\" uy=\""+uy+"\" uz=\""+uz+
                "\" rx=\""+rx+"\" ry=\""+ry+"\" rz=\""+rz+
                "\" sux=\""+sux+"\" suy=\""+suy+"\" suz=\""+suz+
                "\" srx=\""+srx+"\" sry=\""+sry+"\" srz=\""+srz+
                "\"/>\r\n";
        };

        return sups_s;
    }

    function returnLoadsString () {
        var loads_s = "";

        loads_s += "\t\t\t<loadCases>\r\n";

        for (var i = 0; i < _this.loaderComponent.viewerLoadCases.childNodes.length; i++) {
            var child = _this.loaderComponent.viewerLoadCases.childNodes[i];
            if(_this.loaderComponent.CheckValidNode(child)){
                var id = child.getAttribute("id");
                var type = child.getAttribute("type");
                var factor = child.getAttribute("factor");
                loads_s += "\t\t\t\t<loadCase id=\""+id+"\" type=\""+type+"\" factor=\""+factor+"\"/>\r\n"
            }
        };

        loads_s += "\t\t\t</loadCases>\r\n";

        loads_s += "\t\t\t<loadPoints>\r\n";

        for (var i = 0; i < _this.loaderComponent.loadMeshes.length; i++){
            var curLoad = _this.loaderComponent.loadMeshes[i];
            var multiBar = checkMultiBarForce(curLoad);

            if(multiBar){loads_s += multiBar; continue;}
            loads_s += returnIndividualPointString(curLoad, true);
        }

        loads_s += "\t\t\t</loadPoints>\r\n";
        return loads_s;
    }

    function returnIndividualPointString (curLoad, nonMultiBar) {
        var id = curLoad.parentNode.getAttribute("id");

        if(nonMultiBar == true) id = _this.loaderComponent.validLoad_ID++;

        var	barId = curLoad.parentNode.getAttribute("barId"),
            caseId = curLoad.parentNode.getAttribute("caseId");
        var loads_s = "\t\t\t\t<loadPoint id=\""+id+"\" barId=\""+barId+"\" caseId=\""+caseId+"\">\r\n";

        for (var j = 0; j < curLoad.points; j++) {
            var pointNum = "point"+j.toString(),
                dist = Number(curLoad[pointNum].dist).toFixed(3),

                angX = curLoad[pointNum].angX,
                angY = curLoad[pointNum].angY,
                angZ = curLoad[pointNum].angZ,

                fx = curLoad[pointNum].fx,
                fy = curLoad[pointNum].fy,
                fz = curLoad[pointNum].fz,

                mx = curLoad[pointNum].mx,
                my = curLoad[pointNum].my,
                mz = curLoad[pointNum].mz;

            loads_s += "\t\t\t\t\t<point"+j.toString()+" dist=\""+dist+"\""+
                " angX=\""+angX+"\" angY=\""+angY+"\""+
                " angZ=\""+angZ+"\" fx=\""+fx+"\""+
                " fy=\""+fy+"\" fz=\""+fz+"\""+
                " mx=\""+mx+"\" my=\""+my+"\""+
                " mz=\""+mz+"\"/>\r\n";
        };

        loads_s += "\t\t\t\t</loadPoint>\r\n";

        return loads_s;
    }

    function checkMultiBarForce (curLoad) {
        if(!curLoad.point1) return false;
        if(curLoad.point0.barID == curLoad.point1.barID) return false;

        var ret_s = "", fx = curLoad.point0.fx, fy = curLoad.point0.fy, fz = curLoad.point0.fz;

        var pointData = {
            barID0: curLoad.point0.barID,
            dist0: curLoad.point0.dist,

            barID1: curLoad.point1.barID,
            dist1: curLoad.point1.dist
        }

        for (var i = 0; i < 2; i++) {
            var parentNode = _this.loaderComponent.CreateXML_Element({
                name: "linear",
                id: _this.loaderComponent.validLoad_ID++,//pointData["nodeID" + i.toString()],
                barId: pointData["barID" + i.toString()],
                caseId: 1
            });

            var childNode = {
                point0: {
                    name: "point0",
                    dist: 0,
                    barId: pointData["barID" + i.toString()],
                    angX: 0,
                    angY: 0,
                    angZ: 0,
                    fx: fx,
                    fy: fy,
                    fz: fz,
                    mx: 0,
                    my: 0,
                    mz: 0,
                    points: 2
                },
                point1: {
                    name: "point1",
                    dist: 0,
                    barId: pointData["barID" + i.toString()],
                    angX: 0,
                    angY: 0,
                    angZ: 0,
                    fx: 0,
                    fy: 0,
                    fz: 0,
                    mx: 0,
                    my: 0,
                    mz: 0,
                    points: 2
                },
                points: 2,
                barId: pointData["barID" + i.toString()]
            };

            if(i == 0){
                childNode.point0.dist = pointData.dist0;
                childNode.point1.dist = 1;
            }
            else if(i == 1){
                childNode.point0.dist = 0;
                childNode.point1.dist = pointData.dist1;
            }

            childNode.parentNode = parentNode;
            ret_s += returnIndividualPointString(childNode, false);
        }

        return ret_s;
    }
}