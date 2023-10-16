<script lang="ts">
  import { fade } from "svelte/transition";
    import type { Class } from "../../../.server/db/DB";
    import AssociatedClass from "../../assets/AssociatedClass.svelte";
  import { scheduledClasses } from "../../mainStore";

    export let item: Class;
    export let close = () => {};

    function selectSection(section: any) {
        scheduledClasses.update(x => [...x, section.number])
        close();
    }
</script>

<div class="modal" transition:fade={{duration: 100}} on:click={close}>
    <div class="modalInner" on:click={(e) => e.stopPropagation()}>
        <h2>This class has associated classes. Would you like to take one?</h2>
        {#if item.classNotes}
        <h3>Class Notes</h3>
        {/if}
        <p>{item.classNotes}</p>
        <div class="associatedClasses">
            {#each item.associatedClasses as associatedClass}
                <AssociatedClass item={associatedClass} onClick={selectSection.bind(null, associatedClass)} />
            {/each}
        </div>
        <button on:click={close}>Skip selecting a section</button>
    </div>
</div>

<style>
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;

        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10;
    }
    .modalInner {
        max-width: 800px;
        max-height: 90%;
        overflow: auto;

        background-color: #333;
        border-radius: 10px;
        padding: 10px;
    }
    h2 {
        margin: 20px;
        text-align: center;
    }
    h3 {
        margin: 0 20px;
        text-align: center;
        margin-bottom: 0px;
    }
    p {
        text-align: center;
        margin: 5px 30px;
        margin-bottom: 30px;
    }
    .associatedClasses {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
    }
    button {
        margin: 20px;
        float: right;
    }
</style>