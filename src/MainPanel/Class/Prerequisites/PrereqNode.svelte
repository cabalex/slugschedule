<script lang="ts">
    import type { Class } from "../../../../.server/db/DB";
    import { db, focusedClass, shouldAnimate } from "../../../mainStore";
    import RichText from "../../../assets/RichText.svelte";
    import type { PrereqNode } from "./prerequisites"; 

    export let node: PrereqNode;
    export let parentType: string | null = null;

    function getTargetClass(classStr: string): Class | null {
        for (let cls of $db.classes) {
            if (cls.code.split(" - ")[0] === classStr) return cls;
        }
        return null;
    }

    function navigateToClass(cls: Class, e: MouseEvent) {
        e.preventDefault();
        $shouldAnimate = false;
        $focusedClass = cls;
        setTimeout(() => $shouldAnimate = true, 0);
    }

    let debugMode = false;
</script>

{#if debugMode}
    <p style="white-space: pre-wrap;">
        {JSON.stringify(node, null, "\t")}
    </p>
{:else if node.type === "CLASS"}
    {@const targetClass = getTargetClass(node.course)}
    
    {#if targetClass}
        <a 
            href="#{node.course.replace(/\s+/g, '')}" 
            on:click={(e) => navigateToClass(targetClass, e)}
        >
            {node.course}
        </a>
    {:else}
        <!-- Fallback if the parsed class isn't in the database for some reason -->
        <span class="deadLink">{node.course}</span>
    {/if}
{:else if node.type === "TEXT"}
    <RichText content={node.text} />
{:else if node.type === "OR"}
    {#if node.children.every(child => child.type === "AND")} 
        <!-- Renders OR as a seperate line when there are complex ANDs under it. -->
        {#each node.children as child, i}
            {#if i != 0 && node.children.length != 0}
                <div class="orDivider">
                    <div class="border"></div>
                    <div class="text">OR</div>
                    <div class="border"></div>
                </div>
            {/if}
            <svelte:self parentType={node.type} node={child} />
        {/each}
    {:else}
        <!-- Renders OR as all inline when there are no complex ANDs under it. (Adds parenthesis if it's within another OR) -->
        {#if parentType === "OR"}
            <span>(</span>
        {/if}

        {#each node.children as child, i}
            <span>{i != 0 ? " or " : ""}<svelte:self parentType={node.type} node={child} /></span>
        {/each}

        {#if parentType === "OR"}
            <span>)</span>
        {/if}
    {/if}
{:else if node.type === "SERIES"}
    <!-- Essentially an AND that renders inline since all classes are part of a series. (Adds parenthesis if it's within another OR) -->

    {#if parentType === "OR"}
        <span>(</span>
    {/if}

    {#each node.children as child, i}
        <span>{i != 0 ? " and " : ""}<svelte:self parentType={node.type} node={child} /></span>
    {/each}

    {#if parentType === "OR"}
        <span>)</span>
    {/if}
{:else if node.type === "AND"}
    <div class="and">
        {#each node.children as child, i}
            <div class="andNode {i == 0 ? "top" : ""} {i == node.children.length - 1 ? "bottom" : ""}">
                <svelte:self parentType={node.type} node={child} />
            </div>
        {/each}
    </div>
{/if}

<style>
    .and {
        display: flex;
        flex-direction: column;
        gap: 3px;
        align-items: stretch;
    }

    .orDivider {
        display: flex;
        align-items: center;
        margin-top: 3px;
        margin-bottom: 3px;
    }

    .orDivider .text {
        padding: 0px 5px 0px 5px;
    }
    
    .orDivider .border {
        border-top-width: 2px;
        border-top-style: dotted;
        border-top-color: #626262;
        width: 100%;
    }

    .deadLink {
        font-weight: 600;
        color: #aaa;
        cursor: not-allowed;
        position: relative;
    }

    .andNode {
        background-color: #0000002d;
        border-radius: 4px;
        padding: 16px 20px 16px 20px;
    }

    .top {
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }

    .bottom {
        border-bottom-right-radius: 8px;
        border-bottom-left-radius: 8px;
    }
</style>