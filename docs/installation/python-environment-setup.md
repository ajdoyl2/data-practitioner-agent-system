# Python Environment Setup Mastery

Complete guide to setting up robust, production-ready Python environments for the Data Practitioner agent system.

## 🎯 Environment Strategy Overview

### Multi-Environment Architecture

**Development → Staging → Production Pipeline:**
- **Development**: Flexible, full-featured, debugging enabled
- **Staging**: Production-like with safety nets and monitoring
- **Production**: Optimized, secure, monitored, resilient

**Virtual Environment Isolation:**
- **Project-Specific**: Isolated dependencies per project
- **Version-Locked**: Exact version control for reproducibility
- **Cross-Platform**: Consistent behavior across operating systems

---

## 🔧 Advanced Virtual Environment Management

### Python Version Management with pyenv

#### Install and Configure pyenv

**macOS Installation:**
```bash
# Install pyenv via Homebrew
brew install pyenv

# Add to shell configuration
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zshrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(pyenv init -)"' >> ~/.zshrc

# Reload shell
source ~/.zshrc

# Verify installation
pyenv --version
```

**Linux Installation:**
```bash
# Install dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install -y make build-essential libssl-dev zlib1g-dev \
libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev libffi-dev liblzma-dev

# Install pyenv
curl https://pyenv.run | bash

# Add to shell configuration
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc

# Reload shell
source ~/.bashrc
```

**Windows Installation:**
```powershell
# Install pyenv-win via git
git clone https://github.com/pyenv-win/pyenv-win.git %USERPROFILE%\.pyenv

# Add to PATH (PowerShell)
[Environment]::SetEnvironmentVariable("PYENV", "$env:USERPROFILE\.pyenv\pyenv-win", "User")
[Environment]::SetEnvironmentVariable("PATH", "$env:PATH;$env:USERPROFILE\.pyenv\pyenv-win\bin;$env:USERPROFILE\.pyenv\pyenv-win\shims", "User")
```

#### Python Version Installation and Management

```bash
# List available Python versions
pyenv install --list | grep " 3\.(10|11|12)\."

# Install specific Python versions
pyenv install 3.10.12
pyenv install 3.11.7
pyenv install 3.12.1

# Set global Python version
pyenv global 3.11.7

# Set local Python version for project
cd /path/to/data-practitioner-agent-system
pyenv local 3.11.7

# Verify version
python --version
which python
```

### Advanced Virtual Environment Creation

#### Enhanced venv with Custom Configuration

```bash
# Create project-specific environment with custom configuration
cd /path/to/data-practitioner-agent-system

# Create enhanced virtual environment
python -m venv data-practitioner-env --prompt="DataPractitioner"

# Activate environment
source data-practitioner-env/bin/activate  # macOS/Linux
# data-practitioner-env\Scripts\activate  # Windows

# Upgrade core packages
pip install --upgrade pip setuptools wheel

# Create environment configuration
cat > data-practitioner-env/pyvenv.cfg << 'EOF'
home = /usr/local/bin
include-system-site-packages = false
version = 3.11.7
executable = /usr/local/bin/python3.11
command = /usr/local/bin/python -m venv /path/to/data-practitioner-env
pip_version = 23.3.1
setuptools_version = 69.0.2
wheel_version = 0.42.0
EOF

echo "✅ Enhanced virtual environment created"
```

#### Environment Validation and Health Check

