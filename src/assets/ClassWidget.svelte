<script lang="ts">
  import { ClassStatus } from "../../.server/db/DB";
  import { db, focusedClass } from "../mainStore";

    export let number;

    let item;
    let color = "red";
    $: {
        item = $db ? $db.classes.find((item) => item.number === number) : null;
        color = item?.availability.status === ClassStatus.Closed ? "var(--closed)" :
            item?.availability.status === ClassStatus.Waitlist ? "var(--waitlist)" : "white";
    }
</script>

{#if item}
<button class="classWidget" on:click={() => focusedClass.set(item)}>
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
    .classWidget {
        text-align: left;
        cursor: pointer;
        user-select: none;
        background-color: #222;
        border-radius: 5px;
        padding: 10px;
        display: inline-block;
        border: 2px solid #777;
        transition: border-color 0.2s, background-color 0.2s;
    }
    .classWidget:hover {
        background-color: #555;
        border-color: #aaa;
    }
    .classWidget span {
        color: "lightgrey";
    }
    .bar {
        position: relative;
        width: 100%;
        height: 5px;
        background-color: #777;
        border-radius: 5px;
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