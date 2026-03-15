(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();const k=[{id:"lars-session",title:"LARS Voice Assistant",subtitle:"Pesticide Residue Analysis",description:"Ask LARS about pesticide residues, violations, neighborhood statistics, and food safety risk assessments using your voice.",persona:"LARS Assistant",objective:"Query the pesticide residue database",example_phrases:["Find imidacloprid in tomatoes","How many samples exceed the MRL limit?","Rank neighborhoods by violations"],mode:"lars"}];class A extends HTMLElement{connectedCallback(){const e="Start Session";this.innerHTML=`
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;
        }

        .splash-particle {
          position: absolute;
          font-family: 'JetBrains Mono', monospace;
          pointer-events: none;
          opacity: 0;
          animation: floatUp 15s linear infinite;
          color: var(--color-accent-primary);
          font-size: 1.2rem;
          z-index: 0;
          filter: blur(1px);
        }

        @keyframes floatUp {
          0% { transform: translateY(110vh) translateX(0) rotate(0deg); opacity: 0; }
          20% { opacity: 0.3; transform: translateY(80vh) translateX(30px) rotate(45deg); }
          50% { transform: translateY(50vh) translateX(-30px) rotate(90deg); }
          80% { opacity: 0.3; transform: translateY(20vh) translateX(30px) rotate(135deg); }
          100% { transform: translateY(-20vh) translateX(0) rotate(180deg); opacity: 0; }
        }

        .mystic-title {
          /* Adjusted Typography - Single Line Guaranteed */
          font-weight: 800;
          letter-spacing: -0.02em;
          line-height: normal; /* Allow natural height for descenders */
          margin-bottom: var(--spacing-sm);
          padding: 0 var(--spacing-md);
          padding-bottom: 0.3em; /* SIGNIFICANT extra space for descenders */

          /* Gradient & Texture */
          background: linear-gradient(135deg, var(--color-text-main) 30%, var(--color-accent-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          /* Glow/Depth */
          filter: drop-shadow(0 0 30px rgba(163, 177, 138, 0.2));
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .mystic-btn {
          /* Premium Solid Pill */
          position: relative;
          background: var(--color-accent-primary);
          color: #ffffff; /* Always white text on accent for contrast */
          padding: 24px 64px;
          font-size: 1.5rem;
          font-weight: 700;
          border-radius: 9999px; /* Pill shape */
          border: none;

          /* Interaction */
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);

          /* Depth */
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2),
                      0 0 0 1px rgba(255, 255, 255, 0.1) inset;

          overflow: hidden;
          z-index: 20;
          letter-spacing: 0.02em;
        }

        .mystic-btn:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 50px rgba(163, 177, 138, 0.4),
                      0 0 0 2px rgba(255,255,255,0.2) inset;
          background: var(--color-accent-primary); /* Keep background stable */
          filter: brightness(1.1);
        }

        /* Shine Effect on Hover */
        .mystic-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 45%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 55%,
            transparent 100%
          );
          transform: translateX(-150%) skewX(-15deg);
          transition: transform 0.6s;
        }

        .mystic-btn:hover::after {
          transform: translateX(150%) skewX(-15deg);
          transition: transform 0.6s ease-in-out;
        }

        .powered-by-link {
          color: var(--color-accent-primary);
          text-decoration: none;
          font-weight: 700;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .powered-by-link:hover {
          border-bottom-color: var(--color-accent-primary);
        }

        .content-wrapper {
          position: relative;
          z-index: 5;
          width: 100%;
          max-width: 1200px;
          min-height: 90vh; /* Ensure full viewport height focus */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: var(--spacing-xl);
          padding-top: 10vh; /* Shift content down */
          padding-bottom: 15vh; /* Space for footer */
        }
      </style>

      <div class="container flex-center" style="position: relative; min-height: 100vh; flex-direction: column;">

        <!-- Particles container -->
        <div id="particles-host" style="position: absolute; inset: 0; pointer-events: none;"></div>

        <!-- Main Content -->
        <div class="content-wrapper">

          <h1 class="mystic-title">LARS — Lab Analysis & Risk System</h1>

          <p style="
            font-family: var(--font-body);
            font-size: clamp(1rem, 3vw, 1.4rem);
            opacity: 0.8;
            margin-bottom: var(--spacing-xl);
            color: var(--color-text-sub);
            text-align: center;
            max-width: 600px;
          ">
            Your voice-powered assistant for pesticide residue data, food safety violations & risk analysis.
          </p>

          <div style="margin-top: var(--spacing-lg);">
            <p style="font-size: 1rem; opacity: 0.6; color: var(--color-text-secondary); text-align: center; line-height: 1.6;">
              Powered by <br>
              <a href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api" target="_blank" class="powered-by-link">
                Gemini Live API on Vertex AI
              </a>
            </p>
          </div>

          <!-- CTA Section -->
          <div style="margin-top: calc(var(--spacing-xxl) * 1.5); width: 100%; display: flex; justify-content: center;">
            <button id="start-btn" class="mystic-btn">
              ${e}
            </button>
          </div>

        </div>

        <!-- Disclaimer Footer -->
        <div style="
          position: absolute; 
          bottom: var(--spacing-lg); 
          left: 0; 
          right: 0;
          font-size: 0.75rem; 
          opacity: 0.5; 
          max-width: 600px; 
          margin: 0 auto; 
          line-height: 1.5; 
          text-align: center;
          padding: 0 var(--spacing-md);
          z-index: 15;
        ">
            <strong>Disclaimer:</strong> This application is a demonstration of the Lab Analysis & Risk System (LARS). Results may not be definitive. Use for lab analysis guidance only.
        </div>

      </div>
    `;const t=this.querySelector("#particles-host"),i=30,s=["% MRL","mg/kg","ppm","≤","≥","Σ","∆","µg","LC50","ADI"];for(let a=0;a<i;a++){const n=document.createElement("div");n.className="splash-particle";const c=s[Math.floor(Math.random()*s.length)];n.textContent=c,n.style.left=`${Math.random()*100}%`,n.style.animationDelay=`${Math.random()*15}s`,n.style.animationDuration=`${10+Math.random()*10}s`,n.style.fontSize=`${.8+Math.random()*1.5}rem`,t.appendChild(n)}this.querySelector("#start-btn").addEventListener("click",()=>{this.style.filter="blur(10px) brightness(1.2)",this.style.opacity="0",this.style.transform="scale(1.05)",this.style.transition="all 0.6s cubic-bezier(0.19, 1, 0.22, 1)",setTimeout(()=>{this.dispatchEvent(new CustomEvent("navigate",{bubbles:!0,detail:{view:"chat",mission:k[0],language:"English",fromLanguage:"English",mode:k[0].mode||"lars"}}))},500)})}}customElements.define("view-splash",A);class E extends HTMLElement{constructor(){super(),this.active=!1,this.audioContext=null,this.analyser=null,this.source=null,this.dataArray=null,this.animationId=null}connectedCallback(){this.style.display="block",this.style.width="100%",this.style.height="100%",this.innerHTML=`
      <canvas style="width: 100%; height: 100%; display: block;"></canvas>
    `,this.canvas=this.querySelector("canvas"),this.ctx=this.canvas.getContext("2d"),this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(this),window.addEventListener("resize",()=>this.resize()),this.resize(),this.drawIdle()}disconnectedCallback(){this.resizeObserver&&this.resizeObserver.disconnect(),this.disconnect()}resize(){const e=this.getBoundingClientRect();this.canvas.width=e.width,this.canvas.height=e.height,this.active||this.drawIdle()}connect(e,t){this.analyser&&this.disconnect();try{this.audioContext=e,this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=2048,this.source=t,this.source.connect(this.analyser);const i=this.analyser.frequencyBinCount;this.dataArray=new Uint8Array(i),this.active=!0,this.animate()}catch(i){console.error("Error connecting visualizer:",i)}}disconnect(){if(this.active=!1,this.animationId&&(cancelAnimationFrame(this.animationId),this.animationId=null),this.source&&this.analyser)try{this.source.disconnect(this.analyser)}catch{}this.analyser=null,this.source=null,this.audioContext=null,this.drawIdle()}setActive(e){this.active=e,this.active?this.analyser&&this.animate():this.drawIdle()}drawIdle(){const{width:e,height:t}=this.canvas;this.ctx.clearRect(0,0,e,t),this.ctx.beginPath(),this.ctx.moveTo(0,t/2),this.ctx.lineTo(e,t/2),this.ctx.strokeStyle="#5c6b48",this.ctx.lineWidth=2,this.ctx.globalAlpha=.3,this.ctx.stroke(),this.ctx.globalAlpha=1}animate(){if(!this.active||!this.analyser)return;this.animationId=requestAnimationFrame(()=>this.animate()),this.analyser.getByteTimeDomainData(this.dataArray);const e=this.canvas.width,t=this.canvas.height,i=this.ctx;i.clearRect(0,0,e,t),i.lineWidth=3,i.strokeStyle="#5c6b48",i.beginPath();const s=20,a=.3,n=10;(!this.points||this.points.length!==s)&&(this.points=new Array(s).fill(0));const c=e/(s-1),h=Math.floor(this.dataArray.length/s);for(let l=0;l<s;l++){const m=Math.min(l*h,this.dataArray.length-1);let g=this.dataArray[m]/128-1;const o=l/(s-1),r=Math.sin(o*Math.PI),u=g*(t*.4)*n*r;this.points[l]+=(u-this.points[l])*a}i.moveTo(0,t/2);for(let l=0;l<s;l++){const m=l*c,g=t/2+this.points[l];if(l===0)i.moveTo(m,g);else{const o=(l-1)*c,r=t/2+this.points[l-1],u=(o+m)/2,f=(r+g)/2;i.quadraticCurveTo(o,r,u,f)}}i.lineTo(e,t/2),i.stroke()}}customElements.define("audio-visualizer",E);class I extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"}),this.render()}connectedCallback(){this.render()}addInputTranscript(e,t){this.updateTranscript("user",e,t)}addOutputTranscript(e,t){this.updateTranscript("model",e,t)}addProvenance(e){const t=this.shadowRoot.querySelector(".transcript-container");if(!t||!e)return;const i=document.createElement("div");i.className="provenance-card";const s=[{icon:"📋",label:"Records",value:e.records??"—"},{icon:"🗂️",label:"Dimensions",value:(e.dimensions||[]).join(", ")||"—"},{icon:"🔍",label:"Values",value:(e.values||[]).join(", ")||"—"},{icon:"📊",label:"Source",value:e.source||"—"},{icon:"✅",label:"Status",value:e.status||"—"}];i.innerHTML=s.map(a=>`<div class="provenance-row"><span class="prov-icon">${a.icon}</span><span class="prov-label">${a.label}</span><span class="prov-value">${a.value}</span></div>`).join(""),t.appendChild(i),t.scrollTop=t.scrollHeight}finalizeAll(){const e=this.shadowRoot.querySelector(".transcript-container");if(!e)return;e.querySelectorAll(".bubble.temp").forEach(i=>{i.classList.remove("temp"),i.dataset.role=null})}updateTranscript(e,t,i){const s=this.shadowRoot.querySelector(".transcript-container");if(!s)return;s.querySelectorAll(".bubble.temp").forEach(l=>{l.dataset.role!==e&&(l.classList.remove("temp"),l.dataset.role=null)});let n=s.querySelector(`.bubble.temp[data-role="${e}"]`);n||(n=document.createElement("div"),n.className=`bubble temp ${e}`,n.dataset.role=e,s.appendChild(n),s.scrollTop=s.scrollHeight);const c=n.textContent;c.length>0&&!c.endsWith(" ")&&!t.startsWith(" ")&&/^[a-zA-Z0-9À-ÿ]/.test(t)&&n.appendChild(document.createTextNode(" "));const h=document.createElement("span");h.textContent=t,h.className="fade-span",n.appendChild(h),s.scrollTop=s.scrollHeight}render(){this.shadowRoot.innerHTML.trim()===""&&(this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .transcript-container {
          height: 100%;
          overflow-y: auto;
          padding: 1rem;
          /* padding-bottom removed in favor of spacer */
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          scroll-behavior: smooth;
          /* Seamless fade effect - fixed size fade */
          mask-image: linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%);
        }

        /* Robust spacer to ensure scrolling clears the bottom fade */
        .transcript-container::after {
          content: "";
          display: block;
          min-height: 120px; 
          flex-shrink: 0;
        }

        /* Bubble animation for the CONTAINER itself (optional, mainly for first appearance) */
        .bubble {
          max-width: 80%;
          padding: 0.5rem 1rem;
          font-size: 1.1rem;
          line-height: 1.5;
          animation: popIn 0.5s ease forwards; 
          word-wrap: break-word;
          /* opacity handled by animation */
        }

        .fade-span {
          animation: fadeIn 1.5s ease forwards;
          opacity: 0;
        }

        .bubble.model {
          align-self: flex-start;
          color: #333; /* Dark text for model */
          text-align: left;
        }

        .bubble.user {
          align-self: flex-end;
          color: var(--color-accent-primary, #5c6b48); /* Accent color for user */
          text-align: right;
          font-weight: 500;
        }

        .bubble.temp {
          opacity: 0.7;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Scrollbar styling - hidden for cleaner look or minimal */
        .transcript-container::-webkit-scrollbar {
          width: 0px; /* Hide scrollbar for seamless feel */
          background: transparent;
        }

        .provenance-card {
          align-self: flex-start;
          background: rgba(92, 107, 72, 0.07);
          border: 1px solid rgba(92, 107, 72, 0.22);
          border-radius: 8px;
          padding: 0.45rem 0.75rem;
          font-size: 0.76rem;
          color: #555;
          margin-top: -0.2rem;
          animation: popIn 0.4s ease forwards;
          max-width: 80%;
        }

        .provenance-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.08rem 0;
        }

        .prov-icon { font-size: 0.82rem; }

        .prov-label {
          font-weight: 600;
          color: #5c6b48;
          min-width: 90px;
        }

        .prov-value { color: #444; }
      </style>
      <div class="transcript-container">
        <!-- Transcripts go here -->
      </div>
    `)}}customElements.define("live-transcript",I);const d={TEXT:"TEXT",AUDIO:"AUDIO",SETUP_COMPLETE:"SETUP COMPLETE",INTERRUPTED:"INTERRUPTED",TURN_COMPLETE:"TURN COMPLETE",TOOL_CALL:"TOOL_CALL",ERROR:"ERROR",INPUT_TRANSCRIPTION:"INPUT_TRANSCRIPTION",OUTPUT_TRANSCRIPTION:"OUTPUT_TRANSCRIPTION"};class S{constructor(e){this.data="",this.type="",this.endOfTurn=!1,console.log("raw message data: ",e),this.endOfTurn=e?.serverContent?.turnComplete;const t=e?.serverContent?.modelTurn?.parts;try{e?.setupComplete?(console.log("🏁 SETUP COMPLETE response",e),this.type=d.SETUP_COMPLETE):e?.serverContent?.turnComplete?(console.log("🏁 TURN COMPLETE response"),this.type=d.TURN_COMPLETE):e?.serverContent?.interrupted?(console.log("🗣️ INTERRUPTED response"),this.type=d.INTERRUPTED):e?.serverContent?.inputTranscription?(console.log("📝 INPUT TRANSCRIPTION:",e.serverContent.inputTranscription),this.type=d.INPUT_TRANSCRIPTION,this.data={text:e.serverContent.inputTranscription.text||"",finished:e.serverContent.inputTranscription.finished||!1}):e?.serverContent?.outputTranscription?(console.log("📝 OUTPUT TRANSCRIPTION:",e.serverContent.outputTranscription),this.type=d.OUTPUT_TRANSCRIPTION,this.data={text:e.serverContent.outputTranscription.text||"",finished:e.serverContent.outputTranscription.finished||!1}):e?.toolCall?(console.log("🎯 🛠️ TOOL CALL response",e?.toolCall),this.type=d.TOOL_CALL,this.data=e?.toolCall):t?.length&&t[0].text?(console.log("💬 TEXT response",t[0].text),this.data=t[0].text,this.type=d.TEXT):t?.length&&t[0].inlineData&&(console.log("🔊 AUDIO response"),this.data=t[0].inlineData.data,this.type=d.AUDIO)}catch{console.log("⚠️ Error parsing response data: ",e)}}}class C{constructor(e,t,i,s){this.name=e,this.description=t,this.parameters=i,this.requiredParameters=s}functionToCall(e){console.log("▶️Default function call")}getDefinition(){const e={name:this.name,description:this.description,parameters:{required:this.requiredParameters,...this.parameters}};return console.log("created FunctionDefinition: ",e),e}runFunction(e){if(console.log(`⚡ Running ${this.name} with params:`,e),typeof this.functionToCall!="function"){console.error(`❌ functionToCall for ${this.name} is not a function`);return}try{this.functionToCall(e)}catch(t){console.error(`❌ Error in ${this.name} functionToCall:`,t)}}}class L{constructor(){this.responseModalities=["AUDIO"],this.systemInstructions="",this.googleGrounding=!1,this.enableAffectiveDialog=!0,this.voiceName="Puck",this.temperature=1,this.inputAudioTranscription=!1,this.outputAudioTranscription=!1,this.enableFunctionCalls=!1,this.functions=[],this.functionsMap={},this.previousImage=null,this.totalBytesSent=0,this.automaticActivityDetection={disabled:!1,silence_duration_ms:2e3,prefix_padding_ms:500,end_of_speech_sensitivity:"END_SENSITIVITY_UNSPECIFIED",start_of_speech_sensitivity:"START_SENSITIVITY_UNSPECIFIED"},this.connected=!1,this.webSocket=null,this.lastSetupMessage=null,this.onReceiveResponse=e=>{console.log("Default message received callback",e)},this.onConnectionStarted=()=>{console.log("Default onConnectionStarted")},this.onErrorMessage=e=>{console.error("❌ [GeminiLiveAPI] Error:",e),alert(e),this.connected=!1},this.onOpen=()=>{},this.onClose=()=>{},this.onError=()=>{},console.log("Created Gemini Live API object: ",this)}setSystemInstructions(e){console.log("setting system instructions: ",e),this.systemInstructions=e}setGoogleGrounding(e){console.log("setting google grounding: ",e),this.googleGrounding=e}setResponseModalities(e){this.responseModalities=e}setVoice(e){console.log("setting voice: ",e),this.voiceName=e}setInputAudioTranscription(e){console.log("setting input audio transcription: ",e),this.inputAudioTranscription=e}setOutputAudioTranscription(e){console.log("setting output audio transcription: ",e),this.outputAudioTranscription=e}setEnableFunctionCalls(e){console.log("setting enable function calls: ",e),this.enableFunctionCalls=e}addFunction(e){this.functions.push(e),this.functionsMap[e.name]=e,console.log("added function: ",e)}callFunction(e,t){const i=this.functionsMap[e];if(!i){console.error(`❌ No function registered with name: ${e}`);return}console.log(`✅ Found function ${e}, calling runFunction`),i.runFunction(t)}async connect(e){try{const t=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({recaptcha_token:e})});if(!t.ok){const c=new Error("Authentication failed");throw c.status=t.status,c}const s=(await t.json()).session_token,n=`${window.location.protocol==="https:"?"wss:":"ws:"}//${window.location.host}/ws?token=${s}`;this.setupWebSocketToService(n)}catch(t){throw console.error("Connection error:",t),t}}disconnect(){this.webSocket&&(this.webSocket.close(),this.connected=!1)}sendMessage(e){console.log("🟩 Sending message: ",e),this.webSocket&&this.webSocket.readyState===WebSocket.OPEN&&this.webSocket.send(JSON.stringify(e))}onReceiveMessage(e){if(console.log("Message received: ",e),e.data instanceof ArrayBuffer){const s=new S({serverContent:{modelTurn:{parts:[{inlineData:{data:e.data}}]}}});s.type=d.AUDIO,s.data=e.data,this.onReceiveResponse(s);return}const t=JSON.parse(e.data),i=new S(t);this.onReceiveResponse(i)}setupWebSocketToService(e){console.log("connecting: ",e),this.webSocket=new WebSocket(e),this.webSocket.binaryType="arraybuffer",this.webSocket.onclose=t=>{console.log(`🔒 WebSocket closed: code=${t.code}, reason='${t.reason}'`),this.connected=!1,t.code!==1e3&&t.code!==1001&&console.error(`WebSocket closed unexpectedly with code ${t.code}: ${t.reason}`),this.onClose&&this.onClose(t)},this.webSocket.onerror=t=>{console.log("websocket error: ",t),this.connected=!1,this.onError&&this.onError(t)},this.webSocket.onopen=t=>{console.log("websocket open: ",t),this.connected=!0,this.totalBytesSent=0,this.sendInitialSetupMessages(),this.onConnectionStarted(),this.onOpen&&this.onOpen(t)},this.webSocket.onmessage=this.onReceiveMessage.bind(this)}getFunctionDefinitions(){console.log("🛠️ getFunctionDefinitions called");const e=[];for(let t=0;t<this.functions.length;t++){const i=this.functions[t];e.push(i.getDefinition())}return e}sendInitialSetupMessages(){const e=this.getFunctionDefinitions(),t={setup:{generation_config:{response_modalities:this.responseModalities,temperature:this.temperature,speech_config:{voice_config:{prebuilt_voice_config:{voice_name:this.voiceName}}}},system_instruction:{parts:[{text:this.systemInstructions}]},tools:{function_declarations:e}}};this.inputAudioTranscription&&(t.setup.input_audio_transcription={}),this.outputAudioTranscription&&(t.setup.output_audio_transcription={}),this.googleGrounding&&(t.setup.tools.google_search={},console.log("Google Grounding enabled, removing custom function calls if any."),delete t.setup.tools.function_declarations),this.enableAffectiveDialog,this.lastSetupMessage=t,console.log("sessionSetupMessage: ",t),this.sendMessage(t)}sendTextMessage(e){const t={client_content:{turns:[{role:"user",parts:[{text:e}]}],turn_complete:!0}};this.sendMessage(t)}sendToolResponse(e,t,i){const s={tool_response:{function_responses:[{id:e,name:t,response:i}]}};console.log("🔧 Client sending tool response:",JSON.stringify(s,null,2)),this.webSocket&&this.webSocket.readyState===WebSocket.OPEN?this.webSocket.send(JSON.stringify(s)):console.error("❌ WebSocket not open when sending tool response")}sendRealtimeInputMessage(e,t){const i={realtime_input:{media_chunks:[{mime_type:t,data:e}]}};this.sendMessage(i),this.addToBytesSent(e)}addToBytesSent(e){const i=new TextEncoder().encode(e);this.totalBytesSent+=i.length}getBytesSent(){return this.totalBytesSent}sendAudioMessage(e){this.webSocket&&this.webSocket.readyState===WebSocket.OPEN&&(this.webSocket.send(e),this.totalBytesSent+=e.byteLength)}async sendImageMessage(e,t="image/jpeg"){this.sendRealtimeInputMessage(e,t)}}console.log("loaded geminiLiveApi.js");class R{constructor(e){this.client=e,this.audioContext=null,this.audioWorklet=null,this.mediaStream=null,this.isStreaming=!1,this.sampleRate=16e3}async start(e=null){try{const t={sampleRate:this.sampleRate,echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0};return e&&(t.deviceId={exact:e}),this.mediaStream=await navigator.mediaDevices.getUserMedia({audio:t}),this.audioContext=new(window.AudioContext||window.webkitAudioContext)({sampleRate:this.sampleRate}),await this.audioContext.audioWorklet.addModule("/audio-processors/capture.worklet.js"),this.audioWorklet=new AudioWorkletNode(this.audioContext,"audio-capture-processor"),this.audioWorklet.port.onmessage=i=>{if(this.isStreaming&&i.data.type==="audio"){const s=i.data.data,a=this.convertToPCM16(s);this.client&&this.client.connected&&this.client.sendAudioMessage(a)}},this.source=this.audioContext.createMediaStreamSource(this.mediaStream),this.source.connect(this.audioWorklet),this.isStreaming=!0,console.log("🎤 Audio streaming started"),!0}catch(t){throw console.error("Failed to start audio streaming:",t),t}}stop(){this.isStreaming=!1,this.audioWorklet&&(this.audioWorklet.disconnect(),this.audioWorklet.port.close(),this.audioWorklet=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.mediaStream&&(this.mediaStream.getTracks().forEach(e=>e.stop()),this.mediaStream=null),console.log("🛑 Audio streaming stopped")}convertToPCM16(e){const t=new Int16Array(e.length);for(let i=0;i<e.length;i++){const s=Math.max(-1,Math.min(1,e[i]));t[i]=s*32767}return t.buffer}arrayBufferToBase64(e){const t=new Uint8Array(e);let i="";for(let s=0;s<t.byteLength;s++)i+=String.fromCharCode(t[s]);return window.btoa(i)}}class M{constructor(){this.audioContext=null,this.workletNode=null,this.gainNode=null,this.isInitialized=!1,this.isPlaying=!1,this.volume=1,this.sampleRate=24e3,this.onInterrupted=null,this.onPlaybackStarted=null,this.onPlaybackEnded=null}async init(){if(!this.isInitialized)try{if(this.audioContext=new(window.AudioContext||window.webkitAudioContext)({sampleRate:this.sampleRate}),!this.audioContext.audioWorklet)throw new Error("AudioWorklet is not supported. Please use a secure context (HTTPS/localhost) or a modern browser.");await this.audioContext.audioWorklet.addModule("/audio-processors/playback.worklet.js"),this.workletNode=new AudioWorkletNode(this.audioContext,"pcm-processor"),this.workletNode.port.onmessage=e=>{e.data==="ended"?(this.isPlaying=!1,console.log("🔊 Audio playback ended naturally"),this.onPlaybackEnded&&this.onPlaybackEnded()):e.data==="started"&&(this.isPlaying=!0,console.log("🔊 Audio playback started"),this.onPlaybackStarted&&this.onPlaybackStarted())},this.gainNode=this.audioContext.createGain(),this.gainNode.gain.value=this.volume,this.workletNode.connect(this.gainNode),this.gainNode.connect(this.audioContext.destination),this.isInitialized=!0,console.log("🔊 Audio player initialized")}catch(e){throw console.error("Failed to initialize audio player:",e),e}}async play(e){this.isInitialized||await this.init();try{this.audioContext.state==="suspended"&&await this.audioContext.resume();let t;if(e instanceof ArrayBuffer)t=new Uint8Array(e);else if(typeof e=="string"){const a=atob(e);t=new Uint8Array(a.length);for(let n=0;n<a.length;n++)t[n]=a.charCodeAt(n)}else{console.error("Unknown audio data format:",e);return}const i=new Int16Array(t.buffer),s=new Float32Array(i.length);for(let a=0;a<i.length;a++)s[a]=i[a]/32768;this.workletNode.port.postMessage(s)}catch(t){throw console.error("Error playing audio chunk:",t),t}}interrupt(){this.workletNode&&(console.log("🛑 Interrupting audio playback"),this.workletNode.port.postMessage("interrupt"),this.isPlaying=!1,this.onInterrupted&&this.onInterrupted(),this.gainNode&&this.audioContext&&(this.gainNode.gain.setValueAtTime(0,this.audioContext.currentTime),setTimeout(()=>{this.gainNode&&this.audioContext&&this.gainNode.gain.setValueAtTime(this.volume,this.audioContext.currentTime)},120)))}get isActive(){return this.isPlaying}setVolume(e){this.volume=Math.max(0,Math.min(1,e)),this.gainNode&&(this.gainNode.gain.value=this.volume)}destroy(){this.workletNode&&(this.workletNode.port.postMessage("interrupt"),this.workletNode.disconnect(),this.workletNode=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.isInitialized=!1,this.isPlaying=!1}}class _ extends HTMLElement{constructor(){super(),this._mission=null}set mission(e){this._mission=e,this.render()}set language(e){this._language=e}set fromLanguage(e){this._fromLanguage=e}set mode(e){this._mode=e}connectedCallback(){this.render()}disconnectedCallback(){this.audioStreamer&&this.audioStreamer.stop(),this.client&&this.client.disconnect()}render(){if(!this._mission)return;this.innerHTML=`

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
          <h2 style="font-size: 1.5rem; margin-bottom: 2px;">${this._mission.target_role||"Target Person"}</h2>
          
          <!-- Language Visibility Pill -->
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
          ${this._mode==="immergo_teacher"?`
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
          `:""}
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: ${this._mode==="immergo_teacher"?"space-between":"center"}; width: 100%; gap: ${this._mode==="immergo_teacher"?"10px":"40px"};">
          <!-- Model Visualizer (Top) -->
          <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
             <audio-visualizer id="model-viz"></audio-visualizer>
          </div>
          
          <!-- Transcript (Middle) -->
          ${this._mode==="immergo_teacher"?`
            <div style="width: 100%; height: 250px; margin: 10px 0; position: relative;">
              <live-transcript></live-transcript>
            </div>
          `:""}

          <!-- User Visualizer (Bottom) -->
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

        <!-- Rate Limit Dialog -->
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
                     " onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(26, 115, 232, 0.2)'; this.style.background='rgba(26, 115, 232, 0.1)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(26, 115, 232, 0.1)'; this.style.background='rgba(26, 115, 232, 0.05)';" >
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
    `;const e=this.querySelector("#rate-limit-dialog");this.querySelector("#close-rate-limit").addEventListener("click",()=>{e.classList.add("hidden"),e.style.display="none"});const i=()=>{this.audioStreamer&&this.audioStreamer.stop(),this.client&&this.client.disconnect(),this.audioPlayer&&this.audioPlayer.interrupt();const o=this.querySelector("#user-viz"),r=this.querySelector("#model-viz");o&&o.disconnect&&o.disconnect(),r&&r.disconnect&&r.disconnect(),console.log("👋 [App] Session ended by user");const u={incomplete:!0};this.dispatchEvent(new CustomEvent("navigate",{bubbles:!0,detail:{view:"summary",result:u}}))};this.querySelector("#back-to-missions").addEventListener("click",()=>{this.audioStreamer&&this.audioStreamer.stop(),this.client&&this.client.disconnect(),this.audioPlayer&&this.audioPlayer.interrupt();const o=this.querySelector("#user-viz"),r=this.querySelector("#model-viz");o&&o.disconnect&&o.disconnect(),r&&r.disconnect&&r.disconnect(),this.dispatchEvent(new CustomEvent("navigate",{bubbles:!0,detail:{view:"mission-selector"}}))});const a=this.querySelector("#user-viz"),n=this.querySelector("#model-viz"),c=this.querySelector("#mic-btn"),h=this.querySelector("#connection-status");let l=!1;this.client=new L,this.audioStreamer=new R(this.client),this.audioPlayer=new M;const m=new C("complete_mission","Call this tool when the user has successfully completed the mission objective. Provide a score and feedback.",{type:"OBJECT",properties:{score:{type:"INTEGER",description:"Rating from 1 to 3 based on performance: 1 (Tiro) = Struggled, used frequent English, or needed many hints. 2 (Proficiens) = Good, intelligible but with errors or hesitation. 3 (Peritus) = Excellent, fluent, native-like, no help needed."},feedback_pointers:{type:"ARRAY",items:{type:"STRING"},description:"List of 3 constructive feedback points or compliments in English."}},required:["score","feedback_pointers"]},["score","feedback_pointers"]);m.functionToCall=o=>{console.log("🏆 [App] Mission Complete Tool Triggered!",o);const r=new Audio("/winner-bell.mp3");r.volume=.6,r.play().catch(y=>console.error("Failed to play winner sound:",y));const f={1:"Tiro",2:"Proficiens",3:"Peritus"}[o.score]||"Proficiens";console.log("⏳ [App] Waiting for final audio to play before ending session..."),setTimeout(()=>{this.audioStreamer&&this.audioStreamer.stop(),this.client&&this.client.disconnect(),this.audioPlayer&&this.audioPlayer.interrupt();const y={score:o.score.toString(),level:f,notes:o.feedback_pointers};this.dispatchEvent(new CustomEvent("navigate",{bubbles:!0,detail:{view:"summary",result:y}}))},2500)},this.client.addFunction(m);const g=new C("search_pesticide_data","Search the pesticide residue database. Call this for any question about samples, violations, or pesticides.",{type:"OBJECT",properties:{question:{type:"STRING",description:"The question in Arabic or English"}},required:["question"]},["question"]);g.functionToCall=async o=>{console.log("🔬 [LARS] Query:",o.question);const u=await(await fetch("/api/lars/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:o.question})})).json();return console.log("🔬 [LARS] Result:",u.answer),u.answer},this.client.addFunction(g),this.client.onConnectionStarted=()=>{console.log("🚀 [Gemini] Connection started")},this.client.onOpen=()=>{console.log("🔓 [Gemini] WebSocket connection opened")},this.client.onReceiveResponse=o=>{if(console.log("📥 [Gemini] Received response:",o.type),o.type===d.AUDIO)this.audioPlayer.play(o.data);else if(o.type===d.TURN_COMPLETE){console.log("✅ [Gemini] Turn complete");const r=this.querySelector("live-transcript");r&&r.finalizeAll()}else if(o.type===d.TOOL_CALL)console.log("🛠️ [Gemini] Tool Call received:",o.data),o.data.functionCalls&&o.data.functionCalls.forEach(r=>{this.client.callFunction(r.name,r.args)});else if(o.type===d.INPUT_TRANSCRIPTION){const r=this.querySelector("live-transcript");r&&r.addInputTranscript(o.data.text,o.data.finished)}else if(o.type===d.OUTPUT_TRANSCRIPTION){const r=this.querySelector("live-transcript");r&&r.addOutputTranscript(o.data.text,o.data.finished)}else if(o.type===d.PROVENANCE){const r=this.querySelector("live-transcript");r&&r.addProvenance(o.data)}},this.client.onError=o=>{console.error("❌ [Gemini] Error:",o)},this.client.onClose=()=>{console.log("🔒 [Gemini] Connection closed")},c.addEventListener("click",async()=>{if(l=!l,l)c.classList.add("active"),c.innerHTML=`
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
            <span style="font-weight: 800; font-size: 1.1rem; letter-spacing: 0.05em; text-transform: uppercase;">End Mission</span>
        `;else{c.classList.remove("active"),i();return}if(l){console.log("🎙️ [App] Microphone button clicked: Starting session..."),h.textContent="Connecting...",h.style.color="var(--color-text-sub)";try{const o=this._language||"French",r=this._fromLanguage||"English",u=this._mode||"immergo_immersive",f=this._mission?this._mission.title:"General Conversation",y=this._mission?this._mission.desc:"",w=this._mission?this._mission.target_role||"a local native speaker":"a conversational partner";let b="";u==="immergo_teacher"?b=`
ROLEPLAY INSTRUCTION:
You are acting as **${w}**, a native speaker of ${o}.
The user is a language learner (native speaker of ${r}) trying to: "${f}" (${y}).
Your goal is to be a PROACTIVE LANGUAGE MENTOR while staying in character as ${w}.

TEACHING PROTOCOL:
1. **Gentle Corrections**: If the user makes a clear mistake, respond in character first, then briefly provide a friendly correction or a "more natural way to say that" in ${r}.
2. **Vocabulary Boost**: Every few turns, suggest 1-2 relevant words or idioms in ${o} that fit the current situation and explain their meaning in ${r}.
3. **Mini-Checks**: Occasionally (every 3-4 turns), ask the user a quick "How would you say...?" question in ${r} related to the mission to test their recall.
4. **Scaffolding**: If the user is hesitant, provide the start of a sentence in ${o} or give them two options to choose from to keep the momentum.
5. **Mixed-Language Support**: Use ${r} for teaching moments, but always pivot back to ${o} to maintain the immersive feel.

INTERACTION GUIDELINES:
1. Prioritize the flow of conversation—don't let the teaching feel like a lecture.
2. Utilize the proactive audio feature: do not respond until the user has clearly finished their thought.

MISSION COMPLETION:
When the user has successfully achieved the mission objective:
1. Give a warm congratulatory message in ${o}, then translate the praise into ${r}.
2. THEN call the "complete_mission" tool.
3. Set 'score' to 0 (Zero) as this is a learning-focused practice session.
4. Provide 3 specific takeaways (grammar tips or new words) in the feedback list in ${r}.
`:b=`
          You are LARS — Laboratory Analysis and Risk System.
          You are a bilingual AI assistant for food safety laboratories in Al-Qassim, Saudi Arabia.

          Respond in the same language the user speaks — Arabic or English.
          تحدث بنفس لغة المستخدم — عربي أو إنجليزي.

          Your mission: "${f}" — ${y}

          For any data question, call the search_pesticide_data tool immediately.
          لأي سؤال عن البيانات، استدعِ أداة search_pesticide_data فوراً.

          After getting results, read the key numbers clearly and concisely.
          Never fabricate data — all answers come from the database only.

          MISSION COMPLETION:
          When the user's question is fully answered, call the "complete_mission" tool.
          Score: 3 always (task-based, not language-based).
          Feedback: 3 insights about what was found in the data.
          `,console.log("📝 [App] Setting system instructions for",o,"Mode:",u),this.client.setSystemInstructions(b),u==="immergo_teacher"?(this.client.setInputAudioTranscription(!0),this.client.setOutputAudioTranscription(!0)):(this.client.setInputAudioTranscription(!1),this.client.setOutputAudioTranscription(!1)),console.log("🔌 [App] Connecting to backend...");let v="";try{v=await this.getRecaptchaToken(),console.log("Captcha solved:",v)}catch(x){console.error("Recaptcha failed:",x),l=!1,c.classList.remove("active"),c.innerHTML=`
                <span style="font-size: 1.3rem; font-weight: 800; margin-bottom: 2px; letter-spacing: 0.02em;">Start Mission</span>
                <span style="font-size: 0.85rem; opacity: 0.9; font-style: italic;">You start the conversation!</span>
            `,a.disconnect(),n.disconnect(),h.textContent="";return}await this.client.connect(v),console.log("🎤 [App] Starting audio stream..."),await this.audioStreamer.start(),this.audioStreamer.audioContext&&this.audioStreamer.source&&a.connect(this.audioStreamer.audioContext,this.audioStreamer.source),console.log("🔊 [App] Initializing audio player..."),await this.audioPlayer.init(),this.audioPlayer.audioContext&&this.audioPlayer.gainNode&&n.connect(this.audioPlayer.audioContext,this.audioPlayer.gainNode),console.log("✨ [App] Session active!"),h.textContent="Connected and ready to speak",h.style.color="#4CAF50";const T=new Audio("/start-bell.mp3");T.volume=.6,T.play().catch(x=>console.error("Failed to play start sound:",x))}catch(o){console.error("❌ [App] Failed to start session:",o),console.log("Error status:",o.status),l=!1,c.classList.remove("active"),c.innerHTML=`
              <span style="font-size: 1.3rem; font-weight: 800; margin-bottom: 2px; letter-spacing: 0.02em;">Start Mission</span>
              <span style="font-size: 0.85rem; opacity: 0.9; font-style: italic;">You start the conversation!</span>
          `,a.disconnect(),n.disconnect(),h.textContent="",o.status===429?(e.classList.remove("hidden"),e.style.display="flex"):alert("Failed to start session: "+o.message)}}})}async getRecaptchaToken(){return new Promise(e=>{if(typeof grecaptcha>"u"){console.warn("⚠️ ReCAPTCHA not loaded (Simple Mode). Proceeding without token."),e(null);return}try{grecaptcha.enterprise.ready(async()=>{try{const t=await grecaptcha.enterprise.execute("6LeSYx8sAAAAAGdRAp8VQ2K9I-KYGWBykzayvQ8n",{action:"LOGIN"});e(t)}catch(t){console.warn("⚠️ ReCAPTCHA execution failed (Simple Mode fallback):",t),e(null)}})}catch(t){console.warn("⚠️ ReCAPTCHA ready failed:",t),e(null)}})}}customElements.define("view-chat",_);class P extends HTMLElement{constructor(){super(),this._result=null}set result(e){this._result=e,this.render()}connectedCallback(){this.render()}render(){if(!this._result)return;this._result.incomplete?this.innerHTML=`
          <div class="container text-center">
            <h2 style="margin-top: var(--spacing-xl); color: var(--color-text-sub);">Session Complete</h2>
            
            <div style="margin: var(--spacing-xxl) 0; opacity: 0.7;">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <p style="margin-top: var(--spacing-md); font-size: 1.1rem;">
                    Your LARS voice session has ended.<br>Start a new session anytime.
                </p>
            </div>

            <div style="flex: 1;"></div>

            <button id="home-btn" class="btn-primary">Back to Topics</button>
          </div>
        `:this.innerHTML=`
          <div class="container text-center">
            <h2 style="margin-top: var(--spacing-xl); color: var(--color-accent-secondary);">Session Accomplished!</h2>
            
            <div style="margin: var(--spacing-lg) 0;">
              ${this._result.score!=="0"&&this._result.score!==0?this._renderScore(this._result.score):'<p style="font-size: 1.2rem; opacity: 0.8;">Data analysis session complete!</p>'}
            </div>

            <div class="card" style="text-align: left;">
              <h4 style="border-bottom: 2px solid var(--color-bg); padding-bottom: var(--spacing-sm);">Summary</h4>
              <ul style="padding-left: var(--spacing-lg); color: var(--color-text-sub);">
                ${this._result.notes.map(t=>`<li>${t}</li>`).join("")}
              </ul>
            </div>

            <div style="flex: 1;"></div>

            <button id="home-btn" class="btn-primary">Back to Topics</button>
          </div>
        `;const e=this.querySelector("#home-btn");e.style.cssText=`
        background: var(--color-accent-primary);
        color: white;
        padding: 20px var(--spacing-xl);
        font-size: 1.25rem;
        font-weight: 800;
        border-radius: var(--radius-lg);
        width: 100%;
        margin-bottom: var(--spacing-xxl);
        box-shadow: 0 10px 20px -5px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.1);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    `,e.onmouseover=()=>{e.style.transform="translateY(-4px) scale(1.01)",e.style.boxShadow="0 15px 30px -10px rgba(163, 177, 138, 0.4)",e.style.filter="brightness(1.1)"},e.onmouseout=()=>{e.style.transform="translateY(0) scale(1)",e.style.boxShadow="0 10px 20px -5px rgba(0,0,0,0.3)",e.style.filter="brightness(1)"},e.addEventListener("click",()=>{this.dispatchEvent(new CustomEvent("navigate",{bubbles:!0,detail:{view:"splash",mission:null,result:null}}))})}_renderScore(e){const t=[{id:"1",title:"Tiro",stars:1},{id:"2",title:"Proficiens",stars:2},{id:"3",title:"Peritus",stars:3}];t.find(n=>n.id===e.toString())||t[0];const i={1:"You needed a lot of help",2:"A little help",3:"No help, fluid"},s='<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';return`
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--spacing-md); height: 80px;">
        ${t.map(n=>{const c=n.id===e.toString(),h=c?"1":"0.3",l=c?"var(--color-accent-primary)":"var(--color-text-main)",m=c?"bold":"normal",g=c?"1.1rem":"0.9rem";let o="";for(let r=0;r<n.stars;r++)o+=s;return`
        <div style="flex: 1; opacity: ${h}; color: ${l}; transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; gap: 4px;">
           <div style="display: flex; gap: 2px; color: ${c?"var(--color-accent-secondary)":"currentColor"}">
             ${o}
           </div>
           <span style="font-family: var(--font-heading); font-weight: ${m}; font-size: ${g};">${n.title}</span>
        </div>
      `}).join("")}
      </div>
      <p style="font-size: 1rem; opacity: 0.8; font-style: italic; margin-top: var(--spacing-md);">(${i[e.toString()]||""})</p>
    `}}customElements.define("view-summary",P);class N extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}static get observedAttributes(){return["text","values"]}connectedCallback(){this.render(),this.startAnimation()}attributeChangedCallback(e,t,i){t!==i&&(this.render(),e==="values"&&this.startAnimation())}render(){const e=this.getAttribute("text")||"";this.shadowRoot.innerHTML=`
      <style>
        :host {
          display: inline-block;
        }
        span {
          transition: opacity 0.5s ease-in-out;
          opacity: 1;
        }
        span.hidden {
          opacity: 0;
        }
      </style>
      <span id="content">${e}</span>
    `}startAnimation(){this.intervalId&&clearInterval(this.intervalId);const e=this.getAttribute("values");if(!e)return;let t=[];try{t=JSON.parse(e)}catch{console.error("Invalid values for text-cycler:",e);return}if(!Array.isArray(t)||t.length===0)return;let i=-1;const s=this.getAttribute("text")||"";let a=!0;const n=this.shadowRoot.getElementById("content");n&&(this.intervalId=setInterval(()=>{n&&(n.classList.add("hidden"),setTimeout(()=>{a?(i=(i+1)%t.length,n.textContent=t[i],a=!1):(n.textContent=s,a=!0),n.classList.remove("hidden")},500))},3e3))}disconnectedCallback(){this.intervalId&&clearInterval(this.intervalId)}}customElements.define("text-cycler",N);class O extends HTMLElement{constructor(){super(),this.state={view:"splash",selectedMission:null,selectedLanguage:null,sessionResult:null}}connectedCallback(){this.innerHTML="",this.themes=["dark","light","system"],this.currentTheme=localStorage.getItem("theme")||"system",this.mediaQuery=window.matchMedia("(prefers-color-scheme: dark)"),this.mediaQuery.addEventListener("change",()=>{this.currentTheme==="system"&&this.applyTheme("system")}),this.applyTheme(this.currentTheme);const e=document.createElement("header");e.style.cssText=`
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: var(--spacing-sm) var(--spacing-md);
            gap: var(--spacing-md);
            width: 100%;
            pointer-events: none; /* Let clicks pass through to underlying elements if needed, but buttons need pointer-events: auto */
        `,e.innerHTML=`

            <button id="theme-toggle" aria-label="Toggle Theme" style="
                pointer-events: auto;
                background: var(--color-surface);
                color: var(--color-text-main);
                border: 1px solid var(--glass-border);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: var(--shadow-sm);
                font-size: 1.2rem;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            ">
                <span class="theme-icon"></span>
            </button>
        `,this.appendChild(e);const t=e.querySelector("#theme-toggle");if(t.onclick=()=>this.cycleTheme(),this.themeBtn=t,this.updateThemeBtnIcon(),!document.getElementById("github-buttons-script")){const i=document.createElement("script");i.id="github-buttons-script",i.src="https://buttons.github.io/buttons.js",i.async=!0,i.defer=!0,document.head.appendChild(i)}this.viewContainer=document.createElement("div"),this.viewContainer.style.height="100%",this.viewContainer.style.width="100%",this.appendChild(this.viewContainer),this.render(),this.checkConfigStatus(),this.addEventListener("navigate",i=>{this.state.view=i.detail.view,i.detail.mission&&(this.state.selectedMission=i.detail.mission),i.detail.language&&(this.state.selectedLanguage=i.detail.language),i.detail.fromLanguage&&(this.state.selectedFromLanguage=i.detail.fromLanguage),i.detail.mode&&(this.state.selectedMode=i.detail.mode),i.detail.result&&(this.state.sessionResult=i.detail.result),this.render()})}applyTheme(e){if(e==="system"){const t=window.matchMedia("(prefers-color-scheme: dark)").matches;this.setLightMode(!t)}else this.setLightMode(e==="light")}setLightMode(e){e?document.body.classList.add("light-mode"):document.body.classList.remove("light-mode")}cycleTheme(){const e=["dark","light","system"],t=e.indexOf(this.currentTheme),i=t===-1?0:(t+1)%e.length;this.currentTheme=e[i],localStorage.setItem("theme",this.currentTheme),this.applyTheme(this.currentTheme),this.updateThemeBtnIcon()}updateThemeBtnIcon(){if(!this.themeBtn)return;let e="",t="";switch(this.currentTheme){case"light":e="☀️",t="Light Mode";break;case"dark":e="🌙",t="Dark Mode";break;case"system":e="💻",t="System Default";break}const i=this.themeBtn.querySelector(".theme-icon");i&&(i.textContent=e),this.themeBtn.title=t}async checkConfigStatus(){try{const t=await(await fetch("/api/status")).json();t.mode==="simple"&&this.showSimpleModeWarning(t.missing)}catch(e){console.warn("Failed to check config status:",e)}}showSimpleModeWarning(e){const t=document.createElement("div");t.style.cssText=`
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff3cd;
            color: #856404;
            padding: 8px 16px;
            text-align: center;
            font-size: 0.9rem;
            z-index: 9999;
            border-top: 1px solid #ffeeba;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        `;const i=e.join(" & ");t.innerHTML=`
            <span>⚠️ <b>Simple Mode Check:</b> Production security features (${i}) are not configured.</span>
            <a href="https://github.com/ZackAkil/immersive-language-learning-with-live-api#advanced-configuration" target="_blank" style="color: #533f03; text-decoration: underline; font-weight: bold; margin-left: 4px;">Learn more</a>
        `,t.style.display="none",this.appendChild(t)}render(){if(!this.viewContainer)return;this.viewContainer.innerHTML="";let e;switch(this.state.view){case"splash":e=document.createElement("view-splash");break;case"chat":e=document.createElement("view-chat"),e.mission=this.state.selectedMission,e.language=this.state.selectedLanguage,e.fromLanguage=this.state.selectedFromLanguage,e.mode=this.state.selectedMode;break;case"summary":e=document.createElement("view-summary"),e.result=this.state.sessionResult;break;default:e=document.createElement("view-splash")}e.classList.add("fade-in"),this.viewContainer.appendChild(e)}}customElements.define("app-root",O);document.querySelector("#app").innerHTML=`
  <app-root></app-root>
`;
