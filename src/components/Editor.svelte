<script lang="ts">
  import { compilationErrors } from "../stores";
  import type { Canvas } from "../canvas";
  import {
    workspaceExamples,
    defaultWorkspaceName,
    WorkspaceData,
  } from "../workspace";
  import { fade } from "svelte/transition";

  export let canvas: Canvas;
  export let code: string;

  let preElem: HTMLPreElement;
  let glslOutput = canvas.userCodeGlsl;
  let showGlslOutput = false;
  let currentExampleName = defaultWorkspaceName;
  const initText = code;
  let showExamples = false;
  const tabsize = 4;

  function onSelectExample(name: string, example: WorkspaceData) {
    console.log("select", name, example);
    currentExampleName = name;
    code = example.code;
    canvas.loadNewWorkSpace(example);
  }
  document.addEventListener("click", (e) => {
    if (
      showExamples &&
      !(e as any).target.closest("#examples-container") &&
      !(e as any).target.closest("#tooltip-container")
    ) {
      showExamples = false;
    }
  });

  function handleInput(e) {
    code = (e.target as HTMLPreElement).innerText;
    canvas.compileUserCodeToGlsl(code, true);
    glslOutput = canvas.userCodeGlsl;
    $compilationErrors.forEach((err) => console.error(err.toString()));
  }

  function insertTab() {
    // https://stackoverflow.com/a/52715915
    let selection = window.getSelection();
    let cursorPos = selection.getRangeAt(0).startOffset;
    let focus = selection.focusNode;
    let offset = selection.focusOffset;
    // focus.textContent = code.slice(0, cursorPos) + " ".repeat(tabsize) + code.slice(cursorPos);

    let range = document.createRange();
    range.selectNode(focus);
    range.setStart(focus, offset + tabsize);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    code = preElem.innerText;
  }

  function handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      insertTab();
    }
  }
</script>

<div id="buttons-div">
  <button
    on:click={() => (showGlslOutput = !showGlslOutput)}
    class:selected={showGlslOutput}>Show glsl</button
  >
  <button on:click={() => (code = initText)}>Reset</button>
  <div id="tooltip-container">
    <button
      on:click={() => (showExamples = !showExamples)}
      class:selected={showExamples}>Examples</button
    >
    {#if showExamples}
      <div id="examples-container" transition:fade={{ duration: 100 }}>
        {#each Object.entries(workspaceExamples) as [name, example]}
          <button
            class:selected={name === currentExampleName}
            on:click={() => onSelectExample(name, example)}>{name}</button
          >
        {/each}
      </div>
    {/if}
  </div>
</div>

<pre
  class:error={$compilationErrors.length > 0}
  id="editor"
  contenteditable="true"
  bind:this={preElem}
  on:input={handleInput}
  on:keydown={handleKeyDown}>{code}</pre>

{#if $compilationErrors.length > 0}
  <div id="error-div">
    {#each $compilationErrors as err, i}
      <p>{err.toString()}</p>
    {/each}
  </div>
{/if}

{#if showGlslOutput}
  <span style:color="var(--c-white)">Transpiled glsl: </span>
  <pre id="glsl-output">{glslOutput}</pre>
{/if}

<style lang="scss">
  :root {
    --c-red: rgb(121, 53, 53);
  }
  #editor,
  #glsl-output {
    font-size: 1em;
    width: 100%;
    color: var(--c-white);
    background-color: var(--c-dark-grey);
    margin: 0 0 10px 0;
    border: 1px solid var(--c-light-grey);
    border-inline: none;
    padding: 10px;
    outline: none;
    white-space: pre;
    display: inline-block;
    &::-webkit-scrollbar {
      display: none;
    }
  }
  #editor {
    max-height: 200px;
    overflow-y: scroll;
    &:focus {
      border: 1px solid var(--c-primary);
      border-inline: 0;
    }
    &.error {
      border: 1px solid var(--c-red);
      border-inline: 0;
    }
  }
  #glsl-output {
    margin-bottom: 10px;
    overflow-x: scroll;
  }
  #error-div {
    width: 100%;
    background-color: var(--c-red);
    color: var(--c-white);
    padding: 5px;
    display: inline-block;
    margin-bottom: 5px;
    translate: 0 -15px;
    border: 1px solid var(--c-red);
    p {
      margin: 0;
    }
  }
  #buttons-div {
    display: flex;
    gap: 20px;
    button {
      padding: 3px;
      &.selected {
        color: var(--c-white);
      }
    }
  }

  #tooltip-container {
    position: relative;
    display: inline-block;
  }

  #examples-container {
    display: flex;
    position: absolute;
    color: var(--c-white);
    background-color: var(--c-dark);
    z-index: 10;
    box-shadow: 0 0 5px var(--c-dark-grey);
    flex-flow: column nowrap;
    gap: 1px;
    align-items: flex-start;
    padding: 0 0 10px 0;
    button {
      width: 100%;
      padding: 7px 10px;
      display: inline;
      text-align: left;
      &.selected {
        color: var(--c-primary);
      }
      transition: none;
    }
  }
</style>
