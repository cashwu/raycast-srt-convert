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

export default function Command() {
  getSelectedFiles()
    .then((selectedFiles) => {
      if (selectedFiles.length === 0) {
        showToast({
          style: Toast.Style.Failure,
          title: "未選擇檔案",
          message:
            "請在 Finder 中選擇一個字幕檔案（支援 .ttml, .xml, .vtt, .srt, .txt）。如果已選擇檔案仍顯示此錯誤，請檢查系統權限設定。",
        });
        return;
      }

      const filePath = selectedFiles[0];
      if (!filePath) {
        showToast({
          style: Toast.Style.Failure,
          title: "無效的檔案路徑",
          message: "未選擇有效的檔案路徑。",
        });
        return;
      }

      console.log("---- filePath: " + filePath);

      const preferences = getPreferenceValues<Preferences>();

      showToast({ style: Toast.Style.Animated, title: "轉換中..." });

      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const srtContent = convertToSRT(fileContent);

        const dirName = path.dirname(filePath);
        const baseName = path.basename(filePath, path.extname(filePath));
        const srtFilePath = path.join(dirName, `${baseName}.srt`);

        if (!preferences.overwriteExisting && fs.existsSync(srtFilePath)) {
          showToast({
            style: Toast.Style.Failure,
            title: "SRT 檔案已存在",
            message: `輸出檔案 ${srtFilePath} 已存在。請在偏好設定中啟用「覆蓋現有檔案」或重新命名/刪除現有檔案。`,
          });
          return;
        }

        fs.writeFileSync(srtFilePath, srtContent, "utf-8");

        showToast({
          style: Toast.Style.Success,
          title: "轉換成功",
          message: `SRT 檔案已儲存至：${srtFilePath}`,
        });
      } catch (error) {
        console.error("Conversion failed:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "轉換失敗",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })
    .catch((error) => {
      console.error("Failed to get selected files:", error);
      showToast({
        style: Toast.Style.Failure,
        title: "檔案選擇錯誤",
        message: "無法取得選中的檔案。請確保 Raycast 有權限存取 Finder，並檢查控制台日誌以取得詳細錯誤信息。",
      });
    });
}
