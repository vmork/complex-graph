<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { UserVariable } from "../types";
  import { roundToDigits } from "../utils";
  import ResizableInput from "./ui/ResizableInput.svelte";

  export let data: UserVariable;

  let dispatch = createEventDispatcher();
  let showEditUI = false;
  let prevName = data.name;
  let nameInputElem: HTMLInputElement;

  let displayX, displayY;
  $: {
    if (data.type === "vec2") {
      displayX = roundToDigits(data.x, 3);
      displayY = roundToDigits(data.y, 3);
    }
  }

  function resetPoint() {
    if (data.type === "vec2") {
      data.x = 0;
      data.y = 0;
    }
    onValueChange();
    showEditUI = false;
  }

  function onNameChange() {
    dispatch("nameChange", { prevName: prevName, data: data });
    prevName = data.name;
  }

  function onPointValueChange(xory: "x" | "y", e) {
    if (data.type !== "vec2") return; //typescript
    if (xory === "x") data.x = e.target.value;
    if (xory === "y") data.y = e.target.value;
    onValueChange();
  }

  function onValueChange() {
    dispatch("valueChange", data);
    updateMinMax();
  }

  function updateMinMax() {
    if (data.type === "float") {
      data.min = Math.min(data.min, data.value);
      data.max = Math.max(data.max, data.value);
    }
  }

  onMount(() =>  {
    nameInputElem.focus();
  })

</script>

<div
  id="container"
  on:keydown={(e) => {
    if (e.key === "Enter") showEditUI = false;
  }}
>
  <div id="row1">
    {#if data.type === "vec2"}
      <input
        type="color"
        id="color-picker"
        bind:value={data.color}
        on:input={onValueChange}
        style:background-color={data.color}
      />
    {/if}

    <ResizableInput
      type="text"
      bind:value={data.name}
      bind:inputElem={nameInputElem}
      on:input={onNameChange}
    />

    <span class="non-clickable">=</span>

    {#if data.type === "float"}
      <input
        id="value-input"
        type="number"
        min={data.min}
        max={data.max}
        step={data.step}
        bind:value={data.value}
        on:input={onValueChange}
      />
    {:else if data.type === "vec2"}
      <ResizableInput
        type="number"
        value={displayX}
        on:input={(e) => onPointValueChange("x", e)}
        step={0.001}
      /> <span class="non-clickable">+</span>
      <ResizableInput
        type="number"
        value={displayY}
        on:input={(e) => onPointValueChange("y", e)}
        step={0.001}
      /> <span class="non-clickable letter-i">i</span>
    {/if}

    <button id="settings-btn" on:click={() => (showEditUI = !showEditUI)}>
      <i class="bi bi-gear" class:active={showEditUI}></i>
    </button>
    <button on:click={() => dispatch("delete", data)}>
      <i class="bi bi-x-circle"></i>
    </button>
  </div>
  {#if showEditUI}
    <div id="edit-ui">
      {#if data.type === "float"}
        <span>Min: </span><input type="number" bind:value={data.min} />
        <span>Max: </span><input type="number" bind:value={data.max} />
        <span>Step: </span><input type="number" bind:value={data.step} />
      {:else}
        <button id="reset-point-btn" on:click={resetPoint}>Reset</button>
      {/if}
    </div>
  {:else if data.type === "float"}
    <div id="row2">
      <span>{data.min}</span>
      <input
        id="slider"
        type="range"
        min={data.min}
        max={data.max}
        step={data.step}
        bind:value={data.value}
        on:input={onValueChange}
      />
      <span>{data.max}</span>
    </div>
  {/if}
</div>

<style lang="scss">
  // Remove the default input[type="number"] spinner
  :global(
      input[type="number"]::-webkit-outer-spin-button,
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]
    ) {
    -webkit-appearance: none;
    -moz-appearance: textfield; // ignore the warning, dont add appearance: textfield
    margin: 0;
  }

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
  #row1,
  #row2 {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
    flex-grow: 1;
    &::-webkit-slider-runnable-track {
      background: var(--c-light-grey);
      height: 5px;
      border-radius: 3px;
    }
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 15px;
      height: 15px;
      background: var(--c-primary);
      border-radius: 50%;
      margin-top: calc(-7.5px + 2.5px);
      &:hover {
        // background: #5fc545;
        transform: scale(1.3);
      }
      transition:
        background-color 0.2s,
        transform 0.2s;
    }
  }
  .non-clickable {
    display: inline-block;
    font-size: 1.5em;
    color: #eeeeeec8;
    translate: -5px 1px;
    &.letter-i {
      font-size: 1.4em;
      font-family: "TeX Gyre Pagella";
      translate: -10px 1px;
    }
  }
  input {
    outline: none;
  }
  #value-input {
    font-size: 1.2em;
    color: #eeeeeedb;
    border: none;
    background-color: transparent;
  }
  #edit-ui {
    display: flex;
    align-items: center;
    input {
      font-size: 1em;
      background-color: transparent;
      color: #eeeeeedb;
      border: none;
      border-bottom: 1px solid var(--c-light-grey);
      width: 50px;
      margin: 0 5px;
      &:focus {
        border-bottom: 1px solid var(--c-primary);
      }
    }
    #reset-point-btn {
      translate: 0;
    }
  }
  #value-input {
    width: 100%;
  }
  #settings-btn {
    margin-left: auto;
  }
  #color-picker {
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
