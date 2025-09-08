# English Reading Backend

This is the backend service for the English Reading application, built to run on the Cloudflare Workers serverless platform. It provides APIs for Text-to-Speech (TTS) generation, article processing, and other related features.

## Features

- **Text-to-Speech (TTS):** Dynamically generates high-quality audio from text.
- **VOA Article Fetching:** Fetches and processes articles from Voice of America.
- **Cloudflare Native:** Built with Hono and designed to leverage the Cloudflare ecosystem (Workers, R2 Storage, D1 Database).

## Technology Stack

- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Language:** TypeScript
- **Storage:** Cloudflare R2 for audio files and assets.
- **Database:** Cloudflare D1 for metadata.
- **TTS Provider:** Google Cloud Text-to-Speech API

---

## TTS Implementation: Technical Details

The Text-to-Speech (TTS) functionality is a core component of this backend, handled by the `TTSService` class. It is designed to be secure, efficient, and to produce high-quality audio by integrating directly with the Google Cloud Text-to-Speech API.

### 1. Authentication

Since the service runs in a serverless environment (Cloudflare Workers) without direct access to a filesystem for service account keys, authentication is handled programmatically using a JWT (JSON Web Token).

- **Credentials:** The service uses a Google Cloud service account's `client_email` and `private_key`, stored securely as environment variables (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`).
- **JWT Generation:** A JWT is created and signed using the `RSASSA-PKCS1-v1_5` algorithm with SHA-256. This process is handled by the Web Crypto API (`crypto.subtle`) available in the Cloudflare Workers runtime.
- **Token Exchange:** The generated JWT is then sent to the Google OAuth2 token endpoint (`https://oauth2.googleapis.com/token`). Google verifies the JWT and returns a short-lived `access_token`.
- **API Authentication:** This `access_token` is then used as a Bearer token in the `Authorization` header for all subsequent requests to the Google Cloud TTS API.

This entire flow is implemented in the `getAccessToken` and `generateJWT` methods within `TTSService`, providing a robust and secure way to authenticate from a serverless function.

### 2. Voice Selection (`pickBestVoice`)

To ensure the best possible audio quality, the service includes an intelligent voice selection mechanism.

- **Dynamic Fetching:** When a TTS request is made with `voice: 'auto'`, the service first calls the `/v1/voices` endpoint of the TTS API to get a list of all available voices for the specified language.
- **Prioritized Ranking:** It then sorts the returned voices based on a predefined quality priority list. The current priority is:
  1.  `Studio`
  2.  `Chirp HD`
  3.  `Neural2`
- **Selection:** The highest-ranking voice for the target language is automatically chosen for the synthesis request. This ensures that users always benefit from Google's latest and most advanced voice models without needing to specify them manually.

### 3. API Endpoints

The TTS functionality is exposed through the `/tts` route, handled by Hono.

-   **`POST /tts/preview`**:
    -   Accepts a JSON body with parameters like `text`, `language`, `voice`, `rate`, and `pitch`.
    -   Calls the `synthesize` method in `TTSService`.
    -   The service then performs the authentication and voice selection flow described above.
    -   It calls the `v1/text:synthesize` endpoint with the chosen parameters.
    -   The resulting audio content (as a base64 string from Google) is decoded into a `Uint8Array` and streamed back to the client with the appropriate `Content-Type` (e.g., `audio/mpeg`).

-   **`GET /tts/voices`**:
    -   Allows the frontend to fetch a list of available voices for a specific language (e.g., `?language=en-US`).
    -   This enables UI features like a voice selection dropdown for the user.

### 4. Code Structure

-   **`src/handlers/tts.ts`**: Contains the Hono router, defines the API endpoints, handles incoming request validation, and calls the `TTSService`.
-   **`src/lib/tts-service.ts`**: The core of the TTS logic. This class is responsible for authentication, voice selection, and direct communication with the Google Cloud API. It is completely decoupled from the Hono framework, making it portable and easy to test.

## Setup and Deployment

1.  **Prerequisites:**
    -   Node.js and npm installed.
    -   A Cloudflare account with Wrangler CLI configured.

2.  **Installation:**
    ```bash
    npm install
    ```

3.  **Configuration:**
    -   Create a `.env` file by copying `.env.local`.
    -   Create a Google Cloud Service Account with the "Cloud Text-to-Speech API User" role.
    -   Generate a JSON private key for the service account.
    -   Populate `.env` with the following secrets:
        -   `GOOGLE_CLIENT_EMAIL`: The `client_email` from the JSON key.
        -   `GOOGLE_PRIVATE_KEY`: The `private_key` from the JSON key.
        -   Configure D1 and R2 bindings as needed.

