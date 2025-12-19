# XWANAI 安全审计报告

> **AI驱动的中国八字命理分析平台 - 安全隐患分析与修复建议**

**审计日期**: 2025-11-16  
**版本**: 2.0.0  
**审计范围**: 前端 + 后端 + 数据库

---

## 📋 执行摘要

经过全面的安全审计，发现以下安全隐患：

| 风险等级 | 数量 | 状态 |
|---------|------|------|
| 🔴 **高风险** | 3 | 需立即修复 |
| 🟡 **中风险** | 5 | 建议修复 |
| 🟢 **低风险** | 4 | 可选优化 |

---

## 🔴 高风险安全隐患

### 1. CORS 配置过于宽松 (HIGH)

**位置**: `XWANAI_backend/main.py:87`

**问题描述**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ 允许所有来源
    allow_credentials=True,  # ⚠️ 同时允许凭证
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**安全风险**:
- ✗ 允许任何域名访问 API
- ✗ 与 `allow_credentials=True` 结合使用时，存在 **CSRF 攻击风险**
- ✗ 可能被恶意网站利用，窃取用户数据

**修复建议**:
```python
# ✅ 正确的 CORS 配置
from app.core.config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://xwanai.com",
        "https://www.xwanai.com",
        settings.frontend_url,  # 从环境变量读取
    ] if settings.environment == "production" else [
        "http://localhost:3000",  # 开发环境
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],  # 明确指定
    allow_headers=["Content-Type", "Authorization"],  # 明确指定
)
```

**优先级**: 🔴 **立即修复** (P0)

---

### 2. 缺少 API 速率限制 (HIGH)

**位置**: 全局 (所有 API 端点)

**问题描述**:
- ✗ 没有实现速率限制 (Rate Limiting)
- ✗ 容易受到 **DDoS 攻击**
- ✗ 容易受到 **暴力破解** (如登录、支付)
- ✗ AI API 调用可能被滥用

**安全风险**:
- 攻击者可以无限制调用 API
- Gemini AI 调用成本可能失控
- 服务器资源被耗尽

**修复建议**:

**方案 1: 使用 slowapi 库**
```python
# requirements.txt
slowapi==0.1.9

# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 在路由中使用
from slowapi import Limiter
from slowapi.util import get_remote_address

@router.post("/chat")
@limiter.limit("10/minute")  # 每分钟最多 10 次
async def chat(request: Request, chat_request: ChatRequest):
    ...
```

**方案 2: 使用 Redis + 中间件**
```python
# app/utils/rate_limiter.py
import redis
from fastapi import Request, HTTPException
from datetime import datetime, timedelta

redis_client = redis.Redis(host='localhost', port=6379, db=0)

async def rate_limit_middleware(request: Request, call_next):
    """全局速率限制中间件"""
    # 获取用户标识 (IP 或 User ID)
    user_id = request.headers.get("Authorization", "").split(" ")[-1]
    if not user_id:
        user_id = request.client.host
    
    # 检查速率限制
    key = f"rate_limit:{user_id}:{request.url.path}"
    count = redis_client.get(key)
    
    if count and int(count) > 100:  # 每分钟最多 100 次
        raise HTTPException(429, "Rate limit exceeded")
    
    # 增加计数
    redis_client.incr(key)
    redis_client.expire(key, 60)  # 1 分钟过期
    
    return await call_next(request)

# main.py
app.middleware("http")(rate_limit_middleware)
```

**建议配置**:
```python
# 不同端点的速率限制
API_RATE_LIMITS = {
    "/api/chat/v1": "10/minute",           # AI 对话: 10次/分钟
    "/api/character/v1": "5/minute",       # 创建角色: 5次/分钟
    "/api/users/v1/avatar": "3/minute",    # 上传头像: 3次/分钟
    "/api/stripe/v1/checkout": "2/minute", # 支付: 2次/分钟
    "default": "60/minute"                 # 默认: 60次/分钟
}
```

**优先级**: 🔴 **立即修复** (P0)

---

### 3. JWT Secret 可能泄露 (HIGH)

**位置**: 环境变量配置

**问题描述**:
- ✗ `SUPABASE_JWT_SECRET` 存储在环境变量中
- ✗ 如果泄露，攻击者可以伪造 JWT Token
- ✗ 可能绕过所有认证检查

