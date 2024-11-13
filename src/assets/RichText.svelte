<script lang="ts">
  import type { Class } from "../../.server/db/DB";
  import { db, term, focusedClass } from "../mainStore";

    export let content = "";

    const classRegex = new RegExp(/([A-Z]{2,4})\s?(\d{1,3}[A-Z]?)/gm);
    function parse(text: string) {
        // sanitize text
        text = text
            .replace(/&quot;/gm, "\"")
            .replace(/&amp;/gm, "&")
            .replace(/</gm, "&lt;")
            .replace(/>/gm, "&gt;");

        const matches = text.match(classRegex);
        if (!matches) return [{start: 0, end: text.length, text}];
        let parsed = [];
        let lastEnd = 0;
        for (let match of matches) {
            let start = text.indexOf(match, lastEnd);
            let end = start + match.length;
            parsed.push({start: lastEnd, end: start, text: text.slice(lastEnd, start)});
            parsed.push({start, end, text: match, class: true});
            lastEnd = end;
        }
        parsed.push({start: lastEnd, end: text.length, text: text.slice(lastEnd)});
        console.log(parsed)
        return parsed;
    }

    function getTargetClass(classStr: string): Class|null {
        for (let cls of $db.classes) {
            if (cls.code.startsWith(classStr)) return cls;
        }
        return null;
    }

    function navigateToClass(cls: Class, e) {
        e.preventDefault();
        $focusedClass = cls;
    }

    $: parsedContent = parse(content);
</script>

<p class={$$props.class} class:empty={!content}>
    {#each parsedContent as segment}
        {#if segment.text}
            {#if segment.class}
                {@const targetClass = getTargetClass(segment.text)}
                {#if targetClass !== null}
                    <a on:click={navigateToClass.bind(null, targetClass)} href={`?class=${targetClass.number}&term=${$term}`}>{segment.text}</a>
                {:else}    
                    <span title="Not held this quarter" class="deadLink">{segment.text}</span>
                {/if}
            {:else}
                <span>{segment.text}</span>
            {/if}
        {/if}
    {/each}
</p>

<style>
    .deadLink {
        font-weight: 600;
        color: #aaa;
        cursor: not-allowed;
        position: relative;
    }
</style>