<script lang="ts">
    // @ts-nocheck
    import type { Canvas } from "../canvas";

    export let canvas: Canvas;

    let settings = canvas.settings;

    function getSettingValue(name: string) {
        if (!canvas.settings.has(name)) console.error(`Setting ${name} not found`);
        return canvas.settings.get(name).value;
    }
    function resetSettings() {
        canvas.settings = canvas.defaultSettings
        settings = canvas.settings;
    }
</script>

{#key settings}
<div id="container">
    <div class="setting">
        <span class="label">Grid on: </span>
        <input type="checkbox" checked={getSettingValue('showGrid')}
            on:change={e => canvas.updateSetting('showGrid', e.target.checked)}/>
    </div>
    <div class="setting">
        <span class="label">Grid spacing: </span>
        <input type="range" min="0.05" max="2.0" step="0.001" value={getSettingValue('gridSpacing')}
            on:input={e => canvas.updateSetting('gridSpacing', e.target.value)}/>
    </div>
    <div class="setting">
        <span class="label">Mod contours: </span>
        <input type="checkbox" checked={getSettingValue('showModContours')}
            on:change={e => canvas.updateSetting('showModContours', e.target.checked)}/>
    </div>
    <div class="setting">
        <span class="label">Phase contours: </span>
        <input type="checkbox" checked={getSettingValue('showPhaseContours')}
            on:change={e => canvas.updateSetting('showPhaseContours', e.target.checked)}/>    
    </div>
    <div id="buttons">
        <button on:click={ () => canvas.camera.reset() }>Reset camera (h)</button>
    </div>
</div>
{/key}

<style lang="scss">
    #container {
        height: 100%;
        display: flex;
        flex-direction: column;
    }
    .label {
        flex-basis: 150px;
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
    input[type='checkbox'] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        background: var(--c-light-grey);
        appearance: none;
        border-radius: 3px;
        position: relative;
        &:checked {
            background: var(--c-primary);
            &::after {
                content: "✔";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -55%);
                color: var(--c-dark-grey);
            }
        }
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
    #buttons {
        margin-top: 20px;
        display: flex;
        gap: 20px;
        button {
            padding: 3px;
            &.selected {
                color: var(--c-white);
            }
        }
    }
    input {
        outline: none;
    }
</style>