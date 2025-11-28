# Security Guidelines

## ⚠️ Important Security Notes

### Credentials Management

**NEVER commit passwords or sensitive credentials to version control.**

1. **Use Environment Variables**: Store sensitive data in environment variables
   ```bash
   export VPS_PASSWORD="your_password"
   ```

2. **Use SSH Keys**: Prefer SSH key authentication over passwords
   ```bash
   ssh -i deploy_ssh_key root@72.61.145.67
   ```

3. **Use .env Files**: Application secrets should be in `.env` files (already in .gitignore)

### Deployment Scripts

The following deployment scripts have been secured:
- `deploy_with_password.sh` - Now prompts for password or uses `VPS_PASSWORD` env var
- `complete_setup.sh` - Now prompts for password or uses `VPS_PASSWORD` env var
- `finalize_deployment.sh` - Now prompts for password or uses `VPS_PASSWORD` env var

**Usage:**
```bash
# Option 1: Set environment variable
export VPS_PASSWORD="your_password"
./deploy_with_password.sh

# Option 2: Script will prompt for password
./deploy_with_password.sh

# Option 3: Use SSH key (recommended)
ssh -i deploy_ssh_key root@72.61.145.67
```

### Files in .gitignore

The following files are excluded from version control:
- `*.sh` (deployment scripts)
- `.env*` (environment files)
- `deploy_ssh_key*` (SSH private keys)

### Best Practices

1. **Rotate Passwords**: Change VPS password regularly
2. **Use SSH Keys**: Set up SSH key authentication for passwordless, secure access
3. **Limit Access**: Only grant access to trusted team members
4. **Monitor Logs**: Regularly check application and server logs for suspicious activity
5. **Keep Updated**: Regularly update system packages and dependencies

### If Credentials Are Exposed

If credentials are accidentally committed:
1. **Immediately change the exposed password/keys**
2. **Remove from git history** (if not yet pushed):
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team first)
4. **Review access logs** for unauthorized access

