<script lang="ts" context="module">
    enum Day {
        Monday, Tuesday, Wednesday, Thursday, Friday
    }
    export class MeetingInfos {
        infos: Array<{
            days: Day[];
            startTime: number;
            endTime: number;
            location: string;
            dates: string;
        }>
        constructor(infos) {
            this.infos = infos;
        }
        static parse(infos: any[]) {
            let outputInfos = [];
            for (let i = 0; i < infos.length; i++) {
                // "MTuWThFSaSu 10:00-11:00"
                let [daysText, times] = infos[i].dayAndTime.split(" ");
                if (!times) continue;
                // really hacky way but i hate dealing with dates
                let [startTime, endTime] = times.split("-").map(x => new Date("1/1/1970 " + x.replace("A", " A").replace("P", " P")).getTime());
                let days = [];
                if (daysText.includes("M")) days.push(Day.Monday);
                if (daysText.includes("Tu")) days.push(Day.Tuesday);
                if (daysText.includes("W")) days.push(Day.Wednesday);
                if (daysText.includes("Th")) days.push(Day.Thursday);
                if (daysText.includes("F")) days.push(Day.Friday);

                outputInfos.push({
                    days, startTime, endTime, location: infos[i].location, dates: infos[i].dates
                })
            }
            return new MeetingInfos(outputInfos);
        }
        checkOverlap(a: MeetingInfos) {
            for (let i = 0; i < this.infos.length; i++) {
                for (let j = 0; j < a.infos.length; j++) {
                    if (this.infos[i].days.some(x => a.infos[j].days.includes(x))) {
                        if (this.infos[i].startTime < a.infos[j].endTime && this.infos[i].endTime > a.infos[j].startTime) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
</script>
<script lang="ts">
    import Clock from "svelte-material-icons/Clock.svelte";
    import { db, scheduledClasses } from "../mainStore";

    export let number;
    export let onlyShowConflict = false;
    export let meetingInfos: Array<{dayAndTime: string; location: string; dates: string}>;

    let conflict = false;
    $: infoObject = MeetingInfos.parse(meetingInfos);
    $: {
        let classes = $scheduledClasses.map(x => $db.getClassByNumber(x)).filter(x => x.number !== number);
        if (classes.some(x => MeetingInfos.parse(x.meetingInfos || [x.meetingInfo]).checkOverlap(infoObject))) {
            conflict = true;
        } else {
            conflict = false;
        }
    }
</script>

{#if conflict}
    <Clock color="red" />
    <span title="This time conflicts with one or more classes in your schedule." style="color: red">
        {meetingInfos.map(x => x.dayAndTime).join(", ")}
    </span>
{:else if (!onlyShowConflict)}
    <Clock color={conflict ? "red" : undefined} />
    <span>
        {meetingInfos.map(x => x.dayAndTime).join(", ")}
    </span>
{/if}