<script lang="ts">
    import Pencil from "svelte-material-icons/Pencil.svelte";
    import VirtualList from "../VirtualList/VirtualList.svelte";
    import SmartSchedule from "./ScheduleItem/ScheduleItem.svelte";
  import Onboarding from "./Onboarding/Onboarding.svelte";
    
    let generated = null;
    
</script>

{#if generated !== null}
<div class="smartTitle">
    <h2>
        Generated schedules
    </h2>
    <button>
        <Pencil size="1em" /> Edit preferences
    </button>
</div>
<VirtualList items={generated} let:item>
    <SmartSchedule item={item} />
</VirtualList>
{:else}
<Onboarding bind:generated={generated} />
{/if}

<style>
    .smartTitle {
        height: 106px;
        border: 2px solid grey;
        border-radius: 10px;
        margin: 10px;
        padding: 10px;

        display: flex;
        flex-direction: column;
        text-align: center;
        justify-content: center;
        align-items: center;
    }
    .smartTitle h2 {
        font-size: 36px;
        margin: 0;
        font-weight: bold;
    }
</style>