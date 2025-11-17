<script lang="ts">
    import { slide } from "svelte/transition";

    export let number: number;
    
    let oldNumber: number = number;
    let percents = [];

    function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }


    function animate(oldNumber: number, newNumber: number, duration: number, startTime: number = performance.now()) {
        let currentTime = performance.now();
        let elapsed = currentTime - startTime;
        if (elapsed >= duration) {
            percents = String(newNumber).split("").map(d => parseInt(d) * 10);
            return;
        }
        let progress = easeInOutCubic(elapsed / duration);
        percents = [];
        let oldNumberStr = String(oldNumber);
        let newNumberStr = String(newNumber);
        const longest = Math.max(oldNumberStr.length, newNumberStr.length);
        oldNumberStr = oldNumberStr.padStart(longest, "0");
        newNumberStr = newNumberStr.padStart(longest, "0");
        for (let i = 0; i < longest; i++) {
            let oldDigit = parseInt(
                oldNumberStr
                .charAt(
                    oldNumberStr.length - 1 - i
                ) || "0"
            );
            let newDigit = parseInt(
                newNumberStr
                .charAt(
                    newNumberStr.length - 1 - i
                ) || "0"
            );
            let digitDiff = (newDigit - oldDigit + 10) % 10;
            let currentDigit = (oldDigit + digitDiff * progress) % 10;
            percents.unshift(currentDigit * 10);
        }

        requestAnimationFrame(animate.bind(this, oldNumber, newNumber, duration, startTime));


    }

    $: {
        if (number !== oldNumber) {
            // rolling time
            console.log("Animating from", oldNumber, "to", number);
            animate(oldNumber, number, 500);
            oldNumber = number;
        }
    }

    animate(oldNumber, number, 0);
</script>

<div class="rollingNumber">
    {#each percents as percent, index (percents.length - index)}
        <div class="digit" style="--index: {index}" out:slide={{ axis: 'x', duration: 200 }}>
            <div class="inner" style="transform: translateY(-{percent / 3 + (1/3 * 100)}%)">
                {#each Array(30) as _, n}
                    <div class="num">{n % 10}</div>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style>
    .rollingNumber {
        line-height: 1;
        display: inline-block;
        flex-shrink: 0;
    }
    .digit {
        display: inline-block;
        width: 1ch;
        height: 1em;
        overflow: hidden;
        vertical-align: bottom;
    }

    .num {
        height: 1em;
        line-height: 1em;
        text-align: center;
    }
</style>