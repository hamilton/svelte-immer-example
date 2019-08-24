<script>
export let label;
export let options;
export let current;
export let onChange;

</script>

<style>
select {
    background-color: transparent;
    color: white;
    border: 1px solid darkgray;
}

</style>

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