```bash
# Create environment health checker
cat > data-practitioner-env/bin/health-check.py << 'EOF'
#!/usr/bin/env python3
"""
Python Environment Health Check
Validates environment setup and package compatibility
"""

import sys
import subprocess
import pkg_resources
import platform
from pathlib import Path

class EnvironmentHealthChecker:
    def __init__(self):
        self.issues = []
        self.warnings = []
        self.successes = []
    
    def check_python_version(self):
        """Verify Python version compatibility"""
        version = sys.version_info
        
        if version.major != 3:
            self.issues.append(f"Python {version.major}.{version.minor} not supported - need Python 3.x")
        elif version.minor < 10:
            self.issues.append(f"Python 3.{version.minor} too old - need Python 3.10+")
        elif version.minor > 12:
            self.warnings.append(f"Python 3.{version.minor} is very new - some packages may not be compatible")
        else:
            self.successes.append(f"Python {version.major}.{version.minor}.{version.micro} is compatible")
    
    def check_virtual_environment(self):
        """Verify virtual environment is active and properly configured"""
        if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
            self.successes.append("Virtual environment is active")
            
            # Check environment path
            venv_path = Path(sys.prefix)
            if venv_path.name == 'data-practitioner-env':
                self.successes.append("Correct virtual environment activated")
            else:
                self.warnings.append(f"Virtual environment name: {venv_path.name} (expected: data-practitioner-env)")
        else:
            self.issues.append("Virtual environment not active - run 'source data-practitioner-env/bin/activate'")
    
    def check_required_packages(self):
        """Check installation of required packages"""
        required_packages = {
            'duckdb': '>=0.9.0',
            'sqlmesh': '>=0.50.0',
            'dagster': '>=1.5.0',
            'pyairbyte': '>=0.18.0',
            'pandas': '>=2.0.0',
            'numpy': '>=1.24.0'
        }
        
        for package, version_req in required_packages.items():
            try:
                installed_version = pkg_resources.get_distribution(package).version
                self.successes.append(f"{package} {installed_version} installed")
            except pkg_resources.DistributionNotFound:
                self.issues.append(f"{package} not installed (required: {version_req})")
            except Exception as e:
                self.warnings.append(f"Error checking {package}: {e}")
    
    def check_package_conflicts(self):
        """Check for package version conflicts"""
        try:
            # Check for known conflicts
            conflicts = []
            
            # Check DuckDB + Pandas compatibility
            try:
                import duckdb
                import pandas as pd
                
                # Test basic integration
                conn = duckdb.connect(':memory:')
                test_df = pd.DataFrame({'a': [1, 2, 3], 'b': ['x', 'y', 'z']})
                conn.execute("CREATE TABLE test AS SELECT * FROM test_df")
                result = conn.execute("SELECT COUNT(*) FROM test").fetchone()
                
                if result[0] == 3:
                    self.successes.append("DuckDB + Pandas integration working")
                else:
                    self.warnings.append("DuckDB + Pandas integration issue detected")
                    
                conn.close()
                
            except ImportError as e:
                self.warnings.append(f"Package import error: {e}")
            except Exception as e:
                self.warnings.append(f"Package compatibility test failed: {e}")
                
        except Exception as e:
            self.warnings.append(f"Conflict check failed: {e}")
    
    def check_system_dependencies(self):
        """Check system-level dependencies"""
        # Check available memory
        try:
            import psutil
            memory = psutil.virtual_memory()
            
            if memory.total < 4 * 1024**3:  # 4GB
                self.warnings.append(f"Low system memory: {memory.total / 1024**3:.1f}GB (recommended: 8GB+)")
            else:
                self.successes.append(f"System memory: {memory.total / 1024**3:.1f}GB")
                
        except ImportError:
            self.warnings.append("psutil not available - cannot check system resources")
        except Exception as e:
            self.warnings.append(f"System resource check failed: {e}")
    
    def check_pip_configuration(self):
        """Check pip configuration and connectivity"""
        try:
            # Test pip connectivity
            result = subprocess.run([sys.executable, '-m', 'pip', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                pip_version = result.stdout.strip()
                self.successes.append(f"pip is working: {pip_version}")
            else:
                self.issues.append(f"pip error: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            self.warnings.append("pip command timed out - possible network issues")
        except Exception as e:
            self.warnings.append(f"pip check failed: {e}")
    
    def run_full_check(self):
        """Run all health checks"""
        print("🔍 Running Python Environment Health Check...")
        print("=" * 50)
        
        self.check_python_version()
        self.check_virtual_environment()
        self.check_required_packages()
        self.check_package_conflicts()
        self.check_system_dependencies()
        self.check_pip_configuration()
        
        # Print results
        if self.successes:
            print("\n✅ Successes:")
            for success in self.successes:
                print(f"  ✅ {success}")
        
        if self.warnings:
            print("\n⚠️ Warnings:")
            for warning in self.warnings:
                print(f"  ⚠️ {warning}")
        
        if self.issues:
            print("\n❌ Issues:")
            for issue in self.issues:
                print(f"  ❌ {issue}")
        
        # Overall status
        print("\n" + "=" * 50)
        if self.issues:
            print("🚨 Environment has CRITICAL issues that need resolution")
            return False
        elif self.warnings:
            print("⚠️ Environment is functional but has warnings")
            return True
        else:
            print("✅ Environment is healthy and ready for use")
            return True

if __name__ == "__main__":
    checker = EnvironmentHealthChecker()
    is_healthy = checker.run_full_check()
    
    print(f"\n🎯 Environment Health Score: {'PASS' if is_healthy else 'FAIL'}")
    
    if not is_healthy:
        print("\n🔧 Recommended actions:")
        print("  1. Review and resolve critical issues above")
        print("  2. Reinstall problematic packages")
        print("  3. Consider recreating virtual environment")
        print("  4. Run health check again after fixes")
    
    sys.exit(0 if is_healthy else 1)
EOF

chmod +x data-practitioner-env/bin/health-check.py

echo "✅ Environment health checker created"
```

---

## 📦 Dependency Management Strategies

### Requirements Management with Multiple Files

#### Layered Requirements Structure

```bash
# Create requirements directory structure
mkdir -p requirements

# Base requirements - core dependencies
cat > requirements/base.txt << 'EOF'
# Core Python packages for data processing
pandas>=2.1.0,<3.0.0
numpy>=1.24.0,<2.0.0
pyarrow>=13.0.0,<15.0.0

# Database and analytics
duckdb>=0.9.0,<1.0.0
sqlalchemy>=2.0.0,<3.0.0

# Utilities
pyyaml>=6.0.0,<7.0.0
python-dotenv>=1.0.0,<2.0.0
click>=8.1.0,<9.0.0
EOF

# Data tools requirements
cat > requirements/data-tools.txt << 'EOF'
-r base.txt

# Transformation engines
dbt-core>=1.6.0,<2.0.0
dbt-duckdb>=1.6.0,<2.0.0
sqlmesh>=0.50.0,<1.0.0

# Orchestration
dagster>=1.5.0,<2.0.0
dagster-webserver>=1.5.0,<2.0.0

# Data ingestion
pyairbyte>=0.18.0,<1.0.0

# Additional analytics
great-expectations>=0.17.0,<1.0.0
EOF

# Development requirements
cat > requirements/dev.txt << 'EOF'
-r data-tools.txt

# Testing
pytest>=7.4.0,<8.0.0
pytest-cov>=4.1.0,<5.0.0
pytest-mock>=3.11.0,<4.0.0

# Code quality
black>=23.7.0,<24.0.0
isort>=5.12.0,<6.0.0
flake8>=6.0.0,<7.0.0
mypy>=1.5.0,<2.0.0

# Documentation
sphinx>=7.1.0,<8.0.0
sphinx-rtd-theme>=1.3.0,<2.0.0

# Debugging and profiling
ipython>=8.14.0,<9.0.0
line-profiler>=4.1.0,<5.0.0
memory-profiler>=0.61.0,<1.0.0
EOF

# Production requirements - minimal, security-focused
cat > requirements/prod.txt << 'EOF'
-r base.txt

# Production-specific versions (pinned exactly)
duckdb==0.9.2
sqlmesh==0.57.0
dagster==1.5.8
dagster-webserver==1.5.8
pyairbyte==0.20.0

# Security and monitoring
psutil==5.9.6
cryptography>=41.0.0,<42.0.0
EOF

echo "✅ Layered requirements structure created"
```

