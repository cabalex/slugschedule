<script lang="ts">
    import TrendingUp from "svelte-material-icons/TrendingUp.svelte";
    import TrendingDown from "svelte-material-icons/TrendingDown.svelte";
    import Information from "svelte-material-icons/Information.svelte";
    import { Line } from 'svelte-chartjs'
    import { Chart as ChartJS, TimeScale, Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale } from "chart.js"
    import 'chartjs-adapter-moment';
    import { db, detectTerm } from "../../../mainStore";
    import { ClassStatus } from '../../../../.server/db/DB';
    import ClassStatusIcon from "../../../assets/ClassStatusIcon.svelte";

    export let availability;
    export let number;
    export let large = true;

    let chartView: "all" | "30d" | "7d" | "3d" | "1d" = "all";

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, TimeScale, CategoryScale);

    let options = {
        color: "white",
        backgroundColor: "#111",
        borderColor: "white",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            },
            verticalLiner: {}
        },
        hover: {
            mode: 'index',
            intersect: false
        },
        layout: {
            padding: {
                bottom: 50
            }
        },
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
                points: false,
                tension: 0.1,
                pointRadius: 0,
            },
            {
                label: 'Waitlist',
                data: [],
                fill: false,
                borderColor: 'orange',
                tension: 0.1,
                pointRadius: 0
            },
            {
                label: 'Capacity',
                data: [],
                backgroundColor: 'rgb(192, 192, 192)',
                fillColor: 'red',
                borderColor: 'rgb(192, 192, 192)',
                tension: 0.1,
                pointRadius: 0
            }
        ]
    }
    let enrolledInLastDay = 0;
    let waitlistInLastDay = 0;
    let range = 0;
    $: {
        if ($db) {
            enrolledInLastDay = 0;
            waitlistInLastDay = 0;
            data.datasets[0].data = [];
            data.datasets[1].data = [];
            data.datasets[2].data = [];
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
                        data.datasets[2].data.push({
                            x: new Date(values[i - 1]),
                            y: lastRecord?.capacity
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
                    data.datasets[2].data.push({
                        x: new Date(values[i]),
                        y: lastRecord?.capacity
                    })

                    if (data.datasets[0].data.length > 1 && Math.abs(Date.now() - values[i]) < 24 * 60 * 60 * 1000) {
                        enrolledInLastDay += data.datasets[0].data[data.datasets[0].data.length - 1].y - data.datasets[0].data[data.datasets[0].data.length - 2].y
                        waitlistInLastDay += data.datasets[1].data[data.datasets[0].data.length - 1].y - data.datasets[0].data[data.datasets[1].data.length - 2].y;
                    }
                }
            }
            data.datasets[0].data.push({x: new Date($db.lastUpdate), y: availability.enrolled});
            data.datasets[1].data.push({x: new Date($db.lastUpdate), y: availability.waitlist});
            data.datasets[2].data.push({x: new Date($db.lastUpdate), y: availability.capacity});

            range = $db.lastUpdate - data.datasets[0].data[0]?.x?.getTime();

            switch(chartView) {
                case "30d":
                    data.datasets = data.datasets.map(dataset => {
                        dataset.data = dataset.data.filter(point => point.x.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000);
                        
                        dataset.data.unshift({
                            x: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                            y: dataset.data[0]?.y
                        })
                        
                        return dataset;
                    })
                    break;
                case "7d":
                    data.datasets = data.datasets.map(dataset => {
                        dataset.data = dataset.data.filter(point => point.x.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000);
                        
                        dataset.data.unshift({
                            x: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                            y: dataset.data[0]?.y
                        })
                        
                        return dataset;
                    })
                    break;
                case "3d":
                    data.datasets = data.datasets.map(dataset => {
                        dataset.data = dataset.data.filter(point => point.x.getTime() > Date.now() - 3 * 24 * 60 * 60 * 1000);
                        
                        dataset.data.unshift({
                            x: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                            y: dataset.data[0]?.y
                        })
                        
                        return dataset;
                    })
                    break;
                case "1d":
                    data.datasets = data.datasets.map(dataset => {
                        dataset.data = dataset.data.filter(point => point.x.getTime() > Date.now() - 24 * 60 * 60 * 1000);
                        
                        dataset.data.unshift({
                            x: new Date(Date.now() - 24 * 60 * 60 * 1000),
                            y: dataset.data[0]?.y
                        })
                        
                        return dataset;
                    })
                    break;
                default:
                    if (data.datasets[0].data.length < 2) {
                        data.datasets = data.datasets.map(dataset => {
                            dataset.data.push({
                                x: 0,
                                y: dataset.data[0]?.y,
                            })
                            
                            return dataset;
                        })
                    }
                    break;
            }


            /*
            // Removes duplicate sequential points (currently breaks graph highlight, so don't use)
            data.datasets = data.datasets.map((dataset) => {
                dataset.data = dataset.data.filter((point, i) =>
                    !(dataset.data[i - 1] &&
                    dataset.data[i + 1] &&
                    dataset.data[i - 1].y == dataset.data[i + 1].y &&
                    dataset.data[i - 1].y == point.y &&
                    dataset.data[i + 1].y == point.y)
                );
                return dataset;
            })*/
        }
    }
