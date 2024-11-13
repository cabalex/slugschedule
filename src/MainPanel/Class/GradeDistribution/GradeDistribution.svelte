<script context="module" lang="ts">
    const gpas = {
        "A+": 4.0,
        "A": 4.0,
        "A-": 3.7,
        "B+": 3.3,
        "B": 3.0,
        "B-": 2.7,
        "C+": 2.3,
        "C": 2.0,
        "C-": 1.7,
        "D+": 1.3,
        "D": 1.0,
        "D-": 0.7,
        "F": 0.0
    }
    const notGraded = ["P", "NP", "W", "I", "S", "U"];
    export function calculateAverageGPA(gradeDistributions) {
        let total = {
            "A+": 0,
            "A": 0,
            "A-": 0,
            "B+": 0,
            "B": 0,
            "B-": 0,
            "C+": 0,
            "C": 0,
            "C-": 0,
            "D+": 0,
            "D": 0,
            "D-": 0,
            "F": 0,
            "P": 0,
            "NP": 0,
            "W": 0,
            "S": 0,
            "I": 0,
            "U": 0,
        }

        for (let distribution of gradeDistributions) {
            for (let key of Object.keys(total)) {
                total[key] += distribution[key] || 0;
            }
        }

        // remove students who haven't been graded
        let gradedStudents = Object.values(total).reduce((acc, value) => acc + value, 0);
        notGraded.forEach(key => gradedStudents -= total[key]);

        return Object.entries(total).reduce((acc, [key, value]) => {
            return acc + (gpas[key] || 0) * value;
        }, 0) / gradedStudents;
    }
    export function calculateDifficulty(averageGPA: number) {
        if (averageGPA >= 3.7) {
            return 'a breeze';
        } else if (averageGPA >= 3.3) {
            return 'easy';
        } else if (averageGPA >= 3.0) {
            return 'fine';
        } else if (averageGPA >= 2.7) {
            return 'hard';
        } else {
            return 'challenging';
        }
    }
</script>
<script lang="ts">
    import { Bar } from 'svelte-chartjs'
    import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js"
    import Class from "../Class.svelte";
    import { prettyTerm } from '../../../SidePanel/SidePanel.svelte';

    ChartJS.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    );

    const options = {
        color: "white",
        backgroundColor: "#111",
        borderColor: "white",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                mode: 'index',
                intersect: false
            }
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

    export let item: Class;
    
    function gradeFromGPA(gpa: number) {
        let grades = Object.keys(gpas);
        if (gpa >= 4.0) return grades[0];
        for (let i = 0; i < grades.length; i++) {
            if (gpas[grades[i]] < gpa) {
                return grades[i];
            }
        }
    }

    let term = null;
    let averageGPA = null;
    let difficulty: 'challenging'|'hard'|'fine'|'easy'|'a breeze' = 'fine';

    let data = null;
    $: getData(term);

    function getData(filterTerm=null) {
        let distributions = item.gradeDistributions;
        let total = {
            "A+": 0,
            "A": 0,
            "A-": 0,
            "B+": 0,
            "B": 0,
            "B-": 0,
            "C+": 0,
            "C": 0,
            "C-": 0,
            "D+": 0,
            "D": 0,
            "D-": 0,
            "F": 0,
            "P": 0,
            "NP": 0,
            "W": 0,
            "S": 0,
            "I": 0,
            "U": 0,
        }

        if (filterTerm === null || !distributions.find(d => d.term === filterTerm)) {
            for (let distribution of distributions) {
                for (let key of Object.keys(total)) {
                    total[key] += distribution[key] || 0;
                }
            }
        } else {
            // allow terms with multiple sections
            for (let distribution of distributions) {
                if (distribution.term !== filterTerm) continue;
                for (let key of Object.keys(total)) {
                    total[key] += distribution[key] || 0;
                }
            }
        }

        // remove students who haven't been graded
        let gradedStudents = Object.values(total).reduce((acc, value) => acc + value, 0);
        notGraded.forEach(key => gradedStudents -= total[key]);

        averageGPA = Object.entries(total).reduce((acc, [key, value]) => {
            return acc + (gpas[key] || 0) * value;
        }, 0) / gradedStudents;

        if (total.S === 0 && total.I === 0 && total.U === 0) {
            delete total.S;
            delete total.I;
            delete total.U;
        }
        if (total.W === 0) {
            delete total.W;
        }
        if (total.P === 0 && total.NP === 0) {
            delete total.P;
            delete total.NP;
        }

        difficulty = calculateDifficulty(averageGPA);

        data = {
                labels: Object.keys(total),
                datasets: [
                    {
                        label: 'Students',
                        data: Object.values(total),
                        backgroundColor: [
                            'rgba(255, 134,159,0.4)',
                            'rgba(98,  182, 239,0.4)',
                            'rgba(255, 218, 128,0.4)',
                            'rgba(113, 205, 205,0.4)',
                            'rgba(170, 128, 252,0.4)',
                            'rgba(255, 177, 101,0.4)',
                        ],
                        borderWidth: 2,
                        borderColor: [
                            'rgba(255, 134, 159, 1)',
                            'rgba(98,  182, 239, 1)',
                            'rgba(255, 218, 128, 1)',
                            'rgba(113, 205, 205, 1)',
                            'rgba(170, 128, 252, 1)',
                            'rgba(255, 177, 101, 1)',
                        ],
                    }
                ]
            }
        }
