import { readable } from 'svelte/store'
console.log('ok')
export default readable(undefined, async (set) => {
    console.log(set)
    const data = await fetch('https://probeinfo.telemetry.mozilla.org/firefox/all/main/all_probes').then(r=>r.json())
    console.log(data, '!!!')
    set(data);
    return () => {};
})