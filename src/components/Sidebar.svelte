<script lang="ts">
    import type { Canvas } from "../canvas";
    import Navbar, { Tab } from "./Navbar.svelte";
    import Editor from "./Editor.svelte";
    import Slider, { SliderData } from "./Slider.svelte";
    import { makeAbsolute } from "../utils";

    import { fly } from "svelte/transition";
    import { v4 as uuidv4 } from 'uuid';

    export let canvas: Canvas;
    export let collapsed = false;
    export let sliders: SliderData[] = [
        {id: uuidv4(), name: "x", value: 0, min: -10, max: 10, step: 0.01}
    ];

    sliders.forEach(slider => {
        canvas.addUniform(slider.name, slider.value);
    });

    let tabs: Tab[] = [
        {name: "Main", id: 1},
        {name: "Controls", id: 2},
    ]
    let activeTab = tabs[0];
    let tabTransitionDuration = 200;

    function addSlider() {
        sliders = [...sliders, {id: uuidv4(), name: "", value: 0, min: -10, max: 10, step: 0.01}]
        // dont add uniform to canvas until name is set
    }

    function deleteSlider(slider: SliderData) {
        if (!(sliders.some(s => (s.name === slider.name) && (s.id !== slider.id)))) {
            canvas.deleteUniform(slider.name);
            canvas.recompilePrograms();
        }
        sliders = sliders.filter(s => s.id !== slider.id);
    }

    function sliderValueChange(slider: SliderData) {
        if (!slider.name.trim()) return;    
        canvas.setUniformValue(slider.name, slider.value);
        canvas.render();
    }

    function sliderNameChange(info: {prevName: string, slider: SliderData}) {
        let [prevName, slider] = [info.prevName, info.slider];
        
        if (prevName.trim() && !(sliders.some(s => (s.name === prevName) && (s.id !== slider.id)))) {
            canvas.deleteUniform(prevName);
        }
        if (slider.name.trim()) {
            canvas.addUniform(slider.name, slider.value);
        }
        canvas.recompilePrograms(); 
    }

</script>

<div id="sidebar">
    <div id="tab-area">
        <Navbar tabs={tabs} bind:activeTab={activeTab}/>
    
        <button id="btn-collapse" 
            on:click={() => collapsed = !collapsed}
            style:right={collapsed ? '-45px': '0'}>
            <i class="bi bi-chevron-double-{collapsed ? 'right': 'left'}"></i>      
        </button>
    </div>

    <div id="below-tab-area">
        {#if activeTab.id == 1}
        <div id="main-tab" 
            transition:fly={{ x:-100, duration: tabTransitionDuration }} 
            on:outrostart={makeAbsolute}>
        <Editor canvas={canvas} text={canvas.userFunctionSrc}/>
        <div id="slider-area">
            {#each sliders as slider (slider.id)}
                <Slider 
                    sd={slider}
                    on:delete={(e) => deleteSlider(e.detail)}
                    on:nameChange={(e) => sliderNameChange(e.detail)}
                    on:valueChange={(e) => sliderValueChange(e.detail)}
                />
            {/each}
            <button id="add-slider-btn" on:click={addSlider}>
                <i class="bi bi-plus"></i>Add slider
            </button>
        </div>
        </div>

        {:else if activeTab.id == 2}
        <div id="controls-tab"  
            transition:fly={{ x: -100, duration: tabTransitionDuration}} 
            on:outrostart={makeAbsolute}>
            Controls
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

