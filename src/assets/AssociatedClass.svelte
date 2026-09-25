<script lang="ts">
    import MapMarker from "svelte-material-icons/MapMarker.svelte";
    import Account from "svelte-material-icons/Account.svelte";
    import Enrollment from "../MainPanel/Class/Enrollment/Enrollment.svelte";
    import { slide } from "svelte/transition";
    import DateChecker from "./DateChecker.svelte";

    export let item;
    export let onClick: null|Function = null;

    let showEnrollment = false;
    let color = item.availability.enrolled / item.availability.capacity * 100 === 100 ? "var(--closed)" : "white";
</script>
  
<div class="associatedClass"
    class:cancelled={item.meetingInfo.dayAndTime.includes("Cancelled") || item.meetingInfo.dayAndTime === ""}
    class:clickable={onClick}
    aria-disabled={!onClick}
    on:click={() => onClick ? onClick() : ""}
    on:keydown={(e) => e.key !== "Tab" && onClick ? onClick() : ""}
    role="button"
    tabindex={onClick ? 0 : -1}

>
    <h3>{item.code} <span class="number">#{item.number}</span></h3>
    <div class="fact">
        <MapMarker />
        {item.meetingInfo.location}
    </div>
    <div class="fact">
        <DateChecker background={false} number={item.number} meetingInfos={[item.meetingInfo]} />
    </div>
    <div class="fact">
        <Account />
        {item.meetingInfo.instructor}
    </div>
    <div class="bar">
        <div class="fill" style={`background-color: ${color}; width: ${item.availability.enrolled / item.availability.capacity * 100}%`} />
    </div>
    <span style="color: lightgrey">{Math.round(item.availability.enrolled / item.availability.capacity * 100)}% full ({item.availability.enrolled}/{item.availability.capacity})</span>
</div>
  
<style>
    h3 {
        margin: 0;
    }
    .cancelled {
        pointer-events: none;
        opacity: 0.5;
    }
    .clickable {
        user-select: none;
        cursor: pointer;
    }
    .associatedClass {
        background-color: #0000002d;
        border-radius: 4px;
        padding: 10px 14px 10px 14px;
        display: inline-block;
        transition: border-color 0.2s, background-color 0.2s;
    }
    .fact {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-bottom: 6px;
        font-size: 14px;
    }
    h3 {
        margin-bottom: 4px;
    }

    .fact :global(svg) {
        font-size: 18px;
    }
    .bar {
        width: 100%;
        height: 5px;
        background-color: #777;
        border-radius: 5px;
        overflow: hidden;
        margin-top: 12px;
    }
    .fill {
        color: white;
        height: 100%;
    }
  </style>