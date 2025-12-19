import { makeAutoObservable } from "mobx";

export interface SessionInfo {
  id: string;
  mode: string;
  title: string;
  character?: any;
  basicBaziId?: string;
}

export interface ChatError {
  error: string;
  error_type: string;
  retryable: boolean;
  resumable: boolean;
  timestamp: Date;
  sessionId?: string;
  lastMessage?: string;
  interrupted?: boolean; // 标记是否是中断的对话
}

interface PersistedErrorState {
  error: ChatError;
  sessionId: string;
  lastUserMessage?: string;
  timestamp: string;
}

class SessionStore {
  // 当前活跃的session
  currentSession: SessionInfo | null = null;

  // session缓存，避免重复查询
  sessionCache = new Map<string, SessionInfo>();

  // 加载状态
  isLoadingSession = false;

  // 🚨 错误状态管理
  currentError: ChatError | null = null;

  // 错误历史（按session ID存储）
  errorHistory = new Map<string, ChatError[]>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  /**
   * 设置当前session
   * @param sessionInfo session信息
   */
  setCurrentSession(sessionInfo: SessionInfo) {
    this.currentSession = sessionInfo;
    // 同时缓存这个session
    this.sessionCache.set(sessionInfo.id, sessionInfo);
  }

  /**
   * 获取当前session的mode
   */
  get currentMode(): string {
    return this.currentSession?.mode || "chat";
  }

  /**
   * 获取当前session的ID
   */
  get currentSessionId(): string | null {
    return this.currentSession?.id || null;
  }

  /**
   * 从缓存中获取session信息
   * @param sessionId session ID
   */
  getCachedSession(sessionId: string): SessionInfo | undefined {
    return this.sessionCache.get(sessionId);
  }

  /**
   * 缓存session信息
   * @param sessionInfo session信息
   */
  cacheSession(sessionInfo: SessionInfo) {
    this.sessionCache.set(sessionInfo.id, sessionInfo);
  }

  /**
   * 切换到指定session
   * @param sessionId session ID
   * @param sessionInfo 可选的session信息，如果提供则直接使用
   */
  async switchSession(sessionId: string, sessionInfo?: Partial<SessionInfo>) {
    // 🔄 切换 session 时立即清除当前错误状态
    this.clearCurrentError();

    // 检查缓存
    const cached = this.getCachedSession(sessionId);
    if (cached) {
      this.setCurrentSession(cached);
      // 🔄 延迟恢复错误状态，避免闪现
      setTimeout(() => {
        this.restoreErrorStateForSession(sessionId);
      }, 100);
      return cached;
    }

    // 如果有提供session信息，使用它
    if (sessionInfo) {
      const fullSessionInfo: SessionInfo = {
        id: sessionId,
        mode: sessionInfo.mode || "chat",
        title: sessionInfo.title || "New Chat",
        character: sessionInfo.character,
        basicBaziId: sessionInfo.basicBaziId,
      };
      this.setCurrentSession(fullSessionInfo);
      // 🔄 延迟恢复错误状态，避免闪现
      setTimeout(() => {
        this.restoreErrorStateForSession(sessionId);
      }, 100);
      return fullSessionInfo;
    }

    // 否则需要从数据库查询 (只在必要时查询)
    this.isLoadingSession = true;
    try {
      // 这里应该调用API获取session信息
      // 暂时使用默认值
      const defaultSessionInfo: SessionInfo = {
        id: sessionId,
        mode: "chat",
        title: "New Chat",
      };
      this.setCurrentSession(defaultSessionInfo);
      // 🔄 延迟恢复错误状态，避免闪现
      setTimeout(() => {
        this.restoreErrorStateForSession(sessionId);
      }, 100);
      return defaultSessionInfo;
    } finally {
      this.isLoadingSession = false;
    }
  }

  /**
   * 创建新session并切换
   * @param mode 会话模式
   * @param title 会话标题
   * @param character 角色信息
   * @param basicBaziId 基础八字ID
   */
  createAndSwitchSession(
    sessionId: string,
    mode: string,
    title: string = "New Chat",
    character?: any,
    basicBaziId?: string
  ) {
    // 🔄 创建新 session 时清除当前错误状态
    this.clearCurrentError();

    const sessionInfo: SessionInfo = {
      id: sessionId,
      mode,
      title,
      character,
      basicBaziId,
    };
    this.setCurrentSession(sessionInfo);

    // 🔄 延迟恢复错误状态，避免闪现
    setTimeout(() => {
      this.restoreErrorStateForSession(sessionId);
    }, 100);

    return sessionInfo;
  }

  /**
   * 清除session缓存
   */
  clearCache() {
    this.sessionCache.clear();
  }

  /**
   * 清除当前session
   */
  clearCurrentSession() {
    this.currentSession = null;
  }

