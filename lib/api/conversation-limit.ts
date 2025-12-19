import { authOperations } from "@/lib/supabase/auth";
import { logger } from "@/lib/utils/logger";
import { API_BASE_URL } from "./config";

export interface ConversationTurnStats {
  turn_count: number;
  turn_limit: number;
  limit_reached: boolean;
  has_report: boolean;
  is_premium: boolean;
}

export const conversationLimitAPI = {
  /**
   * 获取会话的对话回合数统计
   */
  async getSessionTurnStats(sessionId: string): Promise<ConversationTurnStats | null> {
    try {
      const accessToken = await authOperations.getAccessToken();
      if (!accessToken) {
        logger.warn(
          { module: "conversation-limit", operation: "getStats" },
          "User not authenticated"
        );
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/v1/session/${sessionId}/turn-stats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error(
          { module: "conversation-limit", operation: "getStats", status: response.status, error: errorData },
          "Failed to fetch conversation turn stats"
        );
        return null;
      }

      const responseData = await response.json();
      
      // 🎯 后端返回格式: {code: 200, message: 'success', data: {...}}
      // 需要提取实际的统计数据
      const stats = responseData.data || responseData;
      
      logger.info(
        { module: "conversation-limit", operation: "getStats", data: stats },
        "Conversation turn stats fetched successfully"
      );
      return stats;
    } catch (error) {
      logger.error(
        { module: "conversation-limit", operation: "getStats", error },
        "Unexpected error fetching conversation turn stats"
      );
      return null;
    }
  },
};
