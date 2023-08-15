<script lang="ts">
    import TrendingUp from "svelte-material-icons/TrendingUp.svelte";
    import TrendingDown from "svelte-material-icons/TrendingDown.svelte";
    import { Line } from 'svelte-chartjs'
    import { Chart as ChartJS, TimeScale, Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale } from "chart.js"
    import 'chartjs-adapter-moment';
    import { db } from "../../../mainStore";
    import { ClassStatus } from '../../../../.server/db/DB';
  import ClassStatusIcon from "../../../assets/ClassStatusIcon.svelte";

    export let availability;
    export let number;
    export let large = true;

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, TimeScale, CategoryScale);

    let options = {
        color: "white",
        backgroundColor: "#111",
        borderColor: "white",
        scales: {
            x: {
                type: 'time',
                color: 'white',
                ticks: {
                    color: '#ccc'
                },
                grid: {
                    color: '#555'
                }
            },
            y: {
                min: 0,
                max: Math.max(availability.capacity, availability.enrolled, availability.waitlist),
                color: 'white',
                ticks: {
                    color: '#ccc'
                },
                grid: {
                    color: '#555'
                }
            }
        }
    }
    let data = {
        labels: [],
        datasets: [
            {
                label: 'Enrolled',
                data: [],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            },
            {
                label: 'Waitlist',
                data: [],
                fill: false,
                borderColor: 'orange',
                tension: 0.1
            }
        ]
    }
    let enrolledInLastDay = 0;
    let waitlistInLastDay = 0;
    $: {
        if ($db) {
            enrolledInLastDay = 0;
            waitlistInLastDay = 0;
            data.datasets[0].data = [];
            data.datasets[1].data = [];
            let values = [...$db.history.keys()].sort((a, b) => a - b);
            let lastRecord = null;
            for (let i = 0; i < values.length; i++) {
                if ($db.history.get(values[i]).some((v) => v.classNumber == number)) {
                    // changed since last check, so put the point for last check in if not there
                    if (lastRecord && data.datasets[0].data[data.datasets[0].data.length - 1].x != new Date(values[i - 1])) {
                        data.datasets[0].data.push({
                            x: new Date(values[i - 1]),
                            y: lastRecord?.enrolled
                        })
                        data.datasets[1].data.push({
                            x: new Date(values[i - 1]),
                            y: lastRecord?.waitlist
                        })
                    }
                    lastRecord = $db.history.get(values[i]).find((v) => v.classNumber == number);
                    data.datasets[0].data.push({
                        x: new Date(values[i]),
                        y: lastRecord?.enrolled
                    });
                    data.datasets[1].data.push({
                        x: new Date(values[i]),
                        y: lastRecord?.waitlist
                    });

                    if (data.datasets[0].data.length > 1 && Math.abs(Date.now() - values[i]) < 24 * 60 * 60 * 1000) {
                        enrolledInLastDay += data.datasets[0].data[data.datasets[0].data.length - 1].y - data.datasets[0].data[data.datasets[0].data.length - 2].y
                        waitlistInLastDay += data.datasets[1].data[data.datasets[0].data.length - 1].y - data.datasets[0].data[data.datasets[1].data.length - 2].y;
                    }
                }
            }
            data.datasets[0].data.push({x: new Date($db.lastUpdate), y: availability.enrolled});
            data.datasets[1].data.push({x: new Date($db.lastUpdate), y: availability.waitlist});
        }
    }
</script>

<div class="enrollment">
    {#if large}
    <div class="text">
        <h1 style="display: flex; gap: 20px; align-items: center">
            <ClassStatusIcon status={availability.status} />
            {#if availability.status === ClassStatus.Closed}
                Closed
            {:else if availability.capacity <= availability.enrolled}
                Full
            {:else if availability.capacity - availability.enrolled === 1}
                One spot remaining!
            {:else}
                {availability.capacity - availability.enrolled} spots remaining
            {/if}
        </h1>
        {#if availability.status === ClassStatus.Waitlist}
        <h1>{availability.waitlist} on waitlist</h1>
        {/if}
        {#if enrolledInLastDay !== 0}
        <h2 class="trend">
            {#if enrolledInLastDay > 0}
            <TrendingUp size="2em" />
            {:else}
            <TrendingDown size="2em" />
            {/if}
            <div>
                <span>{enrolledInLastDay} enrolled in last day</span>
                <span style="font-size: 0.8em">({Math.round(Math.abs(enrolledInLastDay) / availability.capacity * 100)}% of capacity)</span>
            </div>
        </h2>
        
        {/if}
    </div>
    {/if}
    <Line
        data={data}
        width={large ? 600 : 300}
        height={large ? 300 : 300}
        options={options}
    />
</div>

<style>
    .enrollment {
        display: flex;
        flex-direction: row;
        gap: 10px;
        height: 300px;
        width: 100%;
        margin-bottom: 10px;
    }
    .text {
        flex-grow: 1;
        background-color: #555;
        padding: 10px;
        border-radius: 10px;

        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .text h1 {
        margin: 10px;
    }
    h2.trend {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    .trend > div > span {
        display: block;
        margin: 0;
    }
    @media screen and (max-width: 700px) {
        .enrollment {
            flex-direction: column;
            height: auto;
            width: 100%;
        }
        .text h1 {
            font-size: 2em;
        }
    }
</style>