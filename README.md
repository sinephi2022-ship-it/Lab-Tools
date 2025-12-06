# LabMate Pro

**Real-time Lab Collaboration Platform**

A web-based collaborative laboratory assistant with infinite canvas, real-time synchronization, instant messaging, file management, and experimental workflow tools.

## Features

✨ **Core Capabilities**
- Infinite Canvas with pan & zoom
- Real-time synchronization via Firebase Firestore
- Multi-element support: Notes, Timers, Protocols, Text, Files
- Instant messaging (1-on-1 & group)
- Personal collection & sharing
- Friend system
- Multi-language support (Chinese, English, Japanese)

## Technology Stack

- **Frontend**: Vue.js 3 (CDN)
- **Styling**: Tailwind CSS + Custom CSS
- **Icons**: FontAwesome 6
- **Backend**: Firebase (Auth, Firestore)
- **Deployment**: GitHub Pages

## Project Structure

```
LabMate-Pro/
├── index.html          # Main HTML template
├── app.js             # Vue 3 application logic
├── config.js          # Firebase config & global utilities
├── style.css          # Custom styles
├── package.json       # Project metadata
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## Getting Started

### Prerequisites
- Modern browser with ES6+ support
- Internet connection

### Installation

1. Clone the repository
```bash
git clone https://github.com/sinephi2022-ship-it/Lab-Tools.git
cd Lab-Tools
```

2. Open `index.html` in browser (can be served locally or via GitHub Pages)

### Configuration

Firebase configuration is in `config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    // ... other config
};
```

## Usage

### Authentication
1. Sign up with email/password or Google
2. Complete your profile with avatar and language preference

### Creating a Lab
1. Click "Create Lab" in the lobby
2. Enter lab name and optional password
3. Choose public or private visibility
4. Start collaborating!

### Canvas Elements
- **Note**: Rich text with background color and images
- **Timer**: Visual countdown with start/pause/reset
- **Protocol**: Checklist with step annotations
- **Text**: Formatted text box with styling
- **File**: Attached documents and media

### Collaboration
- **Drag elements**: Move items on canvas
- **Draw connections**: Link related elements
- **Real-time sync**: Changes saved to Firestore instantly
- **Chat**: In-lab messaging and file sharing

## Data Model

See the full data model in the development documentation.

### Collections
- `users` - User profiles and settings
- `labs` - Lab data (canvas, elements, members)
- `direct_messages` - Private chat conversations
- `users/{uid}/repo` - Personal file collection

## Performance Optimizations

- Debounced saves (300ms)
- Optimized drag with requestAnimationFrame
- Image compression (0.7 quality, 800px max)
- Firebase listener cleanup
- Responsive design with safe area support

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Development

### Local Testing
1. Serve files locally: `python -m http.server 8000`
2. Open `http://localhost:8000`
3. Check browser console for logs

### Making Changes
1. Edit files in place
2. Refresh browser to see changes
3. Commit and push to GitHub

### Deployment
The project is automatically deployed via GitHub Pages:
- Push to `main` branch
- Site updates at `https://sinephi2022-ship-it.github.io/Lab-Tools/`

## Troubleshooting

### Loading Screen Stuck
- Check browser console for errors
- Verify Firebase connection
- Clear browser cache and reload

### Firebase Connection Errors
- Check internet connection
- Verify Firebase project is active
- Check browser's storage/cookies settings

### File Upload Issues
- Check file size (Firestore has limits)
- Try image compression
- Check browser storage quota

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## Support

For issues and feature requests, please open an issue on GitHub.

---

**Version**: 2.0.0  
**Last Updated**: 2025-12-06
