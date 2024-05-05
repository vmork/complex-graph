<!-- Adapted from https://stackoverflow.com/a/41389961 -->

<script lang="ts">
    export let type: "text" | "number";
    export let value: string | number;
    export let step: number = 0.001;
    export let min: number = -Infinity;
    export let max: number = Infinity;
    export let inputElem: HTMLInputElement = null;
</script>

<div id="container">
    <span>{value}</span>
    <!-- Not allowed to have dynamic type apparently, so have to do this -->
    {#if type === "text"}
        <input type="text" bind:value on:input bind:this={inputElem} />
    {:else if type === "number"}<input bind:this={inputElem} type="number" bind:value on:input {step} {min} {max} />{/if}
</div>

<style lang="scss">
    #container {
        display: inline-block;
        position: relative;
    }
    span,
    input {
        margin: 0;
        padding: 2px 10px 2px 5px;
        font-size: 1.2em;
        // translate: 0 -1px;
        min-width: 20px;
        max-width: var(--maxWidth, 100px);
    }
    span {
        display: inline-block;
        visibility: hidden;
        white-space: pre;
    }
    input {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        outline: none;
        border: none;
        color: #eeeeeedb;
        background-color: transparent;
    }
    input[type="text"]:focus {
        border-bottom: 1px solid var(--c-light-grey);
    }
</style>
