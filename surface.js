"use strict";

class Surface {
    constructor() {
        this.radius_of_curvature = Infinity;
        this.aperture_radius = 0;
        this.thickness = 0;
        this.material = VACUUM_MATERIAL;

        this.conic_constant = 0;
    }

    sag(y) {
        const R = Math.abs(this.radius_of_curvature);
        const K = this.conic_constant;
        const sign = this.radius_of_curvature < 0 ? -1 : 1;
        return sign * (y*y) / (R + Math.sqrt(R*R - (K + 1) * y * y));
    }

    sag_derivative(y) {
        const R = Math.abs(this.radius_of_curvature);
        const K = this.conic_constant;
        const sign = this.radius_of_curvature < 0 ? -1 : 1;
        return sign * y / Math.sqrt(R*R - (K + 1) * y * y);
    }

    generateVisualOutlinePointList() {
        let points = [];
        let reflected_points = [];
        for (let i = 0; i < this.aperture_radius; i += 0.2) {
            let y = i;
            let x = this.sag(y);
            points.push([x, y]);
            if (y > 0) {
                reflected_points.push([x, -y]);
            }
        }
        reflected_points.reverse();
        let result = reflected_points.concat(points);
        return result;
    }

    static descriptionForConicConstant(k) {
        if (k == 0) { return "spherical"; }
        else if (k > 0) { return "oblate elliptic"; }
        else if (k < 0 && k > -1) { return "prolate elliptic"; }
        else if (k == -1) { return "parabolic"; }
        else if (k < -1) { return "hyperbolic"; }
    }

    static traceRay(ray_ox, ray_oy, ray_slope, medium, surface) {
        let R = Math.abs(surface.radius_of_curvature);
        if (!Number.isFinite(R)) { R = 1e13; }
        let K = surface.conic_constant;
        if (Math.abs(K + 1) < 1e-13) { K = -1 - 1e-13; }

        // y = mx + b
        const m = ray_slope;
        // b = y - mx = ray_oy - m * ray_ox
        const b = ray_oy - m * ray_ox;

        // (y-b)/m = (y*y) / (R + sqrt(R*R - (K + 1) * y * y))
        // y = (+/- sqrt(-b^2 K m^2 - b^2 m^2 - 2 b m^3 R + m^2 R^2) + b K + b + m R)/(K + m^2 + 1)
        // TODO avoid discontinuity for K=-1 m=0
        let sign = ray_slope > 0 ? 1 : -1;
        let curve_sign = surface.radius_of_curvature < 0 ? -1 : 1;
        const y_intersect = (sign * curve_sign * -Math.sqrt(-b*b*K*m*m - b*b*m*m - curve_sign * 2*b*m*m*m*R + m*m*R*R) + b*K + b + curve_sign * m*R)/(K + m*m + 1);
        const x_intersect = surface.sag(y_intersect);

        // n1 -> n2: sin(t1)/sin(t2) = n2/n1
        // angles from surface normal
        let nk1 = medium.complexRefractiveIndex(app.design.center_wavelength);
        let nk2 = surface.material.complexRefractiveIndex(app.design.center_wavelength);
        let tangent_slope = 1/surface.sag_derivative(y_intersect);
        let normal_slope = -1/tangent_slope;

        // cos(t1) = -dot(normal, ray)
        const normal_vector_mag = Math.sqrt(-1 * -1 + normal_slope * normal_slope);
        const normal_unit_vector = [-1 / normal_vector_mag, -normal_slope / normal_vector_mag];
        const ray_vector_mag = Math.sqrt(1 + m * m);
        const ray_unit_vector = [1 / ray_vector_mag, m / ray_vector_mag];
        const cos_t1 = -(normal_unit_vector[0] * ray_unit_vector[0] + normal_unit_vector[1] * ray_unit_vector[1]);

        const r = nk1.real / nk2.real;
        const c = cos_t1;
        const nf = r * c - Math.sqrt(1 - r*r * (1 - c*c));
        let vr = [r*ray_unit_vector[0] + nf * normal_unit_vector[0], r*ray_unit_vector[1] + nf*normal_unit_vector[1]];
        let new_ray_slope = vr[1]/vr[0];

        return [x_intersect, y_intersect, new_ray_slope];
    }
}