</script>

<div class="gradeDistribution">
    {#if data}
        {#if isNaN(averageGPA)}
            <p>We don't have insights for this course.</p>
        {:else}
            <div class="insights">
                <h2>{item.code.split(" - ")[0]} with {item.instructor.name.split(",")[0]} {term === null ? "might be" : "in " + prettyTerm(term) + " was"} <span class={difficulty}>{difficulty}</span></h2>
                <span style="flex-grow: 1" />
                <span class="gpaText">GPA average:</span>
                <b>{averageGPA.toFixed(2)} ({gradeFromGPA(averageGPA)})</b>
            </div>
            <div class="chart">
                <div class="chartViews">
                    {#if item.gradeDistributions.length > 1}
                        <button on:click={() => term = null} class:active={term === null}>all</button>
                        {#each [...new Set(item.gradeDistributions.map(distribution => distribution.term))].toReversed() as distTerm}
                            <button on:click={() => (term = distTerm)} class:active={term === distTerm}>{prettyTerm(distTerm)}</button>
                        {/each}
                    {:else if item.gradeDistributions.length === 1}
                        <button class="active">{prettyTerm(item.gradeDistributions[0].term)}</button>
                    {/if}
                </div>
                <Bar {data} options={options} />
            </div>
        {/if}
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<style>
    .gradeDistribution {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        overflow: hidden;
    }
    .gradeDistribution .chart {
        width: 100%;
        max-height: 300px;
    }
    :global(.gradeDistribution canvas) {
        position: relative;
        max-height: 100% !important;
        max-width: 100% !important;
    }
    .insights {
        background-color: #555;
        padding: 10px;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
    }
    h2 {
        margin: 0;
        line-height: 1.25em;
    }
    .insights b {
        font-size: 24px;
        white-space: nowrap;
    }
    .breeze {
        color: #00E676;
    }
    .easy {
        color: #C6FF00;
    }
    .fine {
        color: var(--primary);
    }
    .hard {
        color: #FF6E40;
    }
    .challenging {
        color: #FF5252;
    }
    .chartViews {
        width: 100%;
        overflow-x: auto;
        white-space: nowrap;
    }
    .chartViews button {
        padding: 5px 10px;
        margin-right: 5px;
    }
    .chartViews button.active {
        background-color: var(--primary);
        color: black;
    }

    @media screen and (max-width: 800px) {
        .gpaText {
            display: none;
        }
        .insights b {
            background-color: #333;
            max-width: 4ch;
            text-align: center;
            white-space: wrap;
            padding: 5px;
            border-radius: 5px;
        }
    }
    @media screen and (min-width: 1400px) {
        .chartViews {
            max-width: calc(100vw - 950px);
        }
        .chartViews::-webkit-scrollbar-thumb {
            background-color: transparent;
            transition: background-color 0.2s ease-in-out;
        }
        .chartViews:hover::-webkit-scrollbar-thumb {
            background-color: #eee;
        }
    }
</style>