  /**
   * 🚨 设置当前错误
   */
  setCurrentError(error: ChatError | null) {
    this.currentError = error;

    // 同时保存到错误历史
    if (error && this.currentSession) {
      this.addErrorToHistory(this.currentSession.id, error);
    }
  }

  /**
   * 🚨 设置特定 session 的错误（不影响当前全局错误状态）
   */
  setSessionError(sessionId: string, error: ChatError | null) {
    // 只有当前 session 才设置全局错误状态
    if (this.currentSession?.id === sessionId) {
      this.setCurrentError(error);
    } else {
      // 其他 session 只保存到历史记录
      if (error) {
        this.addErrorToHistory(sessionId, error);
      }
    }
  }

  /**
   * 🚨 添加错误到历史记录
   */
  addErrorToHistory(sessionId: string, error: ChatError) {
    const history = this.errorHistory.get(sessionId) || [];
    history.push({
      ...error,
      timestamp: new Date()
    });

    // 限制历史记录数量，避免内存泄漏
    if (history.length > 10) {
      history.shift();
    }

    this.errorHistory.set(sessionId, history);
  }

  /**
   * 🚨 获取session的错误历史
   */
  getErrorHistory(sessionId: string): ChatError[] {
    return this.errorHistory.get(sessionId) || [];
  }

  /**
   * 🚨 清除当前错误
   */
  clearCurrentError() {
    this.currentError = null;
  }

  /**
   * 🚨 清除指定session的错误历史
   */
  clearErrorHistory(sessionId: string) {
    this.errorHistory.delete(sessionId);
  }

  /**
   * 🚨 检查当前错误是否可重试
   */
  get canRetry(): boolean {
    return this.currentError?.retryable || false;
  }

  /**
   * 🚨 检查当前错误是否可恢复
   */
  get canResume(): boolean {
    return this.currentError?.resumable || false;
  }

  /**
   * 🚨 获取当前错误的类型
   */
  get currentErrorType(): string | null {
    return this.currentError?.error_type || null;
  }

  /**
   * 🔄 保存错误状态到本地存储（持久化）
   */
  persistErrorState(sessionId: string, lastUserMessage?: string) {
    if (!this.currentError) return;

    const persistedState: PersistedErrorState = {
      error: {
        ...this.currentError,
        sessionId,
        lastMessage: lastUserMessage,
      },
      sessionId,
      lastUserMessage,
      timestamp: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`error_state_${sessionId}`, JSON.stringify(persistedState));
    } catch (error) {
      console.warn("⚠️ [错误持久化] 保存失败:", error);
    }
  }

  /**
   * 🔄 从本地存储恢复错误状态
   */
  restoreErrorState(sessionId: string): ChatError | null {
    try {
      const stored = localStorage.getItem(`error_state_${sessionId}`);
      if (!stored) return null;

      const persistedState: PersistedErrorState = JSON.parse(stored);

      // 检查错误是否太旧（超过24小时则忽略）
      const errorTime = new Date(persistedState.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - errorTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        this.clearPersistedErrorState(sessionId);
        return null;
      }

      // 恢复错误状态
      const restoredError: ChatError = {
        ...persistedState.error,
        timestamp: errorTime,
      };

      return restoredError;
    } catch (error) {
      console.warn("⚠️ [错误恢复] 恢复失败:", error);
      return null;
    }
  }

  /**
   * 🔄 为特定 session 恢复错误状态（仅在该 session 为当前 session 时设置全局状态）
   */
  restoreErrorStateForSession(sessionId: string): boolean {
    const restoredError = this.restoreErrorState(sessionId);
    if (restoredError && this.currentSession?.id === sessionId) {
      this.setCurrentError(restoredError);
      return true;
    }
    return false;
  }

  /**
   * 🔄 清除本地存储的错误状态
   */
  clearPersistedErrorState(sessionId: string) {
    try {
      localStorage.removeItem(`error_state_${sessionId}`);
    } catch (error) {
      console.warn("⚠️ [错误持久化] 清除失败:", error);
    }
  }

  /**
   * 🔄 获取所有持久化的错误状态
   */
  getAllPersistedErrors(): Array<{ sessionId: string; error: ChatError }> {
    const errors: Array<{ sessionId: string; error: ChatError }> = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('error_state_')) {
          const sessionId = key.replace('error_state_', '');
          const error = this.restoreErrorState(sessionId);
          if (error) {
            errors.push({ sessionId, error });
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ [错误持久化] 获取所有错误失败:", error);
    }

    return errors;
  }

  /**
   * 🔄 检查session是否有未解决的错误
   */
  hasPersistedError(sessionId: string): boolean {
    try {
      return localStorage.getItem(`error_state_${sessionId}`) !== null;
    } catch {
      return false;
    }
  }
}

export default SessionStore;
