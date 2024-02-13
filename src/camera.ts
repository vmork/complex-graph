import type { Point } from './types';

type Options = {
    setEventListeners: boolean,
}

const defaultOptions: Options = {
    setEventListeners: true,
}

const cameraEvent = new Event('camera');


export class Camera {
    scale: {x: number, y: number};
    origin: {x: number, y: number};
    canvas: HTMLCanvasElement;
    options: Options = defaultOptions;

    w() { return this.canvas.width; }   
    h() { return this.canvas.height; }
    aspect() { return this.w() / this.h(); }

    reset() {
        this.origin = {x: 0, y: 0}; 
        this.scale = {x: this.aspect(), y: 1};
        this.canvas.dispatchEvent(cameraEvent);
    }

    screenToWorld(x: number, y: number): Point {
        return {
            x: this.origin.x + this.scale.x*(2*x/this.canvas.width-1),
            y: this.origin.y + this.scale.y*(-2*y/this.canvas.height+1),
        }	
    }
    worldToScreen(x: number, y: number): Point {
        return {
            x: this.canvas.width/2 * (1 + (x-this.origin.x)/this.scale.x),
            y: this.canvas.height/2 * (1 - (y-this.origin.y)/this.scale.y),
        }
    }

    scaleAt(x: number, y: number, scaleBy: number) {
        const w = this.screenToWorld(x, y);
        const a = 1-scaleBy;
        this.origin.x += a * (w.x - this.origin.x);
        this.origin.y += a * (w.y - this.origin.y);	
        this.scale.x *= scaleBy; this.scale.y *= scaleBy;
        this.canvas.dispatchEvent(cameraEvent);
    }

    move(x: number, y: number) {
        this.origin.x -= ((x / this.w()) * this.scale.x) * 2.0;
        this.origin.y += ((y / this.h()) * this.scale.y) * 2.0;
        this.canvas.dispatchEvent(cameraEvent);
    }   

    getWorldMatrix() {
        return [
            this.scale.x,    0,             0,
            0,               this.scale.y,  0,
            this.origin.x,   this.origin.y, 1,
        ]
    }

    constructor(canvas: HTMLCanvasElement, options: Options = defaultOptions) {
        this.canvas = canvas; this.options = options;
        this.reset();

        if (options.setEventListeners) {
            this.canvas.addEventListener('wheel', (e) => {
                e.preventDefault();
                this.scaleAt(e.offsetX, e.offsetY, Math.pow(1.001, e.deltaY));
            }); 
            this.canvas.addEventListener('mousemove', (e) => {
                if (e.buttons == 1) this.move(e.movementX, e.movementY);
            });
        }
    }

}