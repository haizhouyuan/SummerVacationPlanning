#!/bin/bash

# Summer Vacation Planning App Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Load configuration
source ./config.sh

# Configuration
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
# PROJECT_ID is now loaded from config.sh

# Function to print colored output
print_step() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    print_step "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Run: npm install -g firebase-tools"
        exit 1
    fi
    
    print_step "All requirements satisfied"
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Frontend dependencies
    echo "Installing frontend dependencies..."
    cd $FRONTEND_DIR
    npm install
    cd ..
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm install
    cd ..
    
    print_step "Dependencies installed"
}

# Run tests
run_tests() {
    print_step "Running tests..."
    
    # Frontend tests
    echo "Running frontend tests..."
    cd $FRONTEND_DIR
    npm test -- --coverage --watchAll=false
    cd ..
    
    # Backend tests
    echo "Running backend tests..."
    cd $BACKEND_DIR
    npm test
    cd ..
    
    print_step "All tests passed"
}

# Build applications
build_applications() {
    print_step "Building applications..."
    
    # Build frontend
    echo "Building frontend..."
    cd $FRONTEND_DIR
    npm run build
    cd ..
    
    # Build backend
    echo "Building backend..."
    cd $BACKEND_DIR
    npm run build
    cd ..
    
    print_step "Applications built successfully"
}

# Deploy to Firebase
deploy_firebase() {
    print_step "Deploying to Firebase..."
    
    # Login to Firebase (if not already logged in)
    if ! firebase projects:list &> /dev/null; then
        print_warning "Please log in to Firebase"
        firebase login
    fi
    
    # Set Firebase project
    firebase use $PROJECT_ID
    
    # Deploy Firestore rules and indexes
    print_step "Deploying Firestore rules and indexes..."
    firebase deploy --only firestore:rules,firestore:indexes
    
    # Deploy Storage rules
    print_step "Deploying Storage rules..."
    firebase deploy --only storage:rules
    
    # Deploy Functions (backend)
    print_step "Deploying Cloud Functions..."
    firebase deploy --only functions
    
    # Deploy Hosting (frontend)
    print_step "Deploying to Firebase Hosting..."
    firebase deploy --only hosting
    
    print_step "Firebase deployment completed"
}

# Verify deployment
verify_deployment() {
    print_step "Verifying deployment..."
    
    # Get hosting URL
    HOSTING_URL=$(firebase hosting:channel:list | grep -o 'https://[^ ]*' | head -1)
    
    if [ -n "$HOSTING_URL" ]; then
        print_step "Application deployed successfully!"
        echo "Frontend URL: $HOSTING_URL"
        echo "Functions URL: https://us-central1-$PROJECT_ID.cloudfunctions.net"
        
        # Basic health check
        if curl -s -f "$HOSTING_URL" > /dev/null; then
            print_step "Health check passed"
        else
            print_warning "Health check failed - please verify manually"
        fi
    else
        print_error "Could not determine hosting URL"
    fi
}

# Cleanup
cleanup() {
    print_step "Cleaning up..."
    # Remove any temporary files or caches if needed
    print_step "Cleanup completed"
}

# Main deployment function
main() {
    echo "🎯 Summer Vacation Planning App Deployment"
    echo "=========================================="
    
    check_requirements
    install_dependencies
    
    # Ask user if they want to run tests
    read -p "Do you want to run tests? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    else
        print_warning "Skipping tests"
    fi
    
    build_applications
    
    # Ask user to confirm deployment
    read -p "Ready to deploy to Firebase? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_firebase
        verify_deployment
    else
        print_warning "Deployment cancelled"
        exit 0
    fi
    
    cleanup
    
    print_step "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test the application thoroughly"
    echo "2. Update DNS settings if using custom domain"
    echo "3. Monitor application performance"
    echo "4. Set up monitoring and alerts"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT

# Run main function
main "$@"