#### Advanced Dependency Resolution

```bash
# Create dependency resolution utility
cat > bmad-method/utils/dependency-resolver.py << 'EOF'
#!/usr/bin/env python3
"""
Advanced Dependency Resolution Utility
Analyzes and resolves package dependencies with conflict detection
"""

import subprocess
import sys
import json
import pkg_resources
from typing import Dict, List, Tuple, Set
import re

class DependencyResolver:
    def __init__(self):
        self.installed_packages = {}
        self.dependency_tree = {}
        self.conflicts = []
        self.recommendations = []
    
    def analyze_installed_packages(self):
        """Analyze currently installed packages"""
        try:
            for dist in pkg_resources.working_set:
                self.installed_packages[dist.project_name.lower()] = {
                    'version': dist.version,
                    'location': dist.location,
                    'requires': [req.project_name.lower() for req in dist.requires()],
                    'required_by': []
                }
        except Exception as e:
            print(f"Error analyzing packages: {e}")
    
    def build_dependency_tree(self):
        """Build dependency tree with required_by relationships"""
        # First pass: collect all requires relationships
        for package, info in self.installed_packages.items():
            for required_package in info['requires']:
                if required_package in self.installed_packages:
                    self.installed_packages[required_package]['required_by'].append(package)
    
    def check_version_conflicts(self):
        """Check for version conflicts in dependencies"""
        try:
            # Run pip check to detect conflicts
            result = subprocess.run([sys.executable, '-m', 'pip', 'check'], 
                                  capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                # Parse pip check output for conflicts
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'has requirement' in line:
                        self.conflicts.append(line.strip())
            
            return len(self.conflicts) == 0
            
        except Exception as e:
            print(f"Error checking conflicts: {e}")
            return False
    
    def analyze_requirements_file(self, requirements_path: str) -> Dict:
        """Analyze requirements file for potential issues"""
        analysis = {
            'total_packages': 0,
            'pinned_versions': 0,
            'range_versions': 0,
            'unpinned_versions': 0,
            'potential_conflicts': [],
            'recommendations': []
        }
        
        try:
            with open(requirements_path, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    
                    # Skip comments and empty lines
                    if not line or line.startswith('#') or line.startswith('-r'):
                        continue
                    
                    analysis['total_packages'] += 1
                    
                    # Analyze version specification
                    if '==' in line:
                        analysis['pinned_versions'] += 1
                    elif any(op in line for op in ['>=', '<=', '>', '<', '~=']):
                        analysis['range_versions'] += 1
                    else:
                        analysis['unpinned_versions'] += 1
                        analysis['recommendations'].append(
                            f"Line {line_num}: Consider pinning version for {line}"
                        )
            
            # Generate overall recommendations
            if analysis['unpinned_versions'] > 0:
                analysis['recommendations'].append(
                    f"Consider pinning {analysis['unpinned_versions']} unpinned packages for reproducibility"
                )
            
            if analysis['pinned_versions'] / analysis['total_packages'] > 0.8:
                analysis['recommendations'].append(
                    "Many packages are pinned - consider using ranges for flexibility"
                )
            
        except FileNotFoundError:
            analysis['error'] = f"Requirements file not found: {requirements_path}"
        except Exception as e:
            analysis['error'] = f"Error analyzing requirements: {e}"
        
        return analysis
    
    def generate_lockfile(self, requirements_path: str, output_path: str):
        """Generate a lockfile with exact versions"""
        try:
            # Install packages and generate lockfile
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'freeze', '--requirement', requirements_path
            ], capture_output=True, text=True, timeout=60)
            
            if result.returncode == 0:
                with open(output_path, 'w') as f:
                    f.write("# Generated lockfile - exact versions for reproducibility\n")
                    f.write(f"# Generated from: {requirements_path}\n\n")
                    f.write(result.stdout)
                
                print(f"✅ Lockfile generated: {output_path}")
                return True
            else:
                print(f"❌ Failed to generate lockfile: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error generating lockfile: {e}")
            return False
    
    def optimize_requirements(self, requirements_path: str):
        """Provide optimization recommendations for requirements file"""
        analysis = self.analyze_requirements_file(requirements_path)
        
        print(f"\n📊 Requirements Analysis: {requirements_path}")
        print("=" * 50)
        
        if 'error' in analysis:
            print(f"❌ {analysis['error']}")
            return
        
        print(f"📦 Total packages: {analysis['total_packages']}")
        print(f"📌 Pinned versions: {analysis['pinned_versions']}")
        print(f"📏 Range versions: {analysis['range_versions']}")
        print(f"🔓 Unpinned versions: {analysis['unpinned_versions']}")
        
        if analysis['recommendations']:
            print("\n💡 Recommendations:")
            for rec in analysis['recommendations']:
                print(f"  • {rec}")
        
        return analysis
    
    def create_environment_report(self):
        """Create comprehensive environment report"""
        self.analyze_installed_packages()
        self.build_dependency_tree()
        has_conflicts = not self.check_version_conflicts()
        
        report = {
            'python_version': sys.version,
            'platform': sys.platform,
            'total_packages': len(self.installed_packages),
            'has_conflicts': has_conflicts,
            'conflicts': self.conflicts,
            'top_level_packages': [],
            'leaf_packages': []
        }
        
        # Identify top-level packages (not required by others)
        for package, info in self.installed_packages.items():
            if not info['required_by']:
                report['top_level_packages'].append(package)
            
            if not info['requires']:
                report['leaf_packages'].append(package)
        
        return report

if __name__ == "__main__":
    resolver = DependencyResolver()
    
    # Analyze current environment
    print("🔍 Analyzing Python environment dependencies...")
    report = resolver.create_environment_report()
    
    print(f"\n📊 Environment Report:")
    print(f"  Python: {report['python_version'].split()[0]}")
    print(f"  Platform: {report['platform']}")
    print(f"  Total packages: {report['total_packages']}")
    print(f"  Top-level packages: {len(report['top_level_packages'])}")
    print(f"  Leaf packages: {len(report['leaf_packages'])}")
    
    if report['has_conflicts']:
        print(f"\n❌ Dependency conflicts detected:")
        for conflict in report['conflicts']:
            print(f"  • {conflict}")
    else:
        print(f"\n✅ No dependency conflicts detected")
    
    # Analyze requirements files if they exist
    req_files = [
        'requirements/base.txt',
        'requirements/data-tools.txt',
        'requirements/dev.txt',
        'requirements/prod.txt'
    ]
    
    for req_file in req_files:
        try:
            analysis = resolver.optimize_requirements(req_file)
        except:
            pass  # Skip missing files
EOF

chmod +x bmad-method/utils/dependency-resolver.py

echo "✅ Dependency resolution utility created"
```

