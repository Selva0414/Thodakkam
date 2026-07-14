# Play Store Deployment Guide for Thodakkam App

Since the Thodakkam app is built with Expo (using EAS), the process of uploading and updating the app on the Google Play Store involves building an Android App Bundle (AAB) and submitting it via the Google Play Console.

## 1. Prerequisites
- A [Google Play Developer account](https://play.google.com/console/signup) ($25 one-time fee).
- The Expo CLI installed globally on your machine (`npm install -g eas-cli`).
- You must be logged into your Expo account in the terminal (`eas login`).

## 2. Preparing the App (app.json)
Before building, ensure your `app.json` (inside the `thodakkam-app` directory) has the necessary Android configuration. Specifically, you need a unique `package` name and a `versionCode`.

```json
{
  "expo": {
    "name": "Thodakkam",
    "slug": "thodakkam",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.thodakkam", // Change 'yourcompany' to something unique to you
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```
> [!IMPORTANT]
> The `package` name must be entirely unique across the entire Google Play Store. It cannot be changed after your first upload.

## 3. Initial Upload (Creating the First Release)

### Step 1: Build the Android App Bundle (AAB)
Open your terminal, navigate to your app directory, and run the EAS build command:
```powershell
cd "e:\Thodakkam mobile App\thodakkam-app"
eas build --platform android
```
- When prompted, choose to let Expo generate a new Android Keystore for you. Expo will securely store this for future builds.
- Wait for the build to finish. It may take 10-15 minutes.

### Step 2: Download the AAB
Once the build is complete, the terminal will provide a link to your Expo dashboard where you can download the `.aab` file. Download it to your computer.

### Step 3: Google Play Console Setup
1. Go to the [Google Play Console](https://play.google.com/console).
2. Click **Create app** and fill in the initial details (App name, language, Free/Paid, etc.).
3. On the Dashboard, complete all the required tasks under **Set up your app** (e.g., App access, Content rating, Target audience, Store listing details).

### Step 4: Upload the App
1. It is highly recommended to start with an internal testing release. In the left menu, go to **Testing > Internal testing** (or go straight to **Release > Production** if you want to publish immediately).
2. Click **Create new release**.
3. Under the "App bundles" section, upload the `.aab` file you downloaded from Expo.
4. Add your release notes.
5. Click **Save**, then **Review release**, and finally start the rollout. 

---

## 4. How to Update the App (Subsequent Releases)

When you fix bugs or add new features and want to push an update to the Play Store, follow these steps:

### Step 1: Update the Version Codes
Before building a new version, you **MUST** increase the version numbers in your `app.json`. Google Play will reject the upload if the `versionCode` is not higher than the previous one.

```json
{
  "expo": {
    "version": "1.0.1", // Update the public version string (e.g., 1.0.1, 1.1.0)
    "android": {
      "versionCode": 2 // MUST BE HIGHER THAN THE PREVIOUS ONE (e.g., from 1 to 2)
    }
  }
}
```

### Step 2: Build a New AAB
Run the exact same build command as before:
```powershell
cd "e:\Thodakkam mobile App\thodakkam-app"
eas build --platform android
```
Download the new `.aab` file once the build is finished.

### Step 3: Upload the Update to Play Console
1. Go to your app in the Google Play Console.
2. Navigate to the track where your app is currently published (e.g., **Production**).
3. Click **Create new release**.
4. Upload the new `.aab` file.
5. Update the "Release notes" section to inform users about what's new or fixed in this update.
6. Click **Save**, **Review release**, and **Start rollout**. Google will review the update, and it will be available to users usually within a few hours to a few days.

> [!TIP]
> **Over-The-Air (OTA) Updates**
> If your update only involves changing JavaScript code or images (and NO native Android code or new libraries), you can use EAS Update to push updates instantly to users' devices without going through the Play Store review process. You can set this up by running `eas update:configure`.
