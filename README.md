# Spellbook Forge

A client-side web application for creating and managing D&D spellbooks with an intuitive drag-and-drop interface. Prepare your perfect spell list for both 5th Edition (2014) and the 2024 Player's Handbook rules.

## Features

- **Drag-and-Drop Spell Management**: Easily drag spells from the library into your spellbook
- **Dual Edition Support**: Access spells from both 2014 and 2024 D&D rulesets
- **Spellbook Creation**: Create multiple spellbooks for different characters and levels
- **Client-Side Storage**: Data stored locally in your browser using IndexedDB
- **Export/Import**: Backup and share your custom spells and spellbooks via JSON files
- **Responsive Design**: Works on desktop and mobile devices
- **No Backend Required**: Runs entirely in the browser

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Storage**: IndexedDB with Dexie ORM
- **Drag-and-Drop**: @dnd-kit
- **Build Tool**: Vite
- **UI Components**: Radix UI, Lucide Icons
- **State Management**: React Query

## Prerequisites

- Node.js 20+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spellbook-forge.git
cd spellbook-forge
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building

To build the application for production:
```bash
npm run build
```

The built files will be in the `dist/` directory. You can serve them with any static file server.

## Data Storage

The application uses IndexedDB for local storage. Data includes:

- Predefined spells (loaded from JSON files)
- User-created spellbooks
- Custom spells (if added)

All data is stored in your browser and can be exported/imported as JSON for backup or sharing.

## Usage

1. **Create a Spellbook**: Click "Create New Spellbook"
2. **Browse Spells**: Scroll through the spell library on the left
3. **Prepare Spells**: Drag spells from the library into your spellbook
4. **Export Data**: Click "Export Data" to download your spellbooks and custom spells as JSON
5. **Import Data**: Click "Import Data" to load previously exported data

## Data Export/Import

- **Export**: Downloads a JSON file containing your custom spells and spellbooks
- **Import**: Upload a JSON file to restore data from another device or share with friends
- Note: Predefined spells are loaded automatically and not included in exports

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and test thoroughly
4. Run type checking: `npm run check`
5. Commit your changes: `git commit -am 'Add new feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.