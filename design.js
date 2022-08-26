"use strict";

class Design {
    constructor() {
        this.surfaces = []
        this.center_wavelength = 0.58756;
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
}