### Package Installation with Safety Checks

#### Secure Installation Process

```bash
# Create secure installation script
cat > scripts/install-python-deps.sh << 'EOF'
#!/bin/bash

set -e  # Exit on any error

echo "🔒 Secure Python Dependency Installation"
echo "======================================"

# Function to check if virtual environment is active
check_venv() {
    if [[ "$VIRTUAL_ENV" == "" ]]; then
        echo "❌ Virtual environment not activated"
        echo "Please run: source data-practitioner-env/bin/activate"
        exit 1
    fi
    echo "✅ Virtual environment active: $VIRTUAL_ENV"
}

# Function to backup current environment
backup_environment() {
    echo "📦 Creating environment backup..."
    pip freeze > "backup-requirements-$(date +%Y%m%d-%H%M%S).txt"
    echo "✅ Backup created"
}

# Function to verify package signatures (if available)
verify_packages() {
    echo "🔍 Verifying package authenticity..."
    
    # Check if pip-audit is available for security scanning
    if command -v pip-audit &> /dev/null; then
        echo "Running security audit..."
        pip-audit --desc --format=json --output=security-audit.json || true
    else
        echo "⚠️ pip-audit not available - consider installing for security scanning"
    fi
}

# Function to install with safety checks
safe_install() {
    local requirements_file=$1
    local environment_type=$2
    
    echo "📥 Installing $environment_type dependencies from $requirements_file"
    
    # Verify requirements file exists
    if [[ ! -f "$requirements_file" ]]; then
        echo "❌ Requirements file not found: $requirements_file"
        exit 1
    fi
    
    # Install with specific options for security and reliability
    pip install \
        --requirement "$requirements_file" \
        --no-deps \
        --force-reinstall \
        --upgrade \
        --only-binary=all \
        --no-cache-dir \
        --timeout 300 \
        --retries 3
    
    # Verify installation
    echo "🔍 Verifying installation..."
    pip check
    
    if [[ $? -eq 0 ]]; then
        echo "✅ $environment_type dependencies installed successfully"
    else
        echo "❌ Dependency conflicts detected after installation"
        exit 1
    fi
}

# Function to setup development tools
setup_dev_tools() {
    echo "🛠️ Setting up development tools..."
    
    # Install pre-commit hooks
    if command -v pre-commit &> /dev/null; then
        pre-commit install
        echo "✅ Pre-commit hooks installed"
    fi
    
    # Setup Jupyter kernel
    if command -v jupyter &> /dev/null; then
        python -m ipykernel install --user --name data-practitioner --display-name "Data Practitioner"
        echo "✅ Jupyter kernel registered"
    fi
}

# Main installation process
main() {
    local environment_type=${1:-"development"}
    
    check_venv
    backup_environment
    
    case $environment_type in
        "base")
            safe_install "requirements/base.txt" "base"
            ;;
        "development" | "dev")
            safe_install "requirements/dev.txt" "development"
            setup_dev_tools
            ;;
        "production" | "prod")
            safe_install "requirements/prod.txt" "production"
            verify_packages
            ;;
        "data-tools")
            safe_install "requirements/data-tools.txt" "data tools"
            ;;
        *)
            echo "❌ Unknown environment type: $environment_type"
            echo "Valid options: base, development, production, data-tools"
            exit 1
            ;;
    esac
    
    # Final health check
    echo "🏥 Running environment health check..."
    python data-practitioner-env/bin/health-check.py
    
    echo "🎉 Installation complete for $environment_type environment!"
}

# Run main function with arguments
main "$@"
EOF

chmod +x scripts/install-python-deps.sh

echo "✅ Secure installation script created"
```

---

## 🔧 Cross-Platform Environment Configuration

### Platform-Specific Optimizations

#### macOS Optimizations

