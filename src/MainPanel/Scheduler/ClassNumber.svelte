<script lang="ts">
    import { db } from "../../mainStore";

    export let number: number;

    function copy(e, classNumber) {
        navigator.clipboard.writeText(classNumber);
        e.target.style.outline = "1px solid var(--success)";

        setTimeout(() => {
            e.target.style.outline = "";
        }, 1000);
    }

    $: item = $db.getClassByNumber(number);
</script>

<button
    class="classNumber"
    on:click={(e) => copy(e, number)}
    style={`background-color: hsla(${number % 360}, 25%, 40%, 1)`}
>
    {number} ({item.code}{item.rootClass ? ` for ${item.rootClass.code}` : ""})
</button>

<style>
    .classNumber {
        padding: 5px;
        margin: 5px;
        border-radius: 5px;
        user-select: none;
    }
</style>