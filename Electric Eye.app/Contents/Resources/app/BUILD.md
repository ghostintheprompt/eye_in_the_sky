# Building Electric Eye

Follow these steps to build Electric Eye from source on macOS.

### Prerequisites
- Node.js 20+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/ghostintheprompt/electric_eye.git
cd electric_eye
```

### 2. Install Dependencies
```bash
# Install Backend
cd backend && npm install

# Install Frontend
cd ../frontend && npm install
```

### 3. Build & Run
```bash
# Start the full station
./scripts/start-all.sh
```

### 4. Create DMG
```bash
# Run the distribution script
./scripts/make_dmg.sh
```

### Troubleshooting
- Ensure ports 3000 (Frontend) and 5000 (Backend) are available.
- Verify `.env` configuration in the root directory.
