#!/bin/bash
# Quick setup script for GitHub Actions + Vercel

echo "🚀 Setting up GitHub Actions deployment..."
echo ""
echo "Step 1: Get Vercel Token"
echo "Opening Vercel tokens page..."
open "https://vercel.com/account/tokens" || echo "Visit: https://vercel.com/account/tokens"
echo ""
echo "👉 Create a new token named 'GitHub Actions'"
echo "👉 Copy the token when shown"
echo ""
read -p "Press Enter after you've copied the token..."
echo ""
echo "Step 2: Add token to GitHub"
echo "Paste your Vercel token:"
read -s VERCEL_TOKEN
echo ""

if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo "Adding secret to GitHub..."
echo "$VERCEL_TOKEN" | gh secret set VERCEL_TOKEN

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Success! GitHub Actions is now configured."
    echo ""
    echo "Testing with an empty commit..."
    git commit --allow-empty -m "trigger: Test automated deployment"
    git push
    echo ""
    echo "🎉 Watch your deployment at:"
    echo "https://github.com/Mark0025/peterental-nextjs/actions"
else
    echo "❌ Failed to add secret. Make sure you're logged into gh CLI:"
    echo "Run: gh auth login"
fi
