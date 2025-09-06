# Scripture Flow

A beautiful, interactive Bible quotes screensaver application that displays inspirational verses with customizable themes and backgrounds.

## Features

- 🎨 **Beautiful Design**: Modern, clean interface with smooth animations
- 🌈 **Multiple Themes**: Light and dark modes with 14+ gradient backgrounds
- 📱 **Mobile Responsive**: Touch gestures for mobile devices (swipe, double-tap)
- ⭐ **Favorites System**: Save and manage your favorite verses
- ⚙️ **Customizable**: Adjustable timing, shuffle mode, and background options
- 🎵 **Auto-slideshow**: Automatic progression with visual countdown timer

## Live Demo

Visit [Scripture Flow](https://your-netlify-site.netlify.app) to see it in action.

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/JoeBuydemDips/scripture-flow.git
cd scripture-flow
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Deployment on Netlify

### Option 1: Deploy from Git (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.`
5. Deploy!

### Option 2: Manual Deploy

1. Run the build command:

```bash
npm run build
```

2. Drag and drop the entire project folder to Netlify

## Project Structure

```
scripture-flow/
├── index.html          # Main HTML file
├── static/
│   ├── css/
│   │   └── styles.css  # Stylesheet
│   ├── js/
│   │   └── app.js      # Main JavaScript application
│   └── images/         # Background images
├── quotes.js           # Bible quotes data
├── package.json        # Node.js dependencies
├── netlify.toml        # Netlify configuration
├── build.js            # Build script
└── README.md           # This file
```

## Features Detail

### Themes & Backgrounds

- **Light/Dark Mode**: Toggle between themes
- **14+ Backgrounds**: Beautiful gradient backgrounds including:
  - Purple Gradient
  - Sunset Harmony
  - Ocean Breeze
  - Forest Mist
  - Mountain Dawn
  - And many more...

### Mobile Features

- **Swipe Navigation**: Swipe left/right to navigate quotes
- **Double-tap Favorite**: Double-tap to add/remove favorites
- **Touch-friendly**: Large touch targets and responsive design

### Customization Options

- **Timer Control**: 5-60 second intervals
- **Shuffle Mode**: Randomize quote order
- **Favorites**: Save and quickly access favorite verses
- **Auto-pause**: Slideshow pauses when settings are open

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

- Bible quotes sourced from various translations
- Icons by [Feather Icons](https://feathericons.com/)
- Fonts by [Google Fonts](https://fonts.google.com/)
