<script lang="ts">
    import Account from "svelte-material-icons/Account.svelte";
    import MapMarker from "svelte-material-icons/MapMarker.svelte";
    import Monitor from "svelte-material-icons/Monitor.svelte";
    import BookVariant from 'svelte-material-icons/BookVariant.svelte';
    import Alert from 'svelte-material-icons/Alert.svelte';

    import DateChecker from "./DateChecker.svelte";
    import { ClassStatus } from "../../.server/db/DB";
    import { db, focusedClass } from "../mainStore";
    import { rmpScoreColor } from "../ListPanel/ClassItem/ClassItem.svelte";
  
    export let number;
    export let code;

    export let reduced: boolean = false;

    let items = [];
    let trimmedCode = code.split(" - ")[0];
    $: {
        trimmedCode = code.split(" - ")[0];
        items = $db ? $db.classes.filter((item) => item.code.startsWith(trimmedCode + " - ")) : [];
    }

    $: oneProfessor = items.length > 0 ? (items.find(item => item.instructor.name != items[0].instructor.name) == undefined) : false;
</script>
  
{#if items.length > 1 && (reduced ? items.length <= 4 : items.length > 4)}

    <div class="sectionTitle">
        <div class="icon">
            <BookVariant></BookVariant>
        </div>
        <p class="text">All {trimmedCode} classes</p>
    </div>

    {#if oneProfessor}
        <div class="section">
            <Alert/>
            <span>All these classes have the same professor (<span style="font-weight: 700;">{items[0].instructor.name}</span>). So instead, we're showing you the time of each class. </span>
        </div>
    {/if}
    <div style="position: relative;">
        <div style="{oneProfessor ? "border-radius: 4px 4px 8px 8px;" : ""}" class="widgetRow {reduced ? "reduced" : "main"}">
            {#each items as item, i}
                <button class="sectionWidget" class:active={number === item.number} on:click={() => focusedClass.set(item)}>
                    <div class="instructor"> 
                        {#if oneProfessor}
                            <div class="dayAndTime">
                                <DateChecker background={false} icon={false} number={item.number} meetingInfos={item.meetingInfos} />
                            </div>
                        {:else if item.instructor.name && item.instructor.name !== "N/A"}
                            {item.instructor.name}
                        {:else}
                            Staff
                        {/if}
                        <div>{number === item.number ? "(this class)" : ""}</div>
                        {#if oneProfessor == false && item.instructor.id && item.instructor.id !== "-1" && item.instructor.numRatings > 0}
                            <div class="rmpScore" style={`background-color: ${rmpScoreColor(item.instructor.avgRating)}; margin-left: auto;`}>
                                {item.instructor.avgRating.toFixed(1)}
                            </div>
                            <div class="rmpScore" style={`background-color: #aaa`}>
                                {item.instructor.avgDifficulty.toFixed(1)}
                            </div>
                        {/if}
                    </div>
                    <div class="details">
                        <div class="spacer"></div>
                        {#if item.meetingInfos.some(x => x.location && x.location !== "N/A")}
                            {#each item.meetingInfos as meetingInfo}
                                <div class="location">
                                    {#if meetingInfo.location === "Online" || meetingInfo.location === "Remote Instruction"}
                                    <Monitor /> {item.details.instructionMode}
                                    {:else}
                                    <MapMarker /> {meetingInfo.location}
                                    {/if}
                                </div>
                            {/each}
                        {/if}
                        {#if oneProfessor == false && item.meetingInfos.some(x => x.dayAndTime && x.dayAndTime !== "Cancelled")}
                            <div class="dayAndTime">
                                <DateChecker number={item.number} meetingInfos={item.meetingInfos} />
                            </div>
                        {/if}
                    </div>
                    <div class="bar" style="margin-top: 8px; margin-bottom: 4px;"> 
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
                    <span style="float: right;">#{item.number}</span>
                </button>
            {/each}
        </div>
    </div>
{/if}
  
<style>
    .sectionTitle {
        display: flex; 
        align-items: center;
        gap: 4px;
        margin-top: 16px;
        margin-bottom: 4px;
    }
    .sectionTitle .icon {
        display: flex;
        align-items: center;
        font-size: 18px;
    }
    .sectionTitle .text {
        margin: 0px;
        font-size: 16px;
        font-weight: 600;
    }
    .section {
        padding: 16px 20px 16px 20px;
        background-color: #0000002d;
        margin-bottom: -7px;
        margin-top: 10px;
        border-radius: 8px 8px 4px 4px;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .section :global(svg) {
        font-size: 22px;
    }
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
    .main {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    .reduced {
        display: flex;
        flex-wrap: wrap;
    }
    .widgetRow {
        gap: 3px;
        margin-top: 10px;
        overflow: hidden;
        border-radius: 8px;
    }
    .sectionWidget {
        text-align: left;
        cursor: pointer;
        user-select: none;
        background-color: #0000002d;
        border-radius: 4px;
        padding: 10px;
        display: inline-block;
        width: 100%;
    }
    .sectionWidget:focus:not(:focus-visible) {
        outline: none;
    }
    .sectionWidget.active {
        background-color: #1f1f1f;
    }
    .sectionWidget:hover {
        background-color: #2c2c2c;
        border-radius: 8px 8px 0px 0px;
        border: #2c2c2c;
    }
    .sectionWidget span {
        color: lightgrey;
    }
    .reduced .details {
        width: calc(100% - 20px);
    }
    .main .details {
        width: calc(50% - 22px);
    }
    .details {
        position: absolute;
        padding: 0px 10px 0 10px;
        transition: height 0.2s cubic-bezier(0.075, 0.82, 0.165, 1);
        height: 0px;
        overflow: hidden;
        background-color: #2c2c2c;
        transform: translateY(40px) translateX(-10px);

        display: flex;
        flex-direction: column;
        gap: 10px;
        border-radius: 0 0 8px 8px;
    }
    .spacer {
        width: 100%;
        margin-bottom: -5px;
    }
    .sectionWidget:hover .details {
        height: 4em;
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
    .rmpScore {
        border-radius: 4px;
        margin-bottom: -2px;
        margin-top: -2px;
        width: 25px;
    }
</style>