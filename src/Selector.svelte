<script>
export let label;
export let options;
export let current;
export let onChange;

</script>

<div>
{label}

    <select bind:value={current} on:change={() => onChange(current)}>
        {#each options as option}
            <option value={option}>
                {option}
            </option>
        {/each}
    </select>

    {current}

</div>