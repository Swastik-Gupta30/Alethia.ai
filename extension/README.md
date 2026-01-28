# Aletheia AI - Chrome Extension

A Chrome Extension for analyzing the financial reliability of webpages using AI.

## Features

- 📊 **Financial Reliability Analysis**: Get a 0-100 score on webpage credibility
- 💬 **Context-Aware Chat**: Ask questions about the current page
- 🎨 **Modern Dark UI**: Clean, professional interface (350×500px)
- ⚡ **Fast & Lightweight**: Built with React + Vite

## Installation

### Load in Chrome

1. Navigate to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **"Load unpacked"**
4. Select the `dist/` folder
5. Pin the extension to your toolbar

### Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Backend Requirements

The extension requires a backend server at `http://localhost:5000` with these endpoints:

### POST /api/extension/analyze
```json
{
  "url": "string",
  "pageTitle": "string",
  "pageText": "string"
}
```
Returns: `{ "score": 0-100, "summary": "string" }`

### POST /api/chat
```json
{
  "query": "string",
  "context": {
    "pageTitle": "string",
    "pageText": "string",
    "url": "string"
  }
}
```
Returns: `{ "response": "string" }`

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- Chrome Manifest V3

## Structure

```
src/
├── App.jsx       # Main component with Insight & Ask tabs
├── api.js        # Backend API utilities
├── index.css     # Tailwind + custom styles
└── main.jsx      # React entry point
```

## Permissions

- `activeTab`: Access current tab info
- `scripting`: Extract page content
- `http://localhost:5000/*`: Backend communication

## License

MIT
