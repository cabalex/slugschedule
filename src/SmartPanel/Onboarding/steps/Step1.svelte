<script lang="ts">
    import CalendarSearch from "svelte-material-icons/CalendarSearch.svelte";
    import Delete from "svelte-material-icons/Delete.svelte";
    import { fly, slide } from "svelte/transition";
    import ClassSelector from "../../../assets/ClassSelector.svelte";
    import DropdownChip from "../../../Chips/DropdownChip.svelte";
    import { opts } from "../../../Chips/GEChip.svelte";
    export let step: number;

    interface Class {
        type: 'class'
        key: number
        value: string
    }

    interface GE {
        type: 'ge'
        key: number
        ge: string[]
        maxCredits: number
    }

    interface Random {
        type: 'random'
        key: number
        maxCredits: number
    }

    let disabled = false;

    $: {
        if (value.length > 0 && value.length === value.filter((item) => {
            if ((item.type === "class" && item.value) ||
                (item.type === "ge" && item.ge && item.ge.length > 0 && item.maxCredits > 0) ||
                (item.type === "random") && item.maxCredits > 0) {
                return true;
            } else {
                return false;
            }
        }).length) {
            disabled = false;
        } else {
            disabled = true;
        }
    }

    export let value: Array<Class|GE|Random> = [];
</script>

<div class="step" in:fly={{duration: 100, x: 50}} out:fly={{duration: 100, x: -50}}>
    <h2>What classes do you need?</h2>
    <div class="icon">
        <CalendarSearch size="10em" />
    </div>
    <p>Enter the classes you know you need to take this quarter.</p>
    <p>It's okay if you don't know every class you want to take. Try choosing a class that fulfills a GE!</p>
    <p>You may want to check the <a target="_blank" rel="noopener noreferrer" href="https://catalog.ucsc.edu/en/current/general-catalog/academic-programs/bachelors-degrees/">requirements for your major</a> before enrolling.</p>
    <hr />

    {#each value as item (item.key)}
        <div class="classSelection" transition:slide={{duration: 50, axis: 'y'}}>
            <button class="dangerBtn" on:click={() => value = value.filter(x => x !== item)}>
                <Delete size="24px" />
            </button>
            <select bind:value={item.type}>
                <option value="class">Specific class</option>
                <option value="ge">GE requirement</option>
                <option value="random">Random class</option>
            </select>
            {#if item.type === 'class'}
                :    
                <ClassSelector bind:value={item.value} />
            {:else}
                with no prereqs and max
                <input style="width: 40px;" type="number" bind:value={item.maxCredits}>
                credits
                {#if item.type === 'ge'}
                    :<DropdownChip multiple={true} label="Select..." options={opts} bind:value={item.ge} />
                {/if}
            {/if}
        </div>
    {/each}
    <button class="fullwidth borderBtn" on:click={() => value = [...value, {type: 'class', value: '', key: Date.now(), maxCredits: 5}]}>
        + Add another class
    </button>

    
    <button class="fullwidth" disabled={disabled} on:click={() => step++}>
        {#if value.length < 1}
            Select at least one class to continue
        {:else}
            Next
        {/if}
    </button>
</div>

<style>
    .step {
        position: absolute;
        top: 0;
        left: 0;
        width: calc(100% - 60px);
        height: calc(100% - 80px);
        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items: center;
        gap: 20px;
        padding: 30px;
        padding-top: 50px;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .step > * {
        margin: 0;
        text-align: center;
    }
    .icon {
        padding: 30px;
    }
    button.fullwidth {
        width: 100%;
    }

    .classSelection {
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: start;
        align-items: center;
        background-color: #333;
        padding: 10px;
        line-height: 1em;
        border-radius: 5px;
    }
    :global(.classSelection select, .classSelection input) {
        font-size: unset;
        padding: 5px;
        border-width: 2px;
        border-style: solid;
        border-radius: 5px;
    }
    :global(.classSelection .chip) {
        border-radius: 5px;
    }
</style>
