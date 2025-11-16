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
    const { image } = await req.json();
    
    if (!image) {
      throw new Error('No image provided');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Extract base64 data from data URL
    const base64Data = image.split(',')[1];

    // Prepare the prompt for fashion analysis
    const systemPrompt = `You are Mira, an expert fashion stylist. Provide SHORT, concise outfit feedback in 2-3 sentences max.

Include:
- Quick positive comment about what works
- One specific tip to enhance the look
- Brief confidence boost

Keep it warm, friendly, and BRIEF. Voice-friendly length only.`;

    // Call Gemini API directly
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_API_KEY;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt + '\n\nPlease analyze this outfit and provide your expert fashion advice.'
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1000,
        candidateCount: 1
      }
    };

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const firstStatus = response.status;
      const firstText = await response.text();
      console.error('Gemini error:', firstStatus, firstText);
      
      if (firstStatus === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (firstStatus === 402) {
        throw new Error('AI usage limit reached. Please add credits to continue.');
      }
      
      if (firstStatus === 503) {
        console.log('Gemini overloaded (503). Retrying once...');
        await new Promise((r) => setTimeout(r, 800));
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const retryText = await response.text();
          console.error('Retry failed:', response.status, retryText);
          throw new Error(`AI analysis failed: ${response.status}`);
        }
      } else {
        throw new Error(`AI analysis failed: ${firstStatus}`);
      }
    }

    let data = await response.json();
    console.log('Gemini API response:', JSON.stringify(data));
    
    // Check for blocked content or safety issues
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Content blocked: ${data.promptFeedback.blockReason}`);
    }
    
    const extract = (d: any) => {
      const parts = d.candidates?.[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts.map((p: any) => p?.text).filter(Boolean).join(' ').trim();
      }
      return undefined;
    };

    let analysis = extract(data);

    // Fallback: if the primary model returns no text, try flash-lite once
    if (!analysis) {
      const finish = data.candidates?.[0]?.finishReason;
      console.warn('Primary model returned no text. finishReason=', finish, ' — trying flash-lite');
      const fallbackUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + GEMINI_API_KEY;
      const fallbackResp = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (fallbackResp.ok) {
        const fbData = await fallbackResp.json();
        console.log('Fallback Gemini response:', JSON.stringify(fbData));
        analysis = extract(fbData);
      } else {
        const fbErr = await fallbackResp.text();
        console.error('Fallback call failed:', fallbackResp.status, fbErr);
      }
    }

    if (!analysis) {
      console.error('No text in response after fallback. Last response:', JSON.stringify(data));
      throw new Error('No analysis returned from Gemini. The response may have been filtered.');
    }

    console.log('Analysis completed successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in analyze-outfit:', error);
    
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
