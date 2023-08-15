<script lang="ts">
    import { ClassStatus } from "../../.server/db/DB";

    export let status: ClassStatus;
</script>

<span
    class="classStatus"
    class:open={status === ClassStatus.Open}
    class:waitlist={status === ClassStatus.Waitlist}
    class:closed={status === ClassStatus.Closed}
/>

<style>
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
</style>