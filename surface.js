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

    static createBackstop(thickness) {
        let result = new Surface();
        result.thickness = thickness;
        result.aperture_radius = Infinity;
        return result;
    }

    static descriptionForConicConstant(k) {
        if (k == 0) { return "spherical"; }
        else if (k > 0) { return "oblate elliptic"; }
        else if (k < 0 && k > -1) { return "prolate elliptic"; }
        else if (k == -1) { return "parabolic"; }
        else if (k < -1) { return "hyperbolic"; }
    }

    static traceRay2D(ray_ox, ray_oy, ray_slope, medium, surface, wavelength) {
        // a request for a 2D ray trace to render the design view
        // where x is the optical axis and y is the height is
        // transformed to a 3D ray trace restricted to the plane x=0
        // where z is the optical axis and y is the height 
        let obj_pt = [0, ray_oy, ray_ox];
        let ray_dir = [0, ray_slope, 1];
        let result = this.traceRay3D(obj_pt, ray_dir, medium, surface, wavelength);
        return [result[0][2], result[0][1], result[1][1] / result[1][2]];
    }

    // from the object point, trace light travelling in the ray direction through the medium to the surface
    // and calculate the angle of refraction at the surface boundary
    static traceRay3D(obj_pt, ray_dir, medium, surface, wavelength) {
        if (!wavelength) { wavelength = app.design.center_wavelength; }
        let R = Math.abs(surface.radius_of_curvature);
        if (!Number.isFinite(R)) { R = 1e13; }
        let K = surface.conic_constant;
        if (Math.abs(K + 1) < 1e-13) { K = -1 - 1e-13; }

        // find point where ray intersects surface
        // x = x0 + ta
        // y = y0 + tb
        // z = z0 + tc
        // z = (sqrt(x^2 + y^2)^2) / (R + sqrt(R*R - (K+1) * sqrt(x^2 + y^2)^2))
        // see "solve-line-conic-intersect.py" and "line-conic-intersect.txt" in "derivations/"
        const [x_0, y_0, z_0] = obj_pt;
        const [a, b, c] = ray_dir;
        const curve_sign = surface.radius_of_curvature < 0 ? -1 : 1;
        const t = (-K*c*z_0 + curve_sign * R*c - a*x_0 - b*y_0 - c*z_0 - curve_sign * Math.sqrt(-K*a**2*z_0**2 + 2*K*a*c*x_0*z_0 - K*b**2*z_0**2 + 2*K*b*c*y_0*z_0 - K*c**2*x_0**2 - K*c**2*y_0**2 + R**2*c**2 + curve_sign * 2*R*a**2*z_0 - curve_sign * 2*R*a*c*x_0 + curve_sign * 2*R*b**2*z_0 - curve_sign * 2*R*b*c*y_0 - a**2*y_0**2 - a**2*z_0**2 + 2*a*b*x_0*y_0 + 2*a*c*x_0*z_0 - b**2*x_0**2 - b**2*z_0**2 + 2*b*c*y_0*z_0 - c**2*x_0**2 - c**2*y_0**2))/(K*c**2 + a**2 + b**2 + c**2);
        const x = x_0 + t*a;
        const y = y_0 + t*b;
        const z = z_0 + t*c;
        const intersection = [x, y, z];

        // calculate surface normal vector
        // see "derivations/find-3d-conic-partial-derivatives.py"
        const dzdx = curve_sign * x*(K + 1)*(x**2 + y**2)/((R + Math.sqrt(R**2 - (K + 1)*(x**2 + y**2)))**2*Math.sqrt(R**2 - (K + 1)*(x**2 + y**2))) + curve_sign * 2*x/(R + Math.sqrt(R**2 - (K + 1)*(x**2 + y**2)));
        const dzdy = curve_sign * y*(K + 1)*(x**2 + y**2)/((R + Math.sqrt(R**2 - (K + 1)*(x**2 + y**2)))**2*Math.sqrt(R**2 - (K + 1)*(x**2 + y**2))) + curve_sign * 2*y/(R + Math.sqrt(R**2 - (K + 1)*(x**2 + y**2)));
        const normal_dir = [dzdx, dzdy, -1];

        // calculate refraction angle
        // n1 -> n2: sin(t1)/sin(t2) = n2/n1 where t1 and t2 are angles from normal
        const nk1 = medium.complexRefractiveIndex(wavelength);
        const nk2 = surface.material.complexRefractiveIndex(wavelength);
        const normal_unit = Vector.normalized(normal_dir);
        const ray_unit = Vector.normalized(ray_dir);
        const cos_t1 = -Vector.dot(normal_unit, ray_unit);
        if (cos_t1 < 0) { throw "wrong sign for surface normal"; }
        const n = nk1.real / nk2.real;
        const refract_dir = Vector.normalized(Vector.sum(Vector.product(n, ray_unit), Vector.product(n*cos_t1 - Math.sqrt(1 - n*n * (1 - cos_t1*cos_t1)), normal_unit)));

        return [intersection, refract_dir];
    }
}
