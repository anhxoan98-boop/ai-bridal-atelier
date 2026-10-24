import { useSyncExternalStore } from 'react'

/** Tiny external store (no dependency) with selector-based subscriptions. */
export function createStore<S>(initial: S) {
  let state = initial
  const listeners = new Set<() => void>()

  const getState = () => state
  const setState = (updater: S | ((s: S) => S)) => {
    const next = typeof updater === 'function' ? (updater as (s: S) => S)(state) : updater
    if (Object.is(next, state)) return
    state = next
    listeners.forEach((l) => l())
  }
  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function useStore<T>(selector: (s: S) => T): T {
    return useSyncExternalStore(
      subscribe,
      () => selector(state),
      () => selector(state),
    )
  }

  return { getState, setState, subscribe, useStore }
}
