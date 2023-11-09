<script lang="ts">
    import { fade } from "svelte/transition";
    import SlugSchedule from "../assets/slugschedule.svg";
    import LoadingIcon from "svelte-material-icons/Loading.svelte";
</script>

<div class="loading" out:fade={{delay: 500, duration: 100}}>
    <div class="center">
        <img src={SlugSchedule} width="128px" alt="Icon" />
        <h2>SlugSchedule</h2>

        <LoadingIcon size="25em" />
    </div>
</div>


<style>
    .loading {
        position: fixed;
        z-index: 100;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        text-align: center;
        background-color: var(--bg);
    }
    .center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    h1, h2 {
        margin: 0;
    }
    h1 {
        color: #ffbf00;
        font-size: 75px;
    }
    :global(.loading svg) {
        z-index: -1;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: #444;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: translate(-50%, -50%) rotate(0deg);
        }
        to {
            transform: translate(-50%, -50%) rotate(360deg);
        }
    }
</style>