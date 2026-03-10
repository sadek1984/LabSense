import missionsData from '../data/missions.json';

class ViewMissions extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap" rel="stylesheet">

      <style>
        .lm-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          background: #f0f2f5;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }

        /* Floating scientific symbols — matches splash screen */
        .lm-bg-symbols {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .lm-bg-symbols span {
          position: absolute;
          font-weight: 700;
          color: #0d9488;
          opacity: 0.07;
          user-select: none;
        }

        /* Status badge */
        .lm-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(13,148,136,0.09);
          border: 1px solid rgba(13,148,136,0.22);
          border-radius: 999px;
          padding: 6px 16px;
          margin-bottom: 20px;
        }
        .lm-badge-dot {
          width: 7px;
          height: 7px;
          background: #0d9488;
          border-radius: 50%;
          animation: lm-pulse 2s ease-in-out infinite;
        }
        .lm-badge-text {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0d9488;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* Header */
        .lm-header {
          text-align: center;
          margin-bottom: 44px;
          position: relative;
          z-index: 1;
        }
        .lm-title {
          font-size: clamp(1.9rem, 5vw, 2.7rem);
          font-weight: 800;
          color: #1a2332;
          margin: 0 0 12px;
          letter-spacing: -0.035em;
          line-height: 1.15;
        }
        .lm-subtitle {
          color: #7a8899;
          font-size: 1rem;
          margin: 0;
          font-weight: 400;
        }

        /* Grid */
        .lm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          width: 100%;
          max-width: 720px;
          position: relative;
          z-index: 1;
        }

        /* Card */
        .lm-card {
          background: #ffffff;
          border-radius: 20px;
          padding: 28px 26px;
          border: 1.5px solid #e6eaf0;
          cursor: pointer;
          transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.22s ease,
                      border-color 0.22s ease;
          animation: lm-fadein 0.45s ease both;
          box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
        }
        .lm-card:hover {
          transform: translateY(-5px) scale(1.015);
          border-color: rgba(13,148,136,0.38);
          box-shadow: 0 14px 36px rgba(13,148,136,0.13), 0 2px 8px rgba(0,0,0,0.05);
        }

        /* Card header row */
        .lm-card-head {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 14px;
        }
        .lm-icon-wrap {
          width: 52px;
          height: 52px;
          min-width: 52px;
          background: linear-gradient(135deg, rgba(13,148,136,0.12) 0%, rgba(13,148,136,0.04) 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.7rem;
          border: 1px solid rgba(13,148,136,0.15);
          transition: background 0.2s;
        }
        .lm-card:hover .lm-icon-wrap {
          background: linear-gradient(135deg, rgba(13,148,136,0.2) 0%, rgba(13,148,136,0.08) 100%);
        }
        .lm-card-titles { flex: 1; }
        .lm-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a2332;
          margin: 0 0 4px;
          line-height: 1.25;
        }
        .lm-card-sub {
          font-size: 0.78rem;
          font-weight: 600;
          color: #0d9488;
          letter-spacing: 0.03em;
        }

        /* Description */
        .lm-card-desc {
          font-size: 0.9rem;
          color: #7a8899;
          line-height: 1.65;
          margin: 0 0 18px;
          flex: 1;
        }

        /* Example phrases */
        .lm-examples {
          border-top: 1px solid #eef0f4;
          padding-top: 14px;
          margin-top: auto;
        }
        .lm-examples-label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #b0bac8;
          margin-bottom: 8px;
        }
        .lm-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .lm-chip {
          font-size: 0.78rem;
          font-weight: 500;
          background: rgba(13,148,136,0.07);
          color: #0d9488;
          padding: 4px 11px;
          border-radius: 999px;
          border: 1px solid rgba(13,148,136,0.18);
          transition: background 0.15s;
          cursor: pointer;
          white-space: nowrap;
        }
        .lm-card:hover .lm-chip {
          background: rgba(13,148,136,0.13);
        }

        /* Arrow hint on hover */
        .lm-card-arrow {
          position: absolute;
          top: 26px;
          right: 22px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(13,148,136,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.2s, transform 0.2s;
        }
        .lm-card { position: relative; }
        .lm-card:hover .lm-card-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        .lm-card-arrow svg { width: 14px; height: 14px; stroke: #0d9488; }

        /* Animations */
        @keyframes lm-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes lm-fadein {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      </style>

      <div class="lm-root">

        <!-- Floating background symbols -->
        <div class="lm-bg-symbols">
          <span style="font-size:2.1rem;top:6%;left:4%;transform:rotate(-20deg);">MRL</span>
          <span style="font-size:1.4rem;top:12%;left:88%;transform:rotate(15deg);">ADI</span>
          <span style="font-size:1.7rem;top:78%;left:6%;transform:rotate(-10deg);">LC50</span>
          <span style="font-size:1.2rem;top:82%;left:84%;transform:rotate(18deg);">μg</span>
          <span style="font-size:2rem;top:45%;left:2%;transform:rotate(-30deg);">%</span>
          <span style="font-size:1.5rem;top:20%;left:52%;transform:rotate(8deg);">ppm</span>
          <span style="font-size:1.8rem;top:68%;left:70%;transform:rotate(-15deg);">Δ</span>
          <span style="font-size:1.3rem;top:34%;left:92%;transform:rotate(22deg);">N</span>
          <span style="font-size:1.6rem;top:55%;left:48%;transform:rotate(-5deg);">ADI</span>
          <span style="font-size:1.1rem;top:91%;left:38%;transform:rotate(12deg);">MRL</span>
        </div>

        <!-- Header -->
        <div class="lm-header">
          <div class="lm-badge">
            <div class="lm-badge-dot"></div>
            <span class="lm-badge-text">LARS Voice Agent — Ready</span>
          </div>
          <h2 class="lm-title">What would you like<br>to investigate?</h2>
          <p class="lm-subtitle">Choose a topic to begin your voice session with LARS.</p>
        </div>

        <!-- Cards injected here -->
        <div class="missions-list lm-grid"></div>

      </div>
    `;

    this.renderMissions();
  }

  renderMissions() {
    const missions = missionsData;
    const listContainer = this.querySelector('.missions-list');

    const iconMap = {
      default: '🧪',
      pesticide: '🔬',
      risk: '⚠️',
      food: '🥦',
      report: '📊',
    };

    missions.forEach((mission, index) => {
      const card = document.createElement('div');
      card.className = 'lm-card';
      card.style.animationDelay = `${index * 0.07}s`;

      const icon = iconMap[mission.icon] || iconMap.default;

      card.innerHTML = `
        <div class="lm-card-arrow">
          <svg viewBox="0 0 16 16" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </div>

        <div class="lm-card-head">
          <div class="lm-icon-wrap">${icon}</div>
          <div class="lm-card-titles">
            <div class="lm-card-title">${mission.title}</div>
            ${mission.subtitle ? `<div class="lm-card-sub">${mission.subtitle}</div>` : ''}
          </div>
        </div>

        ${mission.description ? `<p class="lm-card-desc">${mission.description}</p>` : ''}

        ${mission.example_phrases && mission.example_phrases.length ? `
          <div class="lm-examples">
            <div class="lm-examples-label">Example queries</div>
            <div class="lm-chips">
              ${mission.example_phrases.slice(0, 2).map(p =>
        `<span class="lm-chip">${p}</span>`
      ).join('')}
            </div>
          </div>
        ` : ''}
      `;

      card.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('navigate', {
          bubbles: true,
          detail: {
            view: 'chat',
            mission: mission,
            language: 'English',
            fromLanguage: 'English',
            mode: mission.mode || 'lars'
          }
        }));
      });

      listContainer.appendChild(card);
    });
  }
}

customElements.define('view-missions', ViewMissions);