4.  **Local Development:**
    ```bash
    npm run dev
    ```

5.  **Deployment:**
    ```bash
    npm run deploy
    ```
# Google Cloud credentials copied from tts.js file
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD2cP/WN8z8J2r1\nCDIa6eGx/+stbW70a/FVLZVkkFAHtoKKL0epanr5/yiJwVgurAZqlbLCkWJ41SsT\nUBYY16x2Y8ydKL/vuSm2J7oMpcxDl0nO76cELhqmiG7LvQppiN46ngmywFeL/IUO\nPHfbfziANgPTggWJ+wUBHtjR0UVsXIp3MV0AxK4FFulCvV0Mb93eQm0Sktq5fxul\nauL0KDs5K42FzJ7gBHVeBkSQ1AGbe3KnmmtisDTDif3wA28F3xKTvgKlAGto0eTo\n6UIUYBEkUX61/lqchsIP1avCeAwIFL/FGY9XDwiZ/oLoc8L20YBlWlpt05f4EcTB\n18M3hCtjAgMBAAECggEABnBfZDPNtEznW4LyTt0LhkC/M/mnANXigVeROVvCljZW\nOia6wu9tn83jO5jZ+qYzU2JD6xeCBibeWuvTF/pn9ClECwXUi1Pq22qK+ZJKFaiv\nR1aK+5ikyPMe9KMk0YBqULJuYxrpbqvot2gsYtzJF3h8fcXo6nkCNsxH3VDldSD3\nZlxdQ/kHZ84prnWOH094xb78EvEQngJpHdGDhnKOx4IUPhvs6h95TEeBwoYiT1ec\nL5/poFKUHhjGtrxVoxa9oDIySXVvUtlSBHpylbv56APhm/8iMLIiQ3FHXfy6IEfz\nIBYDvEcQ2BMdTWA0do0D7X36CgRXS20MQ8EZ4x4rqQKBgQD8lFQkU0+IqsKRxjIH\nwPZg6jBAbke1FLbgfmwl4jRA/bnyLoEKBK+SRwM+hyVRwCbiVhWDC7lmglkK0WiZ\n7w5WB2wrSK7cPgT3m2IGnWsuJl8M8c416ihX1xmFz9PJstW4edLlO8L9ba3ZVaDP\nsT9vyofA4QeqMQwZJC3+JORVdQKBgQD5x2QHo8um5cf8GL16vZtDdizpoBYwZZZ6\nNWcXLT/9tfVOkVPM9pU12iSn8hOgb7/g0OGpdpQRR+KJ16IaMje8wcTWRBc8TL2/\nVe47FrEqWzgej5nqBGXYqx+yPfo07SFqdZ1NuDSz8RFqdaUTpqBlP2P8xYBVRM2a\nWlT0iEZqdwKBgQDeawPZZR+herWRxtUhrNOJLlDFPBebJx2PfORhS9u163iGAluR\nZeTxy+TYeAvt/GaBY0rYNkfSNDCS7SrOewvFyA2B5CRPP7ICFOtyZccPQazr6jcr\nlQJnr7wC8KtQb1HyfByxzjl8D8xKmTPeEPiKye9XcxHb1gsQTKLPrM8BTQKBgFdV\ny3kMYZHauEFCWUZIc7hz4qJRklCbxLC4aXJmJQDOFZbCI73/3g41VynN7+TiDgJK\npwy85Griaqht2EU2l9yNGAkfR8ySvKnhHupUNeAsgwPUjCmSHhZTR0LofsrwuwVh\nWH4rUWo1eTRzLCQh1+Vu88QXPpcR9p3oxdm2qIBjAoGBAIEgKqWxbqtiuc94XVOt\n3HjITkMbLRVZeof30GsRuKadds4EXT+k8Z6H7Qa9Miem+tQED5LVq1Rmd3BOtNkF\nLQplJ/xRe7sfqr941Ss1M0NvDVyNr3+hBZ/Pp4zqDV86uUO9Ot1AV+nyjlcdwLxD\ntfwMQsKWndrfgHcbXBCB7gar\n-----END PRIVATE KEY-----"

GOOGLE_CLIENT_EMAIL="tangjiang199328@gen-lang-client-0346700592.iam.gserviceaccount.com"
