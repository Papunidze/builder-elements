import {
  BorderSettingSet,
  ColorSetting,
  OpacitySetting,
  SettingGroup,
  WidthSetting,
} from "builder-settings-types";

const oa_settingsConfig = {
  main: true,
  title: "Leaderboard",
  settings: {
    background: new SettingGroup({
      title: "Background Settings",
      settings: {
        color: new ColorSetting({
          default: "255,255,255",
          title: "background",
        }),
        width: new WidthSetting({ default: 860, mobile: 370, title: "width" }),
        border: new BorderSettingSet({ collapsed: true }),
        borders: new BorderSettingSet({ collapsed: true }),
        opacit: new OpacitySetting({ default: 0.5, title: "opacity" }),
      },
    }),
  },
};

// factory to create new SettingGroup instances
export function createOaSettings() {
  return new SettingGroup(oa_settingsConfig as any);
}
// default export for singleton if needed
export const oa_settings = createOaSettings();
