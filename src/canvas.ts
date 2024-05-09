import type { Point } from "./types";
import { Camera } from "./camera";
import * as utils from "./webgl-utils";
import { ProgramManager, Uniform, UniformType, UniformValue } from "./webgl-program";
import { compile } from "./compiler/main";
import { uvars, shapes, compilationErrors } from "./stores";
import { get } from "svelte/store";
import { WorkspaceData } from "./workspace";
import { RGBStringToVec3, cloneMap } from "./utils";
import { Circle, Shape } from "./shapes";

type Settings = Map<string, { type: UniformType; value: any }>;

class Canvas {
  gl: WebGL2RenderingContext;
  c: HTMLCanvasElement;
  camera: Camera;
  compFbo: WebGLFramebuffer;
  mainProgram: ProgramManager;
  compProgram: ProgramManager;
  shapeProgram: ProgramManager;
  userCodeGlsl: string;
  mousePos: Point = { x: 0, y: 0 };
  defaultWorkspace: WorkspaceData;
  quadVao: WebGLVertexArrayObject;
  shapesVao: WebGLVertexArrayObject;

  defaultSettings: Settings = new Map(
    Object.entries({
      showGrid: { type: "bool", value: false },
      gridSpacing: { type: "float", value: 1.0 },
      showModContours: { type: "bool", value: true },
      showPhaseContours: { type: "bool", value: false },
      polarCoords: { type: "bool", value: false },
    })
  );
  settings: Settings = cloneMap(this.defaultSettings);

  constructor(canvas: HTMLCanvasElement, workspace: WorkspaceData) {
    this.c = canvas;
    this.mousePos = { x: 0, y: 0 };

    this.defaultWorkspace = workspace;
    uvars.set(workspace.vars ?? []);
    shapes.set(workspace.shapes ?? []);
    this.compileUserCodeToGlsl(workspace.code, false);
  }

