<script lang="ts">
    import type { Canvas } from "../canvas";
    import { makeAbsolute, randomColorRGB } from "../utils";
    import Navbar, { Tab } from "./Navbar.svelte";
    import Editor from "./Editor.svelte";
    import Variable from "./Variable.svelte";
    import Controls from "./Settings.svelte";
    import type { UserVariable, UserPoint, UserSlider } from "../types";
    import { uvars, shapes } from "../stores";
    import { Circle, Shape } from "../shapes";
    import ShapeUI from "./ShapeUI.svelte";

    import { fly } from "svelte/transition";
    import { v4 as uuidv4 } from "uuid";
    import { createEventDispatcher } from "svelte";

    export let canvas: Canvas;
    export let collapsed = false;
    export let editorText: string = "";

    let dispatch = createEventDispatcher();

    let tabs: Tab[] = [
        { name: "Main", id: 1 },
        { name: "Settings", id: 2 },
    ];
    let activeTab = tabs[0];
    let tabTransitionDuration = 150;

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
    function addShape() {
        $shapes = [...$shapes, new Circle(0, 0, 1, randomColorRGB(), false)];
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
            canvas.compileUserCodeToGlsl(editorText, true);
        }
    }

    function variableValueChange(v: UserVariable) {
        $uvars = $uvars;
        console.log("value change", $uvars);
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
        canvas.compileUserCodeToGlsl(editorText, true);
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
            <div
                id="main-tab"
                in:fly={{ x: -10, duration: tabTransitionDuration }}
                out:fly={{ x: 10, duration: tabTransitionDuration }}
                on:outrostart={makeAbsolute}
            >
                <div id="main-tab-inner">
                    <Editor {canvas} bind:code={editorText} />

                    <div id="variables-area">
                        {#if $uvars?.length}<h3 style="margin: 0 0 4px 0; font-size: 1em; color: var(--c-white);">Variables</h3>
                            {#each $uvars as v (v.id)}
                                <Variable
                                    data={v}
                                    on:delete={(e) => deleteVariable(e.detail)}
                                    on:nameChange={(e) => variableNameChange(e.detail)}
                                    on:valueChange={(e) => variableValueChange(e.detail)}
                                />
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
                                        on:input={(e) => {
                                            canvas.shapeProgram.setUniformValue("u_t", e.target.value);
                                            canvas.render();
                                        }}
                                    />
                                    <span>1</span>
                                </div>
                            </div>
                            {#each $shapes as shape (shape.id)}
                                <ShapeUI {shape} {canvas} on:delete={(e) => deleteShape(e.detail)} />
                            {/each}
                        {/if}
                    </div>
                    <div id="buttons">
                        <button class="add-slider-btn" on:click={(e) => addSlider()}>
                            <i class="bi bi-plus"></i>Slider
                        </button>
                        <button class="add-slider-btn" on:click={(e) => addPoint()}>
                            <i class="bi bi-plus"></i>Point
                        </button>
                        <button class="add-slider-btn" on:click={(e) => addShape()}>
                            <i class="bi bi-plus"></i>Shape
                        </button>
                    </div>
                </div>
            </div>
        {:else if activeTab.id == 2}
            <div id="controls-tab" transition:fly={{ x: -100, duration: tabTransitionDuration }}>
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
        height: 100%;
        padding: 0;
    }
    #controls-tab {
        height: 100%;
    }
    #main-tab {
        height: 100%;
    }
    #main-tab-inner {
        overflow: scroll;
        &::-webkit-scrollbar {
            display: none;
        }
        height: calc(100% - 130px);
    }
    #buttons {
        display: flex;
        gap: 10px;
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
            input {
                translate: 0 -1px;
            }
        }
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
                transform: scale(1.2);
            }
            transition:
                background-color 0.2s,
                transform 0.2s;
        }
    }
    .add-slider-btn {
        margin-top: 10px;
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
