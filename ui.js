"use strict";

class UI {
    constructor() {
        this.selected_surface_number = 1;
        this.center_pane_view_mode = 'design2d';
    }

    createDOMSurfaceTableTextInput(surface, field, no_select_row, input_id) {
        let td = document.createElement("td");
        let input = document.createElement("input");
        input.type = "text";
        input.value = surface[field];
        if (input_id) {
            input.id = input_id;
        }
        input.addEventListener('change', (event) => {
            surface[field] = Number.parseFloat(input.value);
            this.updateDOMSurfaceNonInputLabels();
            app.renderer.paint(app.design);
        });
        if (!no_select_row) {
            input.addEventListener('focus', (event) => {
                this.selected_surface_number = app.design.indexForSurface(surface) + 1;
                this.writeDOMSurfaceDetails();
                app.renderer.paint(app.design);
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
            this.selected_surface_number = app.design.indexForSurface(surface) + 1;
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
            if (n == this.selected_surface_number) {
                // pass
            } else {
                const sn = n;
                num_col.addEventListener('click', (event) => {
                    this.selected_surface_number = sn;
                    this.writeDOMSurfaceTable();
                    app.renderer.paint(app.design);
                });
            }
            row.appendChild(num_col);
            n += 1;

            let last_thickness_id = null;
            if (surface === app.design.surfaces[app.design.surfaces.length-1]) {
                last_thickness_id = "last-thickness";
            }
            let roc = this.createDOMSurfaceTableTextInput(surface, 'radius_of_curvature');
            row.appendChild(roc);
            let apr = this.createDOMSurfaceTableTextInput(surface, 'aperture_radius');
            row.appendChild(apr);
            let th = this.createDOMSurfaceTableTextInput(surface, 'thickness', false, last_thickness_id);
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
        let selected_surface = app.design.surfaces[this.selected_surface_number - 1];
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
        surf_num_label.innerText = this.selected_surface_number;
        this.updateDOMSurfaceNonInputLabels();
    }

    updateDOMSurfaceNonInputLabels() {
        let selected_surface = app.design.surfaces[this.selected_surface_number - 1];
        let cc_kind = "(" + Surface.descriptionForConicConstant(selected_surface.conic_constant) + ")";
        let shape_label = document.getElementById("surface-detail-cc-shape-name");
        shape_label.innerText = cc_kind;

        let num_cols = document.getElementsByClassName("surface-table-row-number");
        for (let num_col of num_cols) {
            num_col.style = "";
        }
        let num_col = document.getElementById("surface-table-row-" + this.selected_surface_number);
        num_col.style = "background-color: var(--window-bg-color);";

        app.design.autofocus();
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

        let beam_rays_row = document.createElement("tr");
        let beam_rays_label = document.createElement("td");
        let beam_rays_label_text = document.createTextNode("Rays per Beam");
        beam_rays_label.appendChild(beam_rays_label_text);
        beam_rays_row.appendChild(beam_rays_label);
        let beam_rays_input = this.createDOMEnvironmentControlTextInput('env_rays_per_beam');
        beam_rays_row.appendChild(beam_rays_input);
        tbody.appendChild(beam_rays_row);

        let sym_beams_row = document.createElement("tr");
        let sym_beams_label = document.createElement("td");
        let sym_beams_label_text = document.createTextNode("Mirror Angled Beams");
        sym_beams_label.appendChild(sym_beams_label_text);
        sym_beams_row.appendChild(sym_beams_label);
        let sym_beams_input_td = document.createElement("td");
        let sym_beams_input_check = document.createElement("input");
        sym_beams_input_check.type = "checkbox";
        sym_beams_input_check.style = "margin-left: 2.5em;";
        sym_beams_input_check.checked = app.design.env_sym_beams;
        sym_beams_input_check.addEventListener('change', (event) => {
            app.design.env_sym_beams = sym_beams_input_check.checked;
            app.renderer.paint(app.design);
        });
        sym_beams_input_td.appendChild(sym_beams_input_check);
        sym_beams_row.appendChild(sym_beams_input_td);
        tbody.appendChild(sym_beams_row);

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
        let cwl_units_label_text = document.createTextNode("\u00A0\u03BCm");
        cwl_input.appendChild(cwl_units_label_text);
        tbody.appendChild(cwl_row);

        let img_radius_row = document.createElement("tr");
        let img_radius_label = document.createElement("td");
        let img_radius_label_text = document.createTextNode("Image Plane Radius");
        img_radius_label.appendChild(img_radius_label_text);
        img_radius_row.appendChild(img_radius_label);
        let img_radius_input = this.createDOMEnvironmentControlTextInput('env_image_radius');
        img_radius_row.appendChild(img_radius_input);
        tbody.appendChild(img_radius_row);

        let last_surface_autofocus_choices = [
            ["off", "Off"],
            //["paraxial_matrix", "Paraxial Matrix"],
            ["paraxial_ray", "Paraxial Ray"],
            ["marginal_ray", "Marginal Ray"],
        ];
        let last_surface_autofocus_row = document.createElement("tr");
        let last_surface_autofocus_label = document.createElement("td");
        let last_surface_autofocus_label_text = document.createTextNode("Last Surface Autofocus");
        last_surface_autofocus_label.appendChild(last_surface_autofocus_label_text);
        last_surface_autofocus_row.appendChild(last_surface_autofocus_label);
        let last_surface_autofocus_select_td = document.createElement("td");
        let last_surface_autofocus_select = document.createElement("select");
        for (let choice of last_surface_autofocus_choices) {
            let opt = document.createElement("option");
            opt.value = choice[0];
            let opt_text = document.createTextNode(choice[1]);
            opt.appendChild(opt_text);
            last_surface_autofocus_select.appendChild(opt);
        }
        last_surface_autofocus_select.addEventListener('change', (event) => {
            app.design.env_last_surface_autofocus = last_surface_autofocus_select.options[last_surface_autofocus_select.selectedIndex].value;
            app.design.autofocus();
            app.renderer.paint(app.design);
        });
        last_surface_autofocus_select_td.appendChild(last_surface_autofocus_select);
        last_surface_autofocus_row.appendChild(last_surface_autofocus_select_td);
        tbody.appendChild(last_surface_autofocus_row);
    }

    surfaceTableAddRowAfter() {
        app.design.surfaces.splice(this.selected_surface_number, 0, new Surface());
        this.selected_surface_number += 1;
        this.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }

    surfaceTableAddRowBefore() {
        app.design.surfaces.splice(this.selected_surface_number-1, 0, new Surface());
        this.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }

    surfaceTableDeleteRow() {
        if (app.design.surfaces.length > 1) {
            app.design.surfaces.splice(this.selected_surface_number-1, 1);
            this.selected_surface_number = Math.min(this.selected_surface_number, app.design.surfaces.length);
        } else {
            app.design.surfaces[0] = new Surface();
        }
        this.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }
}
