<script lang="ts">
    import ArrowLeft from "svelte-material-icons/ArrowLeft.svelte";
    import Step0 from "./steps/Step0.svelte";
    import Step1 from "./steps/Step1.svelte";
    import { fade } from "svelte/transition";
  import Step2 from "./steps/Step2.svelte";

    export let generated: any[]|null;

    let step = 0;
    let classes = [];

</script>

{#if step > 0}
<div class="backBtn" transition:fade={{duration: 100}}>
    <button class="roundBtn" on:click={() => step--}>
        <ArrowLeft />
    </button>
</div>
{/if}

{#if step === 0}
<Step0 bind:step={step} />
{:else if step === 1}
<Step1 bind:step={step} bind:value={classes} />
{:else if step === 2}
<Step2 bind:step={step} />
{/if}

<style>
    .roundBtn {
        position: absolute;
        top: 10px;
        left: 10px;
    }
</style>