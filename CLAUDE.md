# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個 Raycast 擴展，用於將字幕檔案（TTML/XML）轉換為 SRT 格式。主要功能包括：

- 支援 TTML 與 XML 格式的字幕檔案轉換
- 透過 Finder 或 Path Finder 選擇檔案
- 自動解析時間戳記並轉換為 SRT 格式
- 支援多種時間格式（秒數、HH:MM:SS.mmm、transcript 格式）

## 開發命令

```bash
# 開發模式
npm run dev

# 建置擴展
npm run build

# 執行 lint 檢查
npm run lint

# 修正 lint 問題
npm run fix-lint

# 發佈到 Raycast Store
npm run publish
```

## 架構說明

### 核心檔案結構

- `src/srt-converter.tsx` - 主要的轉換邏輯與 UI 處理
- `src/utils.ts` - 工具函數，包含 AppleScript 檔案選擇功能
- `package.json` - Raycast 擴展配置與依賴

### 主要功能模組

#### 檔案選擇機制
- 使用 AppleScript 與 Finder/Path Finder 整合
- `getSelectedFiles()` 函數負責取得選中的 TTML/XML 檔案
- 支援多種檔案類型：TTML、XML、SubRip、TXT

#### 轉換引擎
- `convertToSRT()` 函數處理 XML 解析與轉換
- 支援兩種格式：
  - TTML 格式：使用 `<p>` 標籤與 `begin`/`end` 屬性
  - Transcript 格式：使用 `<text>` 標籤與 `start`/`dur` 屬性
- `parseTime()` 處理多種時間格式轉換
- `formatSRTTime()` 格式化為 SRT 時間戳記

#### 時間格式支援
- HH:MM:SS.mmm 或 HH:MM:SS,mmm
- 秒數格式：123.456s 或 123s
- 裸秒數：26.542 或 123

### 依賴套件

- `@raycast/api` - Raycast API
- `@raycast/utils` - Raycast 工具函數
- `xmldom` - XML 解析器
- `@types/xmldom` - TypeScript 類型定義

### 使用者偏好設定

- `inputMethod` - 檔案選擇來源（Finder 或 Path Finder）
- `imageResultHandling` - 輸出檔案位置（原檔案目錄或下載目錄）

## 開發支援

如果在開發過程中遇到 Raycast Extension 相關問題，可以透過 MCP 的 context7 工具來查詢 Raycast Extension 的官方文件與範例。

## 注意事項

- 專案使用 TypeScript 與 React（Raycast API）
- XML 解析使用 `xmldom` 套件而非瀏覽器原生 API
- AppleScript 需要系統授權才能存取 Finder 選擇的檔案
- 轉換過程中會保留原始檔案的換行與格式