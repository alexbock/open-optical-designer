"use strict";

class App {
    constructor() {
        this.design = new Design();
        this.renderer = null;
        this.materials = [];
        this.ui = new UI();
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

function registerButtons() {
    document.getElementById("surface-table-add-after-button").onclick = () => { app.ui.surfaceTableAddRowAfter(); };
    document.getElementById("surface-table-add-before-button").onclick = () => { app.ui.surfaceTableAddRowBefore(); };
    document.getElementById("surface-table-delete-button").onclick = () => { app.ui.surfaceTableDeleteRow(); };
}

function main() {
    registerButtons();
    loadMaterialData();
    app.design.addExamplePCXLens(200, 75, app.findMaterial("PMMA"), app.findMaterial("Air"));
    app.design.addExamplePCXLens(70, 55, app.findMaterial("PMMA"), app.findMaterial("Air"));
    app.design.addExamplePCXLens(-100, 40, app.findMaterial("PMMA"), app.findMaterial("Air"));
    //app.design.addExamplePCXLens(100, 75, app.findMaterial("PMMA"), app.findMaterial("Air"));
    //app.design.surfaces[0].conic_constant = -1;
    app.ui.writeDOMSurfaceTable();
    recreateMainCanvas();
}

function loadMaterialData() {
    for (let material_datum of MATERIAL_DATA) {
        app.materials.push(Material.fromJSON(material_datum));
    }
}

function recreateMainCanvas() {
    let canvas = document.getElementById("main-canvas");
    app.renderer = new TestRenderer(canvas);
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
