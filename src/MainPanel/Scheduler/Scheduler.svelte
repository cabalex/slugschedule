<script lang="ts">
    import { tick } from "svelte";
    import { MeetingInfos } from "../../assets/DateChecker.svelte";
    import { db, focusedClass, listMode, scheduledClasses } from "../../mainStore";

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

    const top = new Date("1/1/1970 08:00 AM").getTime();
    const bottom = new Date("1/1/1970 11:00 PM").getTime();

    let days = [
        [], [], [], [], []
    ];
    $: {
        days = [
            [], [], [], [], []
        ];
        for (let scheduledClassNumber of $scheduledClasses) {
            let scheduledClass = $db.getClassByNumber(scheduledClassNumber);
            let meetingInfos = MeetingInfos.parse(scheduledClass.meetingInfos || [scheduledClass.meetingInfo]);
            for (let i = 0; i < meetingInfos.infos.length; i++) {
                let info = meetingInfos.infos[i];
                for (let day of info.days) {
                    days[day].push({
                        class: scheduledClass,
                        startTime: info.startTime,
                        endTime: info.endTime
                    });
                }
            }
        }
        // update state
        days = [...days];
    }
</script>

<h2>Scheduler</h2>
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
        <tr>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
        </tr>
        <tr>
            {#each days as day}
                <td>
                    {#each day as event}
                    <div
                        class="event"
                        on:click={focusClass.bind(null, event)}
                        on:contextmenu={removeClass.bind(null, event)}
                        title={event.class.name || event.class.rootClass.name}
                        style={`background-color: hsla(${event.class.number % 360}, 25%, 40%, 0.4); top: ${(event.startTime - top) / (bottom - top) * 100}%; height: ${(event.endTime - event.startTime) / (bottom - top) * 100}%`}
                    >
                        <p class="time">{new Date(event.startTime).toLocaleTimeString().replace(":00 ", " ")}</p>
                        <h2>{event.class.code}</h2>
                        <h3>{event.class.name || event.class.rootClass.name}</h3>
                        <p class="time">{new Date(event.endTime).toLocaleTimeString().replace(":00 ", " ")}</p>
                    </div>
                    {/each}
                </td>
            {/each}
        </tr>
    </table>
</div>
<p>This schedule is made out of these Class Numbers:</p>
<li style="list-style: none">
    {#each $scheduledClasses as classNumber}
        <span
            class="classNumber"
            style={`background-color: hsla(${classNumber % 360}, 25%, 40%, 1)`}
        >
            {classNumber} ({$db.getClassByNumber(classNumber).code})
        </span>
    {/each}
</li>

<style>
    h2, h3 {
        width: 100%;
        margin: 0;
        text-align: center;
    }
    .schedulerBody {
        display: flex;
        flex-direction: row;
        height: 1300px;
        overflow: hidden;
    }
    .times {
        flex-shrink: 0;
        margin-top: 12px;
        margin-bottom: 6px;
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
    .event {
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
    .time {
        color: black;
        color: lightgrey;
        font-weight: bold;
        text-align: center;
        margin: 0;
        width: 100%;
    }
    .classNumber {
        padding: 5px;
        margin: 5px;
        border-radius: 5px;
    }
</style>