**安全风险**:
- 攻击者可以伪造任意用户身份
- 完全绕过认证系统
- 访问任意用户数据

**修复建议**:

**1. 使用密钥管理服务**:
```python
# ✅ 使用 Google Secret Manager (推荐用于 GCP 部署)
from google.cloud import secretmanager

def get_jwt_secret():
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{settings.project_id}/secrets/jwt-secret/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

# app/core/config.py
class Settings(BaseSettings):
    @property
    def supabase_jwt_secret(self) -> str:
        if settings.environment == "production":
            return get_jwt_secret()  # 从 Secret Manager 读取
        else:
            return os.getenv("SUPABASE_JWT_SECRET")  # 开发环境
```

**2. 定期轮换密钥**:
```python
# 实现密钥轮换机制
JWT_SECRETS = {
    "current": "secret_v2",
    "previous": "secret_v1"  # 支持旧 Token 验证
}

def verify_jwt(token: str):
    for version, secret in JWT_SECRETS.items():
        try:
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            return payload
        except jwt.InvalidTokenError:
            continue
    raise HTTPException(401, "Invalid token")
```

**3. 监控异常登录**:
```python
# 记录和监控异常的 JWT 验证失败
async def get_current_user(authorization: str = Header(...)):
    try:
        payload = jwt.decode(...)
        return payload
    except jwt.InvalidTokenError as e:
        # 记录异常
        logger.warning(f"⚠️ [安全] JWT 验证失败: {e}, IP: {request.client.host}")
        
        # 如果失败次数过多，触发告警
        if is_suspicious_activity(request.client.host):
            await send_security_alert("Possible JWT attack detected")
        
        raise HTTPException(401, "Invalid token")
```

**优先级**: 🔴 **立即修复** (P0)

---

## 🟡 中风险安全隐患

### 4. localStorage 存储敏感数据 (MEDIUM)

**位置**: 前端 (多处)

**问题描述**:
```typescript
// ⚠️ Token 存储在 localStorage
localStorage.setItem('supabase.auth.token', token)
localStorage.setItem('language', language)
```

**安全风险**:
- ✗ 易受 **XSS 攻击** (如果有 XSS 漏洞，可窃取 Token)
- ✗ 无法设置过期时间和 HttpOnly 标志
- ✗ 同域下的所有脚本都可以访问

**修复建议**:

**方案 1: 使用 HttpOnly Cookie (最安全)**
```typescript
// ✅ 后端设置 HttpOnly Cookie
// app/utils/auth.py
from fastapi import Response

async def login(email: str, password: str, response: Response):
    # 登录逻辑...
    
    # 设置 HttpOnly Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # JavaScript 无法访问
        secure=True,    # 仅 HTTPS
        samesite="strict",  # 防止 CSRF
        max_age=3600    # 1 小时
    )
    
    return {"message": "Login successful"}
```

**方案 2: 使用 sessionStorage (次优)**
```typescript
// ✅ 使用 sessionStorage (关闭浏览器后清除)
sessionStorage.setItem('access_token', token)

// ✅ 或使用 Supabase 的安全存储
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key, {
  auth: {
    storage: window.sessionStorage,  // 使用 sessionStorage
    persistSession: false,  // 不持久化
    autoRefreshToken: true
  }
})
```

**方案 3: 加密存储**
```typescript
// ✅ 使用加密库
import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!

function encryptData(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString()
}

function decryptData(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// 存储
localStorage.setItem('token', encryptData(token))

// 读取
const token = decryptData(localStorage.getItem('token'))
```

**优先级**: 🟡 **建议修复** (P1)

---

### 5. 缺少输入验证和清理 (MEDIUM)

**位置**: 前端用户输入

**问题描述**:
- ✗ 前端未对用户输入进行严格验证
- ✗ 可能存在 **XSS 注入** 风险
- ✗ Markdown 渲染可能不安全

**安全风险**:
- 恶意用户可能注入 JavaScript 代码
- 角色名称、描述等字段可能包含恶意脚本

**修复建议**:

