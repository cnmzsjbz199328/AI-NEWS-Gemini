# CosyVoice API Documentation

This document provides instructions on how to programmatically interact with the CosyVoice AI Voice Generation API, which is powered by the `iic-cosyvoice-300m` model. The API allows for text-to-speech synthesis using preset voices, voice cloning from an audio sample, and advanced vocal style control.

**Base URL**: `https://iic-cosyvoice-300m.ms.show/`

---

## Client Setup

To interact with the API, you can use the official Gradio client libraries for Python or JavaScript/TypeScript.

### Python
```bash
pip install gradio_client
```

### JavaScript/TypeScript
```bash
npm install @gradio/client
```

---

## API Endpoints

### 1. Generate Audio with a Preset Voice

Creates audio from text using a pre-defined voice.

- **API Name**: `/generate_audio`

#### Parameters

| Parameter                   | Type   | Required | Description                                                                                             |
| --------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------- |
| `_sound_radio`              | String | Yes      | The preset voice to use. Possible values: `'中文女'`, `'中文男'`, `'英文女'`, `'英文男'`, `'日语男'`, `'粤语女'`, `'韩语女'`. |
| `_synthetic_input_textbox`  | String | Yes      | The text to be converted to speech.                                                                     |
| `_seed`                     | Number | Yes      | A seed for reproducibility. Use `0` or a random integer for varied results.                             |

#### Example Usage

**JavaScript/TypeScript (`@gradio/client`)**
```javascript
import { client } from "@gradio/client";

const app = await client("https://iic-cosyvoice-300m.ms.show/");
const result = await app.predict("/generate_audio", [
	"中文女",                                   // _sound_radio
	"你好，这是一个由AI生成的语音。",              // _synthetic_input_textbox
	Math.floor(Math.random() * 10000)         // _seed
]);

// result.data[0].url contains the full URL to the generated audio file
console.log("Audio URL:", result.data[0].url);
```

**Python (`gradio_client`)**
```python
from gradio_client import Client

client = Client("https://iic-cosyvoice-300m.ms.show/")
result = client.predict(
	_sound_radio="中文女",
	_synthetic_input_textbox="你好，这是一个由AI生成的语音。",
	_seed=12345,
	api_name="/generate_audio"
)

# The result is the temporary filepath to the generated audio
print("Audio file path:", result)
```

---

### 2. Generate Audio with a Cloned Voice

Clones a voice from an audio sample and uses it to synthesize new text.

- **API Name**: `/generate_audio_1`

#### Parameters

| Parameter                   | Type   | Required | Description                                                                                   |
| --------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------- |
| `_recorded_audio`           | File   | Yes      | The audio file sample (e.g., WAV, MP3) to clone. Should be a clear sample of at least 3 seconds. |
| `_prompt_input_textbox`     | String | Yes      | The exact text transcription of what is spoken in the `_recorded_audio` file.                 |
| `_language_radio`           | String | Yes      | Language mode. Use `'same'` for same-language synthesis.                                      |
| `_synthetic_input_textbox`  | String | Yes      | The new text to synthesize using the cloned voice.                                            |
| `_seed`                     | Number | Yes      | A seed for reproducibility.                                                                   |

#### Example Usage

**JavaScript/TypeScript (`@gradio/client`)**
```javascript
import { client, upload } from "@gradio/client";

// This assumes 'audioFile' is a File object from a file input or a created Blob
const audioFile = new File(["..."], "sample.wav", { type: "audio/wav" });
const audioForApi = await upload(audioFile);

const app = await client("https://iic-cosyvoice-300m.ms.show/");
const result = await app.predict("/generate_audio_1", [
	audioForApi,                                    // _recorded_audio
	"The quick brown fox jumps over the lazy dog.", // _prompt_input_textbox
	"same",                                         // _language_radio
	"This is a new sentence with the cloned voice.",// _synthetic_input_textbox
	54321                                           // _seed
]);

console.log("Audio URL:", result.data[0].url);
```

**Python (`gradio_client`)**
```python
from gradio_client import Client, file

client = Client("https://iic-cosyvoice-300m.ms.show/")
result = client.predict(
	_recorded_audio=file('path/to/your/sample.wav'),
	_prompt_input_textbox="The quick brown fox jumps over the lazy dog.",
	_language_radio="same",
	_synthetic_input_textbox="This is a new sentence with the cloned voice.",
	_seed=54321,
	api_name="/generate_audio_1"
)
print("Audio file path:", result)
```

---

### 3. Generate Audio with Advanced Style Control

Creates audio from text using a base voice combined with a descriptive text prompt for style.

- **API Name**: `/generate_audio_2`

#### Parameters

| Parameter                   | Type   | Required | Description                                                                                             |
| --------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------- |
| `_sound_radio`              | String | Yes      | The base voice to use. Possible values: `'中文女'`, `'中文男'`, `'日语男'`, `'英文女'`, `'英文男'`, `'粤语女'`, `'韩语女'`. |
| `_speech_status_textbox`    | String | Yes      | A description of the desired vocal style (e.g., "A happy and energetic voice", "whispering softly").    |
| `_synthetic_input_textbox`  | String | Yes      | The text to be converted to speech.                                                                     |
| `_seed`                     | Number | Yes      | A seed for reproducibility.                                                                   |

#### Example Usage

**JavaScript/TypeScript (`@gradio/client`)**
```javascript
import { client } from "@gradio/client";

const app = await client("https://iic-cosyvoice-300m.ms.show/");
const result = await app.predict("/generate_audio_2", [
	"英文女",                                 // _sound_radio
	"A deep, dramatic narrator voice",      // _speech_status_textbox
	"In a world of code, one model stood alone.", // _synthetic_input_textbox
	98765                                   // _seed
]);

console.log("Audio URL:", result.data[0].url);
```

**Python (`gradio_client`)**
```python
from gradio_client import Client

client = Client("https://iic-cosyvoice-300m.ms.show/")
result = client.predict(
	_sound_radio="英文女",
	_speech_status_textbox="A deep, dramatic narrator voice",
	_synthetic_input_textbox="In a world of code, one model stood alone.",
	_seed=98765,
	api_name="/generate_audio_2"
)
print("Audio file path:", result)
```

---

### 4. Utility: Get Random Seed

Fetches a random seed value from the server. Each generation mode has a corresponding endpoint for fetching a seed.

- **API Names**: `/random_seed`, `/random_seed_1`, `/random_seed_2`

#### Parameters
None.

#### Example Usage

**JavaScript/TypeScript (`@gradio/client`)**
```javascript
import { client } from "@gradio/client";

const app = await client("https://iic-cosyvoice-300m.ms.show/");
// Corresponds to the "Preset Voice" mode
const result = await app.predict("/random_seed", []); 

const seed = result.data[0];
console.log("Random Seed:", seed);
```

**Python (`gradio_client`)**
```python
from gradio_client import Client

client = Client("https://iic-cosyvoice-300m.ms.show/")
# Corresponds to the "Preset Voice" mode
result = client.predict(api_name="/random_seed")

print("Random Seed:", result)
```
