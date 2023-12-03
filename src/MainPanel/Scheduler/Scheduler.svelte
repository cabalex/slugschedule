<script lang="ts">
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import ShareVariant from "svelte-material-icons/ShareVariant.svelte";
    import ExportVariant from "svelte-material-icons/ExportVariant.svelte";
    import { tick, onMount, onDestroy } from "svelte";
    import { MeetingInfos } from "../../assets/DateChecker.svelte";
    import { db, focusedClass, listMode, scheduledClasses, smartClasses } from "../../mainStore";
    import ClassNumber from "./ClassNumber.svelte";
    import ShareModal from "../../assets/ShareModal.svelte";
    import ExportModal from "../../assets/ExportModal.svelte";

    import { createEvents,  type DateArray, type DurationObject, type EventAttributes} from "ics"
    import TermMenu from "../../SidePanel/TermMenu.svelte";


    let shareOpen = false;
    let exportOpen = false;
    async function focusClass(event) {
        $listMode = "all";
        await tick();
        if (event.class.name) {
            $focusedClass = event.class;
        } else {
            $focusedClass = event.class.rootClass;
        }
    }

    function removeClass(event, e) {
        e.preventDefault();
        $scheduledClasses = $scheduledClasses.filter(c => c !== event.class.number);
        if (event.class.name) {
            $scheduledClasses = $scheduledClasses.filter(c => !event.class.associatedClasses.map(x => x.number).includes(c));
        } else {
            $scheduledClasses = $scheduledClasses.filter(c => !event.class.rootClass || c !== event.class.rootClass.number);
        }
    }

    const topDate = new Date("1/1/1970 08:00 AM");
    const bottomDate = new Date("1/1/1970 11:00 PM");

    const top = topDate.getTime();
    const bottom = bottomDate.getTime();

    let days = [
        [], [], [], [], []
    ];
    //let dailyEvents: Array<Array<EventAttributes>>;
    let dailyEvents: EventAttributes[] = [];
    //find a smarter way to do this
    $: {
        days = [
            [], [], [], [], []
        ];
        //dailyEvents = [
        //    [], [], [], [], []
        //]
        dailyEvents = []
        let classes = $listMode === "smart" ? $smartClasses : $scheduledClasses;
        // returns day of term start in [MM,DD,YY] its an array
        let mdy_dayofTermStart = $db.getClassByNumber(classes[0]).meetingInfos[0].dates.slice(0,8).split('/').map((e) => Number(e));
        let mdy_dayofTermEnd = $db.getClassByNumber(classes[0]).meetingInfos[0].dates.slice(11,19).split('/').map((e) => Number(e));
        //console.log(mdy_dayofTermEnd)
        // Convert to [YYYY, MM, DD]
        // no y2k here
        const TermStart = new Date(
            (Math.trunc(new Date().getFullYear() / 100) * 100) + mdy_dayofTermStart[2],
            mdy_dayofTermStart[0]-1,
            mdy_dayofTermStart[1]
        )
        const TermEnd = new Date(
            (Math.trunc(new Date().getFullYear() / 100) * 100) + mdy_dayofTermEnd[2],
            mdy_dayofTermEnd[0]-1,
            mdy_dayofTermEnd[1]
        )
        const TermStartDay = TermStart.getDay()
        //console.log(TermStartDay)
        for (let scheduledClassNumber of classes) {
            let scheduledClass = $db.getClassByNumber(scheduledClassNumber);
            let meetingInfos = MeetingInfos.parse(scheduledClass.meetingInfos || [scheduledClass.meetingInfo]);
            for (let i = 0; i < meetingInfos.infos.length; i++) {
                let info = meetingInfos.infos[i];
                for (let day of info.days) {
                    // This will cause issues near the end of the month 🤷 cause if we're adding more days than there are in the month who knows what happens
                    // anyways this should return the day that the first session of each section is
                    // also dont forget days is 0-4 (mon-fri) while .getDate and stuff is 0-6 (Sun-Sat)
                    let weekDay = day + 1
                    let classDate = new Date(TermStart)
                    // i think this is right??
                    classDate.setDate((weekDay >= TermStartDay) ? TermStart.getDate() + (weekDay - TermStartDay) : TermStart.getDate() + (7 +  TermStartDay - weekDay ));
                    days[day].push({
                        class: scheduledClass,
                        startTime: info.startTime,
                        endTime: info.endTime
                    });
                    let sTime = new Date(info.startTime);
                    let eTime = new Date(info.endTime);
                    //console.log(`${scheduledClass.rootClass.code} ${scheduledClass.rootClass.details}`)
                    //scheduledClass.rootClass ? console.log(scheduledClass) : console.log("error", scheduledClass)
                    //console.log(scheduledClass)
                    //existance of .rootClass means it's a discussion section
                    let event: EventAttributes = {
                        start: [classDate.getFullYear(), classDate.getMonth()+1, classDate.getDay(), sTime.getHours(), sTime.getMinutes()],
                        end: [classDate.getFullYear(), classDate.getMonth()+1, classDate.getDay(), eTime.getHours(), eTime.getMinutes()],
                        title: scheduledClass.rootClass ? `${scheduledClass.code}: ${scheduledClass.rootClass.code} — ${scheduledClass.rootClass.name}` :
                        `${scheduledClass.code} — ${scheduledClass.name}`,
                        description: scheduledClass.rootClass ? scheduledClass.rootClass.description : scheduledClass.description,
                        location: meetingInfos.infos[0].location,
                        categories: [scheduledClass.code],
                                recurrenceRule: `FREQ=WEEKLY;INTERVAL=1;UNTIL=${TermEnd.getFullYear()}${String(TermEnd.getMonth()+1).padStart(2,"0")}${String(TermEnd.getDate()).padStart(2,"0")}`
                    }
                     dailyEvents.push(event)                    
                }
            }
        }
        // update state
        days = [...days];
    }

    // Update the current time every minute
    let nowInterval;
    let nowTime = new Date();

    onMount(() => {
        setInterval(() => nowTime = new Date(), 1000);
    })

    onDestroy(() => clearInterval(nowInterval))
