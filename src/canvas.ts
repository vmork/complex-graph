import type { Point } from "./types";
import { Camera } from "./camera";
import * as utils from "./webgl-utils";
import { ProgramManager, Uniform, UniformType, UniformValue } from "./webgl-program";
import { compilationErrors } from "./stores";
import { compile } from "./compiler/main";
import { uvars } from "./stores";
import { get } from "svelte/store";
import { WorkspaceData } from "./workspace";
import { cloneMap } from "./utils";

type Settings = Map<string, {type: UniformType, value: any}>

class Canvas {
    gl: WebGL2RenderingContext;
    c: HTMLCanvasElement;
    camera: Camera;
    compFbo: WebGLFramebuffer;
    mainProgram: ProgramManager;
    compProgram: ProgramManager;
    shapeProgram: ProgramManager;
    userCodeGlsl: string;
    mousePos: Point = {x: 0, y: 0};
    defaultWorkspace: WorkspaceData;

    defaultSettings: Settings = new Map(Object.entries({
        'showGrid': {type: 'bool', value: false},
        'gridSpacing': {type: 'float', value: 1.0},
        'showModContours': {type: 'bool', value: true},
        'showPhaseContours': {type: 'bool', value: false},
        'polarCoords': {type: 'bool', value: false},
    }))
    settings: Settings = cloneMap(this.defaultSettings)

    constructor(canvas: HTMLCanvasElement, workspace: WorkspaceData) {
        this.c = canvas;
        this.mousePos = {x: 0, y: 0};

        this.defaultWorkspace = workspace;
        uvars.set(workspace.vars);
        this.compileUserCodeToGlsl(workspace.code, false);
    }

    updateSetting(name: string, value: any, render=true) {
        if (!this.settings.has(name)) throw new Error(`setting ${name} doesnt exist`);
        this.settings.get(name).value = value;
        if (this.mainProgram.uniforms.has(`u_${name}`)) {
            this.mainProgram.setUniformValue(`u_${name}`, value);
        }
        if (render) this.render();
    }
    getSetting(name: string) {
        if (!this.settings.has(name)) throw new Error(`setting ${name} doesnt exist`);
        return this.settings.get(name).value;
    }

    addUniform(name: string, value: UniformValue=null, type: UniformType="float") {
        this.mainProgram.addUniform(new Uniform(name, type));
        this.compProgram.addUniform(new Uniform(name, type));
        this.setUniformValue(name, value);
    }
    deleteUniform(name: string) {
        this.mainProgram.deleteUniform(name);
        this.compProgram.deleteUniform(name);
    }
    setUniformValue(name: string, value: any) { 
        this.mainProgram.setUniformValue(name, value);
        this.compProgram.setUniformValue(name, value);
    }

    addUniformsFromWorkspace(workspace: WorkspaceData) {
        workspace.vars.forEach(v => {
            if (v.type === "float") this.addUniform(v.name, v.value, "float");
            if (v.type === "vec2") this.addUniform(v.name, [v.x, v.y], "vec2");
        })
    }

    loadNewWorkSpace(workspace: WorkspaceData) {
        get(uvars).forEach(v => this.deleteUniform(v.name));
        uvars.set(workspace.vars);
        this.addUniformsFromWorkspace(workspace);
        this.compileUserCodeToGlsl(workspace.code, true);
    }

    recompilePrograms() {
        console.log(this.mainProgram.uniforms)
        try {
            this.mainProgram.recompile(this.userCodeGlsl);
            this.compProgram.recompile(this.userCodeGlsl);
        }
        catch (e) {
            compilationErrors.set([e]);
            return;
        }
        compilationErrors.set([]);
        this.render();
    }

    compileUserCodeToGlsl(src: string, recompileProgramsAfter=true) {
        const uvarsSimple = new Map(get(uvars).map(x => [x.name, x.type]))
        console.log(uvarsSimple)
        const cOut = compile(src, uvarsSimple);
        console.log("compiler output: ", cOut);
        if (cOut.errors.length > 0) {
            compilationErrors.set(cOut.errors)
        }
        else {
            compilationErrors.set([]);
            this.userCodeGlsl = cOut.glslString;
            if (recompileProgramsAfter) this.recompilePrograms(); // should always happen except on init
        }
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

    renderShapes() {
        const gl = this.gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        gl.useProgram(this.shapeProgram.id);
        this.shapeProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
        this.shapeProgram.setUniformValue("u_resolution", [this.c.width, this.c.height]);
        this.shapeProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
        this.shapeProgram.bindAllUniforms();

        gl.viewport(0, 0, this.c.width, this.c.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.disable(gl.BLEND)
    }

    render(once=true) {	
        const gl = this.gl;		
        gl.viewport(0, 0, this.c.width, this.c.height);
        gl.clearColor(0.42, 0.42, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(this.mainProgram.id);
        
        this.mainProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
        this.mainProgram.setUniformValue("u_mouse", [this.mousePos.x, this.mousePos.y]);
        this.mainProgram.setUniformValue("u_resolution", [this.c.width, this.c.height]);
        this.mainProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
        this.mainProgram.bindAllUniforms();
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        
        this.renderShapes();

        if (!once) requestAnimationFrame(() => this.render(once));
    }

    async init(error: (s: string) => any) {
        const c = this.c;
        utils.resizeCanvasToDisplaySize(c);

        const gl = c.getContext("webgl2");
        if (!gl) {
            error("No WebGL2 context"); return;
        }
        this.gl = gl;

        this.camera = new Camera(c, { setEventListeners: false });

        let ext = gl.getExtension('EXT_color_buffer_float');
		if (!ext) {
            error("EXT_color_buffer_float not supported"); return;
        }

        let mainProgram = new ProgramManager(gl, [
            new Uniform("u_worldMat", "mat3"),
            new Uniform("u_mouse", "vec2"),
            new Uniform("u_resolution", "vec2"),
            new Uniform("u_scale", "vec2"),
        ]);
        this.settings.forEach((v, k) => {
            mainProgram.addUniform(new Uniform(`u_${k}`, v.type, v.value))
        })
        this.mainProgram = mainProgram;
        // console.table(Array.from(mainProgram.uniforms.values()).map(u => [u.name, u.value]))

        let compProgram = new ProgramManager(gl, [
            new Uniform("u_point", "vec2"),
        ])
        this.compProgram = compProgram

        let shapeProgram = new ProgramManager(gl, [
            new Uniform("u_worldMat", "mat3"),
            new Uniform("u_resolution", "vec2"),
            new Uniform("u_scale", "vec2"),
        ]);
        this.shapeProgram = shapeProgram

        this.addUniformsFromWorkspace(this.defaultWorkspace);

        await mainProgram.compileFromUrls("shaders/main/vertex.glsl", "shaders/main/fragment.glsl", this.userCodeGlsl);
        await compProgram.compileFromUrls("shaders/comp-fval/vertex.glsl", "shaders/comp-fval/fragment.glsl", this.userCodeGlsl);
        await shapeProgram.compileFromUrls("shaders/shapes/vertex.glsl", "shaders/shapes/fragment.glsl", this.userCodeGlsl);

        if (!(mainProgram && compProgram && shapeProgram)) { return; }
        
		utils.bufferFullscreenQuad(gl, gl.getAttribLocation(mainProgram.id, "a_position"));
		utils.bufferFullscreenQuad(gl, gl.getAttribLocation(shapeProgram.id, "a_position"));

        // setup framebuffer for computing and reading f(z) in computeFval
        let compFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, compFbo);
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        this.compFbo = compFbo;
    }
}

export { Canvas, type Settings }