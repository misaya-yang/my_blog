import {
  createElement,
  lazy,
  useState,
  type ComponentProps,
  type ComponentType,
} from "react";

/**
 * A lazy component that can be fetched ahead of time and, once fetched,
 * renders at once.
 *
 * `React.lazy` always suspends on its first render, even when the module is
 * already in memory, and React then keeps the fallback up for a few hundred
 * milliseconds so that it does not flicker. For a page whose code was
 * fetched while the reader was still pointing at the link, that is a loading
 * screen shown for nothing. Here a component that has been preloaded is
 * rendered directly, and only one that has not goes through `lazy`.
 */
export function lazyPreloadable<C extends ComponentType<any>>(
  load: () => Promise<{ default: C }>
) {
  let ready: C | undefined;
  let loading: Promise<C> | undefined;
  const preload = () =>
    (loading ??= load().then(
      module => (ready = module.default),
      error => {
        // Let the next attempt ask again.
        loading = undefined;
        throw error;
      }
    ));
  const Deferred = lazy(() =>
    preload().then(component => ({ default: component }))
  );
  function Preloadable(props: ComponentProps<C>) {
    // Chosen once per mount: swapping the type later would remount the tree.
    const [Component] = useState<ComponentType<any>>(() => ready ?? Deferred);
    return createElement(Component, props);
  }
  return Object.assign(Preloadable, { preload });
}