</script>

<div class="enrollment">
    {#if large && $db.term === detectTerm()}
    <div class="text">
        <h1 style="display: flex; gap: 20px; align-items: center">
            <ClassStatusIcon status={availability.status} />
            {#if availability.status === ClassStatus.Closed}
                Closed
            {:else if availability.capacity <= availability.enrolled || availability.status === ClassStatus.Waitlist}
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
    <div class="chart">
        {#if range > 24 * 60 * 60 * 1000}
        <div class="chartViews">
            <button on:click={() => chartView = "all"} class:active={chartView == "all"}>all</button>
            {#if range > 30 * 24 * 60 * 60 * 1000}
            <button on:click={() => chartView = "30d"} class:active={chartView == "30d"}>30d</button>
            {/if}
            {#if range > 7 * 24 * 60 * 60 * 1000}
            <button on:click={() => chartView = "7d"} class:active={chartView == "7d"}>7d</button>
            {/if}
            {#if range > 3 * 24 * 60 * 60 * 1000}
            <button on:click={() => chartView = "3d"} class:active={chartView == "3d"}>3d</button>
            {/if}
            <button on:click={() => chartView = "1d"} class:active={chartView == "1d"}>1d</button>
        </div>
        {/if}
        <Line
            data={data}
            options={options}
            plugins={[
                {
                    id: 'verticalLiner',
                    afterDraw: chart => {
                        // https://stackoverflow.com/questions/72998998/how-to-make-vertical-line-when-hovering-cursor-chart-js
                        if (chart.tooltip?._active?.length) {
                        let x = chart.tooltip._active[0].element.x;
                        let yAxis = chart.scales.y;
                        let ctx = chart.ctx;
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x, yAxis.top);
                        ctx.lineTo(x, yAxis.bottom);
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.stroke();
                        ctx.restore(); 
                        }
                    }
                }
            ]}
        />
    </div>
</div>
{#if large && $db.term === detectTerm() && availability.status === ClassStatus.Waitlist && availability.capacity > availability.enrolled}
    <!-- waitlists can have empty spots even though you can't enroll in them. -->
    <div class="note">
        <Information size="24px" />
        <div style="flex-grow: 1">
            <h2>This class is still full, even though there's {availability.capacity - availability.enrolled} open {availability.capacity - availability.enrolled === 1 ? "seat" : "seats"}</h2>
            <p>You can't enroll directly into a waitlisted class, even if it has empty seats. These seats will automatically be filled by the waitlist at <b>9:00 AM</b> each day. Use the waitlist to enroll.</p>
        </div>
    </div>

{/if}

<style>
    .enrollment {
        display: flex;
        flex-direction: row;
        gap: 10px;
        height: 300px;
        width: 100%;
        margin-bottom: 10px;
        overflow: hidden;
        max-height: 300px;
    }
    .enrollment .chart {
        width: 100%;
    }
    :global(.enrollment canvas) {
        position: relative;
        max-height: 100% !important;
        max-width: 100% !important;
    }
    .text {
        flex-grow: 1;
        flex-shrink: 0;
        background-color: #555;
        padding: 10px;
        border-radius: 10px;
        width: 50%;

        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .text h1 {
        margin: 10px;
    }
    .chartViews button {
        padding: 5px 10px;
    }
    .chartViews button.active {
        background-color: var(--primary);
        color: black;
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
    .note {
        display: flex;
        gap: 10px;
        padding: 10px;
        justify-content: center;
        align-items: center;
        background-color: var(--waitlist-dark);
        border: 2px solid var(--waitlist);
        border-radius: 10px;
    }
    .note h2, .note p {
        margin: 0;
    }
    :global(.note svg) {
        flex-shrink: 0;
    }
    @media screen and (max-width: 1600px) {
        .enrollment {
            flex-direction: column;
            height: auto;
            width: 100%;
            max-height: 600px;
        }
        :global(.enrollment canvas) {
            max-height: 300px !important;
        }

        .text {
            width: unset;
        }
        .text h1 {
            font-size: 2em;
        }
    }
</style>