**1. 严格的输入验证**:
```typescript
// ✅ 前端验证
import DOMPurify from 'dompurify'

function sanitizeInput(input: string): string {
  // 移除 HTML 标签
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

function validateCharacterName(name: string): boolean {
  // 只允许中英文、数字、空格
  const regex = /^[\u4e00-\u9fa5a-zA-Z0-9\s]{1,20}$/
  return regex.test(name)
}

// 在提交前验证
const handleSubmit = () => {
  const sanitizedName = sanitizeInput(characterName)
  const sanitizedDescription = sanitizeInput(description)
  
  if (!validateCharacterName(sanitizedName)) {
    toast.error("角色名称格式不正确")
    return
  }
  
  // 提交...
}
```

**2. 后端二次验证**:
```python
# ✅ 后端验证
import re
from fastapi import HTTPException

def sanitize_string(text: str) -> str:
    """清理字符串，移除潜在的危险字符"""
    # 移除 HTML 标签
    text = re.sub(r'<[^>]+>', '', text)
    # 移除特殊字符
    text = re.sub(r'[<>\"\'&]', '', text)
    return text.strip()

def validate_character_name(name: str) -> bool:
    """验证角色名称"""
    # 长度检查
    if len(name) < 1 or len(name) > 20:
        return False
    
    # 格式检查 (只允许中英文、数字、空格)
    pattern = r'^[\u4e00-\u9fa5a-zA-Z0-9\s]+$'
    return bool(re.match(pattern, name))

# 在路由中使用
@router.post("/character")
async def create_character(char_info: CharacterCreate):
    # 清理和验证
    char_info.name = sanitize_string(char_info.name)
    
    if not validate_character_name(char_info.name):
        raise HTTPException(400, "角色名称格式不正确")
    
    if char_info.description:
        char_info.description = sanitize_string(char_info.description)
    
    # 处理...
```

**3. 安全的 Markdown 渲染**:
```typescript
// ✅ 使用安全的 Markdown 配置
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // 禁用危险的元素
    script: () => null,
    iframe: () => null,
    
    // 安全的链接
    a: ({ href, children }) => (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"  // 防止 tabnabbing 攻击
      >
        {children}
      </a>
    )
  }}
>
  {content}
</ReactMarkdown>
```

**优先级**: 🟡 **建议修复** (P1)

---

### 6. 缺少 CSRF 保护 (MEDIUM)

**位置**: API 端点 (特别是支付和敏感操作)

**问题描述**:
- ✗ 没有实现 CSRF Token 验证
- ✗ 虽然使用 JWT，但某些操作仍可能受到 CSRF 攻击

**安全风险**:
- 攻击者可能诱导用户执行非预期操作
- 特别是支付、订阅等敏感操作

**修复建议**:

**方案 1: 双重提交 Cookie**
```python
# app/utils/csrf.py
import secrets
from fastapi import Request, HTTPException

def generate_csrf_token() -> str:
    """生成 CSRF Token"""
    return secrets.token_urlsafe(32)

async def verify_csrf_token(request: Request):
    """验证 CSRF Token"""
    # 从 Cookie 读取
    csrf_cookie = request.cookies.get("csrf_token")
    
    # 从 Header 读取
    csrf_header = request.headers.get("X-CSRF-Token")
    
    if not csrf_cookie or not csrf_header:
        raise HTTPException(403, "CSRF token missing")
    
    if csrf_cookie != csrf_header:
        raise HTTPException(403, "CSRF token mismatch")

# 在敏感路由中使用
@router.post("/stripe/checkout")
async def create_checkout(
    request: Request,
    _: None = Depends(verify_csrf_token)  # 依赖注入验证
):
    ...
```

**方案 2: SameSite Cookie**
```python
# 设置 SameSite=Strict
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,
    secure=True,
    samesite="strict"  # 防止跨站请求
)
```

**优先级**: 🟡 **建议修复** (P1)

---

### 7. Stripe Webhook 签名验证不足 (MEDIUM)

**位置**: `app/api/v1/stripe_pay.py`

**问题描述**:
```python
# 当前实现
event = stripe.Webhook.construct_event(
    payload, sig_header, settings.stripe_webhook_secret
)
```

**安全风险**:
- ✗ 如果验证不正确，可能被伪造 Webhook 事件
- ✗ 攻击者可能伪造支付成功事件

