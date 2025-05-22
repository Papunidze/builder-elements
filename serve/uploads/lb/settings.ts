import {
  BorderSettingSet,
  ColorSetting,
  OpacitySetting,
  SettingGroup,
  WidthSetting,
} from "builder-settings-types";

export const oa_settings = new SettingGroup({
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
      },
    }),
  },
});
