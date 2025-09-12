This page gives an introduction to using the Chat API via the Python SDK `"reka-api>=2.0.0"`.

<Callout intent="info">
Find the documentation for [API v0](/chat/api-versioning) (Python SDK < 2.0.0) at: https://v0.docs.reka.ai/.
</Callout>

## Quickstart

First, obtain an API key by setting up an account in the [Reka Platform](https://platform.reka.ai).

Then, install the [Reka Python SDK](https://pypi.org/project/reka-api/) with `pip install "reka-api>=2.0.0"`.

You can then use your API key to query the models:

```python
from reka.client import Reka

# You can also set the API key using the REKA_API_KEY environment variable.
client = Reka(api_key="YOUR_API_KEY")

response = client.chat.create(
    messages=[
        {
            "content": "What is the fifth prime number?",
            "role": "user",
        }
    ],
    model="reka-core-20240501",
)
print(response.responses[0].message.content)
```

This will print a response like:

> The fifth prime number is 11. Here's a quick breakdown of the first five prime numbers in order: 2, 3, 5, 7, 11.

## Single Turn Prompting

A simple single turn request can be made as follows:

```python
from reka.client import Reka

# You can also set the API key using the REKA_API_KEY environment variable.
client = Reka(api_key="YOUR_API_KEY")

response = client.chat.create(
    messages=[
        {
            "content": "Write a python one-liner to flatten a list of lists.",
            "role": "user",
        }
    ],
    model="reka-core-20240501",
)
print(response.responses[0].message.content)
```

This will return a response like:

````
Here's a Python one-liner using list comprehension to flatten a list of lists:

```python
flattened_list = [item for sublist in nested_list for item in sublist]
```

Replace `nested_list` with your actual list of lists. This one-liner works by iterating over each sublist in the outer list, and then iterating over each item in those sublists, effectively flattening the structure into a single list.
````

See [Available Models](/chat/models) for details on valid model names.

## Multiple Turn Conversations

You can request a response to a multiple turn conversation by adding more messages in the history. For example:

```python maxLines=22
from reka.client import Reka

client = Reka(api_key="YOUR_API_KEY")

response = client.chat.create(
    messages=[
        {
            "content": "My name is Matt.",
            "role": "user",
        },
        {
            "content": "Hello Matt! How can I help you today?",
            "role": "assistant",
        },
        {
            "content": "Can you think of a couple of famous people with the same name as me?",
            "role": "user",
        },
    ],
    model="reka-core-20240501",
)
print(response.responses[0].message.content)
```

This will return a response like:

```plaintext
 Certainly, Matt is a popular name, and there are several famous individuals with that name across various fields. Here are a few:

1. **Matt Damon** - An acclaimed actor known for his roles in movies like "Good Will Hunting," the "Bourne" series, and "The Martian."
2. **Matt LeBlanc** - An actor best known for playing Joey Tribbiani on the television series "Friends" and for hosting "Top Gear."
3. **Matt Groening** - The creator of the iconic animated television series "The Simpsons" and "Futurama."
4. **Matt Smith** - An actor who played the Eleventh Doctor in the British television series "Doctor Who" and has also starred in "The Crown."
5. **Matt Bomer** - An actor, producer, and director known for his roles in "White Collar," "Magic Mike," and "The Normal Heart."
6. **Matt Ryan** - An actor known for his role as John Constantine in the television series "Constantine" and for voicing the character in various video games.

These are just a few examples of the many famous Matts out there. Each has made significant contributions to their respective fields.
```

## Assistant Completions

We support guiding the assistant output (e.g. prompting it to output a structured JSON response), by allowing the developer to specify how the assistant response should start. This is done by adding a partial assistant response as the last message:

````python maxLines=42 {29-35}
from reka.client import Reka

client = Reka(api_key="YOUR_API_KEY")

prompt = """
Below is a paragraph from wikipedia:

The Solar System is the gravitationally bound system of the Sun and the objects that orbit it.
The largest of such objects are the eight planets, in order from the Sun: four terrestrial planets named Mercury,
Venus, Earth and Mars, two gas giants named Jupiter and Saturn, and two ice giants named Uranus and Neptune.
The terrestrial planets have a definite surface and are mostly made of rock and metal. The gas giants are
mostly made of hydrogen and helium, while the ice giants are mostly made of 'volatile' substances such as water,
ammonia, and methane. In some texts, these terrestrial and giant planets are called the inner Solar System and outer
Solar System planets respectively.

Extract information about the planets from this paragraph as a JSON list of objects with keys 'planetName' and
'composition'. The 'composition' key should contain one or two words, and there should be no other keys.
""".strip()

json_prefix = """
[
    {
        "planetName":
""".strip()

response = client.chat.create(
    messages=[
        {"role": "user", "content": prompt},
        {
            "role": "assistant",
            "content": (
                "Sure, here is a JSON object conforming to that format:\n\n"
                f"```json\n{json_prefix}"
            ),
        },
    ],
    max_tokens=512,
    temperature=0.4,
    stop=["```\n"],
    model="reka-core-20240501",
)
print(json_prefix + response.responses[0].message.content)
````

This will output:

```json maxLines=34
[
  {
    "planetName": "Mercury",
    "composition": "rock, metal"
  },
  {
    "planetName": "Venus",
    "composition": "rock, metal"
  },
  {
    "planetName": "Earth",
    "composition": "rock, metal"
  },
  {
    "planetName": "Mars",
    "composition": "rock, metal"
  },
  {
    "planetName": "Jupiter",
    "composition": "hydrogen, helium"
  },
  {
    "planetName": "Saturn",
    "composition": "hydrogen, helium"
  },
  {
    "planetName": "Uranus",
    "composition": "water, ammonia, methane"
  },
  {
    "planetName": "Neptune",
    "composition": "water, ammonia, methane"
  }
]
```

## Useful Parameters

The parameters of the Chat API are [fully documented in the API reference](/chat/api-reference/), but some particularly useful parameters are listed below:

- **temperature**: Typically between 0 and 1. Values close to 0 will result in less varied generations, and higher values will result in more variation and creativity.
- **max_tokens**: The maximum number of tokens that should be returned. Increase this if generations are being truncated, i.e. the [`finish_reason`](/chat/api-reference/create#response.body.responses.finish_reason) in the response is `"length"`.
- **stop**: A list of strings that should stop the generation. This can be used to stop after generating a code block, when reaching a certain number in a list etc.

## Streaming

The Chat API supports streaming with the `chat_stream` function in the Python SDK,
or by setting [`stream`](/chat/api-reference/create#request.body.stream) to `true` in the HTTP API. Below is an example of streaming in Python:

```python {5}
from reka.client import Reka

client = Reka(api_key="YOUR_API_KEY")

response = client.chat.create_stream(
    messages=[
        ChatMessage(
            content="Write a detailed template NDA contract between two parties.",
            role="user",
        )
    ],
    max_tokens=2048,
    model="reka-core-20240501",
)

for chunk in response:
    print(chunk.responses[0].chunk.content)
```

## Async

The Python SDK also exports an async client so that you can make non-blocking calls to our API. This can be useful to make batch requests. The following code illustrates how to batch calls to the API, by creating a list of async tasks, and gathering them with `asyncio.gather`. The `Semaphore` limits the number of concurrent requests to the API.

```python maxLines=35
import asyncio
from reka.client import AsyncReka

client = AsyncReka(api_key="YOUR_API_KEY")
max_concurrent_requests = 2
semaphore = asyncio.Semaphore(max_concurrent_requests)

async def respond(prompt: str) -> str:
    async with semaphore:
        response = await client.chat.create(
            messages=[
                {
                    "content": prompt,
                    "role": "user",
                }
            ],
            model="reka-flash",
        )
    return response.responses[0].message

async def main():
    prompts = [
        "What is your name?",
        "What is the fifth prime number?",
        "Write a python one-liner to flatten a list of lists.",
    ]
    responses = await asyncio.gather(*[respond(prompt) for prompt in prompts])
    return responses

asyncio.run(main())
```
