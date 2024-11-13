<script context="module" lang="ts">
    export function rmpScoreColor(score: number) {
        if (score >= 4.0) return "rgb(127, 246, 195)";
        if (score >= 3.0) return "rgb(255, 241, 112)";
        return "rgb(255, 156, 156)";
    }
    export function gpaDifficultyColor(difficulty: string) {
        switch (difficulty) {
            case "a breeze":
                return "#00E676";
            case "easy":
                return "#C6FF00";
            case "fine":
                return "var(--primary)";
            case "hard":
                return "#FF6E40";
            case "challenging":
                return "#FF5252";
            default:
                return "white";
        }
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
    import Poll from "svelte-material-icons/Poll.svelte";

    import { db, detectTerm, focusedClass, listMode, scheduledClasses, starredClasses, term } from "../../mainStore";
    import { ClassStatus, type Class } from "../../../.server/db/DB";
    import ClassAllocation from "../../assets/ClassAllocation.svelte";
    import DateChecker from "../../assets/DateChecker.svelte";
    import SectionPopup from "./SectionPopup.svelte";
    import { calculateAverageGPA, calculateDifficulty } from "../../MainPanel/Class/GradeDistribution/GradeDistribution.svelte";

    export let item: Class;

    let code = item.code;
    let showSectionPopup = false;
    $: {
        if ($db.classes.map(x => x.name).filter(x => x.includes(item.code.split(" - ")[0])).length < 1) {
            code = item.code.split(" - ")[0];
        }
    }

    function toggleStar(e) {
        e.stopPropagation();
        if ($starredClasses.includes(item.number)) {
            $starredClasses = $starredClasses.filter(x => x !== item.number);
        } else {
            $starredClasses = [...$starredClasses, item.number];
        }
    }

    function toggleScheduled(e) {
        e.stopPropagation();
        if ($scheduledClasses.includes(item.number)) {
            $scheduledClasses = $scheduledClasses.filter(x => ![item.number, ...item.associatedClasses.map(y => y.number)].includes(x));
        } else {
            $scheduledClasses = [...$scheduledClasses, item.number];
            if (item.associatedClasses.length) showSectionPopup = true;
        }
    }

    function focusClass() {
        if ($listMode === "scheduler") {
            if ($starredClasses.includes(item.number)) {
                $listMode = "starred";
            } else {
                // if the class isn't starred, it won't show up in the starred list...
                // so go to the main course search instead
                $listMode = "all";
            }
        }
        $focusedClass = item;
    }
</script>

{#if showSectionPopup}
<SectionPopup item={item} close={() => showSectionPopup = false} />
{/if}

<div
    class="classItem"
    class:small={detectTerm() !== $db.term}
    class:focused={$focusedClass !== "home" && $listMode !== "scheduler" && $focusedClass?.code === item.code}
    class:open={item.availability.status === ClassStatus.Open}
    class:waitlist={item.availability.status === ClassStatus.Waitlist}
    class:closed={item.availability.status === ClassStatus.Closed}
    role="button"
    tabindex="0"
    on:click={focusClass}
    on:keydown={(e) => { if (e.key !== "Tab") focusClass() }}
>
    <div class="topBar">
        <h2 title={`${code} - ${item.name}`}>
            <span style="font-weight: bold">{code}</span>
            <span>{item.name}</span>
        </h2>
        <button aria-label={$listMode === "scheduler" ? "Add/remove class to schedule" : "Star this class for later"} tabindex={1} class="roundBtn" on:click={$listMode === "scheduler" ? toggleScheduled : toggleStar}>
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
            <div style="min-width: calc(50% - 10px)" class="location">
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
        <div class="instructor" style="min-width: calc(50%)">
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
        {#if item.gradeDistributions && item.gradeDistributions.length}
        {@const averageGPA = calculateAverageGPA(item.gradeDistributions)}
        {@const difficulty = calculateDifficulty(averageGPA)}
        <div class="gradeDistribution">
            <Poll /> GPA
            <div class="rmpScore" style={`background-color: ${gpaDifficultyColor(difficulty)}`}>
                {averageGPA.toFixed(1)}
            </div>
        </div>
        {/if}
    </div>
    {#if detectTerm() === $db.term}
    <ClassAllocation availability={item.availability} />
    {/if}
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
    .classItem.small {
        height: 160px;
    }
    .classItem.small .topBar:before {
        background-color: #444 !important;
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
    :global(.rmpScore) {
        padding: 2px 5px;
        color: black;
        font-weight: bold;
    }
</style>