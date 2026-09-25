<script lang="ts">
  import { ClassStatus } from "../../.server/db/DB";
  import { db, focusedClass, shouldAnimate } from "../mainStore";

    export let number;

    let item;
    let color = "red";
    $: {
        item = $db ? $db.classes.find((item) => item.number === number) : null;
        color = item?.availability.status === ClassStatus.Closed ? "var(--closed)" :
            item?.availability.status === ClassStatus.Waitlist ? "var(--waitlist)" : "white";
    }

    function focusClass() {
        $shouldAnimate = false;
        $focusedClass = item;   
        setTimeout(() => $shouldAnimate = true, 0);
    }
</script>

{#if item}
<button class="classWidget" on:click={focusClass}>
    <h4>{item.code}</h4>
    <h3>{item.name}</h3>
    <div class="bar">
        <div class="fill" style={`background-color: ${color}; width: ${item.availability.enrolled / item.availability.capacity * 100}%`} />
        <div class="fill" style={`background-color: var(--waitlist-dark); width: ${item.availability.waitlist / item.availability.waitlistCapacity * 100}%`} />
    </div>
    {#if item.availability.capacity === 0}
    <span>Temp. Closed ({item.availability.enrolled}/{item.availability.capacity})</span>
    {:else}
    <span>{Math.round(item.availability.enrolled / item.availability.capacity * 100)}% full ({item.availability.enrolled}/{item.availability.capacity})</span>
    {/if}
</button>
{/if}

<style>
    h3, h4 {
        margin: 0;
    }
    h4 {
        padding-bottom: 6px;
        color: lightgrey;
    }
    .classWidget {
        text-align: left;
        cursor: pointer;
        user-select: none;
        background-color: #0000002d;
        border-radius: 5px;
        padding: 10px 14px 10px 14px;
        display: inline-block;
    }
    .classWidget:hover {
        background-color: #2c2c2c;
        border-color: #2c2c2c;
    }
    .classWidget span {
        color: lightgrey;
        display: block;
        margin-top: 4px;
    }
    .bar {
        position: relative;
        width: 100%;
        height: 5px;
        background-color: #777;
        border-radius: 5px;
        margin-top: 14px;
        overflow: hidden;
    }
    .fill {
        position: absolute;
        left: 0;
        top: 0;
        color: white;
        height: 100%;
    }
</style>