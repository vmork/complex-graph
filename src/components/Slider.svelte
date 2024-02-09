<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fly, fade, scale } from "svelte/transition";
    import { makeAbsolute } from "../utils";
    import type { UserSlider } from "../types";

    export let sd: UserSlider;
    
    let dispatch = createEventDispatcher();
    let showEditUI = false;
    let prevName = sd.name;

    function onNameChange(e: Event) {
        dispatch("nameChange", {prevName: prevName, slider: sd});
        prevName = sd.name;
    }

    function onValueChange(e: Event) {
        dispatch("valueChange", sd);
        updateMinMax();
    }

    function updateMinMax() {
        sd.min = Math.min(sd.min, sd.value);
        sd.max = Math.max(sd.max, sd.value);
    }
</script>

<div id="container" on:keydown={(e) => { if (e.key === "Enter") showEditUI = false }} 
        transition:scale|local={{ duration: 300 }}>
    <div id="row1">
        <input id="name-input" type="text" size={Math.max(sd.name.length-3, 1)}
            bind:value={sd.name} on:input={onNameChange}/> 
        <span>=</span>
        <input id="value-input" type="number" min={sd.min} max={sd.max} step={sd.step} 
            bind:value={sd.value} on:input={onValueChange}/>
        <button id="settings-btn" on:click={() => showEditUI = !showEditUI}>
            <i class="bi bi-gear" class:active={showEditUI}></i>
        </button>
        <button on:click={() => dispatch("delete", sd)}>
            <i class="bi bi-x-circle"></i>
        </button>
    </div>
    {#if showEditUI}
        <div id="edit-ui">
            <span>Min: </span><input type="number"  bind:value={sd.min}/>
            <span>Max: </span><input type="number"  bind:value={sd.max}/>
            <span>Step: </span><input type="number" bind:value={sd.step}/>
        </div>
    {:else}
    <div id="row2">
        <span>{sd.min}</span>
        <input id="slider" type="range" min={sd.min} max={sd.max} step={sd.step} 
            bind:value={sd.value} on:input={onValueChange}/>
        <span>{sd.max}</span>
    </div>
    {/if}
</div>

<style lang="scss">
    // Remove the default input[type="number"] spinner
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button,
    input[type=number] {
        -webkit-appearance: none;
        -moz-appearance: textfield;
        margin: 0;
    }

    #container {
        display: flex;
        flex-direction: column;
        gap: 7px;
        padding: 10px;
        border: 1px solid var(--c-light-grey);
        background-color: var(--c-dark-grey);
        &:focus-within {
            border: 1px solid var(--c-primary);
        }
        margin: 0;
    }
    #row1, #row2 {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    input[type='range'] {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        flex-grow: 1;
        &::-webkit-slider-runnable-track{
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
            transition: background-color 0.2s, transform 0.2s;
        }
    }
    input {
        outline: none;
    }
    #name-input, #value-input {
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
        }
    }
    #value-input {
        width: 100%;
    }
    #settings-btn {
        margin-left: auto;
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

