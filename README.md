# Service Lines Navigator

A modern, intelligent Vue 3 application for navigating and managing organizational service lines with AI-powered insights and real-time collaboration.

![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)
![Quasar](https://img.shields.io/badge/Quasar-2.18-1976D2?logo=quasar)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite)

## ✨ Features

### 🧭 Interactive Navigation
- **Hierarchical Service Line Browser** - Navigate through 4 levels: Service Line → Capability → Solution Set → Sub-function
- **Color-Coded Categories** - Each top-level service line has a unique color that cascades through its children
- **Smart Breadcrumbs** - Easy navigation back through the hierarchy
- **Persistent State** - Your navigation position is saved and restored between sessions
- **Interactive Tree View** - Collapsible sidebar with synchronized tree navigation

### 🤖 AI-Powered Insights
- **Intelligent Requirements Analysis** - Enter business requirements and get ranked recommendations
- **Smart Matching Algorithm** - Multi-layer keyword and contextual analysis
- **Relevance Scoring** - See exactly how well each service line matches your needs
- **Automated Reasoning** - Understand WHY each recommendation was made
- **Contact Discovery** - Instantly see leaders at every level with email links

### 💬 Collaborative Descriptions
- **Team Discussion Threads** - Slack/Teams-style conversation for each service line
- **AI-Generated Summaries** - Master descriptions that synthesize team input
- **Keyword Extraction** - Automatic theme detection from descriptions
- **Google Sheets Integration** - Real-time sync with shared descriptions
- **Local & Cloud Storage** - Works offline, syncs when online
- **Author Attribution** - Track who contributed what information

### 🎨 Modern UI/UX
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Beautiful Animations** - Smooth transitions and hover effects
- **Loading States** - Clear feedback during async operations
- **Progressive Disclosure** - Information revealed as you navigate deeper
- **Material Design** - Powered by Quasar Framework

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google account (for Sheets integration)
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/CipherLab/ServiceLines.git
cd ServiceLines

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/ServiceLines/`

### Google Sheets Setup

The app integrates with Google Sheets for data persistence. Follow these steps:

1. **Create your Google Sheet** with two tabs:
   - `SLs` - Service lines data
   - `Descriptions` - Team descriptions

2. **Deploy the Apps Script** (see `apps-script.js`):
   - Open your sheet → Extensions → Apps Script
   - Paste the code from `apps-script.js`
   - Deploy as Web App
   - Copy the deployment URL

3. **Configure the frontend**:
   ```javascript
   // In src/services/googleSheets.js
   const APPS_SCRIPT_URL = 'your-deployment-url-here'
   const API_KEY = 'your-google-api-key'
   const SHEET_ID = 'your-sheet-id'
   ```

See [SETUP_APPS_SCRIPT.md](./SETUP_APPS_SCRIPT.md) for detailed instructions.

## 🏗️ Technology Stack

### Frontend
- **Vue 3.5** - Progressive JavaScript framework with Composition API
- **Quasar 2.18** - Premium Vue UI component library
- **Vite 7.1** - Next-generation frontend build tool
- **Axios** - HTTP client for API requests

### Data & Storage
- **Google Sheets API** - Primary data source
- **Google Apps Script** - Serverless backend for write operations
- **LocalStorage** - Client-side persistence and offline support

### Architecture Patterns
- **Component-Based Architecture** - Reusable, isolated components
- **Reactive State Management** - Vue 3 reactivity system
- **Event-Driven Communication** - Parent-child component messaging
- **Progressive Enhancement** - Works offline, syncs online

## 📁 Project Structure

```
ServiceLines/
├── src/
│   ├── components/
│   │   ├── NavigateView.vue      # Main navigation interface
│   │   ├── TreeView.vue          # Sidebar tree navigation
│   │   ├── ChatBot.vue           # AI requirements analyzer
│   │   └── DescriptionThread.vue # Collaborative descriptions
│   ├── services/
│   │   └── googleSheets.js       # Google Sheets integration
│   ├── App.vue                   # Root component
│   └── main.js                   # Application entry point
├── public/
│   └── ServiceLines.csv          # Fallback data source
├── apps-script.js                # Google Apps Script backend
├── SETUP_APPS_SCRIPT.md          # Deployment guide
└── vite.config.js                # Build configuration
```

## 🎯 Key Features Explained

### Smart Navigation
The navigation system uses a 4-level hierarchy that matches your organizational structure. Each level is color-coded and provides context about the service line's purpose and leadership.

### AI Analysis
The ChatBot analyzes business requirements using:
- **Direct platform matching** (Salesforce, Dynamics, etc.)
- **Keyword pattern detection** (CRM, Cloud, Data, etc.)
- **Contextual analysis** (understanding related terms)
- **Description analysis** (team insights and documentation)

Results are scored 0-99% with detailed reasoning for each recommendation.

### Master Descriptions
AI-generated summaries that:
- Extract key themes from team discussions
- Identify common focus areas
- Attribute insights to contributors
- Update dynamically as new descriptions are added

### Bidirectional Sync
Changes flow between:
1. **User Input** → LocalStorage (instant)
2. LocalStorage → Google Sheets (background)
3. Google Sheets → All Users (refresh)

## 🔧 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Adding New Service Lines

1. **Via UI**: Click "+ Add New" button at any level
2. **Via Google Sheets**: Add rows directly to the SLs tab
3. **Via CSV**: Update `public/ServiceLines.csv` (fallback)

### Customizing Colors

Edit the color palette in `src/components/NavigateView.vue`:

```javascript
const colorPalette = [
  { bg: '#E3F2FD', text: '#1565C0', hover: '#BBDEFB' }, // Blue
  { bg: '#F3E5F5', text: '#6A1B9A', hover: '#E1BEE7' }, // Purple
  // Add more colors...
]
```

### Adding Icons

Map service line names to Material Icons in `src/components/NavigateView.vue`:

```javascript
const iconMap = {
  'Your Service Line': 'icon_name',
  'default': 'folder'
}
```

## 🚢 Deployment

### GitHub Pages

The app is configured for GitHub Pages deployment:

```bash
# Build for production
npm run build

# The dist/ folder contains your static files
# Deploy to: https://cipherlab.github.io/ServiceLines/
```

The `base` path in `vite.config.js` is set to `/ServiceLines/` for GitHub Pages.

### Other Platforms

Deploy to Netlify, Vercel, or any static hosting:

1. Build: `npm run build`
2. Deploy the `dist/` folder
3. Update `vite.config.js` base path if needed

## 🔐 Security Notes

### Current Setup
- Read-only API key for Google Sheets
- Apps Script web app accessible to "Anyone"
- No user authentication required

### Production Recommendations
- Add API key validation in Apps Script
- Implement OAuth for user authentication
- Add rate limiting to prevent abuse
- Restrict Apps Script access to specific users
- Use environment variables for sensitive config
- Enable HTTPS only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use Vue 3 Composition API
- Follow Quasar component patterns
- Add comments for complex logic
- Keep components focused and reusable
- Use semantic HTML

## 📝 Configuration

### Google Sheets Schema

**SLs Tab:**
- Column A: # (row number)
- Column B: Service Line (L1)
- Column C: Service Line (L1) Leader
- Column D: Capability (L2)
- Column E: Capability (L2) Leader
- Column F: Solution Set (L3)
- Column G: Solution Set (L3) Leader
- Column H: Sub-function (L4)
- Column I: Sub-function Leader

**Descriptions Tab:**
- Column A: pathKey
- Column B: author
- Column C: content
- Column D: timestamp

## 🐛 Troubleshooting

### "CORS Error" when saving
- Redeploy Apps Script with a new version
- Check "Who has access" is set to "Anyone"
- Verify the Apps Script URL is correct

### Data not loading
- Check Google Sheets API key is valid
- Verify Sheet ID is correct
- Check browser console for errors
- Try the fallback CSV data

### Descriptions not syncing
- Check Apps Script deployment
- Verify "Descriptions" tab exists
- Check browser console for errors
- Try posting again after refresh

## 📄 License

ISC License

## 🙏 Acknowledgments

- Built with Vue 3 and Quasar Framework
- Icons from Material Design
- AI-powered features inspired by modern LLM capabilities
- Collaborative features inspired by Slack and Teams

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/CipherLab/ServiceLines/issues)
- **Discussions**: [GitHub Discussions](https://github.com/CipherLab/ServiceLines/discussions)

---

Made with ❤️ for better organizational navigation
