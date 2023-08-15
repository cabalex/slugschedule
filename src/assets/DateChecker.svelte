<script lang="ts">
    import { db, scheduledClasses } from "../mainStore";
    export let number;
    export let meetingInfos: Array<{dayAndTime: string; location: string; dates: string}>;

    $: {
        let classes = $scheduledClasses.map(x => $db.classes.find(y => x === y.number));
    }
</script>

<span>
    {meetingInfos.map(x => x.dayAndTime).join(", ")}
</span>