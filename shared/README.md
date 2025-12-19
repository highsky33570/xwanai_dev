# 📋 Shared Resources

This directory contains resources shared between frontend and backend workspaces via symbolic links.

## 📁 Files

### `.definitionrc`
- **Type**: SQL Schema Definition
- **Purpose**: Complete database schema including tables, indexes, functions (RPC)
- **Updated**: When database structure changes
- **Backend Access**: Via symlink `XWANAI_backend/.definitionrc`

### `openapi.json`
- **Type**: OpenAPI 3.1 Specification
- **Purpose**: API endpoint definitions and schemas
- **Updated**: When API endpoints change
- **Backend Access**: Via symlink `XWANAI_backend/openapi.json`
- **Note**: For complete auto-generated spec, run backend and visit `/openapi.json`

### `chat-flow.md`
- **Type**: Technical Documentation
- **Purpose**: Frontend-Backend interaction protocol for chat system
- **Updated**: When chat flow or SSE format changes
- **Backend Access**: Via symlink `XWANAI_backend/chat-flow.md`

## 🔗 Symbolic Links

Backend workspace accesses these files via symbolic links:

```bash
XWANAI_backend/.definitionrc → ../XWANAI_frontend/shared/.definitionrc
XWANAI_backend/openapi.json → ../XWANAI_frontend/shared/openapi.json
XWANAI_backend/chat-flow.md → ../XWANAI_frontend/shared/chat-flow.md
```

## 📝 Update Guidelines

### When to Update

1. **`.definitionrc`**
   - Creating/modifying database tables
   - Adding/changing indexes
   - Creating/modifying RPC functions
   - Changing constraints or triggers

2. **`openapi.json`**
   - Adding new API endpoints
   - Modifying request/response schemas
   - Changing authentication methods
   - Or run: `curl http://localhost:8000/openapi.json > shared/openapi.json`

3. **`chat-flow.md`**
   - Changing chat modes
   - Modifying SSE response format
   - Updating session creation flow
   - Adding new chat features

### How to Update

⚠️ **Always update files in this directory** (frontend workspace)

```bash
# Update in frontend workspace
cd XWANAI_frontend/shared
vim .definitionrc  # or openapi.json, chat-flow.md

# Backend automatically sees changes via symlink
cd ../../XWANAI_backend
cat .definitionrc  # Shows updated content
```

### Verification

```bash
# In backend workspace
cd XWANAI_backend

# Check symlink status
ls -la | grep -E '\.(definitionrc|json|md)'

# Test file access
head -5 .definitionrc
head -5 openapi.json
head -5 chat-flow.md
```

## 🎯 Benefits

- ✅ Single source of truth
- ✅ Automatic synchronization
- ✅ No duplicate files
- ✅ Consistent definitions
- ✅ Easy to maintain

## ⚠️ Important Notes

1. **Don't edit in backend**: Backend files are symlinks, changes affect frontend
2. **Commit main files**: This directory's files should be committed to git
3. **Backend symlinks**: Can be committed or recreated as needed
4. **Team setup**: New members either get symlinks from git or create them manually

## 🔧 Manual Symlink Creation

If symlinks are not in git, create them manually:

```bash
cd XWANAI_backend
ln -sf ../XWANAI_frontend/shared/.definitionrc .definitionrc
ln -sf ../XWANAI_frontend/shared/openapi.json openapi.json
ln -sf ../XWANAI_frontend/shared/chat-flow.md chat-flow.md
```

---

**Last Updated**: 2025-11-10
**Maintainer**: Development Team

