import { DOMParser } from "xmldom";

/**
 * 將時間字串 (秒或 HH:MM:SS.mmm) 轉換為總毫秒數
 */
export function parseTime(timeStr: string | null | undefined): number | undefined {
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
export function formatSRTTime(totalMilliseconds: number | undefined): string {
  if (typeof totalMilliseconds !== "number" || isNaN(totalMilliseconds)) return "00:00:00,000";
  const ms = String(Math.max(0, totalMilliseconds) % 1000).padStart(3, "0");
  const totalSeconds = Math.floor(Math.max(0, totalMilliseconds) / 1000);
  const s = String(totalSeconds % 60).padStart(2, "0");
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = String(totalMinutes % 60).padStart(2, "0");
  const h = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  return `${h}:${m}:${s},${ms}`;
}

export function parseVTTTime(timeStr: string): number | undefined {
  if (!timeStr) return undefined;
  timeStr = timeStr.trim();

  // VTT 時間格式: MM:SS.mmm 或 HH:MM:SS.mmm
  const match = timeStr.match(/^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\.(\d{3})$/);
  if (match) {
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const milliseconds = parseInt(match[4]);

    return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
  }

  console.warn("Unsupported VTT time format:", timeStr);
  return undefined;
}

export function parseVTT(vttContent: string): string {
  const lines = vttContent.split(/\r?\n/);
  let srtContent = "";
  let subtitleIndex = 1;
  let i = 0;

  // 跳過 WEBVTT 標題和可能的設定行
  while (
    i < lines.length &&
    (lines[i].trim() === "" || lines[i].trim().startsWith("WEBVTT") || lines[i].trim().includes("NOTE"))
  ) {
    i++;
  }

  while (i < lines.length) {
    // 跳過空行
    while (i < lines.length && lines[i].trim() === "") {
      i++;
    }

    if (i >= lines.length) break;

    // 檢查是否為時間戳記行
    const timelineMatch = lines[i].match(/^(\S+)\s+-->\s+(\S+)/);
    if (timelineMatch) {
      const startTime = timelineMatch[1];
      const endTime = timelineMatch[2];

      // 解析時間
      const startMs = parseVTTTime(startTime);
      const endMs = parseVTTTime(endTime);

      if (startMs === undefined || endMs === undefined || endMs <= startMs) {
        console.warn("Skipping VTT cue due to invalid time values:", lines[i]);
        i++;
        continue;
      }

      i++; // 移到下一行

      // 收集字幕文字（直到遇到空行或文件結束）
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }

      if (textLines.length > 0) {
        const text = textLines.join("\n").trim();
        // 清理 VTT 標籤（如 <c>, <v>, <b>, <i> 等）
        const cleanedText = text.replace(/<[^>]*>/g, "");

        if (cleanedText) {
          const srtStartTime = formatSRTTime(startMs);
          const srtEndTime = formatSRTTime(endMs);

          srtContent += `${subtitleIndex}\n`;
          srtContent += `${srtStartTime} --> ${srtEndTime}\n`;
          srtContent += `${cleanedText}\n\n`;

          subtitleIndex++;
        }
      }
    } else {
      // 如果不是時間戳記行，可能是字幕 ID 或其他行，跳過
      i++;
    }
  }

  if (subtitleIndex === 1 && srtContent === "") {
    throw new Error("成功解析 VTT 檔案，但未找到有效的字幕條目可轉換。請檢查檔案內容與時間標記。");
  }

  return srtContent.trim();
}

export function convertToSRT(content: string): string {
  // 檢查是否為 VTT 格式
  if (content.trim().startsWith("WEBVTT")) {
    return parseVTT(content);
  }

  // 處理 XML/TTML 格式
  // 注意：這裡的 DOMParser 來自 'xmldom'
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, "application/xml");

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
