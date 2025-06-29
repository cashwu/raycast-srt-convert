import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import path from "path";
import fs from "fs";
import { DOMParser } from "xmldom";
import { getSelectedFiles } from "./utils";

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

/**
 * 將時間字串 (秒或 HH:MM:SS.mmm) 轉換為總毫秒數
 */
function parseTime(timeStr: string | null | undefined): number | undefined {
  if (!timeStr) return undefined;
  timeStr = String(timeStr).trim();

  // 格式: HH:MM:SS.mmm or HH:MM:SS,mmm
  let match = timeStr.match(/^(\d{2,}):(\d{2}):(\d{2})[.,](\d{1,3})$/);
  if (match) {
    return (
      parseInt(match[1]) * 3600000 +
      parseInt(match[2]) * 60000 +
      parseInt(match[3]) * 1000 +
      parseInt(match[4].padEnd(3, "0"))
    );
  }

  // 格式: SSS.mmm s (e.g., "123.456s") or SSS s (e.g., "123s")
  match = timeStr.match(/^(\d+)(?:[.,](\d{1,3}))?s$/);
  if (match) {
    let ms = parseInt(match[1]) * 1000;
    if (match[2]) {
      ms += parseInt(match[2].padEnd(3, "0"));
    }
    return ms;
  }

  // 格式: 裸秒數 SSS.mmm (e.g., "26.542") or SSS (e.g., "123")
  if (!isNaN(parseFloat(timeStr)) && isFinite(Number(timeStr))) {
    return Math.round(parseFloat(timeStr) * 1000);
  }

  console.warn("Unsupported time format:", timeStr);
  return undefined;
}

/**
 * 將總毫秒數格式化為 SRT 時間字串 HH:MM:SS,mmm
 */
function formatSRTTime(totalMilliseconds: number | undefined): string {
  if (typeof totalMilliseconds !== "number" || isNaN(totalMilliseconds)) return "00:00:00,000";
  const ms = String(Math.max(0, totalMilliseconds) % 1000).padStart(3, "0");
  const totalSeconds = Math.floor(Math.max(0, totalMilliseconds) / 1000);
  const s = String(totalSeconds % 60).padStart(2, "0");
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = String(totalMinutes % 60).padStart(2, "0");
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  return `${h}:${m}:${s},${ms}`;
}

function convertToSRT(xmlContent: string): string {
  // 注意：這裡的 DOMParser 來自 'xmldom'
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

  // 檢查解析錯誤 (xmldom 的錯誤處理方式可能不同)
  const parserError = xmlDoc.getElementsByTagName("parsererror");
  if (parserError.length > 0) {
    // 嘗試從 parsererror 元素獲取更詳細的錯誤訊息
    const errorDetails = parserError[0].textContent || "未知的解析錯誤";
    throw new Error(`XML 檔案格式無效或解析錯誤：${errorDetails.trim().split("\n")[0]}`); // 只取第一行錯誤
  }

  let subtitleElements: Element[];
  let isTranscriptFormat = false;

  const transcriptElements = xmlDoc.getElementsByTagName("transcript");
  if (transcriptElements.length > 0 && transcriptElements[0].getElementsByTagName("text").length > 0) {
    subtitleElements = Array.from(transcriptElements[0].getElementsByTagName("text"));
    isTranscriptFormat = true;
  } else {
    const bodyElements = xmlDoc.getElementsByTagName("body");
    if (bodyElements.length > 0) {
      subtitleElements = Array.from(bodyElements[0].getElementsByTagName("p"));
    } else {
      subtitleElements = Array.from(xmlDoc.getElementsByTagName("p"));
    }
  }

  if (subtitleElements.length === 0) {
    throw new Error("在 XML/TTML 檔案中找不到可識別的字幕內容（如 <p> 或 <transcript>/<text> 標籤）。");
  }

  let srtContent = "";
  let subtitleIndex = 1;

  for (let i = 0; i < subtitleElements.length; i++) {
    const el = subtitleElements[i];
    let beginAttr: string | null = null;
    let endAttr: string | null = null;
    let durAttr: string | null = null;
    let textValue: string | null = "";

    if (isTranscriptFormat) {
      beginAttr = el.getAttribute("start");
      durAttr = el.getAttribute("dur");
      textValue = el.textContent;
    } else {
      beginAttr = el.getAttribute("begin");
      endAttr = el.getAttribute("end");
      durAttr = el.getAttribute("dur");

      let tempText = "";
      for (let j = 0; j < el.childNodes.length; j++) {
        const childNode = el.childNodes[j];
        if (childNode.nodeType === 3) {
          // Node.TEXT_NODE
          tempText += childNode.nodeValue;
        } else if (childNode.nodeType === 1 && (childNode as Element).nodeName.toLowerCase() === "br") {
          // Node.ELEMENT_NODE
          tempText += "\n";
        } else if (childNode.nodeType === 1) {
          // Node.ELEMENT_NODE
          tempText += childNode.textContent;
        }
      }
      textValue = tempText;
    }

    if (!beginAttr || (!endAttr && !durAttr)) {
      console.warn("Skipping element due to missing time attributes:", el.toString()); // .outerHTML 不適用於 xmldom
      continue;
    }

    const beginMs = parseTime(beginAttr);
    let endMs: number | undefined;

    if (endAttr) {
      endMs = parseTime(endAttr);
    } else if (durAttr) {
      const durMs = parseTime(durAttr);
      if (beginMs !== undefined && durMs !== undefined) {
        endMs = beginMs + durMs;
      }
    }

    if (beginMs === undefined || endMs === undefined || endMs <= beginMs) {
      console.warn(
        "Skipping element due to invalid or inconsistent time values:",
        el.toString(),
        `Begin: ${beginAttr} (${beginMs}ms)`,
        `End/Dur: ${endAttr || durAttr} (EndMs: ${endMs}ms)`,
      );
      continue;
    }

    const srtStartTime = formatSRTTime(beginMs);
    const srtEndTime = formatSRTTime(endMs);

    const cleanedText = (textValue || "").trim().replace(/\s+\n/g, "\n").replace(/\n\s+/g, "\n").replace(/\s+/g, " "); // 統一使用網頁版的文字清理邏輯

    if (!cleanedText) {
      continue;
    }

    srtContent += `${subtitleIndex}\n`;
    srtContent += `${srtStartTime} --> ${srtEndTime}\n`;
    srtContent += `${cleanedText}\n\n`;

    subtitleIndex++;
  }

  if (subtitleIndex === 1 && srtContent === "") {
    throw new Error("成功解析檔案，但未找到有效的字幕條目可轉換。請檢查檔案內容與時間標記。");
  }

  return srtContent.trim();
}
