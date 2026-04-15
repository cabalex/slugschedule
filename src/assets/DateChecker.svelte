<script lang="ts">
    import Clock from "svelte-material-icons/Clock.svelte";
    import { db, scheduledClasses } from "../mainStore";
    import { MeetingInfos } from "../meetingInfo";

    export let number;
    export let onlyShowConflict = false;
    export let meetingInfos: Array<{dayAndTime: string; location: string; dates: string}>;

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

{#if conflict === true}
    <Clock color="red" />
    <span title="This time conflicts with one or more classes in your schedule." style="color: red">
        {meetingInfos.map(x => x.dayAndTime).join(", ")}
    </span>
{:else if conflict === "close"}
    <Clock color="orange" />
    <span title="This time is close to another class on your schedule (<30 min). You may have trouble commuting." style="color: orange">
        {meetingInfos.map(x => x.dayAndTime).join(", ")}
    </span>
{:else if (!onlyShowConflict)}
    <Clock />
    <span>
        {meetingInfos.map(x => x.dayAndTime).join(", ")}
    </span>
{/if}
