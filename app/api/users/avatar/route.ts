import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    logger.info(
      { module: 'users-avatar-api', operation: 'POST' },
      '收到头像上传请求'
    )

    // 获取认证信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 获取表单数据
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      )
    }

    // 创建新的FormData传递给后端
    const backendFormData = new FormData()
    backendFormData.append('file', file)

    // 调用后端API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/users/v1/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: backendFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error(
        {
          module: 'users-avatar-api',
          operation: 'POST',
          error: errorData
        },
        '后端API调用失败'
      )
      return NextResponse.json(
        { error: errorData.detail || '上传失败' },
        { status: response.status }
      )
    }

    // 获取响应内容（避免重复读取stream）
    const responseText = await response.text();
    let fileId;

    try {
      // 尝试解析JSON响应
      const responseData = JSON.parse(responseText);
      if (responseData.data) {
        fileId = responseData.data;
      } else {
        fileId = responseData;
      }
    } catch {
      // 如果不是JSON，则直接使用文本
      fileId = responseText;
    }

    // 确保fileId是纯字符串
    const cleanFileId = String(fileId).replace(/["{}\s]/g, "");

    logger.success(
      {
        module: 'users-avatar-api',
        operation: 'POST',
        data: { fileId: cleanFileId, originalResponse: fileId }
      },
      '头像上传成功'
    )

    return new NextResponse(cleanFileId, {
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (error) {
    logger.error(
      { module: 'users-avatar-api', operation: 'POST', error },
      '头像上传API出错'
    )

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
