"use strict";

class UI {
    constructor() {
        this.selectedSurfaceNumber = 1;
    }

    createDOMSurfaceTableTextInput(surface, field, no_select_row) {
        let td = document.createElement("td");
        let input = document.createElement("input");
        input.type = "text";
        input.value = surface[field];
        input.addEventListener('change', (event) => {
            surface[field] = Number.parseFloat(input.value);
            this.updateDOMSurfaceNonInputLabels();
            app.renderer.paint(app.design);
        });
        if (!no_select_row) {
            input.addEventListener('focus', (event) => {
                this.selectedSurfaceNumber = app.design.indexForSurface(surface) + 1;
                this.writeDOMSurfaceDetails();
            });
        }
        td.appendChild(input);
        return td;
    }

    createDOMSurfaceTableMaterialSelect(surface) {
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
        select.addEventListener('focus', (event) => {
            this.selectedSurfaceNumber = app.design.indexForSurface(surface) + 1;
            this.writeDOMSurfaceDetails();
        });
        td.appendChild(select);
        return td;
    }

    writeDOMSurfaceTable() {
        let tbody = document.getElementById("surface-table-body");
        
        tbody.innerHTML = "";
        let n = 1;
        for (let surface of app.design.surfaces) {
            let row = document.createElement("tr");
            let num_col = document.createElement("td");
            num_col.id = 'surface-table-row-' + n;
            num_col.className = 'surface-table-row-number';
            let num_text = document.createTextNode(n);
            num_col.appendChild(num_text);
            if (n == this.selectedSurfaceNumber) {
                // TODO
            } else {
                const sn = n;
                num_col.addEventListener('click', (event) => {
                    this.selectedSurfaceNumber = sn;
                    this.writeDOMSurfaceTable();
                });
            }
            row.appendChild(num_col);
            n += 1;

            let roc = this.createDOMSurfaceTableTextInput(surface, 'radius_of_curvature');
            row.appendChild(roc);
            let apr = this.createDOMSurfaceTableTextInput(surface, 'aperture_radius');
            row.appendChild(apr);
            let th = this.createDOMSurfaceTableTextInput(surface, 'thickness');
            row.append(th);

           let mat = this.createDOMSurfaceTableMaterialSelect(surface);
           row.append(mat);

            tbody.appendChild(row);
        }

        this.writeDOMSurfaceDetails();
    }

    writeDOMSurfaceDetails() {
        let tbody = document.getElementById("surface-detail-table-body");
        tbody.innerHTML = "";
        let selected_surface = app.design.surfaces[this.selectedSurfaceNumber - 1];
        let cc = this.createDOMSurfaceTableTextInput(selected_surface, 'conic_constant', true);
        let row = document.createElement("tr");
        let cc_label = document.createElement("td");
        let cc_label_text = document.createTextNode("Conic Constant");
        cc_label.appendChild(cc_label_text);
        row.appendChild(cc_label);
        row.appendChild(cc);
        let cc_kind_label = document.createElement("td");
        cc_kind_label.id = "surface-detail-cc-shape-name";
        row.append(cc_kind_label);
        tbody.appendChild(row);
        let surf_num_label = document.getElementById("surface-detail-selected-number");
        surf_num_label.innerText = this.selectedSurfaceNumber;
        this.updateDOMSurfaceNonInputLabels();
    }

    updateDOMSurfaceNonInputLabels() {
        let selected_surface = app.design.surfaces[this.selectedSurfaceNumber - 1];
        let cc_kind = "(" + Surface.descriptionForConicConstant(selected_surface.conic_constant) + ")";
        let shape_label = document.getElementById("surface-detail-cc-shape-name");
        shape_label.innerText = cc_kind;

        let num_cols = document.getElementsByClassName("surface-table-row-number");
        for (let num_col of num_cols) {
            num_col.style = "";
        }
        let num_col = document.getElementById("surface-table-row-" + this.selectedSurfaceNumber);
        num_col.style = "background-color: var(--window-bg-color);";
    }

    createDOMEnvironmentControlTextInput(field) {
        let td = document.createElement("td");
        let input = document.createElement("input");
        input.type = "text";
        input.value = app.design[field];
        input.addEventListener('change', (event) => {
            app.design[field] = Number.parseFloat(input.value);
            app.renderer.paint(app.design);
        });
        td.appendChild(input);
        return td;
    }

    writeDOMEnvironmentControl() {
        let tbody = document.getElementById("env-control-table-body");
        tbody.innerHTML = "";

        let beam_radius_row = document.createElement("tr");
        let beam_radius_label = document.createElement("td");
        let beam_radius_label_text = document.createTextNode("Input Beam Radius");
        beam_radius_label.appendChild(beam_radius_label_text);
        beam_radius_row.appendChild(beam_radius_label);
        let beam_radius_input = this.createDOMEnvironmentControlTextInput('env_beam_radius');
        beam_radius_row.appendChild(beam_radius_input);
        tbody.appendChild(beam_radius_row);

        let beam_fov_row = document.createElement("tr");
        let beam_fov_label = document.createElement("td");
        let beam_fov_label_text = document.createTextNode("Input FOV Angle");
        beam_fov_label.appendChild(beam_fov_label_text);
        beam_fov_row.appendChild(beam_fov_label);
        let beam_fov_input = this.createDOMEnvironmentControlTextInput('env_fov_angle');
        beam_fov_row.appendChild(beam_fov_input);
        tbody.appendChild(beam_fov_row);

        let beam_cross_dist_row = document.createElement("tr");
        let beam_cross_dist_label = document.createElement("td");
        let beam_cross_dist_label_text = document.createTextNode("Aperture Distance");
        beam_cross_dist_label.appendChild(beam_cross_dist_label_text);
        beam_cross_dist_row.appendChild(beam_cross_dist_label);
        let beam_cross_dist_input = this.createDOMEnvironmentControlTextInput('env_beam_cross_distance');
        beam_cross_dist_row.appendChild(beam_cross_dist_input);
        tbody.appendChild(beam_cross_dist_row);

        let cwl_row = document.createElement("tr");
        let cwl_label = document.createElement("td");
        let cwl_label_text = document.createTextNode("Center Wavelength");
        cwl_label.appendChild(cwl_label_text);
        cwl_row.appendChild(cwl_label);
        let cwl_input = this.createDOMEnvironmentControlTextInput('center_wavelength');
        cwl_row.appendChild(cwl_input);
        // TODO label micrometers
        tbody.appendChild(cwl_row);

        let img_radius_row = document.createElement("tr");
        let img_radius_label = document.createElement("td");
        let img_radius_label_text = document.createTextNode("Image Plane Radius");
        img_radius_label.appendChild(img_radius_label_text);
        img_radius_row.appendChild(img_radius_label);
        let img_radius_input = this.createDOMEnvironmentControlTextInput('env_image_radius');
        img_radius_row.appendChild(img_radius_input);
        tbody.appendChild(img_radius_row);
    }

    surfaceTableAddRowAfter() {
        app.design.surfaces.splice(this.selectedSurfaceNumber, 0, new Surface());
        this.selectedSurfaceNumber += 1;
        this.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }

    surfaceTableAddRowBefore() {
        app.design.surfaces.splice(this.selectedSurfaceNumber-1, 0, new Surface());
        this.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }

    surfaceTableDeleteRow() {
        if (app.design.surfaces.length > 1) {
            app.design.surfaces.splice(this.selectedSurfaceNumber-1, 1);
            this.selectedSurfaceNumber = Math.min(this.selectedSurfaceNumber, app.design.surfaces.length);
        } else {
            app.design.surfaces[0] = new Surface();
        }
        this.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }
}
