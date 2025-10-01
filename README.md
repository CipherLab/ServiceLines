# Service Lines Navigator

A Vue 3 + Quasar web application for navigating and managing organizational service lines, hosted on GitHub Pages.

## Features

- **Interactive Navigation**: Browse service lines using a grid of buttons, drilling down through L1 → L2 → L3 → L4 levels
- **Add New Service Lines**: Add new service lines at any level with optional descriptions
- **Tree Visualization**: View the complete hierarchy in a tree structure with Quasar tree component
- **AI Assistant**: Chat interface to help identify relevant service lines for your projects

## Tech Stack

- Vue 3 (Composition API)
- Quasar Framework
- Vite
- Axios (for Google Sheets API)

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Deployment to GitHub Pages

1. Initialize git repository:
```bash
git init
git add .
git commit -m "Initial commit: Service Lines Navigator"
```

2. Create GitHub repository and push:
```bash
git remote add origin <your-repo-url>
git push -u origin main
```

3. Enable GitHub Pages:
   - Go to repository Settings → Pages
   - Set Source to "GitHub Actions"
   - The workflow will automatically deploy on push to main

4. Update `vite.config.js`:
   - Change `base: '/ServiceLines/'` to match your repository name

## Google Sheets Integration

The app connects to Google Sheets using the Sheets API. The sheet should have these columns:
- `Service Line (L1)` & `Service Line (L1) Leader`
- `Capability (L2)` & `Capability (L2) Leader`
- `Solution Set (L3)` & `Solution Set (L3) Leader`
- `Sub-function (L4)` & `Sub-function Leader`
- Optional: `L1 Description`, `L2 Description`, `L3 Description`, `L4 Description`

API key and Sheet ID are configured in `src/services/googleSheets.js`.

## Project Structure

```
src/
├── components/
│   ├── NavigateView.vue    # Button grid navigation
│   ├── TreeView.vue         # Hierarchical tree view
│   └── ChatBot.vue          # AI assistant interface
├── services/
│   └── googleSheets.js      # Google Sheets API integration
├── App.vue                  # Main app component
└── main.js                  # App entry point
```

## Future Enhancements

- Write changes back to Google Sheets (currently read-only, requires OAuth)
- Integrate with actual LLM API for smarter chatbot responses
- Add search/filter functionality
- Export hierarchy as JSON/CSV
- User authentication for editing capabilities