</script>

<h2 class="title">
    {#if $listMode === "smart"}
    Smart Scheduler
    {:else}
    Scheduler
    {/if}
    <button class="roundBtn" on:click={() => shareOpen = true}><ShareVariant /></button>
    <button class="roundBtn" on:click={() => exportOpen = true}><ExportVariant /></button>
</h2>
{#if shareOpen}
    <ShareModal
        url={`${document.location.origin}${document.location.pathname}?scheduler=${$scheduledClasses.join(",")}&term=${$db.term}`}
        headerText="Share this schedule"
        onClose={() => shareOpen = false}
    />
{/if}
{#if exportOpen}
    <ExportModal
    url={`${document.location.origin}${document.location.pathname}?scheduler=${$scheduledClasses.join(",")}&term=${$db.term}`}
    headerText="Share this schedule"
    onClose={() => exportOpen = false}
    events={dailyEvents}
    />
{/if}
<div class="schedulerBody">
    <div class="times">
        {#each [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22] as hour}
        <div class="main">{`${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`}</div>
        <div class="tick">:15</div>
        <div class="tick">:30</div>
        <div class="tick">:45</div>
        {/each}
    </div>
    <table>
        <thead>
            <tr>
                <th>Monday</th>
                <th>Tuesday</th>
                <th>Wednesday</th>
                <th>Thursday</th>
                <th>Friday</th>
            </tr>
        </thead>
        <tr>
            {#each days as day, i}
                <td>
                    {#each day as event}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <div
                        class="event"
                        on:click={focusClass.bind(null, event)}
                        on:contextmenu={removeClass.bind(null, event)}
                        title={event.class.name || event.class.rootClass.name}
                        style={`background-color: hsla(${event.class.number % 360}, 25%, 40%, 0.4); top: ${(event.startTime - top) / (bottom - top) * 100}%; height: ${(event.endTime - event.startTime) / (bottom - top) * 100}%`}
                    >   
                        <!-- this is how time and dates are converted -->
                        <p class="time">{new Date(event.startTime).toLocaleTimeString().replace(":00 ", " ")}</p>
                        <h2>{event.class.code}</h2>
                        <h3>{event.class.name || event.class.rootClass.name}</h3>
                        <p class="time">{new Date(event.endTime).toLocaleTimeString().replace(":00 ", " ")}</p>
                    </div>
                    {/each}
                    {#if nowTime.getDay() - 1 === i}
                    <!-- for some reason I need to add an additional hour here?? -->
                    <div
                        class="now"
                        style={`top: ${((((nowTime.getHours() + topDate.getHours()) * 60) + nowTime.getMinutes()) * 60 * 1000 - top) / (bottom - top) * 100}%;`}
                    />
                    {/if}
                </td>
            {/each}
        </tr>
    </table>
</div>
<p style="margin: 10px">This schedule is made out of these Class Numbers (click to copy):</p>
<li style="list-style: none; margin: 0 10px">
    {#each $scheduledClasses as classNumber}
        <ClassNumber number={classNumber} />
    {/each}
</li>
<header class="mobileHeader">
    <button class="roundBtn" on:click={() => $focusedClass = null}>
        <ArrowLeft />
    </button>
    <h2>Scheduler</h2>
</header>

<style>
    h2, h3 {
        width: 100%;
        margin: 0;
        text-align: center;
    }
    .title {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: calc(100% - 50px);
        margin-left: 50px;

    }
    .schedulerBody {
        display: flex;
        flex-direction: row;
        height: 1300px;
        overflow: hidden;
    }
    .times {
        flex-shrink: 0;
        padding-top: 12px;
        padding-bottom: 6px;
        background-color: #111;

        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: flex-end;
    }
    .main {
        text-align: right;
        position: relative;
        line-height: 10px;
        height: 10px;
    }
    .main:after {
        content: "";
        z-index: 0;
        position: absolute;
        left: 100%;
        top: 50%;
        width: 100vw;
        height: 2px;
        background-color: grey;
    }
    .tick {
        font-size: 13px;
        height: 5px;
        line-height: 5px;
        color: #999;
    }
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th {
        height: 1em;
        font-size: 20px;
    }
    td {
        width: 20%;
        border: 2px solid #ccc;
        position: relative;
    }
    .event, .now {
        background-color: red;
        position: absolute;
        left: 0;
        width: 100%;
        cursor: pointer;
        user-select: none;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .event h3 {
        flex-shrink: 2;
        overflow: hidden;
    }
    .now {
        pointer-events: none;
        width: 100%;
        height: 4px;
    }
    .now:before {
        content: "";
        position: absolute;
        left: -6px;
        top: -4px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: red;
    }
    .time {
        color: black;
        color: lightgrey;
        font-weight: bold;
        text-align: center;
        margin: 0;
        width: 100%;
    }
    li {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        margin-bottom: 50px;
    }
    @media screen and (max-width: 900px) {
        .mobileHeader {
            margin: 20px;
            margin-bottom: 80px;
            width: calc(100% - 40px);
        }
        .times {
            background-color: #444;
            position: sticky;
            left: 0;
            z-index: 10;
            box-shadow: 0 0 10px black;
        }
        .schedulerBody {
            overflow: auto;
        }
        th {
            min-width: 25vw;
        }
        table {
            width: 500px;
            flex-shrink: 0;
            overflow: auto;
        }
    }
</style>