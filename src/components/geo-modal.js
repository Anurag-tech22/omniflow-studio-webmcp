/**
 * Multi-Region Global Edge Latency Modal Component
 */

import { GeoDistributor } from '../canvas/geo-distributor.js';

export class GeoModal {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.modalEl = document.getElementById('geo-modal');
    this.bodyEl = document.getElementById('geo-modal-body');
    this.initEvents();
  }

  initEvents() {
    const openBtn = document.getElementById('btn-open-geo');
    const closeBtn = document.getElementById('btn-close-geo');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.show());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  show() {
    if (!this.modalEl) return;
    this.render();
    this.modalEl.classList.remove('hidden');
    this.canvas.playSfx(580, 'sine', 0.1);
  }

  hide() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('hidden');
  }

  render() {
    if (!this.bodyEl) return;
    const trafficRps = this.canvas.simulator.isRunning ? this.canvas.simulator.trafficRps : 16500;
    const data = GeoDistributor.simulateGlobalRouting(this.canvas.nodes, trafficRps);

    let html = `
      <div class="geo-header-stats">
        <div class="bench-stat-card">
          <div class="bench-num text-cyan">${data.totalGlobalPoPs} PoPs</div>
          <div class="bench-label">Global Anycast Edge Locations</div>
        </div>
        <div class="bench-stat-card">
          <div class="bench-num text-emerald">${data.avgGlobalLatency}</div>
          <div class="bench-label">Global Roundtrip Latency</div>
        </div>
        <div class="bench-stat-card">
          <div class="bench-num text-purple">99.999%</div>
          <div class="bench-label">Multi-Region Edge SLA</div>
        </div>
      </div>

      <div class="geo-regions-list">
    `;

    data.regions.forEach(r => {
      html += `
        <div class="geo-region-card glass-card">
          <div class="geo-card-header">
            <div class="geo-region-title">
              <span class="geo-flag">${r.flag}</span>
              <strong>${r.name}</strong>
              <code class="geo-code-tag">${r.id}</code>
            </div>
            <div class="geo-badge-live">
              <span class="pulse-dot"></span> Active (${r.cacheHitRate} cache hit)
            </div>
          </div>

          <div class="geo-metrics-grid">
            <div>
              <span class="m-label">Edge PoPs</span>
              <strong class="text-cyan">${r.edgePoPs} points</strong>
            </div>
            <div>
              <span class="m-label">Traffic Share</span>
              <strong class="text-amber">${r.trafficShare} (${r.regionalRps})</strong>
            </div>
            <div>
              <span class="m-label">Latency SLA</span>
              <strong class="text-emerald">${r.pingMs}ms</strong>
            </div>
            <div>
              <span class="m-label">Compliance</span>
              <span class="badge-tag">${r.compliance}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.bodyEl.innerHTML = html;
  }
}