```bash
# Create macOS-specific configuration
cat > config/environments/macos.yaml << 'EOF'
platform: "darwin"
architecture: "universal"

python:
  executable: "python3"
  venv_command: "python3 -m venv"
  preferred_versions: ["3.11.7", "3.10.12"]
  
system_dependencies:
  homebrew_packages:
    - "python@3.11"
    - "postgresql"  # For advanced analytics
    - "sqlite"      # For lightweight databases
    - "openssl"     # For secure connections
  
environment_variables:
  PYTHONPATH: "$(pwd)"
  OBJC_DISABLE_INITIALIZE_FORK_SAFETY: "YES"  # Fix for multiprocessing
  
memory_limits:
  default: "4GB"
  recommended: "8GB"
  
performance:
  parallel_jobs: 8  # Utilize Apple Silicon efficiency
  enable_metal: true  # For ML workloads
  
security:
  keychain_integration: true
  code_signing_required: false
EOF

echo "✅ macOS configuration created"
```

#### Linux Optimizations

```bash
# Create Linux-specific configuration
cat > config/environments/linux.yaml << 'EOF'
platform: "linux"
architecture: "x86_64"

python:
  executable: "python3"
  venv_command: "python3 -m venv"
  preferred_versions: ["3.11.7", "3.10.12"]
  
system_dependencies:
  apt_packages:  # Ubuntu/Debian
    - "python3-dev"
    - "python3-venv"
    - "build-essential"
    - "libssl-dev"
    - "libffi-dev"
    - "libsqlite3-dev"
  
  yum_packages:  # CentOS/RHEL
    - "python3-devel"
    - "gcc"
    - "gcc-c++"
    - "openssl-devel"
    - "libffi-devel"
    - "sqlite-devel"
  
environment_variables:
  PYTHONPATH: "$(pwd)"
  LD_LIBRARY_PATH: "/usr/local/lib:$LD_LIBRARY_PATH"
  
memory_limits:
  default: "2GB"
  recommended: "4GB"
  
performance:
  parallel_jobs: 4
  enable_numa: true
  
security:
  selinux_compatible: true
  apparmor_compatible: true
EOF

echo "✅ Linux configuration created"
```

#### Windows Optimizations

```bash
# Create Windows-specific configuration
cat > config/environments/windows.yaml << 'EOF'
platform: "win32"
architecture: "amd64"

python:
  executable: "python.exe"
  venv_command: "python -m venv"
  preferred_versions: ["3.11.7", "3.10.12"]
  
system_dependencies:
  chocolatey_packages:
    - "python"
    - "git"
    - "visualstudio2019buildtools"
  
  winget_packages:
    - "Python.Python.3.11"
    - "Git.Git"
    - "Microsoft.VisualStudio.2019.BuildTools"
  
environment_variables:
  PYTHONPATH: "%CD%"
  PYTHONIOENCODING: "utf-8"
  
memory_limits:
  default: "2GB"
  recommended: "4GB"
  
performance:
  parallel_jobs: 2
  long_path_support: true
  
security:
  execution_policy: "RemoteSigned"
  defender_exclusions:
    - "data-practitioner-env"
    - "*.pyc"
EOF

echo "✅ Windows configuration created"
```

### Universal Environment Setup Script

