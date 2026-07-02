# 🚀 Deploying VLSAP to Render (Option A)

This guide walks you through deploying the full-stack VLSAP application on **Render.com** (which supports free web services and persistent disks).

---

## 1. Prepare your GitHub Repository
1. Initialize a Git repository in this folder if you haven't already:
   ```bash
   git init
   git add .
   git commit -m "Initialize VLSAP codebase"
   ```
2. Create a new repository on **GitHub** (e.g. name it `vision-language-street-audit-platform`).
3. Add the remote and push your code:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   git branch -M main
   git push -u origin main
   ```

---

## 2. Deploy on Render
1. Log in to [Render.com](https://render.com/).
2. Click **New +** at the top right and select **Web Service**.
3. Connect your GitHub account and choose the repository you just pushed.
4. Set the following configuration values:
   * **Name**: `vlsap` (or your choice)
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`

---

## 3. Set Environment Variables
In the Render Web Service settings, go to the **Environment** tab and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Tells VLSAP to run in production mode and serve static assets. |
| `GEMINI_API_KEY` | `YOUR-GEMINI-KEY` | (Optional) Your Gemini API Key for AI audits. |
| `DB_PATH` | `/data/db.json` | Tells the database to write to the persistent disk folder. |

---

## 4. Configure Persistent Disk (Important!)
By default, Render containers are ephemeral (their disk clears on every deploy/restart, which would wipe your audits and rater profiles). 
To make your audits and database persistent:

1. In your Render Web Service settings, click on the **Disks** tab in the sidebar.
2. Click **Add Disk**.
3. Configure the disk as follows:
   * **Name**: `vlsap-db`
   * **Mount Path**: `/data` (Matches the `DB_PATH` env variable above)
   * **Size**: `1 GiB` (Free tier size limit)
4. Click **Create Disk**.

---

Render will now build and launch your application! Once the build completes, Render will provide you with a live URL (e.g. `https://vlsap.onrender.com`) where your raters can access the platform and run street audits collaboratively.
