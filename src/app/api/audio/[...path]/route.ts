/**
 * Audio Proxy API - 代理从私有Hugging Face Space获取音频
 * GET /api/audio/[...path]
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  let hfUrl = params.path.join('/');

  // 修正因路径参数解析导致的双斜杠丢失问题
  if (hfUrl.startsWith('https:/') && !hfUrl.startsWith('https://')) {
    hfUrl = hfUrl.replace('https:/', 'https://');
  }

  if (!hfUrl) {
    return new NextResponse('Missing Hugging Face URL', { status: 400 });
  }

  console.log(`[Audio Proxy] 代理请求: ${hfUrl}`);

  try {
    const hfToken = process.env.HF_TOKEN || process.env.hf_token;
    if (!hfToken) {
      console.error('[Audio Proxy] HF_TOKEN not found in environment variables.');
      return new NextResponse('Server configuration error: HF_TOKEN is missing.', { status: 500 });
    }

    const response = await fetch(hfUrl, {
      headers: {
        'Authorization': `Bearer ${hfToken}`
      }
    });

    if (!response.ok) {
      console.error(`[Audio Proxy] 代理失败，上游服务器错误: ${response.status} ${response.statusText}`);
      return new NextResponse(response.statusText, { status: response.status });
    }

    // 将音频流式传输回客户端
    const audioBlob = await response.blob();
    return new NextResponse(audioBlob, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/wav',
        'Content-Length': response.headers.get('Content-Length') || audioBlob.size.toString(),
      },
    });

  } catch (error) {
    console.error('[Audio Proxy] 代理时发生内部错误:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
