<script lang="ts">
    import type { Canvas } from "../canvas";
    import { makeAbsolute } from "../utils";
    import Navbar, { Tab } from "./Navbar.svelte";
    import Editor from "./Editor.svelte";
    import Slider from "./Slider.svelte";
    import Controls from "./Controls.svelte";
    import type { UserVariable, UserPoint, UserSlider } from "../types";

    import { fly } from "svelte/transition";
    import { v4 as uuidv4 } from 'uuid';

    export let canvas: Canvas;
    export let collapsed = false;
    export let variables: UserVariable[] = [
        {id: uuidv4(), type: "slider", name: "x", value: 0, min: -10, max: 10, step: 0.01}
    ];

    variables.forEach(slider => {
        if (slider.type === "slider") canvas.addUniform(slider.name, slider.value, "float");
        else if (slider.type === "point") canvas.addUniform(slider.name, [slider.x, slider.y], "vec2");
    });

    let tabs: Tab[] = [
        {name: "Main", id: 1},
        {name: "Controls", id: 2},
    ]
    let activeTab = tabs[0];
    let tabTransitionDuration = 150;

    function addSlider() {
        variables = [...variables, {id: uuidv4(), type: "slider", name: "", value: 0, min: -10, max: 10, step: 0.01}]
        // dont add uniform to canvas until name is set
    }
    function addPoint() {
        variables = [...variables, {id: uuidv4(), type: "point", name: "", x: 0, y: 0}]
    }

    function deleteVariable(slider: UserVariable) {
        if (!(variables.some(s => (s.name === slider.name) && (s.id !== slider.id)))) {
            canvas.deleteUniform(slider.name);
            canvas.recompilePrograms();
        }
        variables = variables.filter(s => s.id !== slider.id);
    }

    function variableValueChange(x: UserVariable) {
        if (!x.name.trim()) return;    
        canvas.setUniformValue(x.name, x.type === "slider" ? x.value : [x.x, x.y]);
        canvas.render();
    }

    function variableNameChange(info: {prevName: string, slider: UserVariable}) {
        let [prevName, variable] = [info.prevName, info.slider];
        
        if (prevName.trim() && !(variables.some(s => (s.name === prevName) && (s.id !== variable.id)))) {
            canvas.deleteUniform(prevName);
        }
        if (variable.name.trim()) {
            if (variable.type === "slider") canvas.addUniform(variable.name, variable.value, "float");
            else if (variable.type === "point") canvas.addUniform(variable.name, [variable.x, variable.y], "vec2");
        }
        canvas.recompilePrograms(); 
    }

</script>

<div id="sidebar">
    <div id="tab-area">
        <Navbar tabs={tabs} bind:activeTab={activeTab}/>
    
        <button id="btn-collapse" 
            on:click={() => collapsed = !collapsed}>
            <i class="bi bi-chevron-double-{collapsed ? 'right': 'left'}"></i>      
        </button>
    </div>

    <div id="below-tab-area">
        {#if activeTab.id == 1}
        <div id="main-tab" 
            in:fly={{ x:-10, duration: tabTransitionDuration }} 
            out:fly={{ x:10, duration: tabTransitionDuration }}
            on:outrostart={makeAbsolute}>
        <Editor canvas={canvas} text={canvas.userFunctionSrc}/>
        <div id="variables-area">
            {#each variables as v (v.id)}
                {#if v.type === "slider"}
                    <Slider 
                        sd={v}
                        on:delete={(e) => deleteVariable(e.detail)}
                        on:nameChange={(e) => variableNameChange(e.detail)}
                        on:valueChange={(e) => variableValueChange(e.detail)}
                    />
                {:else if v.type === "point"}
                    Point {v.name} {v.x} {v.y}
                {/if}
            {/each}
            <button id="add-slider-btn" on:click={addSlider}>
                <i class="bi bi-plus"></i>Add slider
            </button>
            <button id="add-point-btn" on:click={addPoint}>
                <i class="bi bi-plus"></i>Add point
            </button>
        </div>
        </div>

        {:else if activeTab.id == 2}
        <div id="controls-tab"  
            transition:fly={{ x: -100, duration: tabTransitionDuration}}>
            <Controls {canvas}></Controls>
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
        overflow-y: scroll;
        &::-webkit-scrollbar {
            display: none;
        }
        overflow-x: hidden;
        height: 100%;
        padding: 0;
    }
    #controls-tab {
        height: 100%;
    }
    #add-slider-btn {
        margin-top: 10px;
        border: 1px solid var(--c-light-grey);
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

