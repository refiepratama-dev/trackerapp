import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useMemo, useState } from "react";

import { Brand } from "@/constants/theme";
import { TabBarContext } from "@/context/tab-bar-context";

/**
 * Native tab bar. On iOS 26 the system draws it with Liquid Glass, so we only set
 * the selected tint (lime), icons (SF Symbols) and labels.
 */
export default function AppTabs() {
  const [tabBarHidden, setTabBarHidden] = useState(false);
  const tabBar = useMemo(() => ({ setTabBarHidden }), []);

  return (
    <TabBarContext value={tabBar}>
      <NativeTabs tintColor={Brand.accent} hidden={tabBarHidden}>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Record</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "record.circle", selected: "record.circle.fill" }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="garage">
          <NativeTabs.Trigger.Label>Garage</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "bicycle", selected: "bicycle" }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="history">
          <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "clock", selected: "clock.fill" }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarContext>
  );
}
