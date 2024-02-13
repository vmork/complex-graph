<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { scale } from "svelte/transition";
    import type { UserVariable, UserSlider } from "../types";

    export let data: UserVariable;
    
    let dispatch = createEventDispatcher();
    let showEditUI = false;
    let prevName = data.name;

    if (data.type === "point") console.log(data.color)

    function onNameChange(e: Event) {
        dispatch("nameChange", {prevName: prevName, data: data});
        prevName = data.name;
    }

    function onValueChange(e: Event) {
        dispatch("valueChange", data);
        updateMinMax();
    }

    function updateMinMax() {
        if (data.type === "slider") {
            data.min = Math.min(data.min, data.value);
            data.max = Math.max(data.max, data.value);
        }
    }
</script>

<div id="container" on:keydown={(e) => { if (e.key === "Enter") showEditUI = false }} 
        transition:scale|local={{ duration: 200 }}>
    <div id="row1">
        {#if data.type === "point"}
            <input type="color" id="color-picker" 
                bind:value={data.color}
                on:input={onValueChange}
                style:background-color={data.color}>
        {/if}

        <input id="name-input" type="text" size={Math.max(data.name.length-3, 1)}
            bind:value={data.name} on:input={onNameChange}/> 
        <span class="eq-sign">=</span>

        {#if data.type === "slider"}
            <input id="value-input" type="number" min={data.min} max={data.max} step={data.step} 
                bind:value={data.value} on:input={onValueChange}/>
        {:else if data.type === "point"}
            a: <input id="value-input" type="number" bind:value={data.x} on:input={onValueChange}/>
            b: <input id="value-input" type="number" bind:value={data.y} on:input={onValueChange}/>
        {/if}

        <button id="settings-btn" on:click={() => showEditUI = !showEditUI}>
            <i class="bi bi-gear" class:active={showEditUI}></i>
        </button>
        <button on:click={() => dispatch("delete", data)}>
            <i class="bi bi-x-circle"></i>
        </button>
    </div>
    {#if showEditUI}
        <div id="edit-ui">
            {#if data.type === "slider"}
                <span>Min: </span><input type="number"  bind:value={data.min}/>
                <span>Max: </span><input type="number"  bind:value={data.max}/>
                <span>Step: </span><input type="number" bind:value={data.step}/>
            {/if}
        </div>
    {:else}
        {#if data.type === "slider"}
            <div id="row2">
                <span>{data.min}</span>
                <input id="slider" type="range" min={data.min} max={data.max} step={data.step} 
                    bind:value={data.value} on:input={onValueChange}/>
                <span>{data.max}</span>
            </div>
        {/if}
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
    .eq-sign {
        display: inline-block;
        font-size: 1.5em;
        color: var(--c-light-grey);
        translate: -10px 0px;
    }
    input {
        outline: none;
    }
    #name-input {
        translate: 0 -1px;
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

