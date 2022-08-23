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
        this.c.moveTo(points[0][0]+50+offset, points[0][1]+50);
        for (let point of points) {
            this.c.lineTo(point[0]+50+offset, point[1]+50);
        }
        this.c.stroke();
    }
    
    paint(design) {
        this.c.fillStyle = 'cornflowerblue';
        this.c.fillRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    
        this.c.strokeStyle = 'white';
        this.c.lineWidth='0.3';
    
        let t = 0;
        for (let surface of design.surfaces) {
            this.testDrawSurface(surface, t);
            t += surface.thickness;
        }

        // test ray trace
        for (let w = 0; w < 13; ++w) {
        let ray_o = [-30, -30 + w*5];
        let ray_i = Surface.traceRay(ray_o[0], ray_o[1], /*-Math.PI/6*/0, app.findMaterial("Air"), design.surfaces[0]);

        /*
        this.c.strokeStyle = 'red';
        this.c.beginPath();
        this.c.moveTo(ray_o[0]+50, ray_o[1]+50);
        this.c.lineTo(ray_o[0]+44+50, ray_o[1]+Math.tan(-Math.PI/6)*44+50);
        this.c.stroke();
        */

        this.c.strokeStyle = 'yellow';
        this.c.beginPath();
        this.c.moveTo(ray_o[0]+50, ray_o[1]+50);
        this.c.lineTo(ray_i[0]+50, ray_i[1]+50);
        this.c.stroke();

        /*
        this.c.strokeStyle = 'pink';
        this.c.beginPath();
        this.c.moveTo(ray_i[0]+50, ray_i[1]+50);
        this.c.lineTo(ray_i[0]+10+50, ray_i[1]+ray_i[2]*10+50);
        this.c.stroke();
        */

        let t_off = 0;
        for (var s = 1; s < design.surfaces.length; s += 1) {
            /*
            let new_angle = ray_i[2];
            ray_o = [ray_i[0] - design.surfaces[0].thickness, ray_i[1]];
            ray_i = Surface.traceRay(ray_o[0], ray_o[1], new_angle, design.surfaces[0].material, design.surfaces[1]);
            ray_i[0] += design.surfaces[0].thickness;
            this.c.strokeStyle = 'green';
            this.c.beginPath();
            this.c.moveTo(ray_o[0]+design.surfaces[0].thickness+50, ray_o[1]+50);
            this.c.lineTo(ray_i[0]+50, ray_i[1]+50);
            this.c.stroke();

            this.c.strokeStyle = 'red';
            this.c.beginPath();
            this.c.moveTo(ray_i[0]+50, ray_i[1]+50);
            this.c.lineTo(ray_i[0]+70+50, ray_i[1]+ray_i[2]*70+50);
            this.c.stroke();
            */
            t_off += design.surfaces[s-1].thickness;
            let new_angle = ray_i[2];
            ray_o = [ray_i[0] - t_off, ray_i[1]];
            ray_i = Surface.traceRay(ray_o[0], ray_o[1], new_angle, design.surfaces[s-1].material, design.surfaces[s]);
            ray_i[0] += t_off;
            this.c.strokeStyle = 'green';
            this.c.beginPath();
            this.c.moveTo(ray_o[0]+t_off+50, ray_o[1]+50);
            this.c.lineTo(ray_i[0]+50, ray_i[1]+50);
            this.c.stroke();

            if (s == design.surfaces.length - 1) {
                this.c.strokeStyle = 'red';
                this.c.beginPath();
                this.c.moveTo(ray_i[0]+50, ray_i[1]+50);
                this.c.lineTo(ray_i[0]+70+50, ray_i[1]+ray_i[2]*70+50);
                this.c.stroke();
            }
        }
        }
    }
}
