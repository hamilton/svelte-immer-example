<script>
import { fly } from 'svelte/transition';
import Selector from './Selector.svelte'
import RandomNumberList from './RandomNumberList.svelte'
import STORE, {dispatch, connect, options, changeOS, changeChannel, requestNewNumbersFromAPI, queryString } from './store'

// import telemetry from './data/telemetry'

// $: console.log($telemetry)
const requestFromAPI = connect(requestNewNumbersFromAPI);

function updateQueryString(value) {
    if (history.pushState) {
        const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + `?${$queryString}`;
        window.history.pushState({path:newurl},'', newurl);
    }
}

$: updateQueryString($queryString);

</script>

<style>
main {
    width: 700px;
    margin: auto;
}

h1 {
    text-transform: uppercase;
}

div {
    margin-top:30px;
    margin-bottom:30px;
}
</style>

<main>
    <h1>Using Immer to make a global store</h1>

    <p>
        This repository uses Immer to produce new states in one single global $STORE object.
        Atomic updates to $STORE are handled through a produce function.
    </p>

    <p>
        Try playing with these selectors. Take a look at the query string in the
        URL. Read the source on <a href='https://github.com/hamilton/svelte-immer-example'>Github</a>.
    </p>
    <div>
        <Selector label={"os"} current={$STORE.os} onChange={(os) => dispatch(changeOS(os))} options={options.os}  />
        <!-- lets check that other parts of the store don't constantly fire off if the $STORE updates -->
        <Selector label={"channel"} current={$STORE.channel} onChange={(channel) =>
        dispatch(changeChannel(channel))} options={options.channel}  />
    </div>
    <div style="min-height:100px;">
        <button on:click={requestFromAPI}>Random set of 10</button>
        {#if $STORE.isWaiting}
            <div in:fly={{y:-20, duration: 300}}>fetching from "server" (haha jk
            it's fake)</div>
        {/if}
    </div>
    <RandomNumberList />
</main>