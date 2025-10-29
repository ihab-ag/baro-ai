# 🎨 Running Baro AI Bot on Replit

## Quick Setup (5 minutes)

### Step 1: Import to Replit

1. Go to [replit.com](https://replit.com) and sign up/login (free!)
2. Click **"Create Repl"** (big green button)
3. Select **"Import from GitHub"**
4. Enter your repository URL (e.g., `https://github.com/yourusername/baro-ai`)
5. Click **"Import"**

Replit will automatically detect it's a Node.js project.

### Step 2: Set Environment Variables (Secrets)

1. Click the **🔒 (lock icon)** in the left sidebar - this is "Secrets"
2. Add these secrets one by one:

```
TELEGRAM_BOT_TOKEN = your_telegram_bot_token
SUPABASE_URL = your_supabase_url
SUPABASE_ANON_KEY = your_supabase_anon_key
GROQ_API_KEY = your_groq_api_key
LLM_PROVIDER = groq
```

**Where to get these:**
- **TELEGRAM_BOT_TOKEN**: Message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → Follow instructions
- **SUPABASE_URL** & **SUPABASE_ANON_KEY**: From your Supabase project dashboard (see SUPABASE_SETUP.md)
- **GROQ_API_KEY**: From [console.groq.com](https://console.groq.com) (free signup)

### Step 3: Install Dependencies

In the Replit Shell (bottom panel), run:
```bash
npm install
```

### Step 4: Build the Project

```bash
npm run build
```

### Step 5: Run the Bot!

Click the **▶️ Run** button at the top, or manually run:
```bash
npm start
```

That's it! Your bot is now running! 🎉

---

## Testing Your Bot

1. Open Telegram
2. Search for your bot (the username you gave @BotFather)
3. Send `/start` or `help`
4. You should get a response!

---

## Troubleshooting

### Bot doesn't respond?
- Check the Replit console for errors
- Verify all environment variables are set correctly in Secrets
- Make sure you ran `npm run build` first

### Bot stops after a few minutes?
- Replit free tier may pause inactive repls
- Just click **Run** again to restart
- Consider keeping the Replit tab open

### "Module not found" errors?
- Run `npm install` again
- Make sure you're using Node.js (Replit should auto-detect)

### Build errors?
- Check that TypeScript compiled: `npm run build`
- Look for errors in the console

---

## Useful Replit Commands

- **View logs**: Check the console output at the bottom
- **Stop bot**: Click the stop button (square icon)
- **Restart**: Click Run again
- **Terminal**: Use the Shell tab for manual commands

---

## Keep Bot Running (Optional)

Replit may pause your bot when inactive. To keep it running:

1. Keep the Replit tab open in your browser
2. Or use Replit's "Always On" feature (may require upgrade)
3. Or set up a simple ping script to keep it active

---

## Need Help?

- Check Replit docs: [docs.replit.com](https://docs.replit.com)
- Your bot logs appear in the Replit console
- Test locally first with `npm run telegram` if you have issues

Happy coding! 🚀

