<script lang="ts">
    import { Line } from 'svelte-chartjs'
    import { Chart as ChartJS, TimeScale, Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale } from "chart.js"
    import 'chartjs-adapter-moment';
    import { db } from "../../../mainStore";
    import { ClassStatus } from '../../../../.server/db/DB';

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
                max: availability.capacity,
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
                label: 'Availability',
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
    $: {
        if ($db) {
            data.datasets[0].data = [{x: Date.now(), y: availability.enrolled}];
            data.datasets[1].data = [{x: Date.now(), y: availability.waitlist}];
            $db.history.forEach((val, key) => {
                if (val.findIndex((v) => v.classNumber == number) != -1) {
                    data.datasets[0].data.push({
                        x: new Date(key),
                        y: val.find((v) => v.classNumber == number).enrolled
                    });
                    data.datasets[1].data.push({
                        x: new Date(key),
                        y: val.find((v) => v.classNumber == number).waitlist
                    });
                }
            })
        }
    }
</script>

<div class="enrollment">
    {#if large}
    <div class="text">
        <h1 style="display: flex; gap: 20px; align-items: center">
            <span class="classStatus" class:open={availability.status === ClassStatus.Open} class:waitlist={availability.status === ClassStatus.Waitlist} class:closed={availability.status === ClassStatus.Closed} />
            {#if availability.status === ClassStatus.Closed}
                Closed
            {:else if availability.capacity <= availability.enrolled}
                Full
            {:else}
                {availability.capacity - availability.enrolled} spots remaining
            {/if}
        </h1>
        {#if availability.status === ClassStatus.Waitlist}
        <h1>{availability.waitlist} on waitlist</h1>
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
    }
    .text h1 {
        margin: 10px;
    }
    .classStatus {
        width: 0.8em;
        height: 0.8em;
        line-height: 0;
        display: inline-block;
        margin: 0;
        flex-shrink: 0;
    }
    .classStatus.open {
        background-color: var(--success);
        border: 5px solid var(--success-dark);
        border-radius: 100%;
    }
    .classStatus.waitlist {
        background-color: var(--waitlist);
        border: 5px solid var(--waitlist-dark);
        /* triangle */
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
    }
    .classStatus.closed {
        background-color: var(--closed);
        border: 5px solid var(--closed-dark);
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