**修复建议**:
```python
# ✅ 增强的 Webhook 验证
@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    # 1. 验证签名
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError as e:
        logger.error(f"❌ [安全] Webhook payload 无效: {e}")
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"❌ [安全] Webhook 签名验证失败: {e}")
        raise HTTPException(400, "Invalid signature")
    
    # 2. 记录 Webhook 事件
    logger.info(f"✅ [Webhook] 收到事件: {event['type']}, ID: {event['id']}")
    
    # 3. 检查重复事件 (防止重放攻击)
    event_id = event['id']
    if await is_duplicate_event(event_id):
        logger.warning(f"⚠️ [安全] 重复的 Webhook 事件: {event_id}")
        return {"status": "duplicate"}
    
    # 4. 标记事件已处理
    await mark_event_processed(event_id)
    
    # 5. 处理事件
    if event['type'] == 'checkout.session.completed':
        await handle_checkout_completed(event)
    
    return {"status": "success"}

async def is_duplicate_event(event_id: str) -> bool:
    """检查是否是重复事件"""
    client = await get_supabase_client()
    result = await client.table('webhook_events').select('id').eq('event_id', event_id).execute()
    return len(result.data) > 0

async def mark_event_processed(event_id: str):
    """标记事件已处理"""
    client = await get_supabase_client()
    await client.table('webhook_events').insert({
        'event_id': event_id,
        'processed_at': datetime.now(timezone.utc).isoformat()
    }).execute()
```

**优先级**: 🟡 **建议修复** (P1)

---

### 8. 敏感信息日志泄露 (MEDIUM)

**位置**: 多处日志记录

**问题描述**:
- ✗ 可能在日志中记录敏感信息 (Token, 密码, API Key)
- ✗ 日志可能被未授权人员访问

**安全风险**:
- 敏感信息泄露
- 合规问题 (GDPR)

**修复建议**:
```python
# ✅ 安全的日志记录
import re
from typing import Any, Dict

def sanitize_log_data(data: Any) -> Any:
    """清理日志数据，移除敏感信息"""
    if isinstance(data, dict):
        sanitized = {}
        for key, value in data.items():
            # 移除敏感字段
            if key.lower() in ['password', 'token', 'secret', 'api_key', 'authorization']:
                sanitized[key] = '***REDACTED***'
            else:
                sanitized[key] = sanitize_log_data(value)
        return sanitized
    elif isinstance(data, str):
        # 移除看起来像 Token 的字符串
        return re.sub(r'[A-Za-z0-9_-]{20,}', '***TOKEN***', data)
    return data

# 使用
logger.info(f"用户登录: {sanitize_log_data(user_data)}")
logger.debug(f"API 请求: {sanitize_log_data(request_data)}")
```

**优先级**: 🟡 **建议修复** (P2)

---

## 🟢 低风险安全隐患

### 9. 缺少安全响应头 (LOW)

**位置**: HTTP 响应

**问题描述**:
- ✗ 缺少安全相关的 HTTP 头
- ✗ 可能增加某些攻击的风险

**修复建议**:
```python
# ✅ 添加安全头中间件
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # 防止 XSS
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # 强制 HTTPS
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # CSP (Content Security Policy)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline';"
        )
        
        return response

# main.py
app.add_middleware(SecurityHeadersMiddleware)
```

**优先级**: 🟢 **可选优化** (P3)

---

### 10. 密码策略不足 (LOW)

**位置**: Supabase Auth 配置

**问题描述**:
- ✗ 可能没有强制密码复杂度要求
- ✗ 没有密码历史记录

**修复建议**:
```typescript
// ✅ 前端密码验证
function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 12) {
    errors.push("密码至少需要12个字符")
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("密码需要包含至少一个大写字母")
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("密码需要包含至少一个小写字母")
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push("密码需要包含至少一个数字")
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("密码需要包含至少一个特殊字符")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

**优先级**: 🟢 **可选优化** (P3)

---

### 11. 缺少审计日志 (LOW)

**位置**: 敏感操作

**问题描述**:
- ✗ 没有完整的审计日志
- ✗ 难以追溯安全事件

**修复建议**:
```python
# ✅ 审计日志系统
async def audit_log(
    user_id: str,
    action: str,
    resource: str,
    details: Dict[str, Any],
    ip_address: str
):
    """记录审计日志"""
    client = await get_supabase_client()
    
    await client.table('audit_logs').insert({
        'user_id': user_id,
        'action': action,
        'resource': resource,
        'details': details,
        'ip_address': ip_address,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }).execute()

