<script lang="ts">
    import MenuDown from "svelte-material-icons/MenuDown.svelte";
    import Check from "svelte-material-icons/Check.svelte";
    import { fly } from "svelte/transition";

    export let options = {};
    export let label = "Label";
    export let multiple = false;
    export let onChange = (value: string[]) => {};

    function selectOption(option) {

        if (multiple) {
            if (value.includes(option)) {
                value = value.filter(v => v !== option);
            } else {
                value = [...value, option];
            }
        } else {
            if (value.includes(option)) {
                value = [];
            } else {
                value = [option];
            }
            open = false;
        }
        onChange(value);
    }

    let chipElem;
    let height = 0;

    $: {
        if (open) {
            let bounds = chipElem.getBoundingClientRect();

            // get the height of the options menu by checking the bounds
            height = Math.min(500, window.innerHeight - bounds.bottom - 10);
        }
    }

    let open = false;
    export let value = [];

    function toggle(e) {
        if (open) {
            clickOut();
        } else {
            open = true;
        }
    }

    function clickOut(e?) {
        if (e && e.target.closest(`.chip.${label.replaceAll(".", "")}`)) return;
        open = false;
    }
</script>

<div
    role="button"
    tabindex="0"
    bind:this={chipElem}
    class="chip {label.replaceAll(".", "")}"
    class:active={value.length}
    on:click={toggle}
    on:keypress={toggle}
>
    {#if value.length === 0}
    {label}
    {:else if value.length === 1}
    {value[0]}
    {:else}
    {value.length} selected
    {/if}
    <span style={open ? "transform: rotate(180deg)" : ""}>
        <MenuDown />
    </span>
    {#if open}
    <div
        role="listbox"
        tabindex={-1}
        style={`max-height: ${height}px`}
        transition:fly={{duration: 100, y: -50}}
        class="options"
        on:click={(e) => e.stopPropagation()}
        on:keypress={(e) => e.stopPropagation()}
    >
        {#each Object.keys(options) as option}
            <div class="option" role="option" tabindex="0" aria-selected={value.includes(option)} class:selected={value.includes(option)} on:click={selectOption.bind(null, option)} on:keypress={selectOption.bind(null, option)}>
                <Check />
                {options[option]}
            </div>
        {/each}
    </div>
    {/if}
</div>

<svelte:body on:click={clickOut} />

<style>
    .options {
        position: absolute;
        z-index: 10;
        background-color: #222;
        width: 300px;
        top: calc(100% + 2px);
        left: 0;
        max-height: 500px;
        overflow-y: auto;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }
    .options::-webkit-scrollbar-thumb {
        background-color: #333;
    }
    .options::-webkit-scrollbar-thumb:hover {
        background-color: #555;
    }
    .options::-webkit-scrollbar-track {
        width: 5px;
        background-color: #222;
    }
    .option {
        text-align: left;
        padding: 10px;
    }
    .option:focus-visible {
        margin: 2px;
        padding: 8px;
    }
    .option:hover {
        background-color: #333;
    }
    :global(.option:not(.selected) svg) {
        opacity: 0;
    }
    .option.selected {
        background-color: #444;
    }
    .chip > span {
        display: inline-block;
        line-height: 0;
    }
    @media screen and (max-width: 1000px) {
        .options {
            position: fixed;
            left: 0;
            top: unset;
            transform: translateY(10px);
            width: 100%;
        }
    }
</style>