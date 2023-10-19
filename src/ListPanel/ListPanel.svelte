<script lang="ts">
    import Restart from "svelte-material-icons/Restart.svelte";
    import Search from "./Search/Search.svelte";
    import VirtualList from "../VirtualList/VirtualList.svelte";
    import { db, focusedClass, listMode, scheduledClasses, searchFilters, starredClasses } from "../mainStore";
    import ClassItem from "./ClassItem/ClassItem.svelte";
    import DepartmentChip from "../Chips/DepartmentChip.svelte";
    import OnlineChip from "../Chips/OnlineChip.svelte";
    import StatusChip from "../Chips/StatusChip.svelte";
    import GeChip from "../Chips/GEChip.svelte";
    import GraduateChip from "../Chips/GraduateChip.svelte";
    import { tick } from "svelte";


    
    function filterItems(items: any[], filters: any) {
        let newItems = items.filter(x => {
            if (filters.department.length > 0) {
                return filters.department.includes(x.code.split(" ")[0]);
            }
            return true;
        }).filter(x => {
            if (filters.instructionMode.length > 0) {
                return filters.instructionMode.includes(x.details.instructionMode);
            }
            return true;
        }).filter(x => {
            if (filters.status.length > 0) {
                return filters.status.includes(x.availability.status);
            }
            return true;
        }).filter(x => {
            if (filters.ges.length > 0) {
                if (filters.ges.includes("AnyGE") && x.details.generalEducation.length > 0 && x.details.generalEducation[0] !== "") {
                    return true;
                }
                return filters.ges.some(ge => x.details.generalEducation.includes(ge));
            }
            return true;
        }).filter(x => {
            if (filters.undergraduate !== null) {
                return filters.undergraduate === x.details.undergraduate;
            }
            return true;
        })

        if (filters.sortMode) {
            newItems = newItems.sort(filters.sortMode.fn);
        }

        return newItems;
    }

    let items = [];

    // These are all separated into their own $ blocks since they can conflict with one another
    // (e.g. adding a starred class would reload the "starred" $ block, but not the "all" $ block)
    $: {
        if ($listMode === "all") {
            items = filterItems($db.classes, $searchFilters[$listMode]);
        }
    }
    $: {
        if ($listMode === "starred") {
            items = filterItems($starredClasses.map(x => $db.classes.find(c => c.number === x)).filter(x => x), $searchFilters[$listMode])
        }
    }
    $: {
        if ($listMode === "scheduler") {
            // it is possible to have a scheduled class that isn't starred, so make sure it's unschedulable
            // remove duplicates too
            let newItems = filterItems([...new Set([...$scheduledClasses, ...$starredClasses])].map(x => $db.classes.find(c => c.number === x)).filter(x => x), $searchFilters[$listMode]);
            // however we only want to reload the list when it changes, or weird things occur
            if (newItems.length !== items.length) items = newItems;
        }
    }
    $: {
        if ($searchFilters[$listMode].searchResults !== null) {
            items = filterItems($searchFilters[$listMode].searchResults.results.map(x => x.item), $searchFilters[$listMode])
                .filter(x => $listMode !== "all" ? $starredClasses.includes(x.number) : true)
        }
    }
    $: filtered = Object.values($searchFilters[$listMode]).some((v) => v instanceof Array ? v.length : v !== null);

    function resetFilters() {
        $searchFilters[$listMode].department = [];
        $searchFilters[$listMode].instructionMode = [];
        $searchFilters[$listMode].status = [];
        $searchFilters[$listMode].ges = [];
        $searchFilters[$listMode].undergraduate = null;
        $searchFilters[$listMode].searchResults = null;
        $searchFilters[$listMode].sortMode = null;
    }

    let scrollToIndex = null;
    async function scrollOnSearch(item) {
        if ($listMode === "starred" || $listMode === "scheduler") {
            $listMode = "all";
            await tick();
        }
        
        let index = items.findIndex((c) => c.number === item.number);
        if (scrollToIndex && $focusedClass && index) {
            scrollToIndex(index);
        }
    }
</script>

<div class="listPanel">
    <Search onSearchClicked={scrollOnSearch} />
    <div class="chipShelf">
        <DepartmentChip />
        <OnlineChip />
        <StatusChip />
        <GeChip />
        <GraduateChip />
        <SortChip />
        {#if filtered}
            <button class="chip" on:click={resetFilters}><Restart size="1.5em" /></button>
        {/if}
    </div>
    {#if items.length}
        <VirtualList bind:scrollToIndex={scrollToIndex} items={items} let:item>
            <ClassItem item={item} />
        </VirtualList>
    {:else if $listMode === "starred" && $starredClasses.length === 0}
        <span>You haven't starred any classes yet.</span>
    {:else if $listMode === "scheduler"}
        <span>To add classes to the scheduler, you must star them first.<br />Find what you're interested in taking!</span>
    {:else}
        <span>No results...</span>
    {/if}
</div>

<style>
    .listPanel {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;

        width: 500px;
    }
    .chipShelf {
        display: flex;
        flex-direction: row;
        gap: 10px;
        padding: 0 0 10px 10px;
        flex-wrap: wrap;
    }
    button.chip {
        font-weight: unset;
        line-height: 0;
        padding: 5px;
    }
    span {
        padding: 10px;
        text-align: center;
    }
    @media screen and (max-width: 1000px) {
        .listPanel {
            width: 100%;
            height: calc(100% - 50px);
        }
    }
</style>