/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./audio-visualizer.js";
import "./live-transcript.js";
import {
  GeminiLiveAPI,
  MultimodalLiveResponseType,
  FunctionCallDefinition,
} from "../lib/gemini-live/geminilive.js";
import { AudioStreamer, AudioPlayer } from "../lib/gemini-live/mediaUtils.js";

class ViewChat extends HTMLElement {
  constructor() {
    super();
    this._mission = null;
    this.currentQuery = null;
    this.lastItems = [];

    // ─── Interruption & stale-response tracking ─────────────────────────
    // Each tool call cycle gets a unique generation ID. When the user
    // interrupts mid-response, we bump the generation so that any
    // in-flight fetch() responses from a previous cycle are discarded
    // instead of being sent back to Gemini (which would cause Gemini
    // to speak the OLD answer over the user's correction).
    this._toolGeneration = 0;
    this._pendingToolCalls = new Set(); // track in-flight tool call IDs
    this._interrupted = false;          // true between INTERRUPTED and next TURN_COMPLETE
    this._detectedLanguage = "en";      // track user's language: "en" or "ar"
  }

  set mission(value) {
    this._mission = value;
    this.render();
  }

  set language(value) {
    this._language = value;
  }

  set fromLanguage(value) {
    this._fromLanguage = value;
  }

