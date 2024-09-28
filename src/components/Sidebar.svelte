<script lang="ts">
  import type { Canvas } from "../canvas";
  import { Circle, Shape } from "../shapes";
  import { compilationErrors, shapes, uvars } from "../stores";
  import type { UserVariable } from "../types";
  import { randomColorRGB } from "../utils";
  import Editor from "./Editor.svelte";
  import ShapeUI from "./ShapeUI.svelte";
  import SettingsTab from "./tabs/SettingsTab.svelte";
  import Navbar, { Tab } from "./ui/Navbar.svelte";
  import Variable from "./Variable.svelte";

  import { createEventDispatcher } from "svelte";
  import { v4 as uuidv4 } from "uuid";
  import { defaultWorkspaceName, workspaceExamples, WorkspaceName } from "../workspace";
  import ColorsTab from "./tabs/ColorsTab.svelte";
  import Dropdown from "./ui/Dropdown.svelte";

  export let canvas: Canvas;
  export let collapsed = false;
  export let editorText: string = "";

  let dispatch = createEventDispatcher();

  let tabs: Tab[] = [
    { name: "Code", id: 1 },
    { name: "Colors", id: 2 },
    { name: "Settings", id: 3 },
  ];
  let activeTab = tabs[0];

  function duplicateName(v: UserVariable) {
    return $uvars.some((w) => w.id !== v.id && w.name === v.name);
  }

  function addSlider(name = "", value = 0, min = -10, max = 10, step = 0.001) {
    $uvars = [...$uvars, { id: uuidv4(), type: "float", name, value, min, max, step }];
    if (name.trim()) canvas.addUniform(name, value, "float");
  }
  function addPoint(name = "", x = 0, y = 0, color = randomColorRGB()) {
    $uvars = [...$uvars, { id: uuidv4(), type: "vec2", name, x, y, color }];
    if (name.trim()) canvas.addUniform(name, [x, y], "vec2");
  }
  function addShape(type: "circle" | "line" | "custom") {
    let shape: Shape;
    if (type === "circle") shape = new Circle(0, 0, 1);
    else if (type === "line") shape = new Circle(0, 0, 1);
    else shape = new Circle(0, 0, 1);
    $shapes = [...$shapes, shape];
    canvas.render();
  }
  function deleteShape(shape: Shape) {
    $shapes = $shapes.filter((s) => s.id !== shape.id);
    canvas.render();
  }

  function deleteVariable(v: UserVariable) {
    $uvars = $uvars.filter((uvar) => uvar.id !== v.id);
    if (!duplicateName(v)) {
      canvas.deleteUniform(v.name);
      canvas.compileUserCode(editorText, true);
    }
  }

  function variableValueChange(v: UserVariable) {
    $uvars = $uvars;
    dispatch("variableChange", v);
    if (!v.name.trim()) return;
    canvas.setUniformValue(v.name, v.type === "float" ? v.value : [v.x, v.y]);
    canvas.render();
  }

  function variableNameChange(info: { prevName: string; data: UserVariable }) {
    $uvars = $uvars;
    let [prevName, v] = [info.prevName, info.data];

    if (prevName.trim() && !$uvars.some((s) => s.name === prevName && s.id !== v.id)) {
      canvas.deleteUniform(prevName);
    }
    if (duplicateName(v)) {
      console.error("Duplicate name ", v.name);
    } else if (v.name.trim()) {
      if (v.type === "float") canvas.addUniform(v.name, v.value, "float");
      else if (v.type === "vec2") canvas.addUniform(v.name, [v.x, v.y], "vec2");
    }
    canvas.compileUserCode(editorText, true);
  }

  function updateShapeTransform(e) {
    canvas.shapeProgram.setUniformValue("u_t", (e.target as HTMLInputElement).value);
    canvas.render();
  }

  function onSelectWorkspaceExample(name: string) {
    editorText = workspaceExamples[name as WorkspaceName].code.trim();
    canvas.loadNewWorkSpace(name as WorkspaceName);
    return canvas.userCodeGlsl;
  }
  function onEditorReset() {
    editorText = workspaceExamples[defaultWorkspaceName].code.trim();
    canvas.loadNewWorkSpace(defaultWorkspaceName);
  }
  function onEditorInput(src: string): string {
    return compileInput(editorText);
  }

  function compileInput(src: string): string {
    let cOut = canvas.compileUserCode(src, true);
    $compilationErrors = cOut.errors;
    if ($compilationErrors.length) {
      console.error("Compilation errors: ", $compilationErrors);
    }
    return cOut.glslString;
  }
