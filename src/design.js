"use strict";

class Design {
    constructor() {
        this.surfaces = []
        this.center_wavelength = 0.550;
        this.short_wavelength = 0.440;
        this.long_wavelength = 0.620;
        this.env_beam_radius = 5;
        this.env_rays_per_beam = 5;
        this.env_fov_angle = 0;
        this.env_sym_beams = false;
        this.env_beam_cross_distance = 65;
        this.env_image_radius = 21.6
        this.env_initial_material = AIR_MATERIAL;
        this.env_last_surface_autofocus = "off";
    }

    static async importLenFile(e) {
        let file = e.target.files[0];
        if (!file) { return null; }
        let text = await file.text();
        let lines = text.split('\n');
        let i = lines.findIndex((x) => {
            return x.startsWith("NXT ");
        });
        if (i == -1) { throw "missing initial NXT"; }
        i += 1;
        let surfaces = [];
        let surf = new Surface();
        while (i < lines.length) {
            let arg = lines[i].trim().split(' ');
            arg = arg[arg.length - 1];
            if (lines[i].startsWith("GLA ")) {
                surf.material = app.findMaterial(arg);
            } else if (lines[i].startsWith("AIR ")) {
                surf.material = AIR_MATERIAL;
            } else if (lines[i].startsWith("RD ")) {
                surf.radius_of_curvature = Number.parseFloat(arg);
            } else if (lines[i].startsWith("TH ")) {
                surf.thickness = Number.parseFloat(arg);
            } else if (lines[i].startsWith("AP ")) {
                surf.aperture_radius = Number.parseFloat(arg);
            } else if (lines[i].startsWith("CC ")) {
                surf.conic_constant = Number.parseFloat(arg);
            } else if (lines[i].startsWith("NXT ")) {
                surfaces.push(surf);
                surf = new Surface();
                surf.aperture_radius = 25; // TODO
            } else if (lines[i].startsWith("END ")) {
                break;
            } else {
                //console.log('File import: Ignoring ' + lines[i]);
            }
            i += 1;
        }
        let result = new Design();
        result.surfaces = surfaces;
        return result;
    }

    addExamplePCXLens(focal_length, diameter, lens_material, air_material) {
        let front = new Surface();
        front.radius_of_curvature = (lens_material.refractiveIndex(this.center_wavelength) - air_material.refractiveIndex(this.center_wavelength)) * focal_length;
        front.radius_of_curvature = Math.round(front.radius_of_curvature * 100) / 100;
        front.aperture_radius = diameter / 2;
        front.material = lens_material;
        front.thickness = focal_length > 0 ? front.sag(diameter / 2) - front.sag(0) : 2;
        front.thickness = Math.round(front.thickness * 100) / 100;
        this.surfaces.push(front);
        let back = new Surface();
        back.radius_of_curvature = Infinity;
        back.aperture_radius = front.aperture_radius;
        back.material = air_material;
        back.thickness = 10; // TODO
        this.surfaces.push(back);
    }

    // result[1] is system equivalent power
    calculateMeyerArendtSystemMatrix() {
        let matrices = [];
        let last_medium = AIR_MATERIAL;
        for (let i = 0; i < this.surfaces.length; i += 1) {
            let surface = this.surfaces[i];
            const n1 = last_medium.refractiveIndex(this.center_wavelength);
            const n2 = surface.material.refractiveIndex(this.center_wavelength);
            const power = (n2 - n1) / surface.radius_of_curvature;
            const rm = [ 1, power,
                        0, 1 ];
            matrices.push(rm);
            if (i == this.surfaces.length - 1) { break; }
            const tm = [ 1, 0,
                       -surface.thickness/n2, 1 ];
            matrices.push(tm);
            last_medium = surface.material;
        }
        let result = [ 1, 0,
                       0, 1 ];
        for (let matrix of matrices) {
            result = matrix_2x2_multiply(result, matrix);
        }
        return result;
    }

    indexForSurface(s) {
        for (let i = 0; i < this.surfaces.length; i += 1) {
            if (s === this.surfaces[i]) {
                return i;
            }
        }
        throw "requested index of surface not present in design";
    }

