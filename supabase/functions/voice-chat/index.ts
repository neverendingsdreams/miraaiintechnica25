import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, conversationHistory, isProactive } = await req.json();
    
    if (!text && !isProactive) {
      throw new Error('No text provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: `You are Mira, an expert AI fashion stylist with years of experience in personal styling, color theory, and fashion trends. 

Your expertise includes:
- Color coordination and harmony
- Fit and silhouette recommendations  
- Occasion-appropriate styling
- Trend awareness and timeless classics
- Body type considerations
- Accessory suggestions

Communication style:
- Friendly, encouraging, and enthusiastic
- Provide specific, actionable advice
- Keep responses conversational and natural (2-3 sentences max)
- Ask follow-up questions to understand user needs
- Use fashion terminology but explain when needed

${isProactive ? `PROACTIVE MODE: Share interesting fashion tips, seasonal trends, styling tricks, color combinations, or outfit ideas. Be brief and engaging - just 1-2 sentences. Topics can include: wardrobe essentials, upcoming trends, styling hacks, color psychology, fabric care, accessorizing tips, or seasonal transitions.` : ''}

When the user wants you to see their outfit (phrases like "see my outfit", "check my look", "analyze my clothes", "what do you think of this"), use the show_camera tool.

Remember: You're having a voice conversation, so be concise and conversational.`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message if not proactive
    if (!isProactive && text) {
      messages.push({
        role: 'user',
        content: text
      });
    } else if (isProactive) {
      messages.push({
        role: 'user',
        content: 'Share a quick fashion tip or styling advice'
      });
    }

    // Call Lovable AI for fashion advice with tool calling
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: [
          {
            type: 'function',
            function: {
              name: 'show_camera',
              description: 'Opens the camera to capture and analyze the user\'s outfit. Use this when the user asks you to see, check, or analyze their outfit.',
              parameters: {
                type: 'object',
                properties: {},
                required: []
              }
            }
          }
        ],
        tool_choice: 'auto',
        temperature: 0.8,
        max_tokens: 150
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI error:', aiResponse.status, errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const message = aiData.choices[0].message;
    
    // Check if AI wants to use the camera tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      if (toolCall.function.name === 'show_camera') {
        console.log('AI requested camera access');
        return new Response(
          JSON.stringify({ 
            action: 'show_camera',
            text: "Let me take a look at your outfit!"
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    const responseText = message.content;
    console.log('AI response generated:', responseText.substring(0, 50));

    return new Response(
      JSON.stringify({ 
        text: responseText,
        audioUrl: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in voice-chat:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
