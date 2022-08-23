"use strict";

class UI {
    static createDOMSurfaceTableTextInput(surface, field) {
        let td = document.createElement("td");
        let input = document.createElement("input");
        input.type = "text";
        input.value = surface[field];
        input.addEventListener('change', (event) => {
            surface[field] = Number.parseFloat(input.value);
            app.renderer.paint(app.design);
        });
        td.appendChild(input);
        return td;
    }

    static createDOMSurfaceTableMaterialSelect(surface) {
        let td = document.createElement("td");
        let select = document.createElement("select");
        //select.style = "appearance: none; border: none; margin: none; padding: none; font-size: inherit; cursor: pointer;";
        for (let mat of app.materials) {
            let option = document.createElement("option");
            option.value = mat.name;
            option.innerText = mat.name;
            if (mat.name == surface.material.name) {
                option.selected = "selected";
            }
            select.appendChild(option);
        }
        select.addEventListener('change', (event) => {
            surface.material = app.findMaterial(select.options[select.selectedIndex].value);
            app.renderer.paint(app.design);
        });
        td.appendChild(select);
        return td;
    }

    static writeDOMSurfaceTable() {
        let tbody = document.getElementById("surface-table-body");
        
        tbody.innerHTML = "";
        let n = 1;
        for (let surface of app.design.surfaces) {
            let row = document.createElement("tr");
            let num_col = document.createElement("td");
            let num_text = document.createTextNode(n);
            num_col.appendChild(num_text);
            row.appendChild(num_col);
            n += 1;

            let roc = UI.createDOMSurfaceTableTextInput(surface, 'radius_of_curvature');
            row.appendChild(roc);
            let apr = UI.createDOMSurfaceTableTextInput(surface, 'aperture_radius');
            row.appendChild(apr);
            let th = UI.createDOMSurfaceTableTextInput(surface, 'thickness');
            row.append(th);

            /*
            let mat = document.createElement("td");
            let mat_name = document.createTextNode(surface.material.name);
            mat.appendChild(mat_name);
            row.append(mat);
            */
           let mat = this.createDOMSurfaceTableMaterialSelect(surface);
           row.append(mat);

            tbody.appendChild(row);
        }

        return;
    }
}
