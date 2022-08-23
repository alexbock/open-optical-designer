"use strict";

class App {
    constructor() {
        this.design = new Design();
        this.renderer = null;
        this.materials = [];
    }

    findMaterial(name) {
        for (let m of this.materials) {
            if (m.name == name) {
                return m;
            }
        }
        return null;
    }
}

let app = new App();

function main() {
    loadMaterialData();
    app.design.addExamplePCXLens(200, 75, app.findMaterial("PMMA"), app.findMaterial("Air"));
    app.design.addExamplePCXLens(70, 55, app.findMaterial("PMMA"), app.findMaterial("Air"));
    //app.design.addExamplePCXLens(-100, 40, app.findMaterial("PMMA"), app.findMaterial("Air"));
    //app.design.addExamplePCXLens(80, 75, app.findMaterial("PMMA"), app.findMaterial("Air"));
    UI.writeDOMSurfaceTable();
    recreateMainCanvas();
}

function loadMaterialData() {
    app.materials.push(VACUUM_MATERIAL);
    app.materials.push(PERFECT_MIRROR_MATERIAL);
    for (let material_datum of MATERIAL_DATA) {
        app.materials.push(Material.fromJSON(material_datum));
    }
}

function recreateMainCanvas() {
    let canvas = document.getElementById("main-canvas");
    app.renderer = new TestRenderer(canvas);
    app.renderer.c.scale(6,6);
    app.renderer.paint(app.design);
}

onload = () => {
    main();
};
onresize = () => {
    recreateMainCanvas();
};
window.visualViewport.onresize = () => {
    recreateMainCanvas();
};
