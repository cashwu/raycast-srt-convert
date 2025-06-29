import { getPreferenceValues, showHUD } from "@raycast/api";
import path from "path";
import fs from "fs";
import { getSelectedFiles } from "./utils";
import { convertToSRT } from "./converter-core";

interface Preferences {
  inputMethod: string;
  imageResultHandling: string;
  overwriteExisting: boolean;
}

export default async function Command() {
  try {
    const selectedFiles = await getSelectedFiles();

    if (selectedFiles.length === 0) {
      await showHUD("❌ 未選擇檔案，請在 Finder 中選擇字幕檔案");
      return;
    }

    const filePath = selectedFiles[0];
    if (!filePath) {
      await showHUD("❌ 無效的檔案路徑");
      return;
    }

    console.log("---- filePath: " + filePath);

    const preferences = getPreferenceValues<Preferences>();

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const srtContent = convertToSRT(fileContent);

      const dirName = path.dirname(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));
      const srtFilePath = path.join(dirName, `${baseName}.srt`);

      if (!preferences.overwriteExisting && fs.existsSync(srtFilePath)) {
        await showHUD("⚠️ SRT 檔案已存在，請啟用覆蓋設定或重新命名");
        return;
      }

      fs.writeFileSync(srtFilePath, srtContent, "utf-8");

      // 顯示成功訊息
      await showHUD(`✅ 轉換成功！SRT 檔案已儲存至：${baseName}.srt`);
    } catch (error) {
      console.error("Conversion failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await showHUD(`❌ 轉換失敗：${errorMessage}`);
    }
  } catch (error) {
    console.error("Failed to get selected files:", error);
    await showHUD("❌ 檔案選擇錯誤，請確保 Raycast 有權限存取 Finder");
  }
}