    // TODO refactor to use system trace
    traceMarginalRayToImageDistance(limit, wavelength) {
        if (!limit) { limit = 1; }
        const initial_radius = this.surfaces[0].aperture_radius / limit;
        let image_distance = 0;
        for (let w = 0; w < 1001; ++w) {
            let ray_o = [-50, w*(initial_radius/1000)];
            let ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], 0, AIR_MATERIAL, this.surfaces[0]);

            let t_off = 0;
            for (var s = 1; s < this.surfaces.length; s += 1) {
                t_off += this.surfaces[s-1].thickness;
                let new_angle = ray_i[2];
                ray_o = [ray_i[0] - t_off, ray_i[1]];
                if (Math.abs(ray_o[1]) > this.surfaces[s-1].aperture_radius) {
                    break;
                }
                ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], new_angle, this.surfaces[s-1].material, this.surfaces[s], wavelength);
                ray_i[0] += t_off;

                if (s == this.surfaces.length - 1) {
                    const x = ray_i[0];
                    const y = ray_i[1];
                    const m = ray_i[2];
                    const b = y - m*x;
                    // 0 = mx + b, x = -b/m
                    image_distance = -b/m;
                }
            }
        }
        return image_distance;
    }

    // TODO refactor to use system trace
    plotOpticalPathLengthBeforeImagePlane(limit, draw_as_phase) {
        if (!limit) { limit = this.surfaces[0].aperture_radius / this.env_beam_radius; }
        const initial_radius = this.surfaces[0].aperture_radius / limit;
        let opls = [];
        let samples = 400;
        let img_dist = this.distanceToVertexForSurface(this.surfaces.length - 1) + this.surfaces[this.surfaces.length - 1].thickness;
        for (let w = 0; w < samples + 1; ++w) {
            let opl = 0;
            //let ray_o = [-50, w*(initial_radius/100)];
            //let ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], 0, AIR_MATERIAL, this.surfaces[0]);

            let ray_o = [-1000, 0];
            let slope = Math.atan(((w / samples) * initial_radius) / 1000);
            let ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], slope, AIR_MATERIAL, this.surfaces[0]);

            opl += Vector.magnitude(Vector.sum(Vector.product(-1, ray_o), ray_i.slice(0,2))) * AIR_MATERIAL.refractiveIndex(this.center_wavelength);

            let t_off = 0;
            for (var s = 1; s < this.surfaces.length; s += 1) {
                t_off += this.surfaces[s-1].thickness;
                let new_angle = ray_i[2];
                ray_o = [ray_i[0] - t_off, ray_i[1]];
                if (Math.abs(ray_o[1]) > this.surfaces[s-1].aperture_radius) {
                    break;
                }
                ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], new_angle, this.surfaces[s-1].material, this.surfaces[s]);
                opl += Vector.magnitude(Vector.sum(Vector.product(-1, ray_o), ray_i.slice(0,2))) * this.surfaces[s-1].material.refractiveIndex(this.center_wavelength);
                ray_i[0] += t_off;

                // TODO handle misses/TIR

                if (s == this.surfaces.length - 1) {
                    const x = ray_i[0];
                    const y = ray_i[1];

                    opl += Math.sqrt(y**2 + (img_dist - x)**2);

                    opls.push(opl);
                }
            }
        }
        // TODO dbg plot
        let i = 0;
        let opls_r = opls.slice();
        opls.reverse();
        opls = opls.concat(opls_r);
        let zero = opls[opls.length / 2];
        for (let opl of opls) {
            app.renderer.c.fillStyle = "black";
            if (draw_as_phase) {
                app.renderer.c.fillRect(10 + i, 100, 1, 150);
                let phase_scale = opl % (this.center_wavelength/1000) / (this.center_wavelength/1000);
                let phase_color = "hsl(" + phase_scale*360 + "deg,50%,50%)";
                app.renderer.c.fillStyle = phase_color;
                app.renderer.c.fillRect(10 + i, 100, 1, phase_scale * 150);
            } else {
                opl -= zero;
                app.renderer.c.fillRect(10 + i, 100, 1, opl*200);
            }
            i += 1;
        }
    }

    distanceToVertexForSurface(n) {
        let d = 0;
        for (let i = 0; i < n; i += 1) {
            d += this.surfaces[i].thickness;
        }
        return d;
    }

    autofocus() {
        const af = this.env_last_surface_autofocus;
        if (af == "off") { return; }
        let img_dist = undefined;
        if (af == "paraxial_matrix") {
            img_dist = 1/this.calculateMeyerArendtSystemMatrix()[1];
        } else if (af == "marginal_ray" || af == "paraxial_ray") {
            let limit = this.surfaces[0].aperture_radius / this.env_beam_radius;
            if (af == "paraxial_ray") { limit *= 10; }
            img_dist = this.traceMarginalRayToImageDistance(limit);
        }
        const si = this.surfaces.length - 1;
        const offset = this.distanceToVertexForSurface(si);
        this.surfaces[si].thickness = img_dist - offset;
        document.getElementById("last-thickness").value = this.surfaces[this.surfaces.length-1].thickness;
    }

    // traces rays from an object point through all surfaces
    // in the design sequentially
    // options:
    // * call_after_each_trace: a callback function invoked
    //   with a context object containing:
    //   * src_pt and dest_pt: the positions of the ray
    //     before and after the previous trace relative
    //     to the design origin
    //   * refract_dir: the direction vector that the
    //     refracted ray will follow next
    //   * medium: the medium across the previous trace
    // * append_surface: an additional surface to
    //   include after the design surfaces; if the
    //   thickness of the appended surface is non-zero,
    //   then the thickness of the final design surface
    //   before the appended surface will be overriden
    //   by the thickness of the appended surface
    // * continue_after_ray_miss: if true, the trace will
    //   proceed even after a ray misses a surface
    // * wavelength: use the specified wavelength
    //   instead of the center wavelength
    traceRayThroughSystem(obj_pt, ray_dir, options) {
        obj_pt = obj_pt.slice();
        ray_dir = ray_dir.slice();
        if (!options) { options = {}; }
        const wavelength = options.wavelength || this.center_wavelength;

        let pending_medium = this.env_initial_material;
        let pending_thickness = 0;
        let z = 0;
        const trace_surfaces = this.surfaces.slice();

        let appended_surface_thickness_override_index = -1;
        if (options.append_surface) {
            if (options.append_surface.thickness) {
                appended_surface_thickness_override_index = trace_surfaces.length - 1;
            }
            trace_surfaces.push(options.append_surface);
        }

        for (let i = 0; i < trace_surfaces.length; i += 1) {
            const surface = trace_surfaces[i];

            const trace_result = Surface.traceRay3D(obj_pt, ray_dir, pending_medium, surface, wavelength);
            if (Number.isNaN(trace_result[1][0])) {
                // total internal reflection
                return null;
            }
            const intersection = trace_result[0]; // relative to surface vertex
            const refract_dir = trace_result[1];

            if (Vector.magnitude(intersection.slice(0, 2)) > surface.aperture_radius) {
                if (!options.continue_after_ray_miss) {
                    return null;
                }
            }

            if (options.call_after_each_trace) {
                let context = {
                    src_pt: Vector.sum(obj_pt, [0,0,z+pending_thickness]),
                    dest_pt: Vector.sum(intersection, [0,0,z+pending_thickness]),
                    medium: pending_medium,
                    refract_dir: refract_dir,
                };
                options.call_after_each_trace(context);
            }

            z += pending_thickness;
            pending_thickness = surface.thickness;
            pending_medium = surface.material;

            if (i == appended_surface_thickness_override_index) {
                pending_thickness = options.append_surface.thickness;
            }

            obj_pt = Vector.sum(intersection, [0,0,-pending_thickness]);
            ray_dir = refract_dir;
        }

        return [Vector.sum(obj_pt, [0,0,z]), ray_dir];
    }

    traceGeometricPointSpreadFunction(angle, additive) {
        const input_axis_samples = 75;
        const image_physical_size = 0.2;
        const image_buffer_width = 500;
        let intensity_image = new Array(image_buffer_width**2).fill(0);
        let max_intensity = 1;

        // TODO: for angled beams on a fisheye, the parallel rays are
        // being copied and shifted on X without changing angle, but
        // this is not effective when such lenses only admit rays
        // nearly parallel to the surface normal
        let rays = this.enumerateInputRaysForBeam(angle * (2 * Math.PI / 360), this.env_beam_radius, input_axis_samples, 100);
        let results = [];
        for (let ray of rays) {
            for (let x = -this.env_beam_radius; x < this.env_beam_radius; x += (2 * this.env_beam_radius / input_axis_samples)) {
                if (x**2 + ray[0][1]**2 > this.env_beam_radius**2) {
                    continue;
                }

                let img_pt = ray[0];
                img_pt[0] = x;
                let ray_dir = ray[1];

                let result = this.traceRayThroughSystem(img_pt, ray_dir, {
                    append_surface: Surface.createBackstop(0)
                });
                if (result) {
                    results.push(result);
                }
            }
        }

        let cr = this.enumerateInputRaysForBeam(angle * (2 * Math.PI / 360), this.env_beam_radius, 1, 100);
        let cr_result = this.traceRayThroughSystem(cr[0][0], cr[0][1], {
            append_surface: Surface.createBackstop(0)
        });
        if (cr_result) {
            for (let result of results) {
                result[0][1] -= cr_result[0][1];
            }
        }

        for (let result of results) {
            let img_pt = result[0];
            const ix = Math.round((img_pt[0] + image_physical_size/2) / image_physical_size * image_buffer_width);
            const iy = Math.round((img_pt[1] + image_physical_size/2) / image_physical_size * image_buffer_width);
            if (ix > 0 && ix < image_buffer_width && iy > 0 && iy < image_buffer_width) {
                const index = iy * image_buffer_width + ix;
                intensity_image[index] += 1;
                max_intensity = Math.max(max_intensity, intensity_image[index]);
            }
        }
        for (let i = 0; i < intensity_image.length; i += 1) {
            if (additive) {
                intensity_image[i] /= max_intensity;
            } else {
                intensity_image[i] = Math.min(intensity_image[i], 1.0);
            }
        }
        return [image_buffer_width, intensity_image];
    }

    calculateChromaticAberration() {
        let focus_distances = [];
        let img_plane_pts = [];
        const wavelengths = [ this.short_wavelength, this.center_wavelength, this.long_wavelength ];
        for (let w of wavelengths) {
            let h = this.env_beam_radius;

            let crossing = this.traceMarginalRayToImageDistance(this.surfaces[0].aperture_radius/h, w);
            focus_distances.push(crossing);

            let obj_pt = [0, h, -20];
            let ray_dir = [0,0,1];
            let result = this.traceRayThroughSystem(obj_pt, ray_dir, {
                append_surface: Surface.createBackstop(0),
                wavelength: w
            });
            if (!result) { return null; }
            let img_plane_pt = [result[0][0], result[0][1]];
            img_plane_pts.push(img_plane_pt);
        }
        let transverse_differences = [];
        for (let i = 0; i < 3; i += 1) {
            transverse_differences.push(Math.sqrt((img_plane_pts[0][0] - img_plane_pts[i][0])**2 + (img_plane_pts[0][1] - img_plane_pts[i][1])**2));
        }
        let axial_differences = [];
        for (let i = 0; i < 3; i += 1) {
            axial_differences.push(focus_distances[i] - focus_distances[1]);
        }

        return [axial_differences, transverse_differences];
    }

    // note: check functions to ensure that they do not unexpectedly
    // use app.design when you intend to operate on the reverse design
    createReverseSystem() {
        let reverse = new Design();
        Object.assign(reverse, this);

        reverse.surfaces = reverse.surfaces.slice();
        let last_material = AIR_MATERIAL;
        let last_thickness = 0;
        for (let i = 0; i < reverse.surfaces.length; i += 1) {
            let surf = new Surface();
            Object.assign(surf, reverse.surfaces[i]);
            reverse.surfaces[i] = surf;

            let this_material = surf.material;
            surf.material = last_material;
            last_material = this_material;

            let this_thickness = surf.thickness;
            surf.thickness = last_thickness;
            last_thickness = this_thickness;

            surf.radius_of_curvature *= -1;
        }
        reverse.surfaces.reverse();

        reverse.env_beam_cross_distance = this.distanceToVertexForSurface(this.surfaces.length-1) - this.env_beam_cross_distance;

        return reverse;
    }

    // find a ray entering the first surface with
    // the desired angle from the center of the
    // aperture that crosses the optical axis at
    // the aperture (TODO entrance pupil)
    reverseTraceFindChiefRayEntrance(desired_angle) {
        let rd = this.createReverseSystem();

        let rear_surfaces = 0;
        let rear_thickness = 0;
        for (let surf of rd.surfaces) {
            if (rear_thickness >= rd.env_beam_cross_distance) { break; }
            rear_surfaces += 1;
            rear_thickness += surf.thickness;
        }
        rd.surfaces.splice(0, rear_surfaces);
        rd.env_beam_cross_distance -= rear_thickness;

        let vim_pt = [0,0,rd.env_beam_cross_distance];
        let vim_ray_dir = [0, Math.tan(desired_angle), 1];
        let result = rd.traceRayThroughSystem(vim_pt, vim_ray_dir);
        if (result) {
            let pt = result[0];
            let ray = result[1];
            pt[2] -= rd.distanceToVertexForSurface(rd.surfaces.length-1);
            pt[2] *= -1;
            ray[1] *= -1;
            return [pt, ray];
        } else {
            return null;
        }
    }

    calculateNumericalAperture(limit_to_beam_radius) {
        const aperture = limit_to_beam_radius ? this.env_beam_radius : this.surfaces[0].aperture_radius;
        let min = 0;
        let max = aperture;
        const ray_dir = [0,0,1];
        while (Math.abs(max - min) > aperture / 100) {
            let h = max / 2 + min / 2;
            let obj_pt = [0,h,-20];
            let result = this.traceRayThroughSystem(obj_pt, ray_dir);
            if (result) {
                min = h;
            } else {
                max = h;
            }
        }
        let effective_diameter = min + max; // conceptually (min / 2 + max / 2) * 2;
        return effective_diameter / (2 * 1 / this.calculateMeyerArendtSystemMatrix()[1]);
    }

    enumerateInputRaysForBeam(input_angle, beam_radius, ray_count, rear_offset) {
        let entrance = this.reverseTraceFindChiefRayEntrance(input_angle);
        let rays = [];
        if (!entrance) { return []; }
        for (let i = 0; i < ray_count; i += 1) {
            let obj_pt = Vector.sum(entrance[0], Vector.product(entrance[1], -rear_offset));
            let ray_dir = entrance[1];

            if (ray_count > 1) {
                let cross_dir_2d = Vector.normalized([0, ray_dir[2], -ray_dir[1]]);
                obj_pt = Vector.sum(obj_pt, Vector.product(cross_dir_2d, beam_radius * 2 * i/(ray_count-1) - (beam_radius)));
            }

            rays.push([obj_pt, ray_dir]);
        }
        return rays;
    }

    calculateRayAberrations(angle) {
        // measure where chief ray falls on image plane and
        // return an array for each ray of height at aperture
        // crossing and difference in height on image plane
        // compared to chief ray
        let rays = this.enumerateInputRaysForBeam(angle, this.env_beam_radius, 200, 100);
        let aperture_vs_image = [];
        for (let ray of rays) {
            let aperture_height = undefined;
            let result = this.traceRayThroughSystem(ray[0], ray[1], {
                append_surface: Surface.createBackstop(0),
                call_after_each_trace: (trace) => {
                    if (trace.src_pt[2] < this.env_beam_cross_distance) {
                        if (trace.dest_pt[2] >= this.env_beam_cross_distance) {
                            const slope = (trace.dest_pt[1] - trace.src_pt[1]) / (trace.dest_pt[2] - trace.src_pt[2]);
                            aperture_height = trace.src_pt[1] + slope * (this.env_beam_cross_distance - trace.src_pt[2]);
                        }
                    }
                }
            });
            if (result && aperture_height !== undefined) {
                aperture_vs_image.push([aperture_height, result[0][1]]);
            }
        }
        if (aperture_vs_image.length > 0) {
            const chief_image_height = aperture_vs_image[0][1];
            for (let aperture_vs_image_datum of aperture_vs_image) {
                aperture_vs_image_datum[1] -= chief_image_height;
            }
        }
        return aperture_vs_image;
    }
}
