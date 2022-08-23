"use strict";

class Design {
    constructor() {
        this.surfaces = []
        this.center_wavelength = 0.550;
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
}
