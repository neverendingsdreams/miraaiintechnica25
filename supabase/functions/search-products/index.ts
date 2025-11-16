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
    const { searchTerm } = await req.json();

    if (!searchTerm) {
      throw new Error('Search term is required');
    }

    console.log('Searching for products:', searchTerm);

    // Use Google search to find product links from popular fashion sites
    const searchQuery = encodeURIComponent(`${searchTerm} site:zara.com OR site:hm.com OR site:asos.com OR site:gap.com`);
    const searchUrl = `https://www.google.com/search?q=${searchQuery}&tbm=shop`;
    
    console.log('Search URL:', searchUrl);

    // Since we can't directly scrape Google Shopping, we'll create mock products
    // In production, you would use a proper scraping service or API
    const mockProducts = [
      {
        title: `${searchTerm} - Premium Quality`,
        price: `$${Math.floor(Math.random() * 50 + 30)}`,
        image_url: `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=400&fit=crop`,
        product_url: `https://www.zara.com/search?searchTerm=${encodeURIComponent(searchTerm)}`,
        store_name: 'Zara'
      },
      {
        title: `${searchTerm} - Trendy Style`,
        price: `$${Math.floor(Math.random() * 40 + 25)}`,
        image_url: `https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop`,
        product_url: `https://www2.hm.com/en_us/search-results.html?q=${encodeURIComponent(searchTerm)}`,
        store_name: 'H&M'
      },
      {
        title: `${searchTerm} - Classic Design`,
        price: `$${Math.floor(Math.random() * 60 + 35)}`,
        image_url: `https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop`,
        product_url: `https://www.asos.com/search/?q=${encodeURIComponent(searchTerm)}`,
        store_name: 'ASOS'
      }
    ];

    console.log('Found products:', mockProducts.length);

    return new Response(
      JSON.stringify({ products: mockProducts }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in search-products:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        products: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
