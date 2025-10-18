# 🐋 Crypto Whale Tracker

A real-time cryptocurrency whale transaction tracker that monitors large transactions across major blockchains.

## ✨ Features

- 📊 Real-time whale transaction monitoring
- 🔍 Multi-blockchain support (Bitcoin, Ethereum, Tron, Ripple, Polygon)
- 🎯 Filter by blockchain and transaction amount
- 📈 Live statistics and analytics
- ⚡ Auto-refresh every 30 seconds
- 📱 Fully responsive design
- 🆓 Runs completely free on Vercel/Netlify

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git
- GitHub account (for deployment)

### Installation

1. **Create project folder:**
```bash
mkdir crypto-whale-tracker
cd crypto-whale-tracker
```

2. **Initialize React app:**
```bash
npx create-react-app .
```

3. **Replace files with provided code:**
   - Copy all the files I provided into your project
   - Make sure to match the folder structure exactly

4. **Install dependencies:**
```bash
npm install
```

5. **Run locally:**
```bash
npm start
```

Your app will open at `http://localhost:3000`

## 📦 Project Structure

```
crypto-whale-tracker/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── TransactionCard.jsx
│   │   ├── FilterBar.jsx
│   │   └── Stats.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── App.css
│   └── index.jsx
├── package.json
└── README.md
```

## 🌐 Deploy to Vercel (FREE)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import your repository
   - Click "Deploy"
   - Done! Your app is live!

## 🌐 Deploy to Netlify (FREE)

1. **Push to GitHub** (same as above)

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub
   - Click "Add new site"
   - Import from Git
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `build`
   - Click "Deploy"

## 🔑 Using Real API Data

The app currently runs in DEMO mode. To use real data:

1. **Get API Key:**
   - Sign up at [Whale Alert](https://whale-alert.io/) or [ClankApp](https://clankapp.com/)
   - Get your free API key

2. **Update api.js:**
   - Open `src/services/api.js`
   - Change `DEMO_MODE` to `false`
   - Add your API key in the fetch URL

3. **Example:**
```javascript
const DEMO_MODE = false;
const response = await fetch(
  `https://api.whale-alert.io/v1/transactions?api_key=YOUR_API_KEY&min_value=${minValue}`
);
```

## 🛠️ Customization

### Change Refresh Interval
In `App.jsx`, find this line:
```javascript
const interval = setInterval(() => {
  loadTransactions();
}, 30000); // Change 30000 to your desired milliseconds
```

### Add More Blockchains
In `src/services/api.js` and `FilterBar.jsx`, add to the blockchains array:
```javascript
const blockchains = ['all', 'bitcoin', 'ethereum', 'solana', 'cardano'];
```

### Change Color Theme
Edit the gradient in `App.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 📊 Features Breakdown

- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Filters**: Filter by blockchain and minimum transaction value
- **Statistics**: View total transactions, value, and averages
- **Transaction Cards**: Detailed view of each whale transaction
- **Responsive**: Works on desktop, tablet, and mobile

## 🐛 Troubleshooting

### App won't start
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Build fails
```bash
npm run build
```
Check console for errors

### Deployment issues
- Make sure all files are committed to Git
- Check build logs in Vercel/Netlify dashboard
- Verify `package.json` is correct

## 📝 License

Free to use for personal and commercial projects.

## 🤝 Contributing

Feel free to fork and improve!

## 📧 Support

For issues, check the console logs or rebuild the project.

---

**Built with React | Deployed on Vercel/Netlify | Powered by Whale Alert API**