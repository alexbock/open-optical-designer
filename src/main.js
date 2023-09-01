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
            if (m.name == name || (m.alternate_name && m.alternate_name == name)) {
                return m;
            }
        }
        return null;
    }
}

let app = new App();

function saveJSONFile() {
    let json = JSON.stringify(app.design, function(k, v) {
        if (v instanceof Material) {
            return v.name;
        } else if (v == Infinity) {
            return "<INFINITY>";
        } else if (v instanceof Formula) {
            return v.source_text;
        } else if (this instanceof FormulaProperty && k == "host") {
            return undefined;
        } else {
            return v;
        }
    });
    let file = new Blob([json], {type: "text/json"});
    let a = document.createElement("a");
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = "lens-design.json";
    a.click();
    URL.revokeObjectURL(url);
}

function parseJSONFile(text) {
    let json = JSON.parse(text, function(k, v) {
        if (typeof k == 'string') {
            if (k == "material" || k.endsWith("_material")) {
                return app.findMaterial(v);
            } else if ((k == "radius_of_curvature" && v == null) || v == "<INFINITY>") {
                return Infinity;
            } else if (k == "surfaces" && Array.isArray(v)) {
                return v.map(x => {
                    let result = Object.assign(new Surface(), x);
                    for (let prop of result.formula_properties) {
                        prop.host = result;
                    }
                    return result;
                });
            } else if (k == "formula_properties" && Array.isArray(v)) {
                return v.map(x => {
                    return Object.assign(new FormulaProperty(), x);
                });
            } else if (k == "formula" && v) {
                return new Formula(v);
            }
        }
        return v;
    });
    return json;
}

async function loadJSONFile(e) {
    let file = e.target.files[0];
    if (!file) { return null; }
    let text = await file.text();
    return parseJSONFile(text);
}

function registerButtons() {
    document.getElementById("surface-table-add-after-button").onclick = () => { app.ui.surfaceTableAddRowAfter(); };
    document.getElementById("surface-table-add-before-button").onclick = () => { app.ui.surfaceTableAddRowBefore(); };
    document.getElementById("surface-table-delete-button").onclick = () => { app.ui.surfaceTableDeleteRow(); };

    document.getElementById("btn-import-len-file").onchange = async (e) => {
        let result = await Design.importLenFile(e);
        if (result) {
            app.design = result;
            app.ui.selected_surface_number = 1;
            app.ui.writeDOMSurfaceTable();
            app.ui.writeDOMEnvironmentControl();
            app.renderer.paint(app.design);
        } else {
            alert('import failed');
        }
    };
    document.getElementById("btn-save-json-file").onclick = () => {
        saveJSONFile();
    };
    document.getElementById("btn-load-json-file").onchange = async (e) => {
        let json = await loadJSONFile(e);
        app.design = new Design();
        Object.assign(app.design, json);
        app.ui.selected_surface_number = 1;
        app.ui.writeDOMSurfaceTable();
        app.ui.writeDOMEnvironmentControl();
        app.renderer.paint(app.design);
    };

    let select_center_view = document.getElementById("select-center-view");
    select_center_view.onchange = () => {
        app.ui.center_pane_view_mode = select_center_view.options[select_center_view.selectedIndex].value;
        app.renderer.paint(app.design);
    };

    document.getElementById("btn-new").onclick = () => {
        app.design = new Design();
        app.design.addExamplePCXLens(75, 40, app.findMaterial("N-BK7"), AIR_MATERIAL);
        app.design.env_last_surface_autofocus = "marginal_ray";
        app.design.env_beam_radius = 10;
        app.design.updateFormulaProperties();
        app.ui.selected_surface_number = 1;
        app.ui.writeDOMSurfaceTable();
        app.ui.writeDOMEnvironmentControl();
        app.renderer.paint(app.design);
    };
}

function main() {
    registerButtons();
    loadMaterialData();

    Object.assign(app.design, parseJSONFile(DEFAULT_SAMPLE_LENS_JSON));

    app.ui.writeDOMSurfaceTable();
    app.ui.writeDOMEnvironmentControl();
    recreateMainCanvas();
}

function loadMaterialData() {
    for (let material_datum of MATERIAL_DATA) {
        app.materials.push(Material.fromJSON(material_datum));
    }
}

function recreateMainCanvas() {
    let canvas = document.getElementById("main-canvas");
    app.renderer = new CenterCanvasRenderer(canvas);
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
