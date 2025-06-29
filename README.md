# SRT Converter

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Raycast](https://img.shields.io/badge/Raycast-FF6363?logo=raycast&logoColor=white)
![Tests](https://img.shields.io/badge/tests-31%20passed-green)

A powerful Raycast extension that converts various subtitle formats to SRT (SubRip) format with ease. Seamlessly integrates with Finder and Path Finder for intuitive file selection.

## ✨ Features

- 🔄 **Multiple Format Support**: Convert VTT, TTML, and XML transcripts to SRT
- 🖱️ **Finder Integration**: Select files directly from Finder or Path Finder
- ⚡ **Fast Processing**: Instant conversion with comprehensive error handling
- 🎯 **Smart Time Parsing**: Supports multiple time formats (HH:MM:SS.mmm, seconds, etc.)
- 🧪 **Fully Tested**: 31 comprehensive test cases ensuring reliability
- ⚙️ **Configurable**: Customizable output location and overwrite settings

## 🎬 Supported Formats

### Input Formats

| Format | Description | Example |
|--------|-------------|---------|
| **VTT** | WebVTT (Web Video Text Tracks) | `.vtt` files |
| **TTML** | Timed Text Markup Language | `.ttml` files |
| **XML** | Transcript format with start/duration | `.xml` files |

### Output Format

- **SRT** (SubRip) - The most widely supported subtitle format

### Time Format Support

- `HH:MM:SS.mmm` or `HH:MM:SS,mmm` (e.g., `01:23:45.678`)
- Seconds with suffix: `123.456s` or `123s`
- Raw seconds: `26.542` or `123`

## 🚀 Installation

### From Raycast Store

1. Open Raycast
2. Search for "SRT Converter"
3. Click "Install"

### Manual Installation

1. Clone this repository
2. Open terminal in the project directory
3. Run `npm install && npm run build`
4. Import the extension in Raycast

## 📖 Usage

### Basic Usage

1. **Open Raycast** (`⌘ + Space`)
2. **Search for "SRT Converter"** and press Enter
3. **Select your subtitle file** in Finder or Path Finder
4. **Run the extension** - your SRT file will be automatically created

### Configuration Options

Access preferences via Raycast Settings → Extensions → SRT Converter:

- **Input Method**: Choose between Finder or Path Finder for file selection
- **Output Location**: Save to original folder or Downloads folder
- **Overwrite Files**: Toggle whether to overwrite existing SRT files

### Example Conversion

**Input (VTT):**
```
WEBVTT

00:00.000 --> 00:03.000
Hello, world!

00:03.500 --> 00:07.000
This is a test subtitle.
```

**Output (SRT):**
```
1
00:00:00,000 --> 00:00:03,000
Hello, world!

2
00:00:03,500 --> 00:00:07,000
This is a test subtitle.
```

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm
- Raycast (for testing)

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/srt-converter.git
cd srt-converter

# Install dependencies
npm install

# Start development mode
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build the extension
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate test coverage report
npm run lint         # Check code style
npm run fix-lint     # Fix linting issues
npm run publish      # Publish to Raycast Store
```

### Project Structure

```
src/
├── __tests__/              # Test files and test data
│   ├── srt-converter.test.ts
│   └── test-data/
├── converter-core.ts       # Core conversion logic
├── srt-converter.tsx       # Main Raycast command
└── utils.ts               # AppleScript utilities

Configuration:
├── jest.config.js         # Jest testing configuration
├── package.json           # Project metadata and dependencies
└── tsconfig.json          # TypeScript configuration
```

### Architecture

#### Core Components

1. **converter-core.ts**: Contains all conversion logic
   - `parseTime()` - Handles multiple time formats
   - `parseVTT()` - VTT format parser
   - `convertToSRT()` - Main conversion function
   - `formatSRTTime()` - SRT time formatting

2. **utils.ts**: AppleScript integration for file selection
   - Works with both Finder and Path Finder
   - Handles system permissions

3. **srt-converter.tsx**: Raycast UI and command handling
   - File processing workflow
   - Error handling and user feedback
   - Settings integration

### Testing

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

**Test Coverage:**
- ✅ Time parsing functions (11 tests)
- ✅ VTT parsing (6 tests)
- ✅ SRT formatting (3 tests)
- ✅ Format detection (5 tests)
- ✅ Integration tests (6 tests)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if necessary
4. **Run the test suite**: `npm test`
5. **Lint your code**: `npm run lint`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Code Style

- Follow TypeScript best practices
- Add tests for new features
- Ensure all tests pass
- Follow existing code formatting (Prettier + ESLint)

## 📝 Technical Details

### Dependencies

- **[@raycast/api](https://www.npmjs.com/package/@raycast/api)**: Raycast extension API
- **[@raycast/utils](https://www.npmjs.com/package/@raycast/utils)**: Raycast utility functions
- **[xmldom](https://www.npmjs.com/package/xmldom)**: XML parsing for TTML/XML formats

### System Requirements

- macOS with Raycast installed
- Node.js 18+ (for development)
- System permissions for Finder access

### Limitations

- Requires Finder/Path Finder for file selection
- AppleScript permissions needed for file access
- Currently supports input formats: VTT, TTML, XML
- Output format: SRT only

## 🐛 Troubleshooting

### Common Issues

**"File selection failed"**
- Ensure Raycast has accessibility permissions
- Check that file is selected in Finder before running command

**"Conversion failed"**
- Verify input file format is supported
- Check that file is not corrupted or empty

**"SRT file already exists"**
- Enable "Overwrite Existing Files" in preferences, or
- Rename/delete the existing SRT file

### Getting Help

- 🐛 [Report bugs](https://github.com/your-username/srt-converter/issues)
- 💡 [Request features](https://github.com/your-username/srt-converter/issues)
- 📖 [Check documentation](https://github.com/your-username/srt-converter/wiki)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Raycast](https://raycast.com) for the excellent extension platform
- [xmldom](https://github.com/xmldom/xmldom) for XML parsing capabilities
- The open-source community for inspiration and tools

---

<div align="center">

**[⬆ Back to Top](#srt-converter)**

Made with ❤️ by [cashwu](https://github.com/cashwu)

</div>