# 在敏感操作中使用
@router.delete("/character/{character_id}")
async def delete_character(
    character_id: str,
    user: Dict = Depends(get_current_user),
    request: Request = None
):
    # 执行删除
    await character_service.delete_character(character_id, user['id'])
    
    # 记录审计日志
    await audit_log(
        user_id=user['id'],
        action="DELETE_CHARACTER",
        resource=f"character:{character_id}",
        details={"character_id": character_id},
        ip_address=request.client.host
    )
    
    return {"message": "Character deleted"}
```

**优先级**: 🟢 **可选优化** (P3)

---

### 12. 文件上传安全 (LOW)

**位置**: `/api/users/v1/avatar`

**问题描述**:
- ✗ 可能缺少文件类型验证
- ✗ 可能缺少文件大小限制

**修复建议**:
```python
# ✅ 安全的文件上传
from fastapi import UploadFile, File, HTTPException
import magic  # python-magic

ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: Dict = Depends(get_current_user)
):
    # 1. 检查文件大小
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(400, "文件大小超过限制 (5MB)")
    
    # 2. 检查文件类型 (使用 magic number 而非扩展名)
    mime_type = magic.from_buffer(file_content, mime=True)
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(400, f"不支持的文件类型: {mime_type}")
    
    # 3. 生成安全的文件名
    file_ext = mime_type.split('/')[-1]
    safe_filename = f"{user['id']}/{uuid.uuid4()}.{file_ext}"
    
    # 4. 上传到 Supabase Storage
    client = await get_supabase_client()
    result = await client.storage.from_('avatars').upload(
        safe_filename,
        file_content,
        file_options={
            "content-type": mime_type,
            "cache-control": "3600"
        }
    )
    
    return {"avatar_url": result.public_url}
```

**优先级**: 🟢 **可选优化** (P3)

---

## 📊 安全最佳实践建议

### 1. 定期安全审计
- ✅ 每季度进行一次安全审计
- ✅ 使用自动化工具扫描漏洞
- ✅ 聘请专业安全团队进行渗透测试

### 2. 依赖项安全
```bash
# ✅ 定期更新依赖
npm audit fix
pip-audit

# ✅ 使用 Dependabot 自动化
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 3. 环境变量管理
```bash
# ✅ 使用 .env.example 而非 .env
# ✅ 在 .gitignore 中排除敏感文件
.env
.env.local
*.pem
*.key
```

### 4. 监控和告警
```python
# ✅ 设置安全监控
async def detect_suspicious_activity(user_id: str, action: str):
    """检测可疑活动"""
    # 检查短时间内的大量请求
    # 检查异常的登录位置
    # 检查批量操作
    
    if is_suspicious:
        await send_security_alert(f"Suspicious activity detected: {action}")
```

### 5. 备份和恢复
```bash
# ✅ 定期备份数据库
# ✅ 测试恢复流程
# ✅ 加密备份文件
```

---

## 🔒 修复优先级路线图

### 第一阶段 (立即) - P0
- [ ] 修复 CORS 配置
- [ ] 实现 API 速率限制
- [ ] 加强 JWT Secret 管理

### 第二阶段 (1-2周) - P1
- [ ] localStorage 改用更安全的存储
- [ ] 实现输入验证和清理
- [ ] 添加 CSRF 保护
- [ ] 增强 Stripe Webhook 验证

### 第三阶段 (1个月) - P2
- [ ] 清理日志中的敏感信息
- [ ] 添加安全响应头

### 第四阶段 (长期) - P3
- [ ] 实现审计日志系统
- [ ] 增强文件上传安全
- [ ] 强化密码策略

---

## 📝 结论

本次安全审计发现了 **12 个安全隐患**，其中 **3 个高风险** 需要立即修复。

**关键行动项**:
1. 🔴 **立即修复 CORS 配置** - 防止 CSRF 攻击
2. 🔴 **立即实现速率限制** - 防止 DDoS 和资源滥用
3. 🔴 **加强 JWT Secret 管理** - 防止身份伪造
4. 🟡 改进前端存储策略 - 降低 XSS 风险
5. 🟡 实现全面的输入验证 - 防止注入攻击

**预计修复时间**: 2-4 周  
**建议投入**: 1-2 名开发人员

---

**审计人员**: AI Assistant  
**联系方式**: GitHub Issues  
**下次审计**: 2026-02-16

