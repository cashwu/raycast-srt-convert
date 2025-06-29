/**
 * @file utilities/utils.ts
 *
 * @summary Helper functions used throughout the extension.
 */

import { runAppleScript } from "@raycast/utils";

/**
 * Gets currently selected TTML files in Finder.
 *
 * @returns A promise resolving to the comma-separated list of TTML files as a string.
 */
const getSelectedTTMLFiles = async (): Promise<string> => {
  const result = await runAppleScript(
    `set subtitleExtensions to {".ttml", ".xml", ".vtt", ".srt", ".txt"}
    
    try
      tell application "Finder"
        set theSelection to selection
        

        if theSelection is {} then
          return ""
        end if
        
        set validFiles to {}
        
        repeat with selectedItem in theSelection
          try
            set filePath to POSIX path of (selectedItem as alias)
            set fileName to name of selectedItem
            
            -- Check file extension
            repeat with ext in subtitleExtensions
              if fileName ends with ext then
                copy filePath to end of validFiles
                exit repeat
              end if
            end repeat
          on error
            -- Skip items that can't be processed
          end try
        end repeat
        
        if (count validFiles) is 0 then
          return ""
        else if (count validFiles) is 1 then
          return item 1 of validFiles
        else
          set AppleScript's text item delimiters to ", "
          set result to validFiles as string
          set AppleScript's text item delimiters to ""
          return result
        end if
        
      end tell
    on error errorMessage number errorNumber
      if errorNumber is -1743 then
        set btn to button returned of (display alert "權限需求" message "要使用字幕轉換功能，您必須在「系統偏好設定 > 安全性與隱私權 > 自動化」中允許 Raycast 控制 Finder。" buttons {"關閉", "開啟隱私權設定"})
        if btn is "開啟隱私權設定" then
          open location "x-apple.systempreferences:com.apple.preference.security?Privacy_Automation"
        end if
      else
        log "AppleScript error: " & errorMessage & " (" & errorNumber & ")"
      end if
      return ""
    end try`,
  );

  return result || "";
};

/**
 * Gets selected TTML files in the preferred file manager application.
 *
 * @returns A promise resolving to the list of selected TTML file paths.
 */
export const getSelectedFiles = async (): Promise<string[]> => {
  const selectedFiles: string[] = [];

  try {
    // Get selected TTML files from Finder
    const finderFiles = await getSelectedTTMLFiles();

    if (finderFiles && finderFiles.trim()) {
      const files = finderFiles
        .split(", ")
        .map((f) => f.trim())
        .filter(Boolean);
      selectedFiles.push(...files);
    }

    return selectedFiles;
  } catch (error) {
    console.error("取得檔案時發生錯誤:", error);
    return [];
  }
};
