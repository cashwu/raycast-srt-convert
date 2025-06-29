import { getPreferenceValues, showToast, Toast } from "@raycast/api";
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
      await showToast({
        style: Toast.Style.Failure,
        title: "未選擇檔案",
        message: "請在 Finder 中選擇字幕檔案",
      });
      return;
    }

    const filePath = selectedFiles[0];
    if (!filePath) {
      await showToast({
        style: Toast.Style.Failure,
        title: "無效的檔案路徑",
        message: "請重新選擇有效的檔案",
      });
      return;
    }

    console.log("---- filePath: " + filePath);

    const preferences = getPreferenceValues<Preferences>();

    try {
      // 顯示轉換進度
      await showToast({
        style: Toast.Style.Animated,
        title: "Conversion in progress...",
        message: "正在轉換字幕檔案",
      });

      const fileContent = fs.readFileSync(filePath, "utf-8");
      const srtContent = convertToSRT(fileContent);

      const dirName = path.dirname(filePath);
      const baseName = path.basename(filePath, path.extname(filePath));
      const srtFilePath = path.join(dirName, `${baseName}.srt`);

      // 檢查檔案是否已存在
      const fileExists = fs.existsSync(srtFilePath);

      if (fileExists && !preferences.overwriteExisting) {
        await showToast({
          style: Toast.Style.Failure,
          title: "SRT 檔案已存在",
          message: "請啟用「覆蓋現有檔案」設定或重新命名",
        });
        return;
      }

      fs.writeFileSync(srtFilePath, srtContent, "utf-8");

      // 根據檔案是否存在顯示不同的成功訊息
      if (fileExists) {
        await showToast({
          style: Toast.Style.Success,
          title: "Converted 1 File",
          message: `已覆蓋並轉換成功！SRT 檔案：${baseName}.srt`,
        });
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Converted 1 File",
          message: `轉換成功！SRT 檔案已儲存至：${baseName}.srt`,
        });
      }
    } catch (error) {
      console.error("Conversion failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "轉換失敗",
        message: errorMessage,
      });
    }
  } catch (error) {
    console.error("Failed to get selected files:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "檔案選擇錯誤",
      message: "請確保 Raycast 有權限存取 Finder",
    });
  }
}
