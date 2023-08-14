<script lang="ts">
    import Restart from "svelte-material-icons/Restart.svelte";
    import Search from "./Search/Search.svelte";
    import VirtualList from "../VirtualList/VirtualList.svelte";
    import { db, focusedClass, listMode, searchFilters, starredClasses } from "../mainStore";
    import ClassItem from "./ClassItem/ClassItem.svelte";
    import DepartmentChip from "../Chips/DepartmentChip.svelte";
    import OnlineChip from "../Chips/OnlineChip.svelte";
    import StatusChip from "../Chips/StatusChip.svelte";
  import GeChip from "../Chips/GEChip.svelte";
  import GraduateChip from "../Chips/GraduateChip.svelte";

    let items = [];
    
    function filterItems(items: any[], filters: any) {
        return items.filter(x => {
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
    }
    $: {
        if ($listMode === "all") {
            items = filterItems($db.classes, $searchFilters);
        }
    }
    $: {
        if ($listMode === "starred") {
            items = filterItems($starredClasses.map(x => $db.classes.find(c => c.number === x)).filter(x => x), $searchFilters)
        }
    }
    $: filtered = Object.values($searchFilters).some((v) => v instanceof Array ? v.length : v !== null);

    function resetFilters() {
        $searchFilters.department = [];
        $searchFilters.instructionMode = [];
        $searchFilters.status = [];
        $searchFilters.ges = [];
        $searchFilters.undergraduate = null;
    }

    let scrollToIndex = null;
    function scrollOnSearch(item) {
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
</style>