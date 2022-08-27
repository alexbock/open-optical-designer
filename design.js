"use strict";

class Design {
    constructor() {
        this.surfaces = []
        this.center_wavelength = 0.58756;
        this.env_beam_radius = 1;
        this.env_fov_angle = 0;
        this.env_beam_cross_distance = 65;
        this.env_image_radius = 21.6
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
                surf.material = app.findMaterial("Air");
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
                console.log("Ignoring " + lines[i]);
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
        let last_medium = app.findMaterial("Air");
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

    traceMarginalRayToImageDistance(limit) {
        if (!limit) { limit = 1; }
        const initial_radius = this.surfaces[0].aperture_radius / limit;
        let image_distance = 0;
        for (let w = 0; w < 1001; ++w) {
            let ray_o = [-50, w*(initial_radius/1000)];
            let ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], 0, app.findMaterial("Air"), this.surfaces[0]);

            let t_off = 0;
            for (var s = 1; s < this.surfaces.length; s += 1) {
                t_off += this.surfaces[s-1].thickness;
                let new_angle = ray_i[2];
                ray_o = [ray_i[0] - t_off, ray_i[1]];
                if (Math.abs(ray_o[1]) > this.surfaces[s-1].aperture_radius) {
                    break;
                }
                ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], new_angle, this.surfaces[s-1].material, this.surfaces[s]);
                ray_i[0] += t_off;

                if (s == this.surfaces.length - 1) {
                    const x = ray_i[0];
                    const y = ray_i[1];
                    const m = ray_i[2];
                    const b = y - m*x;
                    // y = mx + b
                    // 0 = mx + b
                    // x = -b/m
                    image_distance = -b/m;
                }
            }
        }
        return image_distance;
    }

    dbg_plotOpticalPathLengthBeforeImagePlane(limit) {
        if (!limit) { limit = 1; }
        const initial_radius = this.surfaces[0].aperture_radius / limit;
        let opls = [];
        for (let w = 0; w < 101; ++w) {
            let opl = 0;
            let ray_o = [-50, w*(initial_radius/100)];
            let ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], 0, app.findMaterial("Air"), this.surfaces[0]);
            opl += Vector.magnitude(Vector.sum(Vector.product(-1, ray_o), ray_i.slice(0,2))) * app.findMaterial("Air").refractiveIndex(this.center_wavelength);

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

                if (s == this.surfaces.length - 1) {
                    const x = ray_i[0];
                    const y = ray_i[1];
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
            opl -= zero;
            app.renderer.c.fillStyle = "black";
            app.renderer.c.fillRect(20 + i*5, 60, 4, opl*10 /*%0.001 * 100000*/);
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

    dbg_autofocus() {
        const limit = this.surfaces[0].aperture_radius / this.env_beam_radius;
        const img_dist = this.traceMarginalRayToImageDistance(limit);
        const si = this.surfaces.length - 1;
        const offset = this.distanceToVertexForSurface(si);
        this.surfaces[si].thickness = img_dist - offset;
        app.ui.writeDOMSurfaceTable();
        app.renderer.paint(app.design);
    }
}
