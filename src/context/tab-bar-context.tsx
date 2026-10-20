import { createContext } from 'react';

/** Lets a screen hide the whole bottom tab bar (e.g. while recording). */
export const TabBarContext = createContext<{ setTabBarHidden: (hidden: boolean) => void }>({
  setTabBarHidden: () => {},
});