  async init(error: (s: string) => any) {
    const c = this.c;
    utils.resizeCanvasToDisplaySize(c);

    const gl = c.getContext("webgl2");
    if (!gl) {
      error("No WebGL2 context");
      return;
    }
    this.gl = gl;

    this.camera = new Camera(c, { setEventListeners: false });

    let ext = gl.getExtension("EXT_color_buffer_float");
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
    this.mainProgram = mainProgram;
    // console.table(Array.from(mainProgram.uniforms.values()).map(u => [u.name, u.value]))

    let compProgram = new ProgramManager(gl, [new Uniform("u_point", "vec2")]);
    this.compProgram = compProgram;

    let shapeProgram = new ProgramManager(gl, [
      new Uniform("u_worldMatInv", "mat3"),
      new Uniform("u_color", "vec3"),
      new Uniform("u_t", "float"),
      new Uniform("u_scale", "vec2"),
      new Uniform("u_pointSize", "float"),
    ]);
    this.shapeProgram = shapeProgram;

    this.addUniformsFromWorkspace(this.defaultWorkspace);

    await mainProgram.compileFromUrls("shaders/main/vertex.glsl", "shaders/main/fragment.glsl", this.userCodeGlsl);
    await compProgram.compileFromUrls(
      "shaders/comp-fval/vertex.glsl",
      "shaders/comp-fval/fragment.glsl",
      this.userCodeGlsl
    );
    console.log(this.userCodeGlsl);
    await shapeProgram.compileFromUrls("shaders/shapes/vertex.glsl", "shaders/shapes/fragment.glsl", this.userCodeGlsl);
    if (!(mainProgram && compProgram && shapeProgram)) {
      return;
    }

    // create vertex arrays for fullscreen quad and shape vertices
    this.quadVao = utils.bufferFullscreenQuad(gl, gl.getAttribLocation(mainProgram.id, "a_position"));
    this.shapesVao = this.createShapeVao();

    // setup framebuffer for computing and reading f(z) in computeFval
    let compFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, compFbo);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    this.compFbo = compFbo;
  }

  updateSetting(name: string, value: any, render = true) {
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

  addUniform(name: string, value: UniformValue = null, type: UniformType = "float") {
    this.mainProgram.addUniform(new Uniform(name, type));
    this.compProgram.addUniform(new Uniform(name, type));
    this.shapeProgram.addUniform(new Uniform(name, type));
    this.setUniformValue(name, value);
  }
  deleteUniform(name: string) {
    this.mainProgram.deleteUniform(name);
    this.compProgram.deleteUniform(name);
    this.shapeProgram.deleteUniform(name);
  }
  setUniformValue(name: string, value: any) {
    this.mainProgram.setUniformValue(name, value);
    this.compProgram.setUniformValue(name, value);
    this.shapeProgram.setUniformValue(name, value);
  }

  addUniformsFromWorkspace(workspace: WorkspaceData) {
    workspace.vars.forEach((v) => {
      if (v.type === "float") this.addUniform(v.name, v.value, "float");
      if (v.type === "vec2") this.addUniform(v.name, [v.x, v.y], "vec2");
    });
  }

  loadNewWorkSpace(workspace: WorkspaceData) {
    get(uvars).forEach((v) => this.deleteUniform(v.name));
    uvars.set(workspace.vars);
    shapes.set(workspace.shapes);
    this.addUniformsFromWorkspace(workspace);
    this.compileUserCodeToGlsl(workspace.code, true);
  }

  recompilePrograms() {
    console.log(this.mainProgram.uniforms);
    try {
      this.mainProgram.recompile(this.userCodeGlsl);
      this.compProgram.recompile(this.userCodeGlsl);
      this.shapeProgram.recompile(this.userCodeGlsl);
    } catch (e) {
      compilationErrors.set([e]);
      return;
    }
    compilationErrors.set([]);
    this.render();
  }

  compileUserCodeToGlsl(src: string, recompileProgramsAfter = true) {
    const uvarsSimple = new Map(get(uvars).map((x) => [x.name, x.type]));
    const cOut = compile(src, uvarsSimple);
    if (cOut.errors.length > 0) {
      compilationErrors.set(cOut.errors);
    } else {
      compilationErrors.set([]);
      this.userCodeGlsl = cOut.glslString;
      if (recompileProgramsAfter) this.recompilePrograms(); // should always happen except on init
    }
  }

  computeFval(p: Point): Point {
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

  createShapeVao() {
    const gl = this.gl;
    let positionLoc = gl.getAttribLocation(this.shapeProgram.id, "a_position");
    let buffer = gl.createBuffer();
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    return vao;
  }

  renderShape(shape: Shape) {
    const gl = this.gl;

    gl.useProgram(this.shapeProgram.id);
    let col = RGBStringToVec3(shape.color);
    this.shapeProgram.setUniformValue("u_color", col);
    this.shapeProgram.setUniformValue("u_worldMatInv", this.camera.getInverseWorldMatrix());
    this.shapeProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
    this.shapeProgram.setUniformValue("u_pointSize", Math.max(1.0, shape.thickness));
    this.shapeProgram.bindAllUniforms();

    const maxLineWidth = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)[1];

    let method = gl.LINE_STRIP as number;
    if (shape.lineStyle === "points") {
      method = gl.POINTS;
    } else if (shape.lineStyle === "lines") {
      method = gl.LINE_STRIP;
      gl.lineWidth(Math.min(shape.thickness, maxLineWidth));
    } else if (shape.lineStyle === "filled") {
      // filled circles are already handled by adding points inside
      // for other shapes we just fill with triangle fan, for now atleast
      if (shape instanceof Circle) method = gl.POINTS;
      else {
        shape.vertices = new Float32Array([shape.vertices[0], shape.vertices[1], ...shape.vertices]);
        method = gl.TRIANGLE_FAN;
      }
    }
    // gl.bindBuffer(gl.ARRAY_BUFFER, this.shapesVao);
    gl.bufferData(gl.ARRAY_BUFFER, shape.vertices, gl.STATIC_DRAW);
    gl.drawArrays(method, 0, shape.vertices.length / 2);
  }

  render() {
    const gl = this.gl;
    gl.viewport(0, 0, this.c.width, this.c.height);
    gl.clearColor(0.42, 0.42, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(this.mainProgram.id);
    this.mainProgram.setUniformValue("u_worldMat", this.camera.getWorldMatrix());
    this.mainProgram.setUniformValue("u_mouse", [this.mousePos.x, this.mousePos.y]);
    this.mainProgram.setUniformValue("u_resolution", [this.c.width, this.c.height]);
    this.mainProgram.setUniformValue("u_scale", [this.camera.scale.x, this.camera.scale.y]);
    this.mainProgram.bindAllUniforms();

    gl.bindVertexArray(this.quadVao);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.bindVertexArray(this.shapesVao);
    for (let shape of get(shapes)) {
      this.renderShape(shape);
    }
  }
}

export { Canvas, type Settings };
