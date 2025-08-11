# PyPI/pip Package Access Setup

## Overview

This guide covers setting up access to Python packages for the PyAirbyte integration (Story 1.2).

## Public PyPI Access (Default)

No configuration needed. The system uses the public PyPI repository by default.

## Private Package Repository

If your organization uses a private PyPI repository:

### 1. Configure pip

Create or update `~/.pip/pip.conf`:

```ini
[global]
index-url = https://your-pypi-server.com/simple/
trusted-host = your-pypi-server.com
```

### 2. Set Environment Variables

Add to your `.env` file:

```bash
# Private PyPI configuration
PYPI_INDEX_URL=https://your-pypi-server.com/simple/
PYPI_USERNAME=your-username
PYPI_PASSWORD=your-password
```

### 3. Using API Tokens

For enhanced security, use API tokens instead of passwords:

```bash
# PyPI API token (preferred over password)
PYPI_API_TOKEN=pypi-AgEIcHlwaS5vcmcCJGE4ZjQ5...
```

## Authentication Methods

### Basic Authentication

```bash
pip install package-name --index-url https://username:password@your-pypi-server.com/simple/
```

### Token Authentication

```bash
pip install package-name --index-url https://__token__:your-token@your-pypi-server.com/simple/
```

### Keyring Authentication

For secure credential storage:

```bash
pip install keyring
keyring set https://your-pypi-server.com/simple/ your-username
```

## Troubleshooting

### SSL Certificate Issues

If you encounter SSL errors with self-signed certificates:

```bash
# Temporary workaround (not recommended for production)
pip install --trusted-host your-pypi-server.com package-name

# Better solution: Add certificate to trusted store
export PIP_CERT=/path/to/certificate.pem
```

### Proxy Configuration

If behind a corporate proxy:

```bash
# HTTP proxy
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080

# Or in pip.conf
[global]
proxy = http://proxy.company.com:8080
```

### Permission Errors

Ensure the bmad user has access to:
- `~/.pip/` directory
- Virtual environment directories
- Package installation directories

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use API tokens** instead of passwords when possible
3. **Rotate credentials** regularly
4. **Use virtual environments** to isolate dependencies
5. **Verify package signatures** when available

## Validation

Test your configuration:

```bash
# Test package installation
pip install --dry-run pyairbyte

# Verify credentials
bmad validate-credentials pypi

# Health check
bmad health-check pypi
```