var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Camera } from "./camera";
import * as utils from "./webgl-utils";
import { ProgramManager, Uniform } from "./webgl-program";
import { shaderError } from "./stores";
class Canvas {
    constructor(canvas, userFunctionSrc) {
        this.mousePos = { x: 0, y: 0 };
        this.settings = new Map(Object.entries({
            'showGrid': { type: 'bool', value: false },
            'gridSpacing': { type: 'float', value: 1.0 },
            'showModContours': { type: 'bool', value: true },
            'showPhaseContours': { type: 'bool', value: false },
        }));
        this.c = canvas;
        this.mousePos = { x: 0, y: 0 };
        this.userFunctionSrc = userFunctionSrc;
    }
    updateSetting(name, value, render = true) {
        if (!this.settings.has(name))
            throw new Error(`setting ${name} doesnt exist`);
        this.settings.set(name, value);
        this.mainProgram.setUniformValue(`u_${name}`, value);
        console.log("setting", name, value);
        if (render)
            this.render();
    }
    getSettingValue(name) {
        if (!this.settings.has(name))
            throw new Error(`setting ${name} doesnt exist`);
        return this.settings.get(name).value;
    }
    addUniform(name, value = null, type = "float") {
        this.mainProgram.addUniform(new Uniform(name, type));
        this.compProgram.addUniform(new Uniform(name, type));
        this.setUniformValue(name, value);
    }
    deleteUniform(name, recompile = true) {
        this.mainProgram.deleteUniform(name);
        this.compProgram.deleteUniform(name);
    }
    setUniformValue(name, value) {
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
    updateUserFunction(userFunctionSrc) {
        this.userFunctionSrc = userFunctionSrc;
        this.recompilePrograms();
    }
    computeFval(p) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.compFbo);
        gl.useProgram(this.compProgram.id);
        this.compProgram.setUniformValue("u_point", [p.x, p.y]);
        this.compProgram.bindAllUniforms();
        gl.viewport(0, 0, this.c.width, this.c.height);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, 1);
        let pixel = new Float32Array(4);
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, pixel);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return { x: pixel[0], y: pixel[1] };
    }
    render(once = true) {
        const gl = this.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(this.mainProgram.id);
        this.mainProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
        this.mainProgram.setUniformValue("u_mouse", [this.mousePos.x, this.mousePos.y]);
        this.mainProgram.setUniformValue("u_resolution", [this.c.width, this.c.height]);
        this.mainProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
        this.mainProgram.bindAllUniforms();
        // this.mainProgram.logUniforms();
        gl.viewport(0, 0, this.c.width, this.c.height);
        gl.clearColor(0.42, 0.42, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        if (!once)
            requestAnimationFrame(() => this.render(once));
    }
    init(error) {
        return __awaiter(this, void 0, void 0, function* () {
            const c = this.c;
            utils.resizeCanvasToDisplaySize(c);
            const gl = c.getContext("webgl2");
            if (!gl) {
                error("No WebGL2 context");
                return;
            }
            this.gl = gl;
            this.camera = new Camera(c, { setEventListeners: false });
            let ext = gl.getExtension('EXT_color_buffer_float');
            if (!ext) {
                error("EXT_color_buffer_float not supported");
                return;
            }
            let mainProgram = new ProgramManager(gl, [
                new Uniform("u_worldMat", "mat3"),
                new Uniform("u_mouse", "vec2"),
                new Uniform("u_resolution", "vec2"),
                new Uniform("u_scale", "vec2"),
            ]);
            this.settings.forEach((v, k) => {
                mainProgram.addUniform(new Uniform(`u_${k}`, v.type, v.value));
            });
            yield mainProgram.compileFromUrls("shaders/vertex.glsl", "shaders/fragment.glsl", this.userFunctionSrc);
            // console.table(Array.from(mainProgram.uniforms.values()).map(u => [u.name, u.value]))
            let compProgram = new ProgramManager(gl, [
                new Uniform("u_point", "vec2"),
            ]);
            yield compProgram.compileFromUrls("shaders/vertex-comp.glsl", "shaders/fragment-comp.glsl", this.userFunctionSrc);
            if (!(mainProgram && compProgram)) {
                return;
            }
            this.mainProgram = mainProgram;
            this.compProgram = compProgram;
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
        });
    }
}
export { Canvas };
