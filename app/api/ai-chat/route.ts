import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { question, nodeData, recommendations } = await request.json();

    if (!question || !nodeData) {
      return NextResponse.json(
        { error: 'Question and node data are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // comprehensive node context
    const details = nodeData.details?.result;
    const credits = nodeData.credits || 0;
    const rank = nodeData.rank || 'N/A';
    
    const nodeContext = {
      pubkey: nodeData.pubkey,
      credits: credits,
      rank: rank,
      cpuUsage: details?.cpu_percent || 'N/A',
      ramUsed: details?.ram_used || 'N/A',
      ramTotal: details?.ram_total || 'N/A',
      ramPercent: details ? ((details.ram_used / details.ram_total) * 100).toFixed(1) : 'N/A',
      activeStreams: details?.active_streams || 'N/A',
      packetsReceived: details?.packets_received || 'N/A',
      packetsSent: details?.packets_sent || 'N/A',
      totalBytes: details?.total_bytes || 'N/A',
      fileSize: details?.file_size || 'N/A',
      totalPages: details?.total_pages || 'N/A',
      lastUpdated: details?.last_updated || 'N/A',
      recommendations: recommendations || []
    };

    // context-aware system prompt based on question type
    let systemPrompt = `You are XandExpert, a friendly AI assistant for Xandeum network node operators. You provide clear, actionable insights about node performance.

Node Context:
- Credits: ${nodeContext.credits}
- Network Rank: ${nodeContext.rank}
- CPU Usage: ${nodeContext.cpuUsage}%
- RAM Usage: ${nodeContext.ramPercent}% (${nodeContext.ramUsed}/${nodeContext.ramTotal} bytes)
- Active Streams: ${nodeContext.activeStreams}
- Packets Received: ${nodeContext.packetsReceived}
- Packets Sent: ${nodeContext.packetsSent}
- Last Updated: ${nodeContext.lastUpdated}
- Active Recommendations: ${nodeContext.recommendations.length}

Guidelines:
- Be conversational and professional
- Never use emojis
- Keep responses under 100 words
- Focus on actionable insights
- If data shows issues, be honest but encouraging
- When discussing earnings, be realistic but optimistic`;

    // response based on question type
    let userPrompt = question;
    
    if (question.includes('healthy')) {
      userPrompt = `The user asks: "${question}". 
      
      Analyze the node's health based on:
      - CPU and RAM usage (are they reasonable?)
      - Active streams (is the node actively participating?)
      - Packet activity (is it communicating properly?)
      - Any critical recommendations
      
      Give a clear health status (Excellent/Good/Needs Attention) and explain why in 2-3 sentences.`;
    } 
    else if (question.includes('earning')) {
      userPrompt = `The user asks: "${question}".
      
      Based on:
      - Current credits: ${nodeContext.credits}
      - Network rank: ${nodeContext.rank}
      - Performance metrics
      
      Provide:
      1. Quick assessment of their earning status
      2. Brief prediction for next 30 days (be conservative but encouraging)
      3. One tip to maximize earnings
      
      Keep it under 80 words.`;
    }
    else if (question.includes('action')) {
      const hasRecommendations = nodeContext.recommendations.length > 0;
      userPrompt = `The user asks: "${question}".
      
      ${hasRecommendations 
        ? `There are ${nodeContext.recommendations.length} recommendations. Review them and prioritize the most important action(s).`
        : 'No critical issues detected.'
      }
      
      Provide:
      1. Clear yes/no answer
      2. If yes: what's the most important action (ONE thing)
      3. If no: brief reassurance
      
      Keep it actionable and under 70 words.`;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'I was unable to process that question.';

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}