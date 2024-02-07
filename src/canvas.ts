import type { Point } from "./types";
import { Camera } from "./camera";
import * as utils from "./webgl-utils";
import { ProgramManager, Uniform, UniformType, UniformValue } from "./webgl-program";
import { shaderError } from "./stores";

class Canvas {
    gl: WebGL2RenderingContext;
    c: HTMLCanvasElement;
    camera: Camera;
    compFbo: WebGLFramebuffer;
    mainProgram: ProgramManager;
    compProgram: ProgramManager;
    userFunctionSrc: string;
    mousePos: Point = {x: 0, y: 0};
    fvalAtMouse: Point = {x: 0, y: 0};

    constructor(canvas: HTMLCanvasElement, userFunctionSrc: string) {
        this.c = canvas;
        this.mousePos = {x: 0, y: 0};
        this.userFunctionSrc = userFunctionSrc;
    }

    addUniform(name: string, value: UniformValue=null, type: UniformType="float") {
        this.mainProgram.addUniform(new Uniform(name, type));
        this.compProgram.addUniform(new Uniform(name, type));
        this.setUniformValue(name, value);

        console.table(Array.from(this.mainProgram.uniforms.values()).map(u => [u.name, u.value]))
    }
    deleteUniform(name: string, recompile=true) {
        this.mainProgram.deleteUniform(name);
        this.compProgram.deleteUniform(name);
        console.table(Array.from(this.mainProgram.uniforms.values()).map(u => [u.name, u.value]))
    }
    setUniformValue(name: string, value: any) { 
        this.mainProgram.setUniformValue(name, value);
        this.compProgram.setUniformValue(name, value);
    }

    recompilePrograms() {
        try {
            this.mainProgram.recompile(this.userFunctionSrc);
            this.compProgram.recompile(this.userFunctionSrc);
        }
        catch (e) {
            shaderError.set(e);
            return;
        }
        shaderError.set(null);
        this.render();
    }

    updateUserFunction(userFunctionSrc: string) {
        this.userFunctionSrc = userFunctionSrc;
        this.recompilePrograms();
    }

    computeFval(p : Point) : Point {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.compFbo);
        gl.useProgram(this.compProgram.id);

        this.compProgram.setUniformValue("u_point", [p.x, p.y])
        this.compProgram.bindAllUniforms();
        gl.viewport(0, 0, this.c.width, this.c.height);
        gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, 1);

        let pixel = new Float32Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { x: pixel[0], y: pixel[1] };
    }

    render(once=true) {	
        const gl = this.gl;		
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(this.mainProgram.id);

        this.mainProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
        this.mainProgram.setUniformValue("u_mouse", [this.mousePos.x, this.mousePos.y]);
        this.mainProgram.bindAllUniforms();

        gl.viewport(0, 0, this.c.width, this.c.height);
        gl.clearColor(0.42, 0.42, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!once) requestAnimationFrame(() => this.render(once));
    }

    async init(error: (s: string) => any) {
        const c = this.c;

        const gl = c.getContext("webgl2");
        if (!gl) {
            error("No WebGL2 context"); return;
        }
        this.gl = gl;

        this.camera = new Camera(c, { setEventListeners: true });

        let ext = gl.getExtension('EXT_color_buffer_float');
		if (!ext) {
            error("EXT_color_buffer_float not supported"); return;
        }

        let mainProgram = new ProgramManager(gl, [
            new Uniform("u_worldMat", "mat3"),
            new Uniform("u_mouse", "vec2"),
        ]);
        await mainProgram.compileFromUrls("shaders/vertex.glsl", "shaders/fragment.glsl", this.userFunctionSrc);

        let compProgram = new ProgramManager(gl, [
            new Uniform("u_point", "vec2"),
        ]);
        await compProgram.compileFromUrls("shaders/vertex-comp.glsl", "shaders/fragment-comp.glsl", this.userFunctionSrc);

        if (!(mainProgram && compProgram)) { return; }
        this.mainProgram = mainProgram; this.compProgram = compProgram;
        
        const aPositionLocation = gl.getAttribLocation(mainProgram.id, "a_position");
		utils.bufferFullscreenQuad(gl, aPositionLocation);

        // setup framebuffer for computing and reading f(z) in computeFval
        let compFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, compFbo);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        this.compFbo = compFbo;
        
        c.addEventListener("mousemove", (e) => {
            let [x, y] = this.camera.screenToWorld(e.clientX, e.clientY);
            this.mousePos = {x, y};
            this.fvalAtMouse = this.computeFval(this.mousePos);
        }); 
        // rerender after camera movements
        c.addEventListener("camera", () => {
			this.render();
		})
        // rerender after canvas resizing
		let resizeObserver = new ResizeObserver(() => {
			utils.resizeCanvasToDisplaySize(c);
			this.camera.scale.x = this.camera.scale.y * this.camera.aspect();
			this.render();
		})
		resizeObserver.observe(c);
    }
}

export { Canvas }