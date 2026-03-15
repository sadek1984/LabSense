# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import asyncio
import json
import logging
import inspect
import requests as _requests
from typing import Optional, List, Dict, Callable

from google import genai
from google.genai import types
from google.oauth2 import service_account

logger = logging.getLogger(__name__)


class GeminiLive:
    def __init__(self, project_id: str, location: str, model: str, input_sample_rate: int = 16000):
        self.project_id = project_id
        self.location = location
        self.input_sample_rate = input_sample_rate

        # ── Vertex AI model name mapping ──────────────────────────────────────
        # AI Studio model names are NOT valid on Vertex AI.
        # Map any known AI Studio names to the correct Vertex AI equivalents.
        VERTEX_MODEL_MAP = {
            "gemini-2.5-flash-native-audio-preview-12-2025": "gemini-live-2.5-flash-native-audio",
            "gemini-2.0-flash-exp":                          "gemini-live-2.5-flash-native-audio",
            "gemini-2.0-flash-001":                          "gemini-live-2.5-flash-native-audio",
            "gemini-2.0-flash-live-001":                     "gemini-live-2.5-flash-native-audio",
            "gemini-2.0-flash-live-preview":                 "gemini-live-2.5-flash-native-audio",
        }
        self.model = VERTEX_MODEL_MAP.get(model, model)

        print("🚀 GeminiLive initialized with:")
        print(f"  Project ID:   {project_id}")
        print(f"  Location:     {location}")
        print(f"  Model:        {self.model}  (requested: {model})")
        print(f"  Sample Rate:  {input_sample_rate}")

        # ── Vertex AI client via service account JSON ─────────────────────────
        _creds_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")

        if _creds_path and os.path.exists(_creds_path):
            _credentials = service_account.Credentials.from_service_account_file(
                _creds_path,
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            self.client = genai.Client(
                vertexai=True,
                project=project_id,
                location=location,
                credentials=_credentials,
                http_options={"api_version": "v1beta1"}
            )
            print(f"✅ Vertex AI client ready (service account: {_creds_path})")
        else:
            # Fallback: Application Default Credentials (works on Cloud Run automatically)
            self.client = genai.Client(
                vertexai=True,
                project=project_id,
                location=location,
                http_options={"api_version": "v1beta1"}
            )
            print("✅ Vertex AI client ready (Application Default Credentials)")

        # ── Tool registry ─────────────────────────────────────────────────────
        self.tool_mapping = {}

        # Register LARS as a server-side tool.
        # Calls the /api/lars/query HTTP endpoint (same FastAPI process).
        @self.register_tool
        def search_pesticide_data(question: str) -> str:
            """Search the pesticide residue database for any question."""
            try:
                resp = _requests.post(
                    "http://localhost:8080/api/lars/query",
                    json={"question": question},
                    timeout=30
                )
                data = resp.json()
                return data.get("answer", str(data))
            except Exception as e:
                return f"LARS query failed: {e}"

    # ─────────────────────────────────────────────────────────────────────────
    def register_tool(self, func: Callable):
        self.tool_mapping[func.__name__] = func
        return func

    # ─────────────────────────────────────────────────────────────────────────
    async def start_session(
        self,
        audio_input_queue: asyncio.Queue,
        video_input_queue: asyncio.Queue,
        text_input_queue: asyncio.Queue,
        audio_output_callback: Callable,
        audio_interrupt_callback: Optional[Callable] = None,
        setup_config: Optional[Dict] = None
    ):
        print("⚡️ setup_config", json.dumps(setup_config, indent=4))

        config_args = {
            "response_modalities": [types.Modality.AUDIO]
        }

        if setup_config:
            if "generation_config" in setup_config:
                gen_config = setup_config["generation_config"]
                if "response_modalities" in gen_config:
                    config_args["response_modalities"] = [
                        types.Modality(m) for m in gen_config["response_modalities"]
                    ]
                if "speech_config" in gen_config:
                    try:
                        voice_name = gen_config["speech_config"]["voice_config"]["prebuilt_voice_config"]["voice_name"]
                        config_args["speech_config"] = types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=voice_name)
                            )
                        )
                    except (KeyError, TypeError):
                        pass

            if "system_instruction" in setup_config:
                try:
                    text = setup_config["system_instruction"]["parts"][0]["text"]
                    config_args["system_instruction"] = types.Content(parts=[types.Part(text=text)])
                except (KeyError, IndexError, TypeError):
                    pass

            if "tools" in setup_config:
                try:
                    tool_config = setup_config["tools"]
                    if "function_declarations" in tool_config:
                        fds = []
                        for fd in tool_config["function_declarations"]:
                            fds.append(types.FunctionDeclaration(
                                name=fd.get("name"),
                                description=fd.get("description"),
                                parameters=fd.get("parameters")
                            ))
                        config_args["tools"] = [types.Tool(function_declarations=fds)]
                except Exception as e:
                    logger.warning(f"Error parsing tools config: {e}")

            if "output_audio_transcription" in setup_config:
                print("💬 output_audio_transcription ENABLED")
                config_args["output_audio_transcription"] = types.AudioTranscriptionConfig()
            if "input_audio_transcription" in setup_config:
                print("💬 input_audio_transcription ENABLED")
                config_args["input_audio_transcription"] = types.AudioTranscriptionConfig()

        config = types.LiveConnectConfig(**config_args)

        async with self.client.aio.live.connect(model=self.model, config=config) as session:

            async def send_audio():
                try:
                    while True:
                        chunk = await audio_input_queue.get()
                        await session.send_realtime_input(
                            audio=types.Blob(data=chunk, mime_type=f"audio/pcm;rate={self.input_sample_rate}")
                        )
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"send_audio error: {e}")

            async def send_video():
                try:
                    while True:
                        chunk = await video_input_queue.get()
                        await session.send_realtime_input(
                            video=types.Blob(data=chunk, mime_type="image/jpeg")
                        )
                except asyncio.CancelledError:
                    pass

            async def send_text():
                try:
                    while True:
                        text = await text_input_queue.get()
                        # Handle image blobs sent as JSON
                        try:
                            parsed = json.loads(text)
                            if isinstance(parsed, dict) and "_image" in parsed:
                                import base64 as b64
                                image_bytes = b64.b64decode(parsed["_image"])
                                mime_type = parsed.get("_mime", "image/jpeg")
                                await session.send_realtime_input(
                                    video=types.Blob(data=image_bytes, mime_type=mime_type)
                                )
                                await session.send_client_content(
                                    turns=types.Content(
                                        role="user",
                                        parts=[types.Part(text="I just sent you a photo. Describe what you see.")]
                                    ),
                                    turn_complete=True
                                )
                                continue

                            # Handle tool responses forwarded from the client browser
                            if isinstance(parsed, dict) and "tool_response" in parsed:
                                tool_response_data = parsed["tool_response"]
                                function_responses = []

                                responses_list = tool_response_data.get("function_responses", [])
                                if not responses_list and "id" in tool_response_data:
                                    responses_list = [tool_response_data]

                                for resp in responses_list:
                                    raw = resp.get("response", {})
                                    if isinstance(raw, str):
                                        normalized = {"output": raw}
                                    elif isinstance(raw, dict):
                                        normalized = raw if "output" in raw else {"output": str(raw.get("result", raw.get("error", str(raw))))}
                                    else:
                                        normalized = {"output": str(raw)}

                                    function_responses.append(types.FunctionResponse(
                                        name=resp.get("name", "search_pesticide_data"),
                                        id=resp.get("id", resp.get("response_id", "")),
                                        response=normalized
                                    ))

                                if function_responses:
                                    try:
                                        await session.send_tool_response(function_responses=function_responses)
                                    except Exception as e:
                                        print(f"⚠️ Stale tool response rejected (non-fatal): {e}")
                                continue

                        except json.JSONDecodeError:
                            pass

                        if text.strip():
                            try:
                                await session.send(input=text, end_of_turn=True)
                            except Exception as e:
                                print(f"❌ send_text error (non-fatal): {e}")

                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    logger.error(f"send_text fatal error: {e}")

            event_queue = asyncio.Queue()

            async def receive_loop():
                try:
                    while True:
                        async for response in session.receive():
                            server_content = response.server_content
                            tool_call = response.tool_call

                            if server_content:
                                if server_content.model_turn:
                                    for part in server_content.model_turn.parts:
                                        if part.inline_data:
                                            if inspect.iscoroutinefunction(audio_output_callback):
                                                await audio_output_callback(part.inline_data.data)
                                            else:
                                                audio_output_callback(part.inline_data.data)

                                if server_content.input_transcription:
                                    await event_queue.put({
                                        "serverContent": {
                                            "inputTranscription": {
                                                "text": server_content.input_transcription.text,
                                                "finished": True
                                            }
                                        }
                                    })

                                if server_content.output_transcription:
                                    await event_queue.put({
                                        "serverContent": {
                                            "outputTranscription": {
                                                "text": server_content.output_transcription.text,
                                                "finished": True
                                            }
                                        }
                                    })

                                if server_content.turn_complete:
                                    await event_queue.put({"serverContent": {"turnComplete": True}})

                                if server_content.interrupted:
                                    await event_queue.put({"serverContent": {"interrupted": True}})
                                    if audio_interrupt_callback:
                                        if inspect.iscoroutinefunction(audio_interrupt_callback):
                                            await audio_interrupt_callback()
                                        else:
                                            audio_interrupt_callback()
                                    await event_queue.put({"type": "interrupted"})

                            if tool_call:
                                function_responses = []
                                client_tool_calls = []

                                print(f"🎯 Tool call from Gemini: {tool_call}")

                                for fc in tool_call.function_calls:
                                    func_name = fc.name
                                    args = fc.args or {}
                                    print(f"  - Function: {func_name}, ID: {fc.id}, Args: {args}")

                                    if func_name in self.tool_mapping:
                                        # Server-side tool — execute directly
                                        try:
                                            tool_func = self.tool_mapping[func_name]
                                            if inspect.iscoroutinefunction(tool_func):
                                                result = await tool_func(**args)
                                            else:
                                                loop = asyncio.get_running_loop()
                                                result = await loop.run_in_executor(None, lambda: tool_func(**args))
                                        except Exception as e:
                                            result = f"Tool error: {e}"

                                        # ✅ MUST use "output" key — Gemini SDK requires it
                                        function_responses.append(types.FunctionResponse(
                                            name=func_name,
                                            id=fc.id,
                                            response={"output": str(result)}
                                        ))
                                        await event_queue.put({
                                            "type": "tool_call",
                                            "name": func_name,
                                            "args": args,
                                            "result": str(result)
                                        })
                                    else:
                                        # Client-side tool — forward to browser
                                        client_tool_calls.append({
                                            "name": fc.name,
                                            "args": args,
                                            "id": fc.id
                                        })
                                        print(f"  ⏩ Forwarding {func_name} to client")

                                if client_tool_calls:
                                    await event_queue.put({
                                        "toolCall": {
                                            "functionCalls": client_tool_calls
                                        }
                                    })

                                if function_responses:
                                    try:
                                        await session.send_tool_response(function_responses=function_responses)
                                        print("✅ Server tool response sent to Gemini")
                                    except Exception as e:
                                        print(f"❌ Error sending tool response (non-fatal): {e}")

                except Exception as e:
                    logger.error(f"receive_loop error: {type(e).__name__}: {e}")
                    await event_queue.put({"type": "error", "error": str(e)})
                finally:
                    await event_queue.put(None)

            send_audio_task = asyncio.create_task(send_audio())
            send_video_task = asyncio.create_task(send_video())
            send_text_task = asyncio.create_task(send_text())
            receive_task = asyncio.create_task(receive_loop())

            tasks = [send_audio_task, send_video_task, send_text_task, receive_task]

            try:
                while True:
                    try:
                        event = await asyncio.wait_for(event_queue.get(), timeout=0.5)
                        if event is None:
                            break
                        yield event
                    except asyncio.TimeoutError:
                        pass

                    # Check if any task crashed
                    for task in tasks:
                        if task.done() and not task.cancelled():
                            exc = task.exception()
                            if exc is not None:
                                print(f"❌ Task failed: {task.get_name()}: {exc}")
                                for t in tasks:
                                    if not t.done():
                                        t.cancel()
                                while not event_queue.empty():
                                    ev = event_queue.get_nowait()
                                    if ev is not None:
                                        yield ev
                                return

                    if all(t.done() for t in tasks):
                        while not event_queue.empty():
                            ev = event_queue.get_nowait()
                            if ev is not None:
                                yield ev
                        break

            except asyncio.CancelledError:
                print("Session cancelled")
            finally:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)