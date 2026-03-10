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

import missionsData from '../data/missions.json';

class ViewMissions extends HTMLElement {
  connectedCallback() {
    const options = `
            <option>🇬🇧 English</option>
            <option>🇩🇪 German</option>
            <option>🇪🇸 Spanish</option>
            <option>🇫🇷 French</option>
            <option>🇮🇳 Hindi</option>
            <option>🇦🇪 Arabic</option>
            <option>🇮🇩 Indonesian</option>
            <option>🇮🇹 Italian</option>
            <option>🇯🇵 Japanese</option>
            <option>🇰🇷 Korean</option>
            <option>🇧🇷 Portuguese</option>
            <option>🇷🇺 Russian</option>
            <option>🇳🇱 Dutch</option>
            <option>🇵🇱 Polish</option>
            <option>🇧🇩 Bengali</option>
            <option>🇮🇳 Marathi</option>
            <option>🇮🇳 Tamil</option>
            <option>🇮🇳 Telugu</option>
            <option>🇹🇭 Thai</option>
            <option>🇹🇷 Turkish</option>
            <option>🇻🇳 Vietnamese</option>
            <option>🇷🇴 Romanian</option>
            <option>🇺🇦 Ukrainian</option>
            <option>🧑‍🔬 Science Jargon</option>

    `;

    this.innerHTML = `
      <div class="container" style="max-width: 1000px;">
        <!-- Removed HUD panel entirely since LARS doesn't need language dropdowns or mode selectors -->

        <div style="margin-bottom: var(--spacing-md); text-align: center; margin-top: var(--spacing-xl);">
            <h2 style="font-size: 2.5rem; letter-spacing: -0.03em; margin-bottom: var(--spacing-xs);">Select a Query Topic</h2>
            <p style="opacity: 0.7; font-size: 1.1rem;">Choose a topic to start a voice session with LARS.</p>
        </div>

        <div class="missions-list mission-grid">
          <!-- Missions will be injected here -->
        </div>

        <!-- Removed developer control center (github/cloudrun features) -->
      </div>
    `;

    this.renderMissions();
  }

  renderMissions() {
    const missions = missionsData;
    const listContainer = this.querySelector('.missions-list');

    const getMissionIcon = (title) => {
      if (title.includes('بحث')) return '🔍';
      if (title.includes('مخالفات')) return '📊';
      if (title.includes('الأحياء')) return '🏘️';
      if (title.includes('إحصائيات')) return '📈';
      return '🧪';
    };

    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'card mission-card';
      card.style.cursor = 'pointer';

      let badgeColor = '#00c2c7';
      if (mission.difficulty === 'Medium') badgeColor = '#ffc107';
      if (mission.difficulty === 'Hard') badgeColor = '#ff9800';
      if (mission.difficulty === 'Expert') badgeColor = '#f44336';

      // Highlight Easy for the first one if we wanted, but sticking to logic
      if (mission.difficulty === 'Easy') badgeColor = '#8bc34a';


      card.innerHTML = `
        <div style="margin-bottom: var(--spacing-md); display: flex; justify-content: space-between; align-items: start;">
            <div style="font-size: 2.5rem; line-height: 1;">${getMissionIcon(mission.title)}</div>
            <span style="
                background: ${badgeColor}22;
                color: ${badgeColor};
                padding: 4px 8px;
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid ${badgeColor}44;
            ">${mission.difficulty}</span>
        </div>
        <h3 style="margin: 0 0 var(--spacing-sm) 0; font-size: 1.4rem; line-height: 1.2;">${mission.title}</h3>
        <p style="margin: 0; font-size: 0.95rem; opacity: 0.7; line-height: 1.5;">${mission.desc}</p>
        <div style="margin-top: auto; padding-top: var(--spacing-md); font-size: 0.8rem; color: var(--color-accent-secondary); font-weight: bold; opacity: 0.8;">
            AI Assistant: ${mission.persona || 'LARS'}
        </div>
      `;

      card.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('navigate', {
          bubbles: true,
          detail: {
            view: 'chat',
            mission: mission,
            language: "English",
            fromLanguage: "English",
            mode: "lars"
          }
        }));
      });

      listContainer.appendChild(card);
    });
  }
}

customElements.define('view-missions', ViewMissions);
