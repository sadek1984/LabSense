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

import google.genai as genai
from google.genai import types
import asyncio
import base64
import json
import logging
import inspect
from typing import Optional, List, Dict, Callable

logger = logging.getLogger(__name__)

class GeminiLive:
    def __init__(self, project_id: str, location: str, model: str, input_sample_rate: int = 16000):
        self.project_id = project_id
        self.location = location
        self.model = model
        self.input_sample_rate = input_sample_rate
        print("🚀 GeminiLive initialized with:")
        print(f"  Project ID: {project_id}")
        print(f"  Location: {location}")
        print(f"  Model: {model}")
        print(f"  Input Sample Rate: {input_sample_rate}")
        
        import os
        from google import genai

        self.client = genai.Client(
            api_key=os.environ.get("GEMINI_API_KEY"),
            http_options={"api_version": "v1alpha"}
        )
        self.tool_mapping = {}

    def register_tool(self, func: Callable):
        self.tool_mapping[func.__name__] = func
        return func

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
        
        try:
            print("📸 Vision enabled: MEDIA_RESOLUTION_MEDIUM")
        except Exception as e:
            logger.warning(f"Could not set media_resolution: {e}")
        
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
                        # Images handled in send_text via client_content
                        pass
                except asyncio.CancelledError:
                    pass

            async def send_text():
                try:
                    while True:
                        text = await text_input_queue.get()
                        
                        try:
                            parsed = json.loads(text)
                            
                            # ── Handle image messages ──────────────────────────────
                            if isinstance(parsed, dict) and "_image" in parsed:
                                import base64 as b64
                                image_bytes = b64.b64decode(parsed["_image"])
                                mime_type = parsed.get("_mime", "image/jpeg")
                                try:
                                    await session.send_client_content(
                                        turns=types.Content(
                                            role="user",
                                            parts=[
                                                types.Part(
                                                    inline_data=types.Blob(
                                                        data=image_bytes,
                                                        mime_type=mime_type
                                                    )
                                                ),
                                                types.Part(text="I just sent you a photo. Describe what you see.")
                                            ]
                                        ),
                                        turn_complete=True
                                    )
                                    print(f"📸 Image sent to Gemini: {len(image_bytes)} bytes")
                                except Exception as img_err:
                                    print(f"❌ Image send FAILED: {type(img_err).__name__}: {img_err}")
                                continue
                            
                            # ── Handle tool responses from client ──────────────────
                            if isinstance(parsed, dict) and "tool_response" in parsed:
                                print(f"🔧 Received tool response from client: {parsed}")
                                
                                tool_response_data = parsed["tool_response"]
                                function_responses = []
                                
                                if "function_responses" in tool_response_data:
                                    for resp in tool_response_data["function_responses"]:
                                        # ✅ FIX: Normalize the response value to use "output" key.
                                        # Gemini SDK requires the response dict to have an "output" key.
                                        # If the client sent {"result": ...} we remap it here.
                                        raw_response = resp.get("response", {})
                                        if isinstance(raw_response, str):
                                            normalized_response = {"output": raw_response}
                                        elif isinstance(raw_response, dict):
                                            if "output" not in raw_response:
                                                # remap "result" or "error" → "output"
                                                output_value = raw_response.get(
                                                    "result",
                                                    raw_response.get("error", str(raw_response))
                                                )
                                                normalized_response = {"output": str(output_value)}
                                            else:
                                                normalized_response = raw_response
                                        else:
                                            normalized_response = {"output": str(raw_response)}

                                        fn_id   = resp.get("id", resp.get("response_id", ""))
                                        fn_name = resp.get("name", "search_pesticide_data")

                                        print(f"  📝 FunctionResponse: name={fn_name}, id={fn_id}, output_len={len(str(normalized_response))}")

                                        function_responses.append(types.FunctionResponse(
                                            name=fn_name,
                                            id=fn_id,
                                            response=normalized_response
                                        ))

                                elif "id" in tool_response_data and "response" in tool_response_data:
                                    raw_response = tool_response_data.get("response", {})
                                    if isinstance(raw_response, dict) and "output" not in raw_response:
                                        output_value = raw_response.get(
                                            "result",
                                            raw_response.get("error", str(raw_response))
                                        )
                                        normalized_response = {"output": str(output_value)}
                                    else:
                                        normalized_response = raw_response if isinstance(raw_response, dict) else {"output": str(raw_response)}

                                    function_responses.append(types.FunctionResponse(
                                        name=tool_response_data.get("name", "search_pesticide_data"),
                                        id=tool_response_data["id"],
                                        response=normalized_response
                                    ))
                                
                                if function_responses:
                                    print(f"📤 Forwarding {len(function_responses)} tool response(s) to Gemini")
                                    try:
                                        await session.send_tool_response(function_responses=function_responses)
                                        print("✅ Tool response sent — Gemini will now speak")
                                    except Exception as e:
                                        # Non-fatal: This commonly happens when a tool response
                                        # arrives after the user interrupted. Gemini has already
                                        # moved on and rejects the stale response. Log and continue.
                                        err_msg = str(e).lower()
                                        if "invalid" in err_msg or "unexpected" in err_msg or "state" in err_msg:
                                            print(f"⚠️ Stale tool response rejected by Gemini (user likely interrupted): {type(e).__name__}: {e}")
                                        else:
                                            print(f"❌ Error sending tool response to Gemini (non-fatal): {type(e).__name__}: {e}")
                                else:
                                    print("⚠️ No valid function_responses parsed from tool_response message")
                                continue
                                
                        except json.JSONDecodeError:
                            pass
                        
                        # Regular text message
                        if text.strip():
                            print(f"💬 Sending text to Gemini: {text[:50]}...")
                            try:
                                await session.send(input=text, end_of_turn=True)
                            except Exception as e:
                                print(f"❌ Error sending text to Gemini (non-fatal): {type(e).__name__}: {e}")
                            
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    # ✅ FIX: Log but don't propagate — prevents WebSocket teardown
                    logger.error(f"send_text fatal error: {type(e).__name__}: {e}")

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
                                    print("output_transcription", server_content.output_transcription)
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
                                
                                print(f"🎯 Received tool_call from Gemini: {tool_call}")
                                
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
                                            
                                            function_responses.append(types.FunctionResponse(
                                                name=func_name,
                                                id=fc.id,
                                                response={"output": str(result)}  # ✅ always "output" key
                                            ))
                                        except Exception as e:
                                            print(f"❌ Error executing server tool {func_name}: {e}")
                                            function_responses.append(types.FunctionResponse(
                                                name=func_name,
                                                id=fc.id,
                                                response={"output": f"Tool error: {e}"}
                                            ))
                                    else:
                                        # Client-side tool — forward to browser
                                        client_tool_calls.append({
                                            "name": fc.name,
                                            "args": args,
                                            "id": fc.id
                                        })
                                        print(f"  ⏩ Forwarding {func_name} to client with ID {fc.id}")
                                
                                if client_tool_calls:
                                    tool_call_event = {
                                        "toolCall": {
                                            "functionCalls": client_tool_calls
                                        }
                                    }
                                    print(f"📤 Sending tool call to client: {tool_call_event}")
                                    await event_queue.put(tool_call_event)
                                
                                if function_responses:
                                    print(f"📤 Sending {len(function_responses)} server tool response(s) to Gemini")
                                    try:
                                        await session.send_tool_response(function_responses=function_responses)
                                        print("✅ Server tool response sent")
                                    except Exception as e:
                                        print(f"❌ Error sending server tool response (non-fatal): {type(e).__name__}: {e}")

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
                # ── Drain event_queue concurrently while tasks run ──────────
                # Previously, `asyncio.wait(tasks)` blocked until a task died,
                # so the `yield event` loop never ran during normal operation.
                # Now we yield events as they arrive and only exit when all
                # tasks are done or one throws an exception.
                while True:
                    try:
                        event = await asyncio.wait_for(event_queue.get(), timeout=0.5)
                        if event is None:
                            # receive_loop has ended
                            break
                        yield event
                    except asyncio.TimeoutError:
                        pass

                    # Check if any task threw an exception
                    for task in tasks:
                        if task.done() and task.exception() is not None:
                            print(f"❌ Task failed: {task.get_name()}, exception: {task.exception()}")
                            for t in tasks:
                                if not t.done():
                                    t.cancel()
                            # Drain remaining events before exiting
                            while not event_queue.empty():
                                event = event_queue.get_nowait()
                                if event is not None:
                                    yield event
                            return

                    # If all tasks finished, drain remaining events and exit
                    if all(t.done() for t in tasks):
                        while not event_queue.empty():
                            event = event_queue.get_nowait()
                            if event is not None:
                                yield event
                        break
                        
            except asyncio.CancelledError:
                print("Session cancelled")
            finally:
                for task in tasks:
                    if not task.done():
                        task.cancel()
                await asyncio.gather(*tasks, return_exceptions=True)