```bash
# Create universal setup script
cat > scripts/setup-environment.py << 'EOF'
#!/usr/bin/env python3
"""
Universal Python Environment Setup Script
Works across macOS, Linux, and Windows platforms
"""

import os
import sys
import platform
import subprocess
import shutil
import yaml
from pathlib import Path
import json

class UniversalEnvironmentSetup:
    def __init__(self):
        self.platform = platform.system().lower()
        self.architecture = platform.machine()
        self.python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
        self.project_root = Path(__file__).parent.parent
        self.config = self.load_platform_config()
    
    def load_platform_config(self):
        """Load platform-specific configuration"""
        config_file = self.project_root / f"config/environments/{self.platform}.yaml"
        
        try:
            with open(config_file, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"⚠️ Platform config not found: {config_file}")
            return self.get_default_config()
        except Exception as e:
            print(f"❌ Error loading config: {e}")
            return self.get_default_config()
    
    def get_default_config(self):
        """Get default configuration for unknown platforms"""
        return {
            'platform': self.platform,
            'python': {
                'executable': 'python3' if self.platform != 'windows' else 'python.exe',
                'venv_command': 'python3 -m venv' if self.platform != 'windows' else 'python -m venv'
            },
            'memory_limits': {'default': '2GB', 'recommended': '4GB'},
            'performance': {'parallel_jobs': 2}
        }
    
    def check_system_requirements(self):
        """Check system requirements and dependencies"""
        print(f"🔍 Checking system requirements for {self.platform}...")
        
        issues = []
        
        # Check Python version
        min_version = (3, 10, 0)
        current_version = (sys.version_info.major, sys.version_info.minor, sys.version_info.micro)
        
        if current_version < min_version:
            issues.append(f"Python {self.python_version} is too old (minimum: 3.10.0)")
        else:
            print(f"✅ Python {self.python_version} is compatible")
        
        # Check available memory
        try:
            import psutil
            memory_gb = psutil.virtual_memory().total / (1024**3)
            recommended_gb = float(self.config['memory_limits']['recommended'].rstrip('GB'))
            
            if memory_gb < recommended_gb:
                issues.append(f"Low system memory: {memory_gb:.1f}GB (recommended: {recommended_gb}GB)")
            else:
                print(f"✅ System memory: {memory_gb:.1f}GB")
        except ImportError:
            print("⚠️ Cannot check system memory - psutil not available")
        
        # Check disk space
        try:
            disk_usage = shutil.disk_usage(self.project_root)
            free_gb = disk_usage.free / (1024**3)
            
            if free_gb < 5:  # 5GB minimum
                issues.append(f"Low disk space: {free_gb:.1f}GB free (minimum: 5GB)")
            else:
                print(f"✅ Disk space: {free_gb:.1f}GB free")
        except Exception as e:
            print(f"⚠️ Cannot check disk space: {e}")
        
        return issues
    
    def install_system_dependencies(self):
        """Install platform-specific system dependencies"""
        print(f"📦 Installing system dependencies for {self.platform}...")
        
        try:
            if self.platform == 'darwin':  # macOS
                packages = self.config.get('system_dependencies', {}).get('homebrew_packages', [])
                if packages and shutil.which('brew'):
                    subprocess.run(['brew', 'install'] + packages, check=True)
                    print("✅ Homebrew packages installed")
                else:
                    print("⚠️ Homebrew not available or no packages to install")
            
            elif self.platform == 'linux':
                # Try apt first (Ubuntu/Debian)
                packages = self.config.get('system_dependencies', {}).get('apt_packages', [])
                if packages and shutil.which('apt-get'):
                    subprocess.run(['sudo', 'apt-get', 'update'], check=True)
                    subprocess.run(['sudo', 'apt-get', 'install', '-y'] + packages, check=True)
                    print("✅ APT packages installed")
                
                # Try yum (CentOS/RHEL)
                elif packages and shutil.which('yum'):
                    yum_packages = self.config.get('system_dependencies', {}).get('yum_packages', [])
                    subprocess.run(['sudo', 'yum', 'install', '-y'] + yum_packages, check=True)
                    print("✅ YUM packages installed")
                
                else:
                    print("⚠️ No supported package manager found")
            
            elif self.platform == 'windows':
                print("⚠️ Automatic system dependency installation not implemented for Windows")
                print("Please install required packages manually or use chocolatey/winget")
            
        except subprocess.CalledProcessError as e:
            print(f"❌ System dependency installation failed: {e}")
        except Exception as e:
            print(f"⚠️ Error installing system dependencies: {e}")
    
    def create_virtual_environment(self):
        """Create and configure virtual environment"""
        venv_path = self.project_root / "data-practitioner-env"
        
        if venv_path.exists():
            print("🔄 Virtual environment already exists, recreating...")
            shutil.rmtree(venv_path)
        
        print("🏗️ Creating virtual environment...")
        
        try:
            # Create virtual environment
            venv_cmd = self.config['python']['venv_command'].split()
            subprocess.run(venv_cmd + [str(venv_path)], check=True)
            
            # Determine activation script path
            if self.platform == 'windows':
                activate_script = venv_path / "Scripts" / "activate.bat"
                python_exe = venv_path / "Scripts" / "python.exe"
            else:
                activate_script = venv_path / "bin" / "activate"
                python_exe = venv_path / "bin" / "python"
            
            # Upgrade pip in virtual environment
            subprocess.run([str(python_exe), '-m', 'pip', 'install', '--upgrade', 'pip'], check=True)
            
            print(f"✅ Virtual environment created at: {venv_path}")
            print(f"📝 To activate: source {activate_script}")
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Virtual environment creation failed: {e}")
            return False
        except Exception as e:
            print(f"❌ Error creating virtual environment: {e}")
            return False
    
    def configure_environment_variables(self):
        """Set up environment variables"""
        print("⚙️ Configuring environment variables...")
        
        env_vars = self.config.get('environment_variables', {})
        
        # Create environment variable script
        if self.platform == 'windows':
            env_script = self.project_root / "scripts" / "set-env.bat"
            with open(env_script, 'w') as f:
                f.write("@echo off\n")
                for key, value in env_vars.items():
                    f.write(f'set {key}={value}\n')
        else:
            env_script = self.project_root / "scripts" / "set-env.sh"
            with open(env_script, 'w') as f:
                f.write("#!/bin/bash\n")
                for key, value in env_vars.items():
                    f.write(f'export {key}="{value}"\n')
            
            # Make script executable
            os.chmod(env_script, 0o755)
        
        print(f"✅ Environment script created: {env_script}")
    
    def generate_setup_report(self, issues):
        """Generate setup completion report"""
        report = {
            'platform': self.platform,
            'architecture': self.architecture,
            'python_version': self.python_version,
            'timestamp': str(os.times()),
            'issues': issues,
            'config_used': self.config,
            'next_steps': []
        }
        
        # Add next steps based on results
        if not issues:
            report['next_steps'] = [
                "1. Activate virtual environment",
                "2. Install Python dependencies",
                "3. Run environment health check",
                "4. Test data practitioner agents"
            ]
        else:
            report['next_steps'] = [
                "1. Resolve system requirement issues",
                "2. Re-run environment setup",
                "3. Contact support if issues persist"
            ]
        
        # Save report
        report_file = self.project_root / "environment-setup-report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 Setup report saved: {report_file}")
        return report
    
    def run_full_setup(self):
        """Run complete environment setup process"""
        print("🚀 Starting Universal Python Environment Setup")
        print("=" * 50)
        
        # Check system requirements
        issues = self.check_system_requirements()
        
        if issues:
            print("\n❌ System requirement issues detected:")
            for issue in issues:
                print(f"  • {issue}")
            
            proceed = input("\nProceed with setup despite issues? (y/N): ")
            if proceed.lower() != 'y':
                print("Setup cancelled by user")
                return False
        
        # Install system dependencies
        self.install_system_dependencies()
        
        # Create virtual environment
        if not self.create_virtual_environment():
            print("❌ Setup failed during virtual environment creation")
            return False
        
        # Configure environment variables
        self.configure_environment_variables()
        
        # Generate report
        report = self.generate_setup_report(issues)
        
        print("\n🎉 Environment setup complete!")
        print("\n📋 Next steps:")
        for step in report['next_steps']:
            print(f"  {step}")
        
        return True

if __name__ == "__main__":
    setup = UniversalEnvironmentSetup()
    success = setup.run_full_setup()
    
    sys.exit(0 if success else 1)
EOF

chmod +x scripts/setup-environment.py

echo "✅ Universal environment setup script created"
```

---