  set mode(value) {
    this._mode = value;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.audioStreamer) this.audioStreamer.stop();
    if (this.client) this.client.disconnect();
  }

  render() {
    if (!this._mission) return;

    this.innerHTML = `
      <button id="back-to-missions" style="
          position: absolute;
          top: var(--spacing-md);
          left: var(--spacing-md);
          background: transparent;
          float: left;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          opacity: 0.7;
          transition: opacity 0.2s;
          z-index: 10;
      " onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>

      <div class="container" style="justify-content: space-between; min-height: 100vh; position: relative; padding-bottom: var(--spacing-xl);">

        <div style="margin-top: var(--spacing-xl); text-align: center;">
          <h2 style="font-size: 1.5rem; margin-bottom: 2px;">${this._mission.target_role || "Target Person"}</h2>
          
          <div style="
            font-size: 0.85rem; 
            font-weight: 700; 
            color: var(--color-text-sub);
            margin-bottom: var(--spacing-md);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: rgba(0,0,0,0.04);
            padding: 4px 12px;
            border-radius: var(--radius-full);
            width: fit-content;
            margin-left: auto;
            margin-right: auto;
            border: 1px solid rgba(0,0,0,0.05);
          ">
            <span>${this._fromLanguage}</span>
            <span style="opacity: 0.3; font-weight: normal;">➔</span>
            <span style="color: var(--color-accent-primary);">${this._language}</span>
          </div>

          <div style="
            border-radius: var(--radius-lg);
            padding: var(--spacing-md) var(--spacing-lg);
            display: inline-block;
            margin-top: var(--spacing-md);
            max-width: 800px;
          ">
            <p style="font-size: 1.2rem; font-weight: bold; color: var(--color-accent-secondary); margin: 0;">${this._mission.title}</p>
            <p style="font-size: 1rem; opacity: 0.9; margin-top: 4px;">${this._mission.desc}</p>
          </div>
          ${this._mode === "immergo_teacher"
        ? `
          <div style="
            margin-top: var(--spacing-lg); 
            font-size: 0.9rem; 
            background: var(--color-surface); 
            color: var(--color-accent-primary); 
            padding: 8px 16px; 
            border-radius: var(--radius-full); 
            display: inline-flex; 
            align-items: center; 
            gap: 6px;
            border: 1px solid var(--color-accent-primary);
            box-shadow: var(--shadow-sm);
          ">
            <span>You can ask for <strong>translations</strong> & <strong>explanations</strong> at any time.</span>
          </div>
          `
        : ""
      }
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: ${this._mode === "immergo_teacher" ? "space-between" : "center"}; width: 100%; gap: ${this._mode === "immergo_teacher" ? "10px" : "40px"};">
          <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
             <audio-visualizer id="model-viz"></audio-visualizer>
          </div>
          
          ${this._mode === "immergo_teacher"
        ? `
            <div style="width: 100%; height: 250px; margin: 10px 0; position: relative;">
              <live-transcript></live-transcript>
            </div>
          `
        : ""
      }

           <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
             <audio-visualizer id="user-viz"></audio-visualizer>
          </div>
        </div>

        <style>
          .chat-cta-btn {
            background: var(--color-accent-primary);
            color: white;
            padding: 24px 48px;
            border-radius: var(--radius-lg);
            width: auto;
            min-width: 280px;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5),
                        0 0 0 1px rgba(255,255,255,0.2) inset;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
            position: relative;
            overflow: hidden;
            font-family: var(--font-body);
          }
          .chat-cta-btn:hover {
            transform: translateY(-5px) scale(1.02);
            filter: brightness(1.1);
            box-shadow: 0 20px 40px -10px rgba(163, 177, 138, 0.4),
                        0 0 0 2px rgba(255,255,255,0.3) inset;
          }
          .chat-cta-btn:active {
            transform: translateY(-2px) scale(0.98);
          }
          .chat-cta-btn::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 200%; height: 100%;
            background: linear-gradient(115deg, transparent 0%, transparent 45%, rgba(255, 255, 255, 0.3) 50%, transparent 55%, transparent 100%);
            transform: translateX(-150%) skewX(-15deg);
            transition: transform 0.6s;
          }
          .chat-cta-btn:hover::after {
            transform: translateX(150%) skewX(-15deg);
          }
          .chat-cta-btn.active {
            background: var(--color-danger) !important;
            flex-direction: row !important;
            gap: 12px;
          }
        </style>

        <div style="margin-bottom: var(--spacing-xxl); display: flex; flex-direction: column; gap: var(--spacing-lg); align-items: center;">
           <button id="mic-btn" class="chat-cta-btn">
            <span style="font-size: 1.3rem; font-weight: 800; margin-bottom: 2px; letter-spacing: 0.02em;">Start Mission</span>
            <span style="font-size: 0.85rem; opacity: 0.9; font-style: italic;">You start the conversation!</span>
          </button>

          <button id="camera-btn" style="
             display: none;
             background: rgba(0,0,0,0.06);
             color: var(--color-text-primary);
             border: 2px dashed rgba(0,0,0,0.15);
             padding: 12px 24px;
             border-radius: var(--radius-lg);
             cursor: pointer;
             font-family: var(--font-body);
             font-weight: 700;
             font-size: 0.95rem;
             align-items: center;
             gap: 8px;
             transition: all 0.3s ease;
           " onmouseover="this.style.background='rgba(0,0,0,0.1)'; this.style.borderColor='var(--color-accent-primary)'"
             onmouseout="this.style.background='rgba(0,0,0,0.06)'; this.style.borderColor='rgba(0,0,0,0.15)'">
             📸 Scan Report
           </button>

           <p id="connection-status" style="
             margin-top: var(--spacing-sm);
             font-size: 0.9rem;
             font-weight: 700;
             height: 1.2em;
             transition: all 0.3s ease;
             letter-spacing: 0.05em;
             text-transform: uppercase;
           "></p>
        </div>

        <div id="rate-limit-dialog" class="hidden" style="
            position: fixed; inset: 0; 
            background: rgba(0,0,0,0.8); 
            backdrop-filter: blur(4px);
            z-index: 20;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        ">
            <div style="background: white; color: var(--color-text-primary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 500px; text-align: center; box-shadow: var(--shadow-lg);">
                <h3 style="margin-bottom: var(--spacing-md); color: var(--color-accent-primary);">Opps, this is too popular!</h3>
                <p style="margin-bottom: var(--spacing-lg); line-height: 1.5;">
                    The global quota has been reached. But you can skip the queue by deploying your own version on Google Cloud Run!
                </p>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                     <a href="https://deploy.cloud.run/?git_repo=https://github.com/ZackAkil/immersive-language-learning-with-live-api&utm_source=github&utm_medium=unpaidsoc&utm_campaign=FY-Q1-global-cloud-ai-starter-apps&utm_content=immergo-app&utm_term=-" target="_blank" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 12px;
                        padding: 16px 32px;
                        border-radius: var(--radius-md);
                        color: #1a73e8;
                        background: rgba(26, 115, 232, 0.05);
                        text-decoration: none;
                        font-weight: 800;
                        box-shadow: 0 4px 15px rgba(26, 115, 232, 0.1);
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        font-size: 1.1rem;
                        white-space: nowrap;
                        border: 2px dashed #1a73e8;
                     " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(26, 115, 232, 0.2)'; this.style.background='rgba(26, 115, 232, 0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(26, 115, 232, 0.1)'; this.style.background='rgba(26, 115, 232, 0.05)';">
                        <img src="https://www.gstatic.com/images/branding/product/1x/google_cloud_48dp.png" width="24" height="24" alt="Cloud Run Logo" />
                        Deploy to Cloud Run
                     </a>
                </div>
                <button id="close-rate-limit" style="
                    background: var(--color-accent-primary);
                    color: white;
                    border: none;
                    padding: var(--spacing-sm) var(--spacing-xl);
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    font-weight: bold;
                ">Got it</button>
            </div>
        </div>

      </div>
    `;

    const rateLimitDialog = this.querySelector("#rate-limit-dialog");
    const closeRateLimitBtn = this.querySelector("#close-rate-limit");

    closeRateLimitBtn.addEventListener("click", () => {
      rateLimitDialog.classList.add("hidden");
      rateLimitDialog.style.display = "none";
    });

    const doEndSession = () => {
      if (this.audioStreamer) this.audioStreamer.stop();
      if (this.client) this.client.disconnect();
      if (this.audioPlayer) this.audioPlayer.interrupt();

      const userViz = this.querySelector("#user-viz");
      const modelViz = this.querySelector("#model-viz");
      if (userViz && userViz.disconnect) userViz.disconnect();
      if (modelViz && modelViz.disconnect) modelViz.disconnect();

      console.log("👋 [App] Session ended by user");

      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: true,
          detail: { view: "summary", result: { incomplete: true } },
        }),
      );
    };

    const backBtn = this.querySelector("#back-to-missions");
    backBtn.addEventListener("click", () => {
      if (this.audioStreamer) this.audioStreamer.stop();
      if (this.client) this.client.disconnect();
      if (this.audioPlayer) this.audioPlayer.interrupt();

      const userViz = this.querySelector("#user-viz");
      const modelViz = this.querySelector("#model-viz");
      if (userViz && userViz.disconnect) userViz.disconnect();
      if (modelViz && modelViz.disconnect) modelViz.disconnect();

      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: true,
          detail: { view: "splash" },
        }),
      );
    });

    const userViz = this.querySelector("#user-viz");
    const modelViz = this.querySelector("#model-viz");
    const micBtn = this.querySelector("#mic-btn");
    const statusEl = this.querySelector("#connection-status");
    let isSpeaking = false;

    // Initialize Gemini Live
    this.client = new GeminiLiveAPI();
    this.audioStreamer = new AudioStreamer(this.client);
    this.audioPlayer = new AudioPlayer();

    // ─── Mission Complete Tool ───────────────────────────────────────────────
    const completeMissionTool = new FunctionCallDefinition(
      "complete_mission",
      "Call this tool when the user has successfully completed the mission objective. Provide a score and feedback.",
      {
        type: "OBJECT",
        properties: {
          score: {
            type: "INTEGER",
            description:
              "Rating from 1 to 3 based on performance: 1 (Tiro) = Struggled, used frequent English, or needed many hints. 2 (Proficiens) = Good, intelligible but with errors or hesitation. 3 (Peritus) = Excellent, fluent, native-like, no help needed.",
          },
          feedback_pointers: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "List of 3 constructive feedback points or compliments in English.",
          },
        },
        required: ["score", "feedback_pointers"],
      },
      ["score", "feedback_pointers"],
    );

    completeMissionTool.functionToCall = (args) => {
      console.log("🏆 [App] Mission Complete Tool Triggered!", args);

      const winnerSound = new Audio("/winner-bell.mp3");
      winnerSound.volume = 0.6;
      winnerSound.play().catch((e) => console.error("Failed to play winner sound:", e));

      const transcriptEl = this.querySelector("live-transcript");
      if (transcriptEl) {
        transcriptEl.addSystemMessage("✅ Mission milestone reached - continue asking!");
      }
    };

    this.client.addFunction(completeMissionTool);

    // Save reference for use inside tool callbacks
    const geminiClient = this.client;

    // ─── LARS Tool ───────────────────────────────────────────────────────────
    const larsQueryTool = new FunctionCallDefinition(
      "search_pesticide_data",
      "Search the pesticide residue database. Call this for any question about samples, violations, or pesticides.",
      {
        type: "OBJECT",
        properties: {
          question: {
            type: "STRING",
            description: "The question in Arabic or English",
          },
        },
        required: ["question"],
      },
      ["question"],
    );

    // ✅ FIX: functionToCall is now properly assigned as a method on the tool object
    larsQueryTool.functionToCall = (args) => {
      // ✅ FIX: Guard against missing tool call ID — without this Gemini ignores the response
      const toolCallId = args._toolCallId;
      const callGeneration = args._generation;  // generation at time of tool call
      if (!toolCallId) {
        console.error("❌ [LARS] Missing _toolCallId! Tool response will be ignored by Gemini.");
        return;
      }

      console.log("🔬 [LARS] Query:", args.question, "| CallID:", toolCallId, "| Gen:", callGeneration);

      // Check if this is a correction/modification
      const question = args.question.toLowerCase();
      const isCorrection =
        question.includes("sorry") ||
        question.includes("please add") ||
        question.includes("include") ||
        question.includes("also") ||
        question.includes("اضف") ||
        question.includes("أيضا");

      // If it's a correction and we have previous context, build a merged query
      if (isCorrection && this.currentQuery && this.lastItems.length > 0) {
        console.log("🔄 Detected correction, modifying query...");

        const commodities = [
          "potato", "cucumber", "eggplant", "tomato", "pepper",
          "carrot", "onion", "garlic", "lettuce", "spinach",
          "بطاطس", "خيار", "باذنجان", "طماطم", "فلفل",
        ];

        const newItems = commodities.filter(
          (item) => question.includes(item) && !this.lastItems.includes(item)
        );

        if (newItems.length > 0) {
          const allItems = [...this.lastItems, ...newItems];
          let modifiedQuestion;
          if (allItems.length === 2) {
            modifiedQuestion = `${allItems[0]} and ${allItems[1]}`;
          } else {
            const lastItem = allItems.pop();
            modifiedQuestion = `${allItems.join(", ")}, and ${lastItem}`;
          }

          if (this.currentQuery.includes("violation")) {
            modifiedQuestion = `violations for ${modifiedQuestion}`;
          } else if (this.currentQuery.includes("risk")) {
            modifiedQuestion = `risk assessment for ${modifiedQuestion}`;
          } else if (this.currentQuery.includes("count")) {
            modifiedQuestion = `count of ${modifiedQuestion} samples`;
          } else {
            modifiedQuestion = `${modifiedQuestion} samples`;
          }

          console.log("🔄 Modified query:", modifiedQuestion);
          args.question = modifiedQuestion;
        }
      }

      fetch("/api/lars/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: args.question }),
      })
        .then((res) => res.json())
        .then((data) => {
          // ── Staleness check: discard if user interrupted since this call started ──
          if (callGeneration !== undefined && callGeneration !== this._toolGeneration) {
            console.log(`🗑️ [LARS] DISCARDING stale response (gen ${callGeneration} vs current ${this._toolGeneration})`);
            this._pendingToolCalls.delete(toolCallId);
            return;  // Don't send this back to Gemini — it belongs to an old turn
          }

          const answer = data.answer || data.error || "No results found.";
          console.log("🔬 [LARS] Result:", answer);
          this._pendingToolCalls.delete(toolCallId);

          // ── Inject language directive into tool response ──
          // This is the most reliable way to force Gemini to respond in the
          // correct language, because it sees this instruction right before
          // formulating its spoken answer.
          const langDirective = this._detectedLanguage === "ar"
            ? "\n\n[INSTRUCTION: The user spoke in ARABIC. You MUST respond ENTIRELY in Arabic. Translate all data above into Arabic before speaking. لا تتحدث بالإنجليزية.]"
            : "\n\n[INSTRUCTION: The user spoke in ENGLISH. You MUST respond ENTIRELY in English. Do NOT use Arabic.]";

          geminiClient.sendToolResponse(toolCallId, "search_pesticide_data", {
            output: answer + langDirective,
          });
        })
        .catch((err) => {
          // Also check staleness on error path
          if (callGeneration !== undefined && callGeneration !== this._toolGeneration) {
            console.log(`🗑️ [LARS] DISCARDING stale error response (gen ${callGeneration})`);
            this._pendingToolCalls.delete(toolCallId);
            return;
          }

          console.error("🔬 [LARS] Error:", err);
          this._pendingToolCalls.delete(toolCallId);

          const errLangDirective = this._detectedLanguage === "ar"
            ? "\n\n[INSTRUCTION: أجب بالعربي فقط.]"
            : "\n\n[INSTRUCTION: Respond in English only.]";

          geminiClient.sendToolResponse(toolCallId, "search_pesticide_data", {
            output: "Database query failed: " + err.message + errLangDirective,
          });
        });
    };

    this.client.addFunction(larsQueryTool);

    // ─── Client Callbacks ────────────────────────────────────────────────────
    this.client.onConnectionStarted = () => {
      console.log("🚀 [Gemini] Connection started");
    };

    this.client.onOpen = () => {
      console.log("🔓 [Gemini] WebSocket connection opened");
    };

    this.client.onReceiveResponse = (response) => {
      console.log("📥 [Gemini] Received response:", response.type);

      if (response.type === MultimodalLiveResponseType.AUDIO) {
        statusEl.textContent = "Speaking...";
        statusEl.style.color = "#4CAF50";
        this.audioPlayer.play(response.data);

      } else if (response.type === MultimodalLiveResponseType.INTERRUPTED) {
        console.log("🛑 [Gemini] Interruption signal received");
        if (this.audioPlayer) this.audioPlayer.interrupt();

        // ── Bump generation to invalidate all in-flight tool responses ──
        this._toolGeneration++;
        this._interrupted = true;
        console.log(`🛑 [Interruption] Generation bumped to ${this._toolGeneration}, ${this._pendingToolCalls.size} pending call(s) will be discarded`);
        this._pendingToolCalls.clear();

        statusEl.textContent = "Interrupted - listening...";
        statusEl.style.color = "#FFA500";

      } else if (response.type === MultimodalLiveResponseType.TURN_COMPLETE) {
        statusEl.textContent = "Listening...";
        statusEl.style.color = "#2196F3";
        console.log("✅ [Gemini] Turn complete");
        this._interrupted = false;  // reset interruption state
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) transcriptEl.finalizeAll();

      } else if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
        console.log("🛠️ [Gemini] Tool Call received:", response.data);
        if (response.data.functionCalls) {
          // Capture current generation at the moment the tool call arrives.
          // If an interruption bumps _toolGeneration before the fetch resolves,
          // the response handler will see a mismatch and discard it.
          const callGeneration = this._toolGeneration;

          response.data.functionCalls.forEach((fc) => {
            // Track context for LARS correction handling
            if (fc.name === "search_pesticide_data") {
              this.currentQuery = fc.args.question;
              this.lastItems = [];

              // Detect language from the question as fallback
              const arabicRe = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
              if (arabicRe.test(fc.args.question)) {
                this._detectedLanguage = "ar";
              }
              // Note: don't set to "en" here because Gemini may translate
              // the Arabic user query to English for the tool call.
              // We only trust Arabic detection from tool args, and rely
              // on input transcription for English detection.

              const commodities = [
                "potato", "cucumber", "eggplant", "tomato", "pepper",
                "carrot", "onion", "garlic", "lettuce", "spinach",
                "بطاطس", "خيار", "باذنجان", "طماطم", "فلفل",
              ];
              const q = fc.args.question.toLowerCase();
              commodities.forEach((item) => {
                if (q.includes(item)) this.lastItems.push(item);
              });
            }

            // Tag the call with generation so the async handler can check staleness
            this._pendingToolCalls.add(fc.id);
            const argsWithId = {
              ...fc.args,
              _toolCallId: fc.id,
              _generation: callGeneration,
            };
            this.client.callFunction(fc.name, argsWithId);
          });
        }

      } else if (response.type === MultimodalLiveResponseType.INPUT_TRANSCRIPTION) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addInputTranscript(response.data.text, response.data.finished);
        }
        // ── Detect user language from transcription ──
        if (response.data.text && response.data.text.trim()) {
          const txt = response.data.text.trim();
          const arabicRe = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
          this._detectedLanguage = arabicRe.test(txt) ? "ar" : "en";
          console.log(`🌐 [Lang] Detected user language: ${this._detectedLanguage} from: "${txt.slice(0, 40)}..."`);
        }

      } else if (response.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addOutputTranscript(response.data.text, response.data.finished);
        }
      }
    };

    this.client.onError = (error) => {
      console.error("❌ [Gemini] Error:", error);
    };

    this.client.onClose = () => {
      console.log("🔒 [Gemini] Connection closed");
    };

    // ─── Mic Button ──────────────────────────────────────────────────────────
    micBtn.addEventListener("click", async () => {
      isSpeaking = !isSpeaking;

      if (isSpeaking) {
        micBtn.classList.add("active");
        micBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            <span style="font-weight: 800; font-size: 1.1rem; letter-spacing: 0.05em; text-transform: uppercase;">End Mission</span>
        `;
      } else {
        micBtn.classList.remove("active");
        doEndSession();
        return;
      }

      if (isSpeaking) {
        console.log("🎙️ [App] Microphone button clicked: Starting session...");
        statusEl.textContent = "Connecting...";
        statusEl.style.color = "var(--color-text-sub)";

        try {
          const language = this._language || "French";
          const fromLanguage = this._fromLanguage || "English";
          const mode = this._mode || "immergo_immersive";
          const missionTitle = this._mission ? this._mission.title : "General Conversation";
          const missionDesc = this._mission ? this._mission.desc : "";
          const targetRole = this._mission ? this._mission.target_role || "a local native speaker" : "a conversational partner";

          let systemInstruction = "";

          if (mode === "immergo_teacher") {
            systemInstruction = `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to be a PROACTIVE LANGUAGE MENTOR while staying in character as ${targetRole}.

TEACHING PROTOCOL:
1. **Gentle Corrections**: If the user makes a clear mistake, respond in character first, then briefly provide a friendly correction or a "more natural way to say that" in ${fromLanguage}.
2. **Vocabulary Boost**: Every few turns, suggest 1-2 relevant words or idioms in ${language} that fit the current situation and explain their meaning in ${fromLanguage}.
3. **Mini-Checks**: Occasionally (every 3-4 turns), ask the user a quick "How would you say...?" question in ${fromLanguage} related to the mission to test their recall.
4. **Scaffolding**: If the user is hesitant, provide the start of a sentence in ${language} or give them two options to choose from to keep the momentum.
5. **Mixed-Language Support**: Use ${fromLanguage} for teaching moments, but always pivot back to ${language} to maintain the immersive feel.

INTERACTION GUIDELINES:
1. Prioritize the flow of conversation—don't let the teaching feel like a lecture.
2. Utilize the proactive audio feature: do not respond until the user has clearly finished their thought.

MISSION COMPLETION:
When the user has successfully achieved the mission objective:
1. Give a warm congratulatory message in ${language}, then translate the praise into ${fromLanguage}.
2. THEN call the "complete_mission" tool.
3. Set 'score' to 0 (Zero) as this is a learning-focused practice session.
4. Provide 3 specific takeaways (grammar tips or new words) in the feedback list in ${fromLanguage}.
`;
          } else {
            systemInstruction = `
          You are LARS — Laboratory Analysis and Risk System.
          You are a bilingual AI assistant for food safety laboratories in Al-Qassim, Saudi Arabia.

          === STRICT LANGUAGE RULE (HIGHEST PRIORITY) ===
          You MUST detect which language the user spoke and respond ENTIRELY in that SAME language.
          - If the user speaks in ENGLISH → respond ONLY in English. Every word must be English.
          - If the user speaks in ARABIC → respond ONLY in Arabic. Every word must be Arabic.
          - This applies to EVERYTHING you say: greetings, data results, follow-up questions, summaries.
          - When you receive tool results (which may be in English), you MUST TRANSLATE them
            into the user's language before speaking. Do NOT read English data to an Arabic speaker.
          - Do NOT mix languages. Do NOT switch mid-sentence. Do NOT add Arabic to English or vice versa.
          - Even numbers, commodity names, and pesticide names should be spoken in the user's language
            when a natural translation exists (e.g. "بطاطس" not "potato" for Arabic speakers).
            Technical pesticide names (like "chlorpyrifos") can stay in their original form.

          يجب أن تكتشف لغة المستخدم وتجيب بنفس اللغة تماماً.
          إذا تحدث بالعربي، أجب بالعربي فقط. إذا تحدث بالإنجليزي، أجب بالإنجليزي فقط.
          لا تخلط بين اللغتين أبداً.

          Your mission: "${missionTitle}" — ${missionDesc}

          === CORE RULE ===
          For ANY question about pesticide data, samples, violations, risk, or lab results:
          Call search_pesticide_data IMMEDIATELY with a natural language question.
          Do NOT answer from your own knowledge. Do NOT say "I don't have data."
          The LARS database handles ALL analysis — just forward the question.
          IMPORTANT: Always send the tool query in ENGLISH regardless of the user's language,
          because the database works best with English queries. But ALWAYS present
          the results back to the user in THEIR language.

          === HOW TO USE THE TOOL ===
          The search_pesticide_data tool accepts natural language questions. Examples:
          - "how many potato samples were tested"
          - "risk assessment for potato"
          - "quality index for cucumber"  
          - "health risk index for tomato"
          - "what pesticides found in cumin samples"
          - "violations in leafy greens"
          - "compare tomato and cucumber violation rates"
          - "which vegetables have the highest contamination"
          - "chlorpyrifos violations across all samples"
          - "samples with more than 3 pesticides"
          
          You can ask about: sample counts, violations, compliance rates, risk assessment,
          quality index, health risk index, pesticide statistics, chemical groups,
          trend analysis, comparisons between commodities, and more.

          === VISION CAPABILITY ===
          You can SEE images the user sends from their camera.

          WHEN YOU SEE A FOOD ITEM (vegetable, fruit, spice, herb, etc.):
          1. Identify it: "I can see this is [potato/tomato/cumin/parsley/etc.]"
          2. Ask the user what they want to know, OR proactively call the tool:
             - "risk assessment for [identified food]"
             - "quality index for [identified food]"  
             - "how many [food] samples and what is the violation rate"
          3. If user asks follow-up questions about the same food, keep querying.

          WHEN YOU SEE A LAB REPORT OR DOCUMENT:
          1. Read what you can see (sample name, pesticides, results).
          2. Use that information to form a natural language query to the tool.
          3. Compare what you read in the image with the database results.

          WHEN YOU SEE MULTIPLE FOOD ITEMS:
          1. Identify each one.
          2. Call the tool for each to compare risk levels.
          3. Prioritize which one is higher risk based on the data.

          === VOICE TIPS ===
          - Keep responses concise for voice — summarize key numbers first.
          - Round numbers: "about 350 samples" not "347 samples"
          - Highlight the most important finding first.
          - After giving results, offer to go deeper: "Would you like the quality index?" or "Should I check the health risk?"
          - REMINDER: Speak in the SAME language as the user's last message. Always.
          
          === HANDLING CORRECTIONS & MODIFICATIONS ===
          The user may interrupt you mid-sentence to correct or modify their query.
          For example: "what are the violations for potato and cucumber" then while
          you're answering they say "sorry, please add eggplant".
          
          When this happens:
          1. STOP immediately (the system handles audio cutoff automatically).
          2. Understand the correction in context of the PREVIOUS query.
          3. Build a NEW COMPLETE query that merges the original items with the new ones.
             Example: original was "violations for potato and cucumber" + correction "add eggplant"
             → new query: "violations for potato, cucumber, and eggplant"
          4. Call search_pesticide_data with the MERGED query.
          5. Present the COMPLETE results — don't repeat the old partial answer.
          6. RESPOND in the same language the user used for the correction.

          This also applies to:
          - "actually, I meant tomato not potato" → replace the item
          - "and also check the risk" → add a new analysis type to the same items
          - "wait, include garlic too" → add to the item list
          - Arabic equivalents: "اضف الباذنجان" / "أيضا الثوم"

          === HANDLING INTERRUPTIONS (TOPIC CHANGE) ===
          If the user interrupts with a COMPLETELY DIFFERENT question:
          1. STOP your current response (automatic)
          2. Do NOT reference or finish the previous answer
          3. IMMEDIATELY address the new question
          4. Call search_pesticide_data for the new topic if needed
          5. Respond in whatever language the NEW question was asked in
          `;
          }

          console.log("📝 [App] Setting system instructions for", language, "Mode:", mode);
          this.client.setSystemInstructions(systemInstruction);

          if (mode === "immergo_teacher") {
            this.client.setInputAudioTranscription(true);
            this.client.setOutputAudioTranscription(true);
          } else {
            this.client.setInputAudioTranscription(false);
            this.client.setOutputAudioTranscription(false);
          }

          console.log("🔌 [App] Connecting to backend...");

          let token = "";
          try {
            token = await this.getRecaptchaToken();
            console.log("Captcha solved:", token);
          } catch (err) {
            console.error("Recaptcha failed:", err);
            isSpeaking = false;
            micBtn.classList.remove("active");
            micBtn.innerHTML = `
                <span style="font-size: 1.3rem; font-weight: 800; margin-bottom: 2px; letter-spacing: 0.02em;">Start Mission</span>
                <span style="font-size: 0.85rem; opacity: 0.9; font-style: italic;">You start the conversation!</span>
            `;
            userViz.disconnect();
            modelViz.disconnect();
            statusEl.textContent = "";
            return;
          }

          await this.client.connect(token);

          console.log("🎤 [App] Starting audio stream...");
          await this.audioStreamer.start();

          if (this.audioStreamer.audioContext && this.audioStreamer.source) {
            userViz.connect(this.audioStreamer.audioContext, this.audioStreamer.source);
          }

          console.log("🔊 [App] Initializing audio player...");
          await this.audioPlayer.init();

          if (this.audioPlayer.audioContext && this.audioPlayer.gainNode) {
            modelViz.connect(this.audioPlayer.audioContext, this.audioPlayer.gainNode);
          }

          console.log("✨ [App] Session active!");
          statusEl.textContent = "Connected and ready to speak";
          statusEl.style.color = "#4CAF50";

          if (mode !== "immergo_teacher") {
            const camBtn = this.querySelector("#camera-btn");
            if (camBtn) camBtn.style.display = "flex";
          }

          const startSound = new Audio("/start-bell.mp3");
          startSound.volume = 0.6;
          startSound.play().catch((e) => console.error("Failed to play start sound:", e));

        } catch (err) {
          console.error("❌ [App] Failed to start session:", err);
          console.log("Error status:", err.status);

          isSpeaking = false;
          micBtn.classList.remove("active");
          micBtn.innerHTML = `
              <span style="font-size: 1.3rem; font-weight: 800; margin-bottom: 2px; letter-spacing: 0.02em;">Start Mission</span>
              <span style="font-size: 0.85rem; opacity: 0.9; font-style: italic;">You start the conversation!</span>
          `;

          userViz.disconnect();
          modelViz.disconnect();
          statusEl.textContent = "";

          if (err.status === 429) {
            rateLimitDialog.classList.remove("hidden");
            rateLimitDialog.style.display = "flex";
          } else {
            alert("Failed to start session: " + err.message);
          }
        }
      }
    });

    // ─── Camera Snap (LARS Vision) ───────────────────────────────────────────
    const cameraBtn = this.querySelector("#camera-btn");

    cameraBtn.addEventListener("click", async () => {
      try {
        console.log("📸 [LARS] Camera snap requested");

        // Use back camera (environment) on mobile, fall back to any camera on desktop
        let constraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        const preview = document.createElement("video");
        preview.srcObject = stream;
        preview.setAttribute("playsinline", "true");
        preview.style.cssText = `
          position: fixed; bottom: 120px; right: 20px; 
          width: 320px; height: 240px; border-radius: 12px;
          border: 3px solid #4CAF50; z-index: 999;
          object-fit: cover; background: black;
        `;
        document.body.appendChild(preview);
        await preview.play();

        cameraBtn.innerHTML = "🔴 Tap to Capture!";
        cameraBtn.style.borderColor = "#f44336";
        cameraBtn.style.background = "rgba(244,67,54,0.1)";

        await new Promise((resolve) => {
          const snapNow = () => {
            cameraBtn.removeEventListener("click", snapNow);
            clearTimeout(autoSnap);
            resolve();
          };
          cameraBtn.addEventListener("click", snapNow, { once: true });
          const autoSnap = setTimeout(resolve, 3000);
        });

        const canvas = document.createElement("canvas");
        canvas.width = preview.videoWidth;
        canvas.height = preview.videoHeight;
        canvas.getContext("2d").drawImage(preview, 0, 0);

        stream.getTracks().forEach((t) => t.stop());
        preview.remove();

        const base64Data = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
        this.client.sendImageMessage(base64Data, "image/jpeg");
        console.log("📸 [LARS] Image sent! Size:", Math.round(base64Data.length / 1024), "KB");

        cameraBtn.innerHTML = "✅ Photo Sent — Now ask about it!";
        cameraBtn.style.borderColor = "#4CAF50";
        cameraBtn.style.background = "rgba(76,175,80,0.1)";
        setTimeout(() => {
          cameraBtn.innerHTML = "📸 Scan Report";
          cameraBtn.style.borderColor = "rgba(0,0,0,0.15)";
          cameraBtn.style.background = "rgba(0,0,0,0.06)";
        }, 3000);

      } catch (err) {
        console.error("📸 [LARS] Camera error:", err);
        alert("Camera error: " + err.message);
      }
    });
  }

  async getRecaptchaToken() {
    return new Promise((resolve) => {
      if (typeof grecaptcha === "undefined") {
        console.warn("⚠️ ReCAPTCHA not loaded (Simple Mode). Proceeding without token.");
        resolve(null);
        return;
      }
      try {
        grecaptcha.enterprise.ready(async () => {
          try {
            const t = await grecaptcha.enterprise.execute(
              "6LeSYx8sAAAAAGdRAp8VQ2K9I-KYGWBykzayvQ8n",
              { action: "LOGIN" },
            );
            resolve(t);
          } catch (e) {
            console.warn("⚠️ ReCAPTCHA execution failed (Simple Mode fallback):", e);
            resolve(null);
          }
        });
      } catch (e) {
        console.warn("⚠️ ReCAPTCHA ready failed:", e);
        resolve(null);
      }
    });
  }
}

customElements.define("view-chat", ViewChat);