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
    const { imageUrl, currentAnalysis } = await req.json();

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating outfit suggestions for image:', imageUrl);

    const systemPrompt = `You are Mira, an expert fashion stylist. Analyze the outfit in the image and provide 3-5 specific, actionable outfit suggestions to enhance the look.

For each suggestion, provide:
1. A specific item type (e.g., "denim jacket", "white sneakers", "leather belt")
2. Why it would work with this outfit
3. A search term for finding this item online

Format your response as a JSON array with this structure:
[
  {
    "item_type": "denim jacket",
    "suggestion_text": "A light-wash denim jacket would add casual sophistication and layer beautifully over your current top",
    "search_term": "women light wash denim jacket"
  },
  ...
]

Focus on practical, wearable suggestions that complement the existing outfit. Consider color coordination, style consistency, and current fashion trends.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: currentAnalysis ? `Current analysis: ${currentAnalysis}\n\nNow suggest specific items to enhance this outfit.` : 'Analyze this outfit and suggest specific items to enhance it.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_outfit_items',
              description: 'Return 3-5 specific outfit item suggestions',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        item_type: { type: 'string' },
                        suggestion_text: { type: 'string' },
                        search_term: { type: 'string' }
                      },
                      required: ['item_type', 'suggestion_text', 'search_term'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_outfit_items' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data, null, 2));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No suggestions generated');
    }

    const suggestions = JSON.parse(toolCall.function.arguments).suggestions;

    // Generate images for each suggestion using AI
    const suggestionsWithImages = await Promise.all(
      suggestions.map(async (suggestion: any) => {
        try {
          const imageGenResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: `Generate a clean, professional product photo of: ${suggestion.search_term}. Studio lighting, white background, fashion photography style.`
                }
              ],
              modalities: ['image', 'text']
            }),
          });

          if (imageGenResponse.ok) {
            const imageData = await imageGenResponse.json();
            const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            
            return {
              ...suggestion,
              image_url: generatedImageUrl || null
            };
          }
        } catch (error) {
          console.error('Error generating image for suggestion:', error);
        }

        return {
          ...suggestion,
          image_url: null
        };
      })
    );

    return new Response(
      JSON.stringify({ suggestions: suggestionsWithImages }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in generate-outfit-suggestions:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate suggestions',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
