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
  import RollingNumber from "../../../assets/RollingNumber.svelte";

    export let availability;
    export let number;
    export let large = true;
    export let lastUpdate: Date = new Date();

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
                tension: 0,
                pointRadius: 0,
            },
            {
                label: 'Waitlist',
                data: [],
                fill: false,
                borderColor: 'orange',
                tension: 0,
                pointRadius: 0
            },
            {
                label: 'Capacity',
                data: [],
                backgroundColor: 'rgb(192, 192, 192)',
                fillColor: 'red',
                borderColor: 'rgb(192, 192, 192)',
                tension: 0,
                pointRadius: 0
            }
        ]
    }
    export let enrolledInLastDay = 0;
    let waitlistInLastDay = 0;
    let range = 0;
    $: {
        if ($db && availability) {
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
            data.datasets[0].data.push({x: lastUpdate, y: availability.enrolled});
            data.datasets[1].data.push({x: lastUpdate, y: availability.waitlist});
            data.datasets[2].data.push({x: lastUpdate, y: availability.capacity});

            range = lastUpdate.getTime() - data.datasets[0].data[0]?.x?.getTime();

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
    {#if range > 24 * 60 * 60 * 1000}
        <div class="chartViews">
            <button on:click={() => chartView = "all"} class:active={chartView == "all"} class:left={true}>all</button>
            {#if range > 30 * 24 * 60 * 60 * 1000}
            <button on:click={() => chartView = "30d"} class:active={chartView == "30d"}>30d</button>
            {/if}
            {#if range > 7 * 24 * 60 * 60 * 1000}
            <button on:click={() => chartView = "7d"} class:active={chartView == "7d"}>7d</button>
            {/if}
            {#if range > 3 * 24 * 60 * 60 * 1000}
            <button on:click={() => chartView = "3d"} class:active={chartView == "3d"}>3d</button>
            {/if}
            <button on:click={() => chartView = "1d"} class:active={chartView == "1d"} class:right={true}>1d</button>
        </div>
    {/if}
    <div class="chart">
        <div>
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
</div>

<style>
    .enrollment {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        margin-top: -35px;
        flex-direction: column;
        height: auto;
        width: 100%;
        max-height: 600px;
    }
    .enrollment .chart {
        background-color: #0000002d;
        border-radius: 8px;
        padding: 8px 20px 0px 20px;
    }
    .enrollment .chart div {
        height: 300px;
        margin-bottom: -32px;
    }
    :global(.enrollment canvas) {
        position: relative;
        max-width: 100% !important;
        max-height: 300px !important;
    }
    .text {
        flex-grow: 1;
        flex-shrink: 0;
        background-color: #555;
        padding: 10px;
        border-radius: 10px;
        width: unset;

        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
    }
    .text h1 {
        margin: 10px;
        font-size: 2em;
    }
    .chartViews {
        margin-left: auto;
    }
    .chartViews button {
        font-size: 10px;
        border-radius: 4px;
        background-color: transparent;
        border-color: #6a6969;
        border-width: 1px;
        margin-left: -1px;
    }
    .chartViews .left {
        border-radius: 8px 4px 4px 8px;
    }
    .chartViews .right {
        border-radius: 4px 8px 8px 4px;
    }
    .chartViews button.active {
        background-color: #2c2c2c;
        border-color: #2c2c2c;
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
    .updatingLive {
        position: absolute;
        bottom: 10px;
        right: 10px;
        color: #ccc;
        font-size: 0.8em;
    }
    :global(.note svg) {
        flex-shrink: 0;
    }
</style>