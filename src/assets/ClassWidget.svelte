<script lang="ts">
  import { db, focusedClass } from "../mainStore";

    export let number;

    let item;
    let color = "red";
    $: {
        item = $db ? $db.classes.find((item) => item.number === number) : null;
        color = item?.availability.enrolled / item?.availability.capacity * 100 === 100 ? "var(--closed)" : "white";
    }
</script>

{#if item}
<button class="classWidget" on:click={() => focusedClass.set(item)}>
    <h4>{item.code}</h4>
    <h3>{item.name}</h3>
    <div class="bar">
        <div class="fill" style={`background-color: ${color}; width: ${item.availability.enrolled / item.availability.capacity * 100}%`} />
    </div>
    <span style="color: lightgrey">{Math.round(item.availability.enrolled / item.availability.capacity * 100)}% full ({item.availability.enrolled}/{item.availability.capacity})</span>
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