<script context="module" lang="ts">
    export function rmpScoreColor(score: number) {
        if (score >= 4.0) return "rgb(127, 246, 195)";
        if (score >= 3.0) return "rgb(255, 241, 112)";
        return "rgb(255, 156, 156)";
    }
</script>
<script lang="ts">
    import Star from "svelte-material-icons/Star.svelte";
    import StarOutline from "svelte-material-icons/StarOutline.svelte";
    import Plus from "svelte-material-icons/Plus.svelte";
    import Minus from "svelte-material-icons/Minus.svelte";
    import MapMarker from "svelte-material-icons/MapMarker.svelte";
    import Monitor from "svelte-material-icons/Monitor.svelte";
    import Account from "svelte-material-icons/Account.svelte";

    import { db, focusedClass, listMode, smartClasses, starredClasses } from "../../mainStore";
    import { ClassStatus, type Class } from "../../../.server/db/DB";
    import ClassAllocation from "../../assets/ClassAllocation.svelte";
    import DateChecker from "../../assets/DateChecker.svelte";

    export let item: number[];

    $: classes = item.map(x => $db.getClassByNumber(x));

    function focusSchedule() {
        $scheduledClasses = item;
    }

    function addToSchedule() {
        $scheduledClasses = [...item];
    }
</script>
<div
    class="classItem"
    class:focused={$smartClasses.every(x => item.includes(x))}
    on:click={focusClass}
>
    <div class="topBar">
        <h2 title={`${code} - ${item.name}`}>
            <span style="font-weight: bold">{code}</span>
            <span>{item.name}</span>
        </h2>
        <button class="roundBtn" on:click={addToSchedule}>
            {#if $listMode === "scheduler"}
                {#if $scheduledClasses.includes(item.number)}
                    <Minus />
                {:else}
                    <Plus />
                {/if}
            {:else}
                {#if $starredClasses.includes(item.number)}
                    <Star />
                {:else}
                    <StarOutline />
                {/if}
            {/if}
        </button>
    </div>
    <div class="body">
        {#if item.meetingInfos.some(x => x.location && x.location !== "N/A")}
        {#each item.meetingInfos as meetingInfo}
            <div class="location">
                {#if meetingInfo.location === "Online" || meetingInfo.location === "Remote Instruction"}
                <Monitor />
                {:else}
                <MapMarker />
                {/if}
                {meetingInfo.location}
            </div>
        {/each}
        {/if}
        {#if item.meetingInfos.some(x => x.dayAndTime && x.dayAndTime !== "Cancelled")}
        <div class="dayAndTime">
            <DateChecker number={item.number} meetingInfos={item.meetingInfos} />
        </div>
        {/if}
        {#if item.instructor.name && item.instructor.name !== "N/A"}
        <div class="instructor">
            <Account />
            {item.instructor.name}
            {#if item.instructor.id && item.instructor.id !== "-1" && item.instructor.numRatings > 0}
                <div class="rmpScore" style={`background-color: ${rmpScoreColor(item.instructor.avgRating)}`}>
                    {item.instructor.avgRating.toFixed(1)}
                </div>
                <div class="rmpScore" style={`background-color: #aaa`}>
                    {item.instructor.avgDifficulty.toFixed(1)}
                </div>
                ({item.instructor.numRatings} ratings)
            {/if}
        </div>
        {/if}
    </div>
    <ClassAllocation availability={item.availability} />
</div>

<style>
    .classItem {
        cursor: pointer;
        padding: 10px;
        background-color: #333;
        margin: 10px;
        border-radius: 10px;
        height: 200px;
        position: relative;
        overflow: hidden;

        display: flex;
        flex-direction: column;
    }
    .classItem.focused {
        outline: 2px solid grey;
    }
    .classItem .topBar:before {
        content: "";
        position: absolute;
        top: -20px;
        left: -20px;
        width: calc(100% + 40px);
        height: calc(100% + 20px);
        z-index: -1;
        background-color: #444;
        z-index: 1;
    }
    .classItem.closed .topBar:before {
        background-color: var(--closed-dark);
    }
    .classItem.waitlist .topBar:before {
        background-color: var(--waitlist-dark);
    }
    .topBar {
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transform: translateY(-5px); /* looks better on smaller text lens */
        padding-bottom: 5px;
    }
    .topBar h2 {
        z-index: 2;
        font-weight: normal;
        margin: 0;
        margin-left: 5px;
        flex-grow: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        line-height: 1.25; /* fallback */
        max-height: 3;
    }
    .body {
        flex-grow: 1;

        display: flex;
        flex-direction: row;
        align-content: flex-start;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 5px;
    }
    .body > * {
        margin-left: 5px;
    }
    .body > * {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    .rmpScore {
        padding: 2px 5px;
        color: black;
        font-weight: bold;
    }
</style>