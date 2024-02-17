<!-- Adapted from https://stackoverflow.com/a/41389961 -->

<script lang="ts">
    export let type: "text"|"number";
    export let value: string|number;
</script>

<div id="container">
    <span>{value}</span>
    <!-- Not allowed to have dynamic type apparently, so have to do this -->
    {#if type === "text"}       <input type="text" bind:value={value} on:input>
    {:else if type === "number"}<input type="number" bind:value={value} on:input>{/if}
</div>

<style lang="scss">
    #container {
        display: inline-block;
        position: relative;
    }
    span, input {
        margin: 0;
        padding: 2px 10px 2px 5px;
        font-size: 1.2em;
        // translate: 0 -1px;
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
</style>
