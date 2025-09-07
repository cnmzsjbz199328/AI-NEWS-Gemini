

# Mumble Jumble: A Gemini Voice & Image Playground

Mumble Jumble is an interactive web application designed to showcase the creative capabilities of the Google Gemini API, particularly its native audio and image generation features. Users can craft unique AI characters by combining various attributes—such as personality, role, mood, and speaking style—and then engage in real-time voice conversations with them.

## Core Technologies

- **Frontend Framework:** [Vue.js 3](https://vuejs.org/) (with the Composition API) for a reactive and component-based UI.
- **AI/ML API:** [Google Gemini API (`@google/genai`)](https://ai.google.dev/) for all generative functionalities.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) for rapid and responsive UI development.
- **Web APIs:**
  - **Web Audio API:** For capturing microphone input and playing back synthesized audio streams.
  - **Fetch API:** For retrieving static assets.
  - **Clipboard API:** For the "Share" functionality.

## Key Features

- **Dynamic Character Creation:** Users can select from dozens of combinations of character types, roles (e.g., Pirate, Cowboy), moods (e.g., Happy, Angry), and speaking styles (e.g., Whispering, Slam Poetry) to create a distinct persona.
- **Real-time Voice Conversation:** Leverages Gemini's streaming audio capabilities for low-latency, interruptible, two-way voice chat.
- **AI-Powered Image Generation:** Each character persona is visually represented by a unique, AI-generated image in a consistent "claymation" style.
- **Advanced Prompt Engineering:** The application dynamically constructs highly detailed prompts for both voice and image generation based on user selections to ensure a coherent and high-quality experience.
- **Responsive Design:** A mobile-first UI that adapts seamlessly to desktop screen sizes.
- **Shareable Characters:** Users can share their unique character creations via a URL.
- **"I'm Feeling Lucky":** A feature to instantly generate a completely random character for quick discovery.

---

## Technical Deep Dive

### 1. Voice Generation & Real-time Interaction

The core of the application is the live, streaming conversation. This is achieved using the `live.connect` method from the Gemini API, which establishes a persistent bidirectional connection.

**Model Used:** `gemini-2.5-flash-preview-native-audio-dialog`

**Implementation Steps:**

1.  **Connection:** A `Session` is established with `client.live.connect`. This setup includes callbacks for handling server messages (`onmessage`), errors (`onerror`), and connection state changes.
2.  **Microphone Input:**
    - The **Web Audio API** (`navigator.mediaDevices.getUserMedia`) is used to request microphone access.
    - An `AudioContext` (at a 16kHz sample rate to match the model's requirement) is created.
    - The microphone's `MediaStream` is routed through an `AnalyserNode` (for visualization) and a `ScriptProcessorNode`.
    - The `onaudioprocess` event of the `ScriptProcessorNode` captures raw audio chunks as `Float32Array` data.
3.  **Audio Processing & Streaming (Client -> Server):**
    - The raw `Float32Array` data is converted to 16-bit PCM (Pulse-Code Modulation) format.
    - This PCM data is then Base64 encoded.
    - The encoded audio chunk is sent to the Gemini server via `session.sendRealtimeInput`. This happens continuously as the user speaks.
4.  **Prompting for Voice:**
    - A detailed system prompt is constructed by combining the text attributes of the selected **Character**, **Role**, **Mood**, and **Style**.
    - This master prompt provides the model with a comprehensive backstory, personality traits, vocal instructions (e.g., "speak like a swashbuckling pirate"), and strict behavioral rules (e.g., "NEVER break character").
    - The initial message is sent using `session.sendClientContent`, which includes the detailed prompt and a simple instruction like "Just say a very short introduction."
5.  **Receiving & Playing Audio (Server -> Client):**
    - The server streams back audio chunks in the `onmessage` callback. Each message contains a Base64 encoded audio payload.
    - The payload is decoded from Base64 into a `Uint8Array`.
    - This array is converted into an `AudioBuffer` using `outputAudioContext.decodeAudioData`.
    - To ensure seamless, gapless playback, each new `AudioBufferSourceNode` is scheduled to start precisely when the previous one finishes, managed by a `nextStartTime` variable.
    - The output audio is also routed through its own `AnalyserNode` to power the "system" side of the waveform visualizer.
6.  **Interruptibility:** The `realtimeInputConfig` is configured with `startOfSpeechSensitivity`. This allows the model to detect when the user starts speaking and gracefully stop its own output, creating a natural, fluid conversation flow.

### 2. "Claymation" Image Generation

The application generates a unique visual representation for each character. This is not an animation but a carefully prompted static image.

**Model Used:** `imagen-3.0-generate-002`

**Prompt Engineering Strategy:**

The image prompt is a masterclass in specificity, designed to force the model into a very particular artistic style. Key components include:

-   **Core Subject:** Dynamically built from user selections (e.g., "A dog with floppy ears... who is beaming with a smile... and looks like a pirate wearing a weathered tricorn hat").
-   **Artistic Style:** Explicitly demands a "whimsical, minimalist style" where the character appears "handcrafted from realistic modeling clay."
-   **Texture & Imperfection:** Instructions to include "textual imperfections like well defined prominant fingerprints, strong rough bump mapping with clay texture, or small mistakes" to enhance the realism of the clay effect.
-   **Geometric Constraints:** "All forms must be constructed from simple, clearly defined geometric shapes with visibly rounded edges and corners... Avoid any sharp points or harsh angles."
-   **Composition & Staging:** Demands a "full shot, centered against a stark, clean white background" with "ample negative space" and a "solid-colored warm shadow." This ensures consistency and makes the characters feel like collectible figures.
-   **The "Googly Eyes" Mandate:** The prompt contains a highly detailed paragraph exclusively describing the eyes. It specifies "realistic plastic googly eyes (also called wiggle eyes) with diffused specular highlights," detailing their construction, reflectivity, and "slightly uneven, handmade placement." This single, hyper-specific instruction is critical for achieving the app's signature aesthetic.
-   **Negative Constraints:** The prompt includes rules like "DO NOT JUST STAND STRAIGHT FACING THE CAMERA! DO NOT BE BORING!" to encourage dynamic poses.

**Image Validation:**

-   The API is asked to generate 3 candidate images.
-   A client-side function (`checkKeyPixels`) draws each image to a temporary canvas and inspects the color of key pixels (corners and edges).
-   This is used to automatically discard common failure cases, like all-black or corrupted images, ensuring a higher quality result is shown to the user.

### 3. UI/UX & State Management

-   **Reactivity:** Vue 3's Composition API (`ref`, `computed`, `watch`) is used extensively to manage the application's state. When a user clicks a character option, a `ref` is updated, which automatically triggers `computed` properties to rebuild the prompts and `watchers` to initiate the generation process.
-   **Visual Feedback:**
    -   **Waveform:** The dual-waveform display, powered by the Web Audio API's `AnalyserNode`, provides real-time visual feedback on both the user's input and the AI's output audio levels.
    -   **Loading States:** Skeletons, spinners, and pulsing animations are used to provide clear feedback during model connection and image generation phases. A pre-loaded "generating" video cleverly masks the image generation latency.
-   **Claymojis:** To enhance the tactile, clay-like theme, all selection buttons are pre-rendered into a single sprite sheet (`claymojis.png`). These are then drawn to individual canvases on the client, which is more performant than loading dozens of separate images.