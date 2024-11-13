<script lang="ts">
    import Heart from "svelte-material-icons/Heart.svelte";
    import HeartBroken from "svelte-material-icons/HeartBroken.svelte";
    import Dumbbell from "svelte-material-icons/Dumbbell.svelte";
    import Monitor from "svelte-material-icons/Monitor.svelte";
    import { rmpScoreColor } from "../../../ListPanel/ClassItem/ClassItem.svelte";

    export let review;
</script>

<div class="review">
    <aside>
        <div title="Quality score" style="background-color: {rmpScoreColor(review.rating)}" class="quality">
            {review.rating.toFixed(1)}
            {#if review.rating >= 3}
                <Heart />
            {:else}
                <HeartBroken />
            {/if}
        </div>
        <div title="Difficulty score" style="background-color: lightgrey" class="difficulty">
            {review.difficultyRating.toFixed(1)}
            <Dumbbell />
        </div>
    </aside>
    <div class="body">
        <header>
            <h3>
                {review.class}
                {#if review.online}
                <Monitor />
                {/if}
            </h3>
            <h3>{new Date(review.postedAt).toLocaleDateString()}</h3>
        </header>
        <p>
            {review.comment.replace(/&quot;/gm, "\"").replace(/&amp;/gm, "&")}
        </p>
        {#if review.tags}
            <div class="tags">
                {#each review.tags.split("--") as tag}
                    <span class="tag">{tag}</span>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .review {
        border: 2px solid #777;
        padding: 10px;
        padding-left: 0;
        margin-bottom: 20px;
        border-radius: 10px;

        display: flex;
        flex-direction: row;
    }
    .body {
        width: calc(100% - 70px);
        flex-shrink: 1;
        flex-grow: 1;
    }
    p {
        overflow-wrap: break-word;
        margin: 0;
    }
    h3 {
        margin: 12px 0;
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 10px;
    }
    aside {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    aside .quality, aside .difficulty {
        position: relative;
        font-size: 20px;
        font-weight: bold;
        color: black;
        text-align: center;
        margin: 0 10px;
        width: 50px;
        border-radius: 5px;
    }
    :global(.quality svg, .difficulty svg) {
        font-size: 30px;
    }
    .review header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-right: 10px;
    }
    .tags {
        margin-top: 10px;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
         gap: 10px;
    }
    .tag {
        padding: 5px;
        border-radius: 5px;
        background-color: #777;
        text-transform: uppercase;
    }
</style>