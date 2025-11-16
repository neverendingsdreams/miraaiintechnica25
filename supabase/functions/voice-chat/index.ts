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
    const { text, conversationHistory = [], userPreferences = null, imageData = null } = await req.json();
    
    if (!text && !imageData) {
      throw new Error('No text or image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build personalized context from user preferences
    let personalizationContext = '';
    if (userPreferences) {
      const genderContext = userPreferences.gender && userPreferences.gender !== 'prefer-not-to-say' 
        ? `\n- Gender: ${userPreferences.gender}` 
        : '';
      
      personalizationContext = `\n\nUser's Style Profile:${genderContext}
- Preferred Style: ${userPreferences.style}
- Favorite Colors: ${userPreferences.colors}
- Common Occasions: ${userPreferences.occasions}
- Fit Preference: ${userPreferences.bodyType}
- Budget Range: ${userPreferences.budget}

Use this information to provide personalized, relevant advice that matches their preferences. Tailor your suggestions to be appropriate for their gender identity when relevant (e.g., cuts, silhouettes, traditional vs contemporary styles).`;
    }

    // Build messages array with conversation history
    const messages: any[] = [
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

${personalizationContext}

Tools you have available:
1. show_camera - Use when the user wants you to see their outfit (phrases like "see my outfit", "check my look", "analyze my clothes")
2. generate_outfit_image - Use when the user wants visual inspiration, outfit ideas, or wants to see what an outfit would look like (phrases like "show me", "what would that look like", "can you visualize")
3. suggest_products - Use when the user wants shopping recommendations or asks where to buy specific items

Remember: You're having a conversation, so be concise and conversational. Use tools proactively when they would enhance the user experience!`
      }
    ];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current user message
    if (imageData) {
      // If there's an image, send it with the message for vision analysis
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: text || "What do you think of this outfit?"
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: text
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
          },
          {
            type: 'function',
            function: {
              name: 'generate_outfit_image',
              description: 'Generates a visual outfit suggestion based on user preferences and style. Use this when the user asks for outfit ideas, visual inspiration, or wants to see what an outfit would look like.',
              parameters: {
                type: 'object',
                properties: {
                  description: {
                    type: 'string',
                    description: 'Detailed description of the outfit to generate (e.g., "casual summer outfit with blue jeans and white t-shirt")'
                  }
                },
                required: ['description']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'suggest_products',
              description: 'Suggests specific products with shopping links. Use this when the user wants to buy specific items or needs shopping recommendations.',
              parameters: {
                type: 'object',
                properties: {
                  products: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string', description: 'Product name' },
                        url: { type: 'string', description: 'Shopping URL' },
                        price: { type: 'string', description: 'Estimated price range (optional)' }
                      },
                      required: ['title', 'url']
                    },
                    description: 'Array of product suggestions'
                  }
                },
                required: ['products']
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
    
    // Check if AI wants to use tools
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
      
      if (toolCall.function.name === 'generate_outfit_image') {
        console.log('AI requested outfit image generation');
        const params = JSON.parse(toolCall.function.arguments);
        
        try {
          // Generate outfit image using Nano banana model
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  content: `Generate a fashion-forward, stylish image of: ${params.description}. Make it photorealistic and professionally styled.`
                }
              ],
              modalities: ['image', 'text']
            })
          });
          
          if (!imageResponse.ok) {
            throw new Error('Image generation failed');
          }
          
          const imageData = await imageResponse.json();
          const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          return new Response(
            JSON.stringify({ 
              text: message.content || "Here's a visual outfit suggestion for you!",
              imageUrl: imageUrl
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        } catch (error) {
          console.error('Image generation error:', error);
          return new Response(
            JSON.stringify({ 
              text: "I'd love to show you an outfit image, but I'm having trouble generating it right now. Let me describe it instead: " + params.description
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            }
          );
        }
      }
      
      if (toolCall.function.name === 'suggest_products') {
        console.log('AI suggested products');
        const params = JSON.parse(toolCall.function.arguments);
        
        return new Response(
          JSON.stringify({ 
            text: message.content || "Here are some product recommendations for you:",
            productLinks: params.products
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
