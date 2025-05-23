import {
  BorderSettingSet,
  ColorSetting,
  OpacitySetting,
  SettingGroup,
  WidthSetting,
} from "builder-settings-types";

export const test_mb0iw43n_i4nvm_oa_settings = new SettingGroup({
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
        width: new WidthSetting({
          default: 860,
          mobile: 370,
          title: "width",
        }),
        border: new BorderSettingSet({ collapsed: true }),
        borders: new BorderSettingSet({ collapsed: true }),
        opacit: new OpacitySetting({ default: 0.5, title: "opacity" }),
      },
    }),
  },
});
