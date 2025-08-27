import { j as json } from "../../../../chunks/index.js";
import fs from "fs";
import $4S4dR$path1__default from "path";
const prerender = false;
const CUSTOMIZATION_DIRECTORY = "../customization";
const CUSTOM_FORMATTING_SETTINGS_PATH = `${CUSTOMIZATION_DIRECTORY}/custom-formatting.json`;
const DEFAULT_CUSTOM_FORMATTING_SETTINGS = {
  version: "1.0",
  customFormats: []
};
async function GET() {
  let customFormattingSettings = {};
  try {
    customFormattingSettings = getCustomFormattingSettings() || customFormattingSettings;
  } catch {
  }
  let result = { customFormattingSettings };
  return json(result);
}
async function POST({ request }) {
  const { newCustomFormat } = await request.json();
  let customFormattingSettings = getCustomFormattingSettings() || {};
  if (newCustomFormat) {
    if (!customFormattingSettings.customFormats) {
      customFormattingSettings.customFormats = [];
    }
    if (newCustomFormat.formatTag && newCustomFormat.formatCode) {
      customFormattingSettings.customFormats.push(newCustomFormat);
    }
    saveCustomFormattingSettings(customFormattingSettings);
  }
  return json(customFormattingSettings);
}
async function DELETE({ request }) {
  const { formatTag } = await request.json();
  let customFormattingSettings = getCustomFormattingSettings() || {};
  if (formatTag) {
    if (!customFormattingSettings.customFormats) {
      customFormattingSettings.customFormats = [];
    }
    let index = customFormattingSettings.customFormats.findIndex(
      (format) => format.formatTag === formatTag
    );
    if (index >= 0) {
      customFormattingSettings.customFormats.splice(index, 1);
    }
    saveCustomFormattingSettings(customFormattingSettings);
  }
  return json(customFormattingSettings);
}
function getCustomFormattingSettings() {
  let customFormattingSettingsPath = getCustomFormattingSettingsFilePath();
  return JSON.parse(fs.readFileSync(customFormattingSettingsPath, "utf8"));
}
function saveCustomFormattingSettings(customFormattingSettings) {
  let customFormattingSettingsPath = getCustomFormattingSettingsFilePath();
  fs.writeFileSync(customFormattingSettingsPath, JSON.stringify(customFormattingSettings, null, 2));
}
function getCustomFormattingSettingsFilePath() {
  let customFormattingSettingsPath = $4S4dR$path1__default.join($4S4dR$path1__default.resolve("./"), CUSTOM_FORMATTING_SETTINGS_PATH);
  if (!fs.existsSync(customFormattingSettingsPath)) {
    if (!fs.existsSync(CUSTOMIZATION_DIRECTORY)) {
      fs.mkdirSync(CUSTOMIZATION_DIRECTORY);
    }
    fs.writeFileSync(
      customFormattingSettingsPath,
      JSON.stringify(DEFAULT_CUSTOM_FORMATTING_SETTINGS, null, 2)
    );
  }
  return customFormattingSettingsPath;
}
export {
  DELETE,
  GET,
  POST,
  prerender
};
