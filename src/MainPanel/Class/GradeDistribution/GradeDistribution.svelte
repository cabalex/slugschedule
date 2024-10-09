<script lang="ts">
    import axios from "axios";
    import { term } from "../../../mainStore";
    import { Bar } from 'svelte-chartjs'
    import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js"
    import { onMount } from "svelte";

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

    export let code: string;
    export let instructor: string;

    $: classCode = code.split(" - ")[0];

    function toQuarter(term: number) {
        let termString = term.toString();
        let quarter = "";
        switch (termString.slice(-1)) {
            case "0":
                quarter = "20" + termString.slice(1, 3) + " Winter Quarter";
                break;
            case "2":
                quarter = "20" + termString.slice(1, 3) + " Spring Quarter";
                break;
            case "4":
                quarter = "20" + termString.slice(1, 3) + " Summer Quarter";
                break;
            case "8":
                quarter = "20" + termString.slice(1, 3) + " Fall Quarter";
                break;
        }
        return quarter;
    }

    let quarter = toQuarter($term);

    async function getInstructors() {
        let instructors = await axios.get(`https://api.slugtistics.com/api/instructors/${encodeURIComponent(classCode)}`)
        return instructors.data;
    }

    async function getDistribution(instructor: string, quarter="All") {
        let distro = await axios.get(`https://api.slugtistics.com/api/grade-distribution/${encodeURIComponent(classCode)}/?instructor=${encodeURIComponent(instructor)}&term=${encodeURIComponent(quarter)}`);
        return distro.data;
    }


    let data = null;
    let averageGPA = null;
    let matchedInstructor = "All";
    let difficulty: 'challenging'|'hard'|'fine'|'easy'|'a breeze' = 'fine';

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
    
    function gradeFromGPA(gpa: number) {
        let grades = Object.keys(gpas);
        if (gpa >= 4.0) return grades[0];
        for (let i = 0; i < grades.length; i++) {
            if (gpas[grades[i]] < gpa) {
                return grades[i];
            }
        }
    }

    async function getData() {
        let instructors = await getInstructors();
        // match instructor
        let originalName = instructor.split(",")[0];
        matchedInstructor = instructors.find((ins) => ins.split(" ").pop() === originalName) || "All";

        let rawData = await getDistribution(matchedInstructor);

        console.log(rawData);

        averageGPA = Object.entries(rawData).reduce((acc, [key, value]) => {
            return acc + gpas[key] * value;
        }, 0) / Object.values(rawData).reduce((acc, value) => acc + value, 0);

        if (averageGPA >= 3.7) {
            difficulty = 'a breeze';
        } else if (averageGPA >= 3.3) {
            difficulty = 'easy';
        } else if (averageGPA >= 3.0) {
            difficulty = 'fine';
        } else if (averageGPA >= 2.7) {
            difficulty = 'hard';
        } else {
            difficulty = 'challenging';
        }

        data = {
                labels: Object.keys(rawData),
                datasets: [
                    {
                        label: 'Students',
                        data: Object.values(rawData),
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
    onMount(getData);
</script>

<div class="gradeDistribution">
    {#if data}
        {#if isNaN(averageGPA)}
            <p>We don't have insights for this course.</p>
        {:else}
            <div class="insights">
                <h2>{classCode}{matchedInstructor !== "All" ? " with " + matchedInstructor.split(" ").pop() : ""} might be <span class={difficulty}>{difficulty}</span></h2>
                <span style="flex-grow: 1" />
                <span class="gpaText">GPA average:</span>
                <b>{averageGPA.toFixed(2)} ({gradeFromGPA(averageGPA)})</b>
            </div>
            <Bar {data} options={options} />
        {/if}
    {:else}
        <p>Loading...</p>
    {/if}
</div>

<style>
    .gradeDistribution {
        width: 100%;
        max-height: 300px;
    }
    .insights {
        background-color: #555;
        padding: 10px;
        border-radius: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
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

    @media screen and (max-width: 800px) {
        .gpaText {
            display: none;
        }
    }
</style>