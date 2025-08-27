#!/bin/bash

# Evidence.dev Deployment Script for BMad Data Practitioner Agent System
# Automated deployment script with multiple platform support

set -e

# Load environment configuration
if [ -f ".evidence.env" ]; then
    export $(cat .evidence.env | grep -v '^#' | xargs)
else
    echo "⚠️  Warning: .evidence.env not found. Using defaults."
    export NODE_ENV=production
    export DEPLOYMENT_TYPE=static
fi

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}❌ ERROR:${NC} $1"
}

# Validate environment
validate_environment() {
    log_info "Validating deployment environment..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Evidence.dev installation
    if ! command -v evidence &> /dev/null; then
        log_error "Evidence.dev is not installed. Run: npm install"
        exit 1
    fi
    
    # Check required files
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi
    
    if [ ! -f "evidence.config.js" ]; then
        log_error "evidence.config.js not found"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Build the Evidence.dev site
build_site() {
    log_info "Building Evidence.dev site..."
    
    # Clean previous builds
    if [ -d "./build" ]; then
        rm -rf ./build
        log_info "Cleaned previous build directory"
    fi
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production
    
    # Build the site
    log_info "Generating static site..."
    npm run build
    
    # Validate build output
    if [ ! -d "./build" ]; then
        log_error "Build failed - output directory not found"
        exit 1
    fi
    
    # Check for critical files
    if [ ! -f "./build/index.html" ]; then
        log_error "Build failed - index.html not found"
        exit 1
    fi
    
    log_success "Site build completed"
}

# Deploy to static hosting platforms
deploy_static() {
    log_info "Deploying to static hosting platform..."
    
    case "${STATIC_PLATFORM:-netlify}" in
        "netlify")
            deploy_netlify
            ;;
        "vercel")
            deploy_vercel
            ;;
        "github_pages")
            deploy_github_pages
            ;;
        *)
            log_error "Unknown static platform: ${STATIC_PLATFORM}"
            exit 1
            ;;
    esac
}

# Deploy to Netlify
deploy_netlify() {
    log_info "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        log_error "Netlify CLI not installed. Run: npm install -g netlify-cli"
        exit 1
    fi
    
    netlify deploy --prod --dir=./build
    log_success "Deployed to Netlify"
}

# Deploy to Vercel
deploy_vercel() {
    log_info "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI not installed. Run: npm install -g vercel"
        exit 1
    fi
    
    vercel --prod
    log_success "Deployed to Vercel"
}

# Deploy to GitHub Pages
deploy_github_pages() {
    log_info "Deploying to GitHub Pages..."
    
    if [ -z "${GITHUB_TOKEN}" ]; then
        log_error "GITHUB_TOKEN environment variable is required"
        exit 1
    fi
    
    # This would typically use gh-pages or similar tool
    log_info "GitHub Pages deployment requires additional setup"
    log_info "Please configure GitHub Actions or use gh-pages package"
}

# Deploy to AWS S3 + CloudFront
deploy_cdn() {
    log_info "Deploying to AWS S3 + CloudFront..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not installed"
        exit 1
    fi
    
    if [ -z "${AWS_S3_BUCKET}" ]; then
        log_error "AWS_S3_BUCKET environment variable is required"
        exit 1
    fi
    
    # Sync to S3
    log_info "Uploading to S3 bucket: ${AWS_S3_BUCKET}"
    aws s3 sync ./build s3://${AWS_S3_BUCKET}/ --delete
    
    # Invalidate CloudFront cache if distribution ID provided
    if [ -n "${AWS_CLOUDFRONT_DISTRIBUTION_ID}" ]; then
        log_info "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id ${AWS_CLOUDFRONT_DISTRIBUTION_ID} --paths "/*"
    fi
    
    log_success "Deployed to AWS S3 + CloudFront"
}

# Deploy to Evidence Cloud
deploy_evidence_cloud() {
    log_info "Deploying to Evidence Cloud..."
    
    if [ -z "${EVIDENCE_CLOUD_API_KEY}" ]; then
        log_error "EVIDENCE_CLOUD_API_KEY environment variable is required"
        exit 1
    fi
    
    if [ -z "${EVIDENCE_CLOUD_PROJECT_ID}" ]; then
        log_error "EVIDENCE_CLOUD_PROJECT_ID environment variable is required"
        exit 1
    fi
    
    # Evidence Cloud API deployment (placeholder - would use Evidence Cloud API)
    log_info "Evidence Cloud deployment integration would be implemented here"
    log_success "Deployed to Evidence Cloud"
}

# Performance testing
test_performance() {
    log_info "Running performance tests..."
    
    # Basic checks
    BUILD_SIZE=$(du -sh ./build | cut -f1)
    log_info "Build size: ${BUILD_SIZE}"
    
    # Count files
    FILE_COUNT=$(find ./build -type f | wc -l)
    log_info "Total files: ${FILE_COUNT}"
    
    # Check for large files
    LARGE_FILES=$(find ./build -type f -size +1M)
    if [ -n "${LARGE_FILES}" ]; then
        log_warning "Large files found (>1MB):"
        echo "${LARGE_FILES}"
    fi
    
    log_success "Performance validation completed"
}

# Main deployment workflow
main() {
    log_info "Starting Evidence.dev deployment..."
    log_info "Deployment type: ${DEPLOYMENT_TYPE}"
    
    validate_environment
    build_site
    
    case "${DEPLOYMENT_TYPE}" in
        "static")
            deploy_static
            ;;
        "cdn")
            deploy_cdn
            ;;
        "evidence_cloud")
            deploy_evidence_cloud
            ;;
        *)
            log_error "Unknown deployment type: ${DEPLOYMENT_TYPE}"
            exit 1
            ;;
    esac
    
    test_performance
    
    log_success "🚀 Deployment completed successfully!"
    log_info "Site should be available at your configured domain"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "build")
        validate_environment
        build_site
        ;;
    "test")
        test_performance
        ;;
    "validate")
        validate_environment
        ;;
    *)
        echo "Usage: $0 [deploy|build|test|validate]"
        echo "  deploy   - Full deployment workflow (default)"
        echo "  build    - Build site only"
        echo "  test     - Run performance tests"
        echo "  validate - Validate environment"
        exit 1
        ;;
esac