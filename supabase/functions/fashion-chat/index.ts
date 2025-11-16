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
    const { message, imageData, conversationHistory } = await req.json();
    
    if (!message && !imageData) {
      throw new Error('No message or image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare conversation context
    const systemPrompt = `You are Mira, a friendly and expert fashion AI assistant with live video access. You help users with real-time outfit advice and styling questions.

Guidelines:
- Keep responses conversational and concise (2-4 sentences)
- When you can see their outfit (image provided), give specific visual feedback
- Answer fashion questions with practical, actionable advice
- Be warm, encouraging, and professional
- If asked about what you see, describe the outfit briefly and provide feedback`;

    // Build messages array
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Build user message
    const userContent: any[] = [];
    
    if (message) {
      userContent.push({
        type: 'text',
        text: message
      });
    }
    
    if (imageData) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageData
        }
      });
    }

    messages.push({
      role: 'user',
      content: userContent
    });

    console.log('Calling Lovable AI with', messages.length, 'messages');

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 200,
        temperature: 0.8
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI usage limit reached. Please add credits to continue.');
      }
      
      throw new Error(`AI failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error('No response from AI');
    }

    console.log('AI response received:', responseText.substring(0, 100));

    // Generate audio with ElevenLabs if API key is available
    let audioData = null;
    
    if (ELEVENLABS_API_KEY) {
      try {
        console.log('Generating audio with ElevenLabs...');
        
        const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
          method: 'POST',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: responseText,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          }),
        });

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
          audioData = `data:audio/mpeg;base64,${base64Audio}`;
          console.log('Audio generated successfully');
        } else {
          console.error('ElevenLabs TTS error:', ttsResponse.status);
        }
      } catch (error) {
        console.error('Error generating audio:', error);
        // Continue without audio
      }
    }

    return new Response(
      JSON.stringify({ 
        text: responseText,
        audio: audioData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in fashion-chat:', error);
    
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
