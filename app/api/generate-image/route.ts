import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Agnes AI 配置
const AGNES_API_URL = process.env.AGNES_API_BASE_URL || 'https://apihub.agnes-ai.com/v1';
const AGNES_MODEL = process.env.AGNES_MODEL || 'agnes-2.5-flash';

async function makeRequest(prompt: string, retries = 3) {
  try {
    const response = await axios.post(`${AGNES_API_URL}/images/generations`, {
      model: AGNES_MODEL,
      prompt,
      image_size: "1024x1024",
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY || process.env.AGNES_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000
    });
    return response.data.data;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return makeRequest(prompt, retries - 1);
    }
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const generatedImages = await makeRequest(prompt);
    return NextResponse.json({ images: generatedImages });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ error: '图片生成失败: ' + (error as Error).message }, { status: 500 });
  }
}

// 额外的改进：添加一个获取生成状态的函数
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  
  if (!taskId) {
    return NextResponse.json({ error: '缺少 taskId 参数' }, { status: 400 });
  }

  try {
    const response = await axios.get(`${AGNES_API_URL}/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.AGNES_API_KEY || process.env.SILICONFLOW_API_KEY}`,
      }
    });
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching task status:', error);
    return NextResponse.json({ error: '获取任务状态失败' }, { status: 500 });
  }
}
