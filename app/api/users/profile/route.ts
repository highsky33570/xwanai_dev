import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function PUT(request: NextRequest) {
  try {
    logger.info(
      { module: 'users-profile-api', operation: 'PUT' },
      '收到用户资料更新请求'
    )

    // 获取请求数据
    const body = await request.json()

    // 获取认证信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '未提供认证信息' },
        { status: 401 }
      )
    }

    // 调用后端API
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/users/v1/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error(
        {
          module: 'users-profile-api',
          operation: 'PUT',
          error: errorData
        },
        '后端API调用失败'
      )
      return NextResponse.json(
        { error: errorData.detail || '更新失败' },
        { status: response.status }
      )
    }

    const result = await response.json()

    logger.success(
      {
        module: 'users-profile-api',
        operation: 'PUT',
        data: result
      },
      '用户资料更新成功'
    )

    return NextResponse.json(result)
  } catch (error) {
    logger.error(
      { module: 'users-profile-api', operation: 'PUT', error },
      '用户资料更新API出错'
    )

    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
