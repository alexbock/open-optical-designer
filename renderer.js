"use strict";

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.c = this.prepareCanvas();
    }

    prepareCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.offsetWidth * dpr;
        this.canvas.height = this.canvas.offsetHeight * dpr;
        let context = this.canvas.getContext("2d");
        context.scale(dpr, dpr);
        return context;
    }

    paint(design) {
        this.c.fillStyle = 'red';
        this.c.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    }
}

class TestRenderer extends Renderer {
    testDrawSurface(surf, offset) {
        const points = surf.generateVisualOutlinePointList();
        if (points.length == 0) { return; }
        this.c.beginPath();
        this.c.moveTo(points[0][0]+0+offset, points[0][1]+0);
        for (let point of points) {
            this.c.lineTo(point[0]+0+offset, point[1]+0);
        }
        this.c.stroke();
        return [points[0], points[points.length-1]];
    }
    
    paint(design) {
        this.c.fillStyle = 'steelblue';
        this.c.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    
        this.c.save();

        //let system_width = (1/design.calculateMeyerArendtSystemMatrix()[1]);
        let system_width = design.traceMarginalRayToImageDistance();
        let width_scale = this.canvas.offsetWidth / system_width;
        let max_surface_height = 0;
        for (let surface of design.surfaces) {
            if (surface.aperture_radius > max_surface_height) {
                max_surface_height = surface.aperture_radius;
            }
        }
        let height_scale = this.canvas.offsetHeight / (max_surface_height*2);
        let img_scale = Math.min(width_scale, height_scale);
        img_scale *= 0.85;
        this.c.scale(img_scale, img_scale);
        this.c.translate(system_width * 0.10, this.canvas.offsetHeight/2/img_scale);

        this.c.strokeStyle = 'white';
        this.c.lineWidth='0.3';
        let t = 0;
        let last_edges = null;
        let last_surface = null;
        for (let surface of design.surfaces) {
            let edges = this.testDrawSurface(surface, t);
            if (edges && last_edges && last_surface) {
                if (last_surface.material.name != 'Air' && last_surface.material.name != 'Vacuum') {
                    // draw edges
                    this.c.beginPath();
                    this.c.moveTo(last_edges[0][0]+t-last_surface.thickness, last_edges[0][1]);
                    this.c.lineTo(edges[0][0]+t, edges[0][1]);
                    this.c.moveTo(last_edges[1][0]+t-last_surface.thickness, last_edges[1][1]);
                    this.c.lineTo(edges[1][0]+t, edges[1][1]);
                    this.c.stroke();

                    // fill lens area
                    this.c.fillStyle = "rgba(255,255,255,0.1)";
                    this.c.beginPath();
                    let last_pts = last_surface.generateVisualOutlinePointList();
                    let this_pts = surface.generateVisualOutlinePointList();
                    this_pts.reverse();
                    this.c.moveTo(last_pts[0][0]+t-last_surface.thickness, last_pts[0][1]);
                    for (let pt of last_pts) {
                        this.c.lineTo(pt[0]+t-last_surface.thickness, pt[1]);
                    }
                    for (let pt of this_pts) {
                        this.c.lineTo(pt[0]+t, pt[1]);
                    }
                    this.c.closePath();
                    this.c.fill();
                }
            }
            t += surface.thickness;
            last_edges = edges;
            last_surface = surface;
        }

        // test ray trace
        this.c.lineWidth='0.15';
        const initial_radius = Math.floor(app.design.surfaces[0].aperture_radius);
        for (let w = 0; w < initial_radius+1; ++w) {
            let ray_o = [-initial_radius, -initial_radius + w*(initial_radius*2/(initial_radius))];
            let ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], /*-Math.PI/6*/0, app.findMaterial("Air"), design.surfaces[0]);

            this.c.strokeStyle = 'orange';
            this.c.beginPath();
            this.c.moveTo(ray_o[0], ray_o[1]);
            this.c.lineTo(ray_i[0], ray_i[1]);
            this.c.stroke();

            let t_off = 0;
            for (var s = 1; s < design.surfaces.length; s += 1) {
                t_off += design.surfaces[s-1].thickness;
                let new_angle = ray_i[2];
                ray_o = [ray_i[0] - t_off, ray_i[1]];
                ray_i = Surface.traceRay2D(ray_o[0], ray_o[1], new_angle, design.surfaces[s-1].material, design.surfaces[s]);
                ray_i[0] += t_off;

                if (false) {
                    // debug: view extrapolated refraction angle
                    // vs actual path to intersection point
                    this.c.strokeStyle = 'green';
                    this.c.beginPath();
                    this.c.moveTo(ray_o[0]+t_off, ray_o[1]);
                    this.c.lineTo(ray_o[0]+t_off+5, ray_o[1]+5*new_angle);
                    this.c.stroke();
                }

                if (s != design.surfaces.length - 1 && Math.abs(ray_i[1]) > design.surfaces[s].aperture_radius) {
                    break;
                }

                this.c.strokeStyle = 'orange';
                this.c.beginPath();
                this.c.moveTo(ray_o[0]+t_off, ray_o[1]);
                this.c.lineTo(ray_i[0], ray_i[1]);
                this.c.stroke();

                if (s == design.surfaces.length - 1) {
                    this.c.strokeStyle = 'orange';
                    this.c.beginPath();
                    this.c.moveTo(ray_i[0], ray_i[1]);
                    this.c.lineTo(ray_i[0]+system_width*2, ray_i[1]+ray_i[2]*system_width*2);
                    this.c.stroke();
                }
            }
        }

        // test draw point at image
        const image_distance_paraxial = app.design.traceMarginalRayToImageDistance(10);
        const image_distance_mid = app.design.traceMarginalRayToImageDistance(2);
        const image_distance_marginal = app.design.traceMarginalRayToImageDistance(1);
        this.c.fillStyle = 'black';
        this.c.beginPath();
        this.c.arc(image_distance_paraxial, 0, 0.3, 0, 2*Math.PI);
        this.c.fill();
        this.c.beginPath();
        this.c.arc(image_distance_marginal, 0, 0.3, 0, 2*Math.PI);
        this.c.fill();
        this.c.beginPath();
        this.c.arc(image_distance_mid, 0, 0.3, 0, 2*Math.PI);
        this.c.fill();
        
        this.c.restore();

        // test write system focal length
        let matrix = design.calculateMeyerArendtSystemMatrix();
        let focal_length = 1 / matrix[1];
        let fnumber = focal_length/(design.surfaces[0].aperture_radius*2);
        focal_length = Math.round(focal_length * 100) / 100;
        fnumber = Math.round(fnumber * 100) / 100;
        this.c.font = '24px sans-serif';
        this.c.fillStyle = 'white';
        let caption = "f = " + focal_length;
        if (focal_length > 0) {
            caption += ", \u0192/" + fnumber;
        }
        this.c.fillText(caption, 10, 25);
    }
}
