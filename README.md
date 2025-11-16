MiraAI: Your Personal AI Fashion Stylist

## Inspiration
We were inspired by the universal daily dilemma we face everyday standing in front of your closet, overwhelmed, wondering "What should I wear?" Traditional styling is expensive and inconvenient. We wanted to build an accessible, intelligent, and real-time solution that makes fashion advice as easy as talking to your mirror.

## What it does
MiraAI is your live, personal AI fashion stylist delivered via a web app. It offers:
1. Image Upload & Query: Upload a photo, speak your fashion question, and get intelligent, voiced advice from MiraAI.

2. Live Video & Gesture Detection: Activate your camera, hold up clothes for real-time item detection, give a thumbs-up to snap a pic, and receive instant, live outfit analysis based on what you're wearing.

3. Conversational AI Styling: Talk naturally to MiraAI for tips, suggestions, and wardrobe insights, receiving spoken replies just like a human stylist.

## How we built it
1. Frontend: We utilized Lovable App to construct the interactive web user interface, which allowed for a smooth and efficient development process.

2. Live Video & Vision: For camera integration and real-time clothing identification, we leveraged custom computer vision models (OpenCV2 for object detection).

3. AI Styling Brain: Google's Gemini API served as the core artificial intelligence for advanced natural language understanding, fashion intelligence, and generating all stylist responses.

4. Voice Interaction: ElevenLabs API was integrated for both accurate Speech-to-Text (to process user's spoken queries) and high-quality, natural Text-to-Speech (to voice MiraAI's intelligent responses).

5. Backend/Data: Python was used for all core logic and orchestrating the API integrations.
## Challenges we ran into
The most challenging part of this project was the live video integration and text to speech and speech to text using ElevenLabs. ElevenLabs only lets you use a free trial and have voice for 10 mins - this required us to create new accounts for utilizing that API several times during our testing.

## Accomplishments that we're proud of
We're incredibly proud of achieving truly live, conversational, and visually-aware AI styling, all built rapidly with Lovable App. Seamlessly integrating real-time camera feeds, gesture detection, sophisticated AI (Gemini), and natural voice (ElevenLabs) into a single, functional web app is a massive accomplishment. We're especially proud of the initial style quiz that immediately customizes the user's experience, laying the foundation for truly personalized fashion advice from day one.

## What we learned
We gained valuable insights into rapidly developing a feature-rich frontend using Lovable App's capabilities, proving its efficiency for interactive solutions. We also deepened our understanding of orchestrating complex API interactions with Gemini and ElevenLabs to create a highly responsive, engaging, and genuinely conversational AI experience that transcends typical text-based chatbots.

## What's next for MiraAI

1. Expand User Profiles: Build out secure user accounts for persistent virtual wardrobes and detailed style profiles, continuously refined by the initial quiz and ongoing interactions.

2. Advanced Personalization: Leverage Gemini's learning capabilities to dynamically adapt recommendations based on user feedback and evolving trends, moving beyond the initial quiz.

3. Trend Integration: Integrate real-time fashion trend APIs to offer even more current and stylish suggestions.

4. Community & Sharing: Explore features for users to share outfits, get community feedback, and discover new styles within the MiraAI ecosystem.

