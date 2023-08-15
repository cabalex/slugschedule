<script lang="ts">
    import MapMarker from "svelte-material-icons/MapMarker.svelte";
    import Clock from "svelte-material-icons/Clock.svelte";
    import Account from "svelte-material-icons/Account.svelte";
    import Enrollment from "../MainPanel/Class/Enrollment/Enrollment.svelte";
  import { slide } from "svelte/transition";

    export let item;

    let showEnrollment = false;
    let color = item.availability.enrolled / item.availability.capacity * 100 === 100 ? "var(--closed)" : "white";
</script>
  
<div class="associatedClass">
    <h3>{item.code} <span class="number">#{item.number}</span></h3>
    <div class="fact">
        <MapMarker />
        {item.meetingInfo.location}
    </div>
    <div class="fact">
        <Clock />
        {item.meetingInfo.dayAndTime}
    </div>
    <div class="fact">
        <Account />
        {item.meetingInfo.instructor}
    </div>
    <div style="cursor: pointer; user-select: none" on:click={() => showEnrollment = !showEnrollment}>
        <div class="bar">
            <div class="fill" style={`background-color: ${color}; width: ${item.availability.enrolled / item.availability.capacity * 100}%`} />
        </div>
        <span style="color: lightgrey">{Math.round(item.availability.enrolled / item.availability.capacity * 100)}% full ({item.availability.enrolled}/{item.availability.capacity})</span>
    </div>
    {#if showEnrollment}
        <div transition:slide={{duration: 100}}>
            <Enrollment large={false} availability={item.availability} number={item.number} />
        </div>
    {/if}
</div>
  
<style>
    h3 {
        margin: 0;
    }
    .associatedClass {
        background-color: #222;
        border-radius: 5px;
        padding: 10px;
        display: inline-block;
        border: 2px solid #777;
        transition: border-color 0.2s, background-color 0.2s;
    }
    .fact {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-bottom: 10px;
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