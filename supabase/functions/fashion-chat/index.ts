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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Prepare conversation context
    const systemPrompt = `You are Mira, a friendly and expert fashion AI assistant with live video access. You help users with real-time outfit advice and styling questions.

Guidelines:
- Keep responses conversational and concise (2-4 sentences)
- When you can see their outfit (image provided), give specific visual feedback
- Answer fashion questions with practical, actionable advice
- Be warm, encouraging, and professional
- If asked about what you see, describe the outfit briefly and provide feedback`;

    // Build Gemini contents array
    const contents: any[] = [];

    // Add conversation history in Gemini format
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Build current user message parts
    const currentParts: any[] = [];
    
    if (message) {
      currentParts.push({
        text: systemPrompt + '\n\n' + message
      });
    } else {
      currentParts.push({
        text: systemPrompt + '\n\nPlease analyze this outfit.'
      });
    }
    
    if (imageData) {
      const base64Data = imageData.split(',')[1];
      currentParts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Data
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    console.log('Calling Gemini API with', contents.length, 'messages');

    // Call Gemini API directly
    const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 200
        }
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
    const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error('No response from Gemini');
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
