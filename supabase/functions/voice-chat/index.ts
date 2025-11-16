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
    const { text } = await req.json();
    
    if (!text) {
      throw new Error('No text provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI for fashion advice
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
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

Remember: You're having a voice conversation, so be concise and conversational.`
          },
          {
            role: 'user',
            content: text
          }
        ],
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
    const responseText = aiData.choices[0].message.content;

    console.log('AI response generated:', responseText.substring(0, 50));

    // Generate speech using Web Speech API synthesis markup
    return new Response(
      JSON.stringify({ 
        text: responseText,
        audioUrl: null // Client will use Web Speech API
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