## 🔍 Environment Monitoring and Maintenance

### Automated Health Monitoring

```bash
# Create environment monitor
cat > bmad-method/utils/environment-monitor.py << 'EOF'
#!/usr/bin/env python3
"""
Environment Health Monitor
Continuous monitoring of Python environment health and performance
"""

import time
import json
import threading
import subprocess
import sys
import psutil
import pkg_resources
from pathlib import Path
from datetime import datetime, timedelta

class EnvironmentMonitor:
    def __init__(self, monitoring_interval=300):  # 5 minutes
        self.monitoring_interval = monitoring_interval
        self.is_monitoring = False
        self.metrics_history = []
        self.alerts = []
        self.thresholds = {
            'memory_percent': 85.0,
            'disk_percent': 90.0,
            'package_age_days': 365,
            'vulnerability_score': 7.0
        }
    
    def start_monitoring(self):
        """Start continuous environment monitoring"""
        if self.is_monitoring:
            print("⚠️ Monitoring already active")
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        print("🚀 Environment monitoring started")
    
    def stop_monitoring(self):
        """Stop environment monitoring"""
        self.is_monitoring = False
        if hasattr(self, 'monitor_thread'):
            self.monitor_thread.join(timeout=1)
        print("🛑 Environment monitoring stopped")
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                metrics = self.collect_environment_metrics()
                self.metrics_history.append(metrics)
                self.check_environment_health(metrics)
                
                # Keep only last 100 records
                if len(self.metrics_history) > 100:
                    self.metrics_history = self.metrics_history[-100:]
                
                time.sleep(self.monitoring_interval)
                
            except Exception as e:
                print(f"⚠️ Monitoring error: {e}")
                time.sleep(self.monitoring_interval)
    
    def collect_environment_metrics(self):
        """Collect comprehensive environment metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'system': self._collect_system_metrics(),
            'python': self._collect_python_metrics(),
            'packages': self._collect_package_metrics(),
            'dependencies': self._collect_dependency_metrics()
        }
        
        return metrics
    
    def _collect_system_metrics(self):
        """Collect system-level metrics"""
        try:
            return {
                'memory': {
                    'percent': psutil.virtual_memory().percent,
                    'available_gb': psutil.virtual_memory().available / (1024**3),
                    'total_gb': psutil.virtual_memory().total / (1024**3)
                },
                'disk': {
                    'percent': psutil.disk_usage('/').percent,
                    'free_gb': psutil.disk_usage('/').free / (1024**3),
                    'total_gb': psutil.disk_usage('/').total / (1024**3)
                },
                'cpu': {
                    'percent': psutil.cpu_percent(interval=1),
                    'count': psutil.cpu_count()
                },
                'processes': {
                    'python_count': len([p for p in psutil.process_iter(['name']) 
                                       if 'python' in p.info['name'].lower()])
                }
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _collect_python_metrics(self):
        """Collect Python environment metrics"""
        try:
            venv_path = os.environ.get('VIRTUAL_ENV', '')
            
            return {
                'version': sys.version,
                'executable': sys.executable,
                'virtual_env': {
                    'active': bool(venv_path),
                    'path': venv_path
                },
                'path': sys.path[:3],  # First 3 entries
                'platform': sys.platform
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _collect_package_metrics(self):
        """Collect package installation metrics"""
        try:
            packages = {}
            total_packages = 0
            outdated_packages = 0
            
            for dist in pkg_resources.working_set:
                packages[dist.project_name] = {
                    'version': dist.version,
                    'location': dist.location
                }
                total_packages += 1
            
            # Check for outdated packages (simplified)
            try:
                result = subprocess.run([
                    sys.executable, '-m', 'pip', 'list', '--outdated', '--format=json'
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    outdated = json.loads(result.stdout)
                    outdated_packages = len(outdated)
            except:
                pass  # Ignore errors in outdated check
            
            return {
                'total_packages': total_packages,
                'outdated_packages': outdated_packages,
                'key_packages': {
                    name: info for name, info in packages.items() 
                    if name.lower() in ['duckdb', 'sqlmesh', 'dagster', 'pyairbyte', 'pandas']
                }
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _collect_dependency_metrics(self):
        """Collect dependency health metrics"""
        try:
            # Check for dependency conflicts
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'check'
            ], capture_output=True, text=True, timeout=30)
            
            has_conflicts = result.returncode != 0
            conflicts = result.stdout.split('\n') if has_conflicts else []
            
            return {
                'has_conflicts': has_conflicts,
                'conflict_count': len([c for c in conflicts if c.strip()]),
                'conflicts': conflicts[:5]  # First 5 conflicts
            }
        except Exception as e:
            return {'error': str(e)}
    
    def check_environment_health(self, metrics):
        """Check environment health against thresholds"""
        alerts = []
        
        # Check system metrics
        if 'system' in metrics and 'error' not in metrics['system']:
            system = metrics['system']
            
            if system['memory']['percent'] > self.thresholds['memory_percent']:
                alerts.append({
                    'type': 'HIGH_MEMORY',
                    'severity': 'WARNING',
                    'message': f"High memory usage: {system['memory']['percent']:.1f}%",
                    'timestamp': metrics['timestamp']
                })
            
            if system['disk']['percent'] > self.thresholds['disk_percent']:
                alerts.append({
                    'type': 'LOW_DISK',
                    'severity': 'CRITICAL',
                    'message': f"Low disk space: {system['disk']['percent']:.1f}% used",
                    'timestamp': metrics['timestamp']
                })
        
        # Check package health
        if 'packages' in metrics and 'error' not in metrics['packages']:
            packages = metrics['packages']
            
            if packages['outdated_packages'] > 10:
                alerts.append({
                    'type': 'OUTDATED_PACKAGES',
                    'severity': 'INFO',
                    'message': f"{packages['outdated_packages']} packages are outdated",
                    'timestamp': metrics['timestamp']
                })
        
        # Check dependency conflicts
        if 'dependencies' in metrics and 'error' not in metrics['dependencies']:
            deps = metrics['dependencies']
            
            if deps['has_conflicts']:
                alerts.append({
                    'type': 'DEPENDENCY_CONFLICTS',
                    'severity': 'CRITICAL',
                    'message': f"{deps['conflict_count']} dependency conflicts detected",
                    'timestamp': metrics['timestamp']
                })
        
        # Store alerts
        self.alerts.extend(alerts)
        
        # Log critical alerts immediately
        for alert in alerts:
            if alert['severity'] == 'CRITICAL':
                print(f"🚨 CRITICAL ALERT: {alert['message']}")
    
    def get_health_summary(self):
        """Get current environment health summary"""
        if not self.metrics_history:
            return {'status': 'UNKNOWN', 'message': 'No metrics collected yet'}
        
        latest = self.metrics_history[-1]
        recent_alerts = [a for a in self.alerts 
                        if datetime.fromisoformat(a['timestamp']) > 
                           datetime.now() - timedelta(hours=1)]
        
        # Determine overall health status
        critical_alerts = [a for a in recent_alerts if a['severity'] == 'CRITICAL']
        warning_alerts = [a for a in recent_alerts if a['severity'] == 'WARNING']
        
        if critical_alerts:
            status = 'CRITICAL'
        elif warning_alerts:
            status = 'WARNING'
        else:
            status = 'HEALTHY'
        
        return {
            'status': status,
            'timestamp': latest['timestamp'],
            'recent_alerts': len(recent_alerts),
            'critical_alerts': len(critical_alerts),
            'metrics': latest,
            'recommendations': self._generate_recommendations(latest, recent_alerts)
        }
    
    def _generate_recommendations(self, metrics, alerts):
        """Generate health improvement recommendations"""
        recommendations = []
        
        # Memory recommendations
        if 'system' in metrics and 'memory' in metrics['system']:
            memory_percent = metrics['system']['memory']['percent']
            if memory_percent > 80:
                recommendations.append("High memory usage - consider closing unused applications")
        
        # Package recommendations
        if 'packages' in metrics:
            outdated = metrics['packages'].get('outdated_packages', 0)
            if outdated > 5:
                recommendations.append(f"Update {outdated} outdated packages for security and performance")
        
        # Dependency recommendations
        if 'dependencies' in metrics and metrics['dependencies'].get('has_conflicts'):
            recommendations.append("Resolve dependency conflicts to prevent runtime errors")
        
        return recommendations
    
    def generate_detailed_report(self):
        """Generate detailed environment report"""
        if not self.metrics_history:
            return "No monitoring data available"
        
        summary = self.get_health_summary()
        latest = self.metrics_history[-1]
        
        report = f"""
🏥 Environment Health Report
==========================

📊 Overall Status: {summary['status']}
🕒 Last Updated: {summary['timestamp']}
⚠️ Recent Alerts: {summary['recent_alerts']}

💻 System Health:
  Memory: {latest['system']['memory']['percent']:.1f}% used ({latest['system']['memory']['available_gb']:.1f}GB available)
  Disk: {latest['system']['disk']['percent']:.1f}% used ({latest['system']['disk']['free_gb']:.1f}GB free)
  CPU: {latest['system']['cpu']['percent']:.1f}% utilization
  Python Processes: {latest['system']['processes']['python_count']}

🐍 Python Environment:
  Version: {latest['python']['version'].split()[0]}
  Virtual Env: {'Active' if latest['python']['virtual_env']['active'] else 'Inactive'}
  
📦 Package Health:
  Total Packages: {latest['packages']['total_packages']}
  Outdated: {latest['packages']['outdated_packages']}
  Dependency Conflicts: {'Yes' if latest['dependencies']['has_conflicts'] else 'No'}

💡 Recommendations:
"""
        
        for i, rec in enumerate(summary['recommendations'], 1):
            report += f"  {i}. {rec}\n"
        
        if not summary['recommendations']:
            report += "  • No specific recommendations - environment is healthy\n"
        
        return report

if __name__ == "__main__":
    monitor = EnvironmentMonitor(monitoring_interval=60)  # 1 minute for testing
    
    try:
        print("🚀 Starting environment monitoring...")
        monitor.start_monitoring()
        
        # Run for a short period for demonstration
        time.sleep(10)
        
        # Generate report
        print("\n" + monitor.generate_detailed_report())
        
    except KeyboardInterrupt:
        print("\n⏹️ Monitoring interrupted by user")
    finally:
        monitor.stop_monitoring()
EOF

chmod +x bmad-method/utils/environment-monitor.py

echo "✅ Environment monitor created"
```

This comprehensive Python environment setup guide provides data practitioners with production-ready virtual environment management, advanced dependency resolution, cross-platform compatibility, and continuous health monitoring. The modular utilities can be customized for specific deployment requirements and integrated into existing DevOps workflows.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create Priority 1 Deliverable 1: Complete Onboarding Masterclass", "status": "completed", "id": "1"}, {"content": "Create Priority 1 Deliverable 2: Role-Based Daily Workflows", "status": "completed", "id": "2"}, {"content": "Create Priority 1 Deliverable 3: End-to-End Pipeline Masterclass", "status": "completed", "id": "3"}, {"content": "Create Priority 1 Deliverable 4: Advanced Troubleshooting Intelligence", "status": "completed", "id": "4"}, {"content": "Create Priority 1 Deliverable 5: Environment Setup Mastery", "status": "completed", "id": "5"}]