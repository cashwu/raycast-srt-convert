import fs from "fs";
import path from "path";
import { parseTime, parseVTTTime, formatSRTTime, parseVTT, convertToSRT } from "../converter-core";

const testDataDir = path.join(__dirname, "test-data");

describe("parseTime", () => {
  describe("HH:MM:SS.mmm and HH:MM:SS,mmm formats", () => {
    test("should parse HH:MM:SS.mmm format correctly", () => {
      expect(parseTime("01:23:45.678")).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
      expect(parseTime("00:00:03.000")).toBe(3000);
      expect(parseTime("00:01:26.789")).toBe(86789);
    });

    test("should parse HH:MM:SS,mmm format correctly", () => {
      expect(parseTime("01:23:45,678")).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
      expect(parseTime("00:00:03,000")).toBe(3000);
    });

    test("should handle single and double digit milliseconds", () => {
      expect(parseTime("00:00:01.5")).toBe(1500); // .5 -> 500ms
      expect(parseTime("00:00:01.50")).toBe(1500); // .50 -> 500ms
      expect(parseTime("00:00:01.500")).toBe(1500); // .500 -> 500ms
    });
  });

  describe("seconds with s suffix format", () => {
    test("should parse seconds with decimal correctly", () => {
      expect(parseTime("123.456s")).toBe(123456);
      expect(parseTime("26.542s")).toBe(26542);
    });

    test("should parse whole seconds correctly", () => {
      expect(parseTime("123s")).toBe(123000);
      expect(parseTime("5s")).toBe(5000);
    });

    test("should handle milliseconds padding", () => {
      expect(parseTime("1.5s")).toBe(1500);
      expect(parseTime("1.50s")).toBe(1500);
    });
  });

  describe("bare seconds format", () => {
    test("should parse bare decimal seconds correctly", () => {
      expect(parseTime("26.542")).toBe(26542);
      expect(parseTime("123.456")).toBe(123456);
      expect(parseTime("0.5")).toBe(500);
    });

    test("should parse bare whole seconds correctly", () => {
      expect(parseTime("123")).toBe(123000);
      expect(parseTime("5")).toBe(5000);
      expect(parseTime("0")).toBe(0);
    });
  });

  describe("edge cases", () => {
    test("should handle null and undefined", () => {
      expect(parseTime(null)).toBeUndefined();
      expect(parseTime(undefined)).toBeUndefined();
      expect(parseTime("")).toBeUndefined();
    });

    test("should handle whitespace", () => {
      expect(parseTime("  123.456s  ")).toBe(123456);
      expect(parseTime(" 01:23:45.678 ")).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
    });

    test("should handle invalid formats", () => {
      expect(parseTime("invalid")).toBeUndefined();
      expect(parseTime("abc:def:ghi.jkl")).toBeUndefined();
      expect(parseTime("25:61:99,999")).toBe(93759999); // Note: 現在的實作不檢查時間值的有效性
    });
  });
});

describe("parseVTTTime", () => {
  describe("MM:SS.mmm format", () => {
    test("should parse MM:SS.mmm format correctly", () => {
      expect(parseVTTTime("03:45.678")).toBe(3 * 60000 + 45 * 1000 + 678);
      expect(parseVTTTime("00:03.000")).toBe(3000);
      expect(parseVTTTime("26:42.500")).toBe(26 * 60000 + 42 * 1000 + 500);
    });
  });

  describe("HH:MM:SS.mmm format", () => {
    test("should parse HH:MM:SS.mmm format correctly", () => {
      expect(parseVTTTime("1:23:45.678")).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
      expect(parseVTTTime("0:00:03.000")).toBe(3000);
      expect(parseVTTTime("2:26:42.500")).toBe(2 * 3600000 + 26 * 60000 + 42 * 1000 + 500);
    });
  });

  describe("edge cases", () => {
    test("should handle null and undefined", () => {
      expect(parseVTTTime("")).toBeUndefined();
    });

    test("should handle whitespace", () => {
      expect(parseVTTTime("  1:23:45.678  ")).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
    });

    test("should handle invalid formats", () => {
      expect(parseVTTTime("invalid")).toBeUndefined();
      expect(parseVTTTime("25:61.999")).toBe(1561999); // Note: 現在的實作不檢查時間值的有效性
    });
  });
});

describe("formatSRTTime", () => {
  test("should format milliseconds to SRT time correctly", () => {
    expect(formatSRTTime(0)).toBe("00:00:00,000");
    expect(formatSRTTime(3000)).toBe("00:00:03,000");
    expect(formatSRTTime(63500)).toBe("00:01:03,500");
    expect(formatSRTTime(3723456)).toBe("01:02:03,456");
  });

  test("should handle edge cases", () => {
    expect(formatSRTTime(undefined)).toBe("00:00:00,000");
    expect(formatSRTTime(NaN)).toBe("00:00:00,000");
    expect(formatSRTTime(-1000)).toBe("00:00:00,000"); // Negative should be clamped to 0
  });

  test("should handle large values", () => {
    expect(formatSRTTime(25 * 3600000 + 59 * 60000 + 59 * 1000 + 999)).toBe("25:59:59,999");
  });
});

describe("parseVTT", () => {
  test("should parse basic VTT content correctly", () => {
    const vttContent = `WEBVTT

00:00.000 --> 00:03.000
Hello, world!

00:03.500 --> 00:07.000
This is a test subtitle.`;

    const expected = `1
00:00:00,000 --> 00:00:03,000
Hello, world!

2
00:00:03,500 --> 00:00:07,000
This is a test subtitle.`;

    expect(parseVTT(vttContent)).toBe(expected);
  });

  test("should handle VTT with HTML tags", () => {
    const vttContent = `WEBVTT

00:00.000 --> 00:03.000
Hello, <b>bold</b> world!

00:03.500 --> 00:07.000
This is <i>italic</i> text.`;

    const expected = `1
00:00:00,000 --> 00:00:03,000
Hello, bold world!

2
00:00:03,500 --> 00:00:07,000
This is italic text.`;

    expect(parseVTT(vttContent)).toBe(expected);
  });

  test("should handle multi-line subtitles", () => {
    const vttContent = `WEBVTT

00:00.000 --> 00:03.000
Line 1
Line 2
Line 3`;

    const expected = `1
00:00:00,000 --> 00:00:03,000
Line 1
Line 2
Line 3`;

    expect(parseVTT(vttContent)).toBe(expected);
  });

  test("should skip invalid time entries", () => {
    const vttContent = `WEBVTT

invalid time --> 00:03.000
Should be skipped

00:03.500 --> 00:07.000
Valid entry`;

    const expected = `1
00:00:03,500 --> 00:00:07,000
Valid entry`;

    expect(parseVTT(vttContent)).toBe(expected);
  });

  test("should throw error for empty VTT", () => {
    const vttContent = `WEBVTT

NOTE This is just a note`;

    expect(() => parseVTT(vttContent)).toThrow("成功解析 VTT 檔案，但未找到有效的字幕條目可轉換");
  });
});

describe("convertToSRT", () => {
  test("should detect and convert VTT format", () => {
    const vttContent = fs.readFileSync(path.join(testDataDir, "sample.vtt"), "utf-8");
    const result = convertToSRT(vttContent);

    expect(result).toContain("00:00:00,000 --> 00:00:03,000");
    expect(result).toContain("Hello, world!");
    expect(result).toContain("This is a test subtitle.");
  });

  test("should detect and convert TTML format", () => {
    const ttmlContent = fs.readFileSync(path.join(testDataDir, "sample.ttml"), "utf-8");
    const result = convertToSRT(ttmlContent);

    expect(result).toContain("00:00:00,000 --> 00:00:03,000");
    expect(result).toContain("Hello, world!");
    expect(result).toContain("This is a test subtitle.");
  });

  test("should detect and convert Transcript XML format", () => {
    const transcriptContent = fs.readFileSync(path.join(testDataDir, "sample-transcript.xml"), "utf-8");
    const result = convertToSRT(transcriptContent);

    expect(result).toContain("00:00:00,000 --> 00:00:03,000");
    expect(result).toContain("Hello, world!");
    expect(result).toContain("This is a test subtitle with duration.");
    expect(result).toContain("00:00:03,500 --> 00:00:07,000");
  });

  test("should throw error for invalid XML", () => {
    const invalidXml = "<invalid>xml content without proper closing";

    expect(() => convertToSRT(invalidXml)).toThrow();
  });

  test("should throw error for XML without recognized subtitle elements", () => {
    const xmlWithoutSubtitles = `<?xml version="1.0"?>
<root>
  <data>No subtitle content here</data>
</root>`;

    expect(() => convertToSRT(xmlWithoutSubtitles)).toThrow("在 XML/TTML 檔案中找不到可識別的字幕內容");
  });
});

describe("Integration tests", () => {
  test("VTT to SRT conversion should match expected output format", () => {
    const vttContent = fs.readFileSync(path.join(testDataDir, "sample.vtt"), "utf-8");
    const result = convertToSRT(vttContent);

    // 檢查基本格式
    const lines = result.split("\n");
    expect(lines[0]).toBe("1"); // 第一個字幕編號
    expect(lines[1]).toMatch(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/); // 時間格式
    expect(lines[2]).toBe("Hello, world!"); // 字幕內容
    expect(lines[3]).toBe(""); // 空行分隔
  });

  test("should handle various input formats consistently", () => {
    const testCases = [
      { file: "sample.vtt", type: "VTT", expectTime: "00:00:00,000 --> 00:00:03,000" },
      { file: "sample.ttml", type: "TTML", expectTime: "00:00:00,000 --> 00:00:03,000" },
      { file: "sample-transcript.xml", type: "Transcript", expectTime: "00:00:00,000 --> 00:00:03,000" },
    ];

    testCases.forEach(({ file, type, expectTime }) => {
      const content = fs.readFileSync(path.join(testDataDir, file), "utf-8");
      const result = convertToSRT(content);

      // 所有格式都應該包含相同的基本字幕內容
      expect(result).toContain("Hello, world!");
      if (type !== "Transcript") {
        expect(result).toContain(expectTime);
      }

      // 檢查 SRT 格式結構
      expect(result).toMatch(/^\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n/);
    });
  });
});
