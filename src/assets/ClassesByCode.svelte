<script lang="ts">
    import Account from "svelte-material-icons/Account.svelte";
    import MapMarker from "svelte-material-icons/MapMarker.svelte";
    import Monitor from "svelte-material-icons/Monitor.svelte";
    import DateChecker from "./DateChecker.svelte";
    import { ClassStatus } from "../../.server/db/DB";
    import { db, focusedClass } from "../mainStore";
    import { rmpScoreColor } from "../ListPanel/ClassItem/ClassItem.svelte";
  
      export let number;
      export let code;
  
      let items = [];
      let trimmedCode = code.split(" - ")[0];
      $: {
        trimmedCode = code.split(" - ")[0];
        items = $db ? $db.classes.filter((item) => item.code.startsWith(trimmedCode + " - ")) : [];
      }
</script>
  
{#if items.length > 1}
    <h3>All {trimmedCode} classes</h3>
    <div class="widgetRow">
        {#each items as item}
            <button class="sectionWidget" class:active={number === item.number} on:click={() => focusedClass.set(item)}>
                <h4>{item.number} {number === item.number ? "(this class)" : ""}</h4>
                <div class="details">
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
                                ({item.instructor.numRatings})
                            {/if}
                        </div>
                    {/if}
                </div>
                <div class="bar" style="margin-top: 5px"> 
                    <div class="fill" style={`background-color: ${
                        item.availability.status === ClassStatus.Closed ? "var(--closed)" :
                        item.availability.status === ClassStatus.Waitlist ? "var(--waitlist)" :
                        "white"}; width: ${item.availability.enrolled / item.availability.capacity * 100}%`} />
                </div>
                {#if item.availability.capacity === 0}
                <span>Temp. Closed ({item.availability.enrolled}/{item.availability.capacity})</span>
                {:else}
                <span>{Math.round(item.availability.enrolled / item.availability.capacity * 100)}% full ({item.availability.enrolled}/{item.availability.capacity})</span>
                {/if}
            </button>
        {/each}
    </div>
{/if}
  
<style>
    h4 {
        color: lightgrey;
        margin: 0;
    }
    .instructor, .dayAndTime, .location {
        display: flex;
        gap: 5px;
        align-items: center;
        font-weight: normal;
    }
    .widgetRow {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    }
    .sectionWidget {
        text-align: left;
        cursor: pointer;
        user-select: none;
        background-color: #222;
        border-radius: 5px;
        padding: 10px;
        display: inline-block;
        border: 2px solid #777;
        position: relative;
        min-width: 17em;
        transition: border-color 0.2s, background-color 0.2s;
    }
    .sectionWidget:focus:not(:focus-visible) {
        outline: none;
    }
    .sectionWidget.active {
        background-color: #444;
        border-color: #fff;
    }
    .sectionWidget:hover {
        background-color: #555;
        border-color: #aaa;
    }
    .sectionWidget span {
        color: lightgrey;
    }
    .details {
        position: absolute;
        top: calc(100% - 2px);
        left: -2px;
        width: calc(100% - 20px);
        padding: 0 10px;
        transition: height 0.2s cubic-bezier(0.075, 0.82, 0.165, 1), border-color 0.2s;
        height: 0px;
        overflow: hidden;
        background-color: #555;

        display: flex;
        flex-direction: column;
        gap: 10px;
        border-radius: 0 0 5px 5px;
    }
    .sectionWidget:hover .details {
        height: 6em;
        border: 2px solid #aaa;
        border-top: none;
        z-index: 5;
    }
    .sectionWidget:active, .sectionWidget:active .details {
        border-color: white;
    }
    .bar {
        width: 100%;
        height: 5px;
        background-color: #777;
        border-radius: 5px;
        overflow: hidden;
    }
    .fill {
        color: white;
        height: 100%;
    }
</style>