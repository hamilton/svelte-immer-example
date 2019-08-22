# svelte + immer strategies

Svelte apps can be built using patterns familiar to the React / Redux community.
This repository contains a demo app that shows how one might build an app with
a single global store + functions that create a new state from the current
one. You know, like Redux! This repo is an expression of a few principles:

1. follow _some_ patterns you may be familiar with if you come from React /
   Redux land by having a single source of truth for the all the app's business
   logic (they call this a "store" in Redux land) with functions that return a
   new state. This particularly works well in the actually-reactive paradigm of Svelte.
2. continue in the proud Svelte tradition of reducing lines of code by doing
   things simply
3. make it easy to maintain the testability and integrity of your app as it
   grows in complexity
4. leverage the gajillion things that makes Svelte a joy to work in

This readme (and in fact this whole repo) assumes familiarity with React, Redux,
and Svelte.

I made this repository to show some other Mozilla employees a few of these patterns. Throughout the codebase, I've left as many comments that suggests how this thing
works and why choices were made. I am not tied to these patterns enough to
advocate fiercely for them in public, and will likely deviate from these if I
find that something doesn't quite work as you would expect. That said,
suggestions & improvements welcome as issues.

## Svelte writable + immer for updates

The first pattern is the most obvious; Svelte has a built-in store feature, which can be used with immer to maintain
a global store for your entire app a la Redux. Take a look at `store.js`. You'll see the
following:

1. a `writable` called `STORE`, which defaults to some initial state you can
   define (perhaps from a server, or local storage, or whatever). Critically, we export 
    `{ subscribe: STORE.subscribe }` instead of `STORE` from `store.js` because we do not want
    the store to be manipulated manually within the app via `set` or `update`. This follows from one
    of the patterns described in the [Svelte
    tutorial](https://svelte.dev/tutorial/custom-stores)
2. a function called `dispatch`, which looks like this:
    ```javascript
    const dispatch = (fcn) => STORE.update(state => produce(state, fcn))
    ``` 
    This function updates the store with the provided function `fcn`,
    which is an action (I use this term fast and loose, bare with mem but I mean
    "a function that determines what state changes are about to happen"). The
    `produce` function is the totality of what we need from immer. It takes a state object and a function
    that mutates a draft state, and returns a brand new copy of state.
    Readers familiar with the React / Redux paradigm may have heard of immer –
    it's often recommended as a way to produce a new complex state
    object without having to commit to a ton of `Object.assign`s or whatever in
    your reducers. It
    has saved me tremendous time in the React context, so might as well use it
    here since we face many of the same constraints. One could easily build a
    Redux-style reducer and have that be the thing that gets called (or heck,
    just use the Redux library) but I think it is overkill in many contexts,
    including the contexts where I work.
3. a function called `connect`, which takes a function, and then returns another
   function that composes `dispatch` likeso:

   ```
    const connect = (func) => {
        return (...args) => dispatch(func(...args))
    }
   ```
   This function allows you to have a single function that updates the store
   with a particular action, allowing you to pass in the action arguments later when needed.
4. actions, which take some arguments, then returns a draft-mutating function that
   closes over the arguments, such as `(args) => draft => { draft.whatever = args
   }`. These are fed directly into either `dispatch` or `connect`.

We could simplify this approach by getting rid of `dispatch` and
`connect` and have each action function update the state. But ultimately we may be in the position of reusing some of
these actions down the line somewhere else, or against another store, or perhaps
utilize actions from some tiny library you wrote at work that you have noticed
has been used like ten times already. Separating out the action from the actual
updating step in `produce` is one way to achieve a nice separation. It also
allows you to test this all very easily. But you should 100% go with your heart
and ignore the haters if you want to make it so you never have to call
`connect`.

Avoid using the store for UX-related / transient locale state such as
animations, and form input values. Keep business logic & globally-important
state in the store.

As an aside, I can see `store.js` really being `store.ts` – using typescript to provide
interfaces & validate the store automatically.

Next up, we can see how to use these in context.

## components can generically subscribe to STORE directly and use the state, no prob

At this point, because our `STORE` is read-only, we can easily subscribe to the
store values we care about directly in our components, a la
`$STORE.randomNumbers` and so on. There may be more complex, interesting
patterns here that I'm not considering, namely things that require very complex
nested objects. I'll make sure to try those in this repo at some point, but I
don't really think they'd be a problem.

## using state & actions in components

These are two very common patterns in the `react-redux` world, where you have
an unconnected component that connects to Redux-land via this function. You
typically define  `mapStateToProps` and `mapDispatchToProps` (for mapping the
store to props & dispatched actions to props, respectively) and connect your
component using those two functions.

I am not _against_ this idea, but I think there are many ways to handle these
kinds of patterns outside of Redux-land that will still be familiar and simple
enough. After all, we're trying to prevent boilerplate while maintaining
legibility, testability, and joy. Here's how I handle it in this repo:

1. the bits of state – this is fairly straightforward. You write the
   "unconnected" component just as you normally would regardless of how it is
   used, and pass in the props you care about from the parent. These relies on
   the parent component that implements the functionality to handle the
   `mapStateToProps` workflow. I tend to think that's the right approach,
   though.
2. the actions – in a similar fashion, one could connect actions to the store
   update function via the `connect` function above – something like 
   ```javascript
   const add = connect(addRandomNumber)
   ```
    – and just pass that down as a prop to each component. Alternatively, you
    can use Svelte's great `setContext` and `getContext` to give your components
    the opportunity to either consume the prop (if passed as such) or attempt to
    fetch from the parent component (in other words, the component that utilizes
    said component). In a component, you can easily construct this
    using something like `export let onDelete = getContext('onDelete')` and
    throw if no prop was passed in / the `getContext` returns `undefined` (that
    is, the parent never calls `setContext('onDelete',
    connect(deleteRandomNumber))`). This shouldn't be that controversial, if
    you've been keeping up with the movement to use Context over Redux in the
    React community.

A full example with all of these patterns can be found in `RandomNumberList.svelte`.

## etc.

There are a few other things that are nice about this overall approach:

1. binding sort of just works as you would expect. Take a look at
   `Selector.svelte` for an example of this. As long as you rely on the `STORE`
   for the current value and some `dispatch` / `connect` thing for the mutation,
   you have everything you want.

## downsides

There are, of course, some downsides to this approach:
- You don't get any of the nice Redux middleware, though some of it can perhaps
  be built by you, since this is such a simple model.
  

## conclusion

There really isn't a right way to build an app, so do not let anyone tell you
otherwise. This particular approach does, however, have a few benefits. One of
these seems clear: it's simple and allows you to extend it as you need it. For
the kinds of apps I build (data tools, dashboards, and data viz-heavy) these
patterns have been quite easy to follow along.



## TODOS:

- try methods around very-nested state and see what holds up