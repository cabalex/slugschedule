<script lang="ts">
    import Fuse from 'fuse.js'
    import { db, focusedClass, searchFilters, listMode } from '../../mainStore';
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import Close from "svelte-material-icons/Close.svelte";
    import Magnify from "svelte-material-icons/Magnify.svelte";
    import Account from "svelte-material-icons/Account.svelte";
    import ClassStatusIcon from '../../assets/ClassStatusIcon.svelte';
    import DateChecker from '../../assets/DateChecker.svelte';

    let searchElem;
    let focused = false;
    export let onSearchClicked = (item) => {};

    $: fuse = new Fuse($db.classes, {
        keys: ['name', 'code', 'number', 'description', 'details.instructionMode', 'instructor.name'],
        threshold: 0.3
    });

    let focus = (e) => { focused = true; e.stopPropagation(); }
    let unfocus = (e) => { focused = false; searchElem.value = ""; results = null; e.stopPropagation(); }

    let results = null;
    let timeout = null;
    function search(e) {
        if (timeout) clearTimeout(timeout);
        if (e.key == "Enter") {
            focused = false;
            $searchFilters[$listMode].searchResults = e.target.value !== "" ?
                {query: e.target.value, results: fuse.search(e.target.value)} :
                null;
            return;
        }
        timeout = setTimeout(() => {
            results = e.target.value !== "" ? fuse.search(e.target.value) : null;
        }, 500);
    }

    $: {
        if (searchElem && searchElem.value === "") results = null;
    }
    $: {
        if ($searchFilters[$listMode].searchResults === null) {
            results = null;
            if (searchElem) searchElem.value = "";
        } else {
            results = $searchFilters[$listMode].searchResults.results;
            if (searchElem) searchElem.value = $searchFilters[$listMode].searchResults.query;
        }
    }

    function focusClass(item, e) {
        focused = false;
        onSearchClicked(item);
        $focusedClass = item;
        e.stopPropagation();
    }

    $: if (focused) {
        searchElem.focus();
    }
</script>

<div class="spacer">
    <div class="searchOuter" class:focused={focused}>
        <div class="search" on:click={focus} on:focus={focus} on:keypress={focus} aria-label="Search classes" role="searchbox" tabindex="0">
            {#if focused}
                <button on:click={unfocus} on:keypress={unfocus}>
                    <ArrowLeft size="1.5em" />
                </button>
            {:else}
                <Magnify size="1.5em" />
            {/if}
            <input type="text" placeholder={$listMode === "all" ? "Search classes" : "Search starred classes"} on:keyup={search} bind:this={searchElem} />
            {#if searchElem?.value}
                <button on:click={(e) => {$searchFilters[$listMode].searchResults = null; unfocus(e)}} on:keypress={(e) => {$searchFilters[$listMode].searchResults = null; unfocus(e)}} >
                    <Close size="1.5em" />
                </button>
            {/if}
        </div>
        {#if results !== null}
            <div class="results">
                {#each results as result}
                <div class="resultItem" role="link" tabindex="0" on:click={focusClass.bind(null, result.item)} on:keypress={focusClass.bind(null, result.item)}>
                    <ClassStatusIcon status={result.item.availability.status} />
                    <div class="text">
                        <span class="resultCode">
                            {result.item.code}

                            {#if searchElem?.value && result.item.instructor.name.toLowerCase().includes(searchElem?.value.toLowerCase())}
                            <Account size="1.2em" /> {result.item.instructor.name}
                            {/if}
                            {#if searchElem?.value && result.item.number.toString().includes(searchElem?.value)}
                            <span style="color: #888">#{result.item.number}</span>
                            {/if}
                        </span>
                        <h2>{result.item.name}</h2>
                        <DateChecker onlyShowConflict={true} number={result.item.number} meetingInfos={result.item.meetingInfos} />
                    </div>
                </div>
                {/each}
            </div>
        {:else}
            <!-- results splash -->
            <p>Search by name ("Biology"), class ID ("CHEM 1A"), description...</p>
        {/if}
    </div>
</div>

<svelte:body on:click={() => focused = false} on:keypress={() => focused = false} />

<style>
    .spacer {
        width: 100%;
        height: 84px;
        position: relative;
    }
    .searchOuter {
        position: absolute;
        left: 0;
        top: 0;
        overflow: hidden;
        clip-path: inset(10px);
        width: calc(100% - 40px);
        height: 54px;
        padding: 10px 20px;
        border-radius: 26px;
        transition: height 0.1s ease-in-out, clip-path 0.1s ease-in-out, background-color 0.1s ease-in-out;
    }
    .searchOuter p {
        color: black;
    }
    .search {
        color: black;
        background-color: #eee;
        margin: auto;
        border-radius: 26px;
        padding: 15px 20px;
        user-select: none;
        cursor: text;

        display: flex;
        flex-direction: row;
        transition: border-radius 0.1s ease-in-out;
    }
    .search:focus-visible {
        border-color: black;
        border-style: solid;
        border-width: 5px;
    }
    .results {
        overflow: auto;
        height: calc(100% - 50px);
    }
    .resultItem {
        height: 80px;
        color: black;
        border-bottom: 1px solid #ccc;
        cursor: pointer;
        user-select: none;

        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }
    .resultItem .resultCode {
        display: flex;
        gap: 2px;
        align-items: center;
    }
    :global(.resultItem .resultCode svg) {
        margin-left: 5px;
    }
    .resultItem h2 {
        margin: 0;
        line-height: 1em;
        font-size: 1.2em;
    }
    .search input {
        font-size: 18px;
        font-family: unset;
        background-color: unset;
        color: black;
        border: none;
        outline: none;
        padding: 0;
        flex-grow: 1;
        margin-left: 10px;
        outline: none;
    }
    .search button {
        background-color: transparent;
        border: none;
        padding: 0;
        color: unset;
        line-height: 0;
    }
    .search button:focus:not(:focus-visible) {
        outline: none;
    }

    .searchOuter.focused {
        clip-path: inset(0);
        z-index: 20;
        background-color: #eee;
        height: 50vh;
        max-height: calc(100vh - 20px);
    }
    .results::-webkit-scrollbar {
        width: 5px;
    }
    .results::-webkit-scrollbar-track {
        background-color: transparent;
    }
    .results::-webkit-scrollbar-thumb {
        background-color: #ccc;
    }
    .searchOuter.focused .search {
        border-radius: 0px;
        border-bottom: 1px solid #999;
    }
    @media screen and (max-width: 1000px) {
        .searchOuter.focused {
            height: calc(100vh - 70px);
            border-radius: 0px;
        }
    }
</style>