<script lang="ts">
    import Clock from "svelte-material-icons/Clock.svelte";
    import { db, scheduledClasses } from "../mainStore";
    import { MeetingInfos } from "../meetingInfo";

    export let number;
    export let onlyShowConflict = false;
    export let meetingInfos: Array<{dayAndTime: string; location: string; dates: string}>;

    export let compressed: boolean = true;
    export let icon: boolean = true;
    export let background: boolean = false;
    export let lightMode: boolean = false;

    let conflict: false|"close"|true = false;
    $: infoObject = MeetingInfos.parse(meetingInfos);
    $: {
        let classes = $scheduledClasses.map(x => $db.getClassByNumber(x)).filter(x => x.number !== number);
        if (classes.some(x => MeetingInfos.parse(x.meetingInfos || [x.meetingInfo]).checkOverlap(infoObject))) {
            conflict = true;
        } else if (classes.some(x => MeetingInfos.parse(x.meetingInfos || [x.meetingInfo]).checkVicinity(infoObject, 1000 * 60 * 30))) {
            conflict = "close";
        } else {
            conflict = false;
        }
    }
</script>

<div style="{background ? "" : "background: none;"}" class="fact {compressed ? "compressed" : ""} {conflict === true ? "red" : (conflict === "close" ? "orange" : "green")} {lightMode ? "light" : ""}">
    {#if conflict === true}
        {#if icon} <Clock /> {/if}
        <span title="This time conflicts with one or more classes in your schedule.">
            {meetingInfos.map(x => x.dayAndTime).join(", ")}
        </span>
    {:else if conflict === "close"}
        {#if icon} <Clock /> {/if}
        <span title="This time is close to another class on your schedule (<30 min). You may have trouble commuting.">
            {meetingInfos.map(x => x.dayAndTime).join(", ")}
        </span>
    {:else if (!onlyShowConflict)}
        {#if icon} <Clock /> {/if}
        <span>
            {meetingInfos.map(x => x.dayAndTime).join(", ")}
        </span>
    {/if}
</div>

<style>
    .fact {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 15px;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 3px;
    }

    .compressed {
        padding: 5px 12px 5px 6px;
        margin: -5px 0px -5px -6px;
        gap: 5px;
    }

    .compressed :global(svg) {
        font-size: 16px;
    }

    .green {
        background-color: #002608;
        color: #99ffa8;
    }

    .light.green {
        color: #084411;
    }

    .red {
        background-color: #3a0000;
        color: #ff9999;
    }

    .light.red {
        color: #f00f0f;
    }

    .orange {
        background-color: #3a1c00;
        color: #ffc599
    }

    .light.orange {
        color: #e86d10;
    }
</style>
