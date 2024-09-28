<script lang="ts">
  import { fade } from "svelte/transition";
  import type { Canvas } from "../canvas";
  import { compilationErrors } from "../stores";
  import { onFocusOut } from "../utils";

  export let canvas: Canvas;
  export let code: string;
  export let exampleName: string;
  export let examples: Record<string, any>;
  export let onInput: (code: string) => string; // return glsl output
  export let onSelectExample: (name: string, data: string) => string; // return glsl output
  export let onReset: () => void;
  export let glslOutput: string;

  let preElem: HTMLPreElement;
  let showGlslOutput = false;
  let showExamples = false;
  const tabsize = 4;

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

  function handleInput() {
    code = preElem.innerText;
    glslOutput = onInput(code);
  }

  function handleKeyDown(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      insertTab();
    }
  }
</script>

<div id="buttons-div">
  <button on:click={() => (showGlslOutput = !showGlslOutput)} class:selected={showGlslOutput}>Show glsl</button>
  <button on:click={onReset}>Reset</button>
  <div id="tooltip-container" on:focusout={(e) => onFocusOut(e, () => (showExamples = false))}>
    <button on:click={() => (showExamples = !showExamples)} class:selected={showExamples}>Examples</button>
    {#if showExamples}
      <div id="examples-container" transition:fade={{ duration: 100 }}>
        {#each Object.entries(examples) as [name, data]}
          <button
            class:selected={name === exampleName}
            on:click={() => {
              exampleName = name;
              code = examples[name]
              glslOutput = onSelectExample(name, data);
              showExamples = false;
            }}>{name}</button
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
