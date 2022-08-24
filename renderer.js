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
        this.c.beginPath();
        this.c.moveTo(points[0][0]+0+offset, points[0][1]+0);
        for (let point of points) {
            this.c.lineTo(point[0]+0+offset, point[1]+0);
        }
        this.c.stroke();
        return [points[0], points[points.length-1]];
    }
    
    paint(design) {
        this.c.fillStyle = 'cornflowerblue';
        this.c.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    
        this.c.save();

        let system_width = (1/design.calculateMeyerArendtSystemMatrix()[1]);
        let width_scale = this.canvas.offsetWidth / system_width;
        let max_surface_height = 0;
        for (let surface of design.surfaces) {
            if (surface.aperture_radius > max_surface_height) {
                max_surface_height = surface.aperture_radius;
            }
        }
        let height_scale = this.canvas.offsetHeight / (max_surface_height*2);
        let img_scale = Math.min(width_scale, height_scale);
        img_scale *= 0.9;
        this.c.scale(img_scale, img_scale);
        this.c.translate(system_width * 0.05, this.canvas.offsetHeight/2/img_scale);
        //this.c.translate(10, 10);

        this.c.strokeStyle = 'white';
        this.c.lineWidth='0.3';
        let t = 0;
        let last_edges = null;
        let last_surface = null;
        for (let surface of design.surfaces) {
            let edges = this.testDrawSurface(surface, t);
            if (last_edges && last_surface) {
                if (last_surface.material.name != 'Air' && last_surface.material.name != 'Vacuum') {
                    this.c.beginPath();
                    this.c.moveTo(last_edges[0][0]+0+t-last_surface.thickness, last_edges[0][1]+0);
                    this.c.lineTo(edges[0][0]+0+t, edges[0][1]+0);
                    this.c.moveTo(last_edges[1][0]+0+t-last_surface.thickness, last_edges[1][1]+0);
                    this.c.lineTo(edges[1][0]+0+t, edges[1][1]+0);
                    this.c.stroke();
                }
            }
            t += surface.thickness;
            last_edges = edges;
            last_surface = surface;
        }

        // test ray trace
        this.c.lineWidth='0.15';
        for (let w = 0; w < 13; ++w) {
            let ray_o = [-50, -30 + w*5];
            let ray_i = Surface.traceRay(ray_o[0], ray_o[1], /*-Math.PI/6*/0, app.findMaterial("Air"), design.surfaces[0]);

            this.c.strokeStyle = 'yellow';
            this.c.beginPath();
            this.c.moveTo(ray_o[0]+0, ray_o[1]+0);
            this.c.lineTo(ray_i[0]+0, ray_i[1]+0);
            this.c.stroke();

            let t_off = 0;
            for (var s = 1; s < design.surfaces.length; s += 1) {
                t_off += design.surfaces[s-1].thickness;
                let new_angle = ray_i[2];
                ray_o = [ray_i[0] - t_off, ray_i[1]];
                ray_i = Surface.traceRay(ray_o[0], ray_o[1], new_angle, design.surfaces[s-1].material, design.surfaces[s]);
                ray_i[0] += t_off;
                this.c.strokeStyle = 'yellow';
                this.c.beginPath();
                this.c.moveTo(ray_o[0]+t_off+0, ray_o[1]+0);
                this.c.lineTo(ray_i[0]+0, ray_i[1]+0);
                this.c.stroke();

                if (s == design.surfaces.length - 1) {
                    this.c.strokeStyle = 'yellow';
                    this.c.beginPath();
                    this.c.moveTo(ray_i[0]+0, ray_i[1]+0);
                    this.c.lineTo(ray_i[0]+system_width+0, ray_i[1]+ray_i[2]*system_width+0);
                    this.c.stroke();
                }
            }
        }
        
        this.c.restore();

        // test write system focal length
        let matrix = design.calculateMeyerArendtSystemMatrix();
        let focal_length = 1 / matrix[1];
        let fnumber = focal_length/design.surfaces[0].aperture_radius;
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
