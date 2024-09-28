<script lang="ts">
  import type { Canvas } from "../../canvas";
  import { coloringFuncs, defaultColoringFunc } from "../../workspace";
  import Editor from "../Editor.svelte";

  export let canvas: Canvas;

  let editorText = canvas.coloringFuncSrc;

  function onColorEditorInput(src: string) {
    const cOut = canvas.compileColoringFunction(src, true);
    return cOut.glslString;
  }
  function onColorEditorSelectExample(name: string) {
    const src = coloringFuncs[name];
    const cOut = canvas.compileColoringFunction(src);
    return cOut.glslString;
  }
  function onColorEditorReset() {
    onColorEditorSelectExample(defaultColoringFunc);
  }
</script>

<div id="container">
  <div class="setting color-section">
    <div class="color-label">Coloring function:</div>
    <Editor
      {canvas}
      bind:code={editorText}
      exampleName={defaultColoringFunc}
      glslOutput={canvas.coloringFunctionGlsl}
      examples={coloringFuncs}
      onInput={onColorEditorInput}
      onSelectExample={onColorEditorSelectExample}
      onReset={onColorEditorReset}
    />
  </div>
</div>

<style lang="scss">
  #container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .setting {
    display: flex;
    gap: 10px;
    padding: 10px;
    align-items: center;
    border: 1px solid #ffffff29;
    border-inline: none;
    color: var(--c-white);
  }
  .color-section {
    display: block;
    padding-inline: 0;
    .color-label {
      padding-left: 10px;
      padding-bottom: 10px;
    }
  }
</style>
