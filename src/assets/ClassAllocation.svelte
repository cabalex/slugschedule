<script lang="ts">
  import { ClassStatus } from "../../.server/db/DB";

    export let availability: {
        status: ClassStatus;
        enrolled: number;
        capacity: number;
        waitlist: number;
        waitlistCapacity: number;
    };

    export let cancelled: boolean = false;

    $: color =
        availability.status === ClassStatus.Closed ? "var(--closed)" :
        availability.status === ClassStatus.Waitlist ? "var(--waitlist)" :
        "white";
    
</script>

<div class="classAllocation">
    {#if cancelled}
        <span class="cancelled">Class Cancelled</span>
    {:else if availability.capacity === 0}
        <span class="cancelled" title="This class is closed and is set to zero capacity. It might open up later.">
            Temporarily Closed
        </span>
    {:else}
        <div class="barRow enrolled">
            <span>{availability.enrolled}</span>
            <div class="bar">
                <div class="fill" style={`background-color: ${color}; width: ${availability.enrolled / availability.capacity * 100}%`} />
            </div>
            <span>{availability.capacity}</span>
        </div>
        <div
            class="barRow waitlist"
            style={availability.status === ClassStatus.Waitlist ? "opacity: 1" : "opacity: 0.3"}
        >
            <span>{availability.waitlist}</span>
            <div class="bar">
                <div class="fill" style={`background-color: ${color.replace(")", "-dark)")}; width: ${availability.waitlist / (availability.capacity) * 100}%`} />
            </div>
            <span>{availability.waitlistCapacity}</span>
        </div>
    {/if}
</div>

<style>
    .classAllocation {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
    .cancelled {
        width: 100%;
        text-align: center;
    }
    .barRow {
        display: flex;
        align-items: center;
    }
    .barRow span:first-child {
        text-align: right;
    }
    span {
        width: 22px;
    }
    .waitlist span {
        font-size: 10px;
        line-height: 10px;
        flex-shrink: 0;
    }
    .bar {
        width: calc(100% - 60px);
        flex-shrink: 0;
        margin: 0 5px;
        height: 10px;
        border-radius: 5px;
        overflow: hidden;
        background-color: #111;
    }
    .enrolled {
        align-items: flex-end;
    }
    .enrolled .bar {
        border-radius: 5px 5px 0 0;
    }
    .waitlist {
        align-items: flex-start;
    }
    .waitlist .bar {
        height: 7px;
        border-radius: 0 0 5px 5px;
    }
    .fill {
        height: 100%;
        background-color: var(--closed);
    }
</style>