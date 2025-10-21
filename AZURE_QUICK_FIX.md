# 🚀 Azure OAuth Quick Fix

## The Problem

Microsoft is rejecting the OAuth redirect because Azure still has the old backend URL.

## The Fix (2 minutes)

### 1. Go to Azure Portal

https://portal.azure.com

### 2. Find Your App

- Azure Active Directory → App registrations
- Search for your PeteRental OAuth app

### 3. Update Redirect URI

- Click **Authentication** (left sidebar)
- Under **Web** → **Redirect URIs**
- **ADD THIS NEW URI:**
  ```
  https://peterental-vapi-github-newer.onrender.com/calendar/auth/callback
  ```
- Click **Save**

### 4. Test

- Go to `/users` in your frontend
- Click "Connect Microsoft Calendar"
- Should work! ✅

---

## Why This Happened

Your backend moved from:

- ❌ `peterentalvapi-latest.onrender.com`
- ✅ `peterental-vapi-github-newer.onrender.com`

But Azure still only knows about the old URL, so Microsoft rejects the new one.

## No Code Changes Needed

The frontend code is already correct. This is purely an Azure configuration issue.

---

**That's it! Just add the new redirect URI in Azure and you're good to go.**
