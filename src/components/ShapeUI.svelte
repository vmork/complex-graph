<script lang="ts">
  import { Shape, Circle } from "../shapes";
  import ResizableInput from "./ResizableInput.svelte";
  import { shapes } from "../stores";
  import { Canvas } from "../canvas";

  import { createEventDispatcher } from "svelte";

  export let shape: Shape;
  export let canvas: Canvas;

  const dispatch = createEventDispatcher();
  let showEditUI = false;

  function updateParam(e) {
    shape.setVertices();
    $shapes = $shapes;
    canvas.render();
  }
</script>

<div
  id="container"
  on:keydown={(e) => {
    if (e.key === "Enter") showEditUI = false;
  }}
>
  <div id="row1">
    <input
      type="color"
      class="color-picker"
      bind:value={shape.color}
      on:input={updateParam}
      style:background-color={shape.color}
    />
    {#if shape instanceof Circle}
      <div class="param">
        <p>x:</p>
        <ResizableInput
          type="number"
          step={0.1}
          bind:value={shape.x}
          on:input={updateParam}
        />
      </div>
      <div class="param">
        <p>y:</p>
        <ResizableInput
          type="number"
          step={0.1}
          bind:value={shape.y}
          on:input={updateParam}
        />
      </div>
      <div class="param">
        <p>r:</p>
        <ResizableInput
          type="number"
          step={0.1}
          bind:value={shape.r}
          on:input={updateParam}
        />
      </div>
      <div class="param">
        <p>filled:</p>
        <input
          type="checkbox"
          bind:checked={shape.filled}
          on:change={updateParam}>
      </div>

    {/if}
    <button id="settings-btn" on:click={() => (showEditUI = !showEditUI)}>
      <i class="bi bi-gear" class:active={showEditUI}></i>
    </button>
    <button on:click={() => dispatch("delete", shape)}>
      <i class="bi bi-x-circle"></i>
    </button>
  </div>
</div>

<style lang="scss">
  
  #container {
    font-size: 0.9em;
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px;
    border: 1px solid var(--c-light-grey);
    border-inline: none;
    background-color: var(--c-dark-grey);
    &:focus-within {
      border: 1px solid var(--c-primary);
      border-inline: none;
    }
    margin: 0;
  }
  #row1 {
    display: flex;
    gap: 7px;
    align-items: center;
  }
  .param {
    p {
      font-size: 1em;
      margin: 0;
    }
    display: flex;
    gap: 1px;
    align-items: center;
  }
  #settings-btn {
    margin-left: auto;
  }

  .color-picker {
    margin-right: 10px;
    cursor: pointer;
    flex: 0 0 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--c-white);
    &:hover {
      scale: 1.2;
    }
    transition: scale 0.2s;
  }
  input[type="color"]::-webkit-color-swatch-wrapper {
    border-radius: 50%;
    padding: 0;
  }
  input[type="color"]::-webkit-color-swatch {
    border-radius: 50%;
    border: none;
  }

  input[type="checkbox"] {
    accent-color: var(--c-primary);
  }
  
  button {
    margin-left: 5px;
    padding: 5px 0 5px 5px;
    translate: 0px -5px;
  }
  i {
    font-size: 1.4em;
    &.active {
      color: var(--c-primary);
    }
  }
</style>
