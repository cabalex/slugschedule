<script lang="ts">
    import CalendarQuestion from "svelte-material-icons/CalendarQuestion.svelte";
    import { fly } from "svelte/transition";
    export let step: number;
</script>

<div class="step" in:fly={{duration: 100, x: 50}} out:fly={{duration: 100, x: -50}}>
    <h2>What kind of person are you?</h2>
    <div class="icon">
        <CalendarQuestion size="10em" />
    </div>
    <p>The Smart Scheduler plans around how you want to enroll.</p>
    <p>Simply input your preferences, and we'll generate some schedules for you automatically!</p>
    <button class="fullwidth" on:click={() => step++}>Get started</button>
    <i style="color: #ccc">Advanced</i>
</div>

<style>
    .step {
        position: absolute;
        top: 0;
        left: 0;
        width: calc(100% - 60px);
        height: calc(100% - 80px);
        display: flex;
        flex-direction: column;
        justify-content: start;
        align-items: center;
        gap: 20px;
        padding: 30px;
        padding-top: 50px;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .step > * {
        margin: 0;
        text-align: center;
    }
    .icon {
        padding: 30px;
    }
    button.fullwidth {
        width: 100%;
    }
</style>
