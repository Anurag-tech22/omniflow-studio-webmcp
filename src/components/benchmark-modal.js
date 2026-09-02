/**
 * AI Frontier Model Benchmark Modal Component
 */

import { BenchmarkEngine } from '../canvas/benchmark-engine.js';

export class BenchmarkModal {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.modalEl = document.getElementById('benchmark-modal');
    this.bodyEl = document.getElementById('benchmark-modal-body');
    this.initEvents();
  }

  initEvents() {
    const openBtn = document.getElementById('btn-open-benchmark');
    const closeBtn = document.getElementById('btn-close-benchmark');

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
    this.canvas.playSfx(660, 'sine', 0.1);
  }

  hide() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('hidden');
  }

  render() {
    if (!this.bodyEl) return;
    const cluster = BenchmarkEngine.evaluateCluster(this.canvas.nodes);

    let html = `
      <div class="benchmark-header-grid" style="grid-template-columns: 1fr 1fr 1fr 1.2fr;">
        <div class="bench-stat-card">
          <div class="bench-num text-emerald">${cluster.totalGpus} GPUs</div>
          <div class="bench-label">Cluster H100 Modules</div>
        </div>
        <div class="bench-stat-card">
          <div class="bench-num text-cyan">${cluster.totalVramGb} GB</div>
          <div class="bench-label">Aggregate HBM3e VRAM</div>
        </div>
        <div class="bench-stat-card">
          <div class="bench-num text-purple">${cluster.maxClusterThroughputTokSec} tok/s</div>
          <div class="bench-label">Max Token Throughput</div>
        </div>
        <div class="bench-stat-card">
          <div class="bench-num text-pink">${cluster.tensorParallelismDegree}</div>
          <div class="bench-label">${cluster.nvlinkInterconnectSpeedup}</div>
        </div>
      </div>

      <div class="benchmark-models-grid">
    `;

    cluster.models.forEach(m => {
      html += `
        <div class="bench-model-card glass-card">
          <div class="model-card-header">
            <div>
              <div class="model-card-title">${m.name}</div>
              <div class="model-card-provider">${m.provider}</div>
            </div>
            <span class="badge-tag">${m.contextWindow}</span>
          </div>

          <div class="model-metrics-row">
            <div class="metric-item">
              <span class="m-label">Throughput</span>
              <strong class="m-val text-cyan">${m.throughputTokSec} tok/s</strong>
            </div>
            <div class="metric-item">
              <span class="m-label">TTFT Latency</span>
              <strong class="m-val text-emerald">${m.avgTtftMs}ms</strong>
            </div>
            <div class="metric-item">
              <span class="m-label">Reasoning</span>
              <strong class="m-val text-purple">${m.reasoningScore}%</strong>
            </div>
          </div>

          <div class="model-pricing-box">
            <span>Price (1M in / out): <strong>${m.inputPricePerM}</strong> / <strong>${m.outputPricePerM}</strong></span>
          </div>

          <div class="model-best-for">
            <em>💡 Best for: ${m.bestFor}</em>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    this.bodyEl.innerHTML = html;
  }
}