</script>

<div id="sidebar">
  <div id="tab-area">
    <Navbar {tabs} bind:activeTab />

    <button id="btn-collapse" on:click={() => (collapsed = !collapsed)}>
      <i class="bi bi-chevron-double-{collapsed ? 'right' : 'left'}"></i>
    </button>
  </div>

  <div id="below-tab-area">
    {#if activeTab.id == 1}
      <div id="main-tab">
        <Editor
          {canvas}
          bind:code={editorText}
          onInput={onEditorInput}
          glslOutput={canvas.userCodeGlsl}
          examples={workspaceExamples}
          exampleName={defaultWorkspaceName}
          onSelectExample={onSelectWorkspaceExample}
          onReset={onEditorReset}
        />

        <div id="buttons">
          <button class="add-object-btn" on:click={(e) => addSlider()}>
            <i class="bi bi-plus"></i>Slider
          </button>
          <button class="add-object-btn" on:click={(e) => addPoint()}>
            <i class="bi bi-plus"></i>Point
          </button>
          <Dropdown
            items={[
              { name: "Circle", onClick: () => addShape("circle") },
              { name: "Line", onClick: () => addShape("line") },
              { name: "Custom", onClick: () => addShape("custom") },
            ]}
          >
            <button slot="trigger" class="add-object-btn">
              <i class="bi bi-plus"></i>Shape
            </button>
          </Dropdown>
        </div>

        <div id="variables-area">
          {#if $uvars?.length}
            <h3 style="margin: 0 0 4px 0; font-size: 1em; color: var(--c-white);">Variables</h3>
            {#each $uvars as v (v.id)}
              <div >
                <Variable
                  data={v}
                  on:delete={(e) => deleteVariable(e.detail)}
                  on:nameChange={(e) => variableNameChange(e.detail)}
                  on:valueChange={(e) => variableValueChange(e.detail)}
                />
              </div>
            {/each}
          {/if}

          {#if $shapes?.length}
            <div class="shapes-header-row">
              <span>Shapes</span>
              <div class="slider-container">
                <span>Transform:</span>
                <span>0</span>
                <input
                  id="slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.001}
                  value={0.0}
                  on:input={updateShapeTransform}
                />
                <span>1</span>
              </div>
            </div>
            {#each $shapes as shape (shape.id)}
              <div>
                <ShapeUI {shape} {canvas} on:delete={(e) => deleteShape(e.detail)} />
              </div>
            {/each}
          {/if}
        </div>

        <div id="bottom-area"></div>
      </div>
    {:else if activeTab.id == 2}
      <div id="colors-tab">
        <ColorsTab {canvas}></ColorsTab>
        <div id="bottom-area"></div>
      </div>
    {:else if activeTab.id == 3}
      <div id="settings-tab">
        <SettingsTab {canvas}></SettingsTab>
        <div id="bottom-area"></div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  #sidebar {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
    background-color: var(--c-dark);
    color: var(--c-light-grey);
  }
  #below-tab-area {
    height: 100%;
    padding: 0;
  }
  #main-tab,
  #settings-tab,
  #colors-tab {
    height: 100%;
    padding-bottom: 100px;
    overflow: scroll;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  #bottom-area {
    height: 80px;
    flex: none;
  }
  #buttons {
    display: flex;
    gap: 10px;
    padding: 0 0 10px 0;
    position: sticky;
    top: 0;
    background-color: var(--c-dark);
    z-index: 5;
  }
  .shapes-header-row {
    margin-top: 12px;
    color: var(--c-white);
    display: flex;
    align-items: baseline;
    gap: 50px;
    padding: 5px;
    .slider-container {
      color: var(--c-light-grey);
      flex: 1;
      font-size: 0.8em;
      display: flex;
      gap: 5px;
      max-width: 200px;
      input {
        translate: 0 -1px;
      }
    }
  }
  .add-object-btn {
    border: 1px solid var(--c-light-grey);
    padding: 5px;
    // background-color: var(--c-dark-grey);
    color: var(--c-white);
  }
  i {
    font-size: 1.5em;
    color: inherit;
  }
  #btn-collapse {
    position: absolute;
    top: 0;
    right: 0;
    margin: 3px;
  }
</style>
