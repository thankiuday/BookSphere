#!/bin/bash

# BookSphere Render Deployment Script
echo "🚀 BookSphere Render Deployment Setup"
echo "======================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ No GitHub remote found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/booksphere.git"
    echo "   git push -u origin main"
    exit 1
fi

echo "✅ Git repository found"

# Check for required files
echo "📋 Checking required files..."

required_files=(
    "backend/Procfile"
    "frontend/render.yaml"
    "backend/env.production.template"
    "frontend/env.production.template"
    "RENDER_DEPLOYMENT.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🎉 All files are ready for Render deployment!"
echo ""
echo "📖 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Follow the deployment guide:"
echo "   📄 Open RENDER_DEPLOYMENT.md for detailed instructions"
echo ""
echo "3. Create services on Render:"
echo "   🔗 Backend: https://dashboard.render.com/new/web-service"
echo "   🔗 Frontend: https://dashboard.render.com/new/static-site"
echo ""
echo "4. Set up environment variables as described in the guide"
echo ""
echo "Good luck with your deployment! 🚀"
