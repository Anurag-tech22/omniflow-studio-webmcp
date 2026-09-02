/**
 * WebMCP DevTools Live Inspector HUD Component
 */

import { webmcp } from '../webmcp/webmcp-core.js';

export class HudInspector {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.panelEl = document.getElementById('webmcp-hud-panel');
    this.toolsContainer = document.getElementById('tools-accordion-container');
    this.logStreamEl = document.getElementById('telemetry-log-stream');
    this.totalCallsEl = document.getElementById('telemetry-total-calls');
    this.avgLatencyEl = document.getElementById('telemetry-avg-latency');
    this.hudToolCountEl = document.getElementById('hud-tools-count');
    this.hudTabCountEl = document.getElementById('hud-tab-count');

    // Test Modal
    this.testModal = document.getElementById('tool-test-modal');
    this.currentTestingTool = null;

    this.initEvents();
    this.renderToolsList();
  }

  initEvents() {
    // Toggle HUD Button
    const toggleBtn = document.getElementById('btn-toggle-hud');
    const closeBtn = document.getElementById('btn-close-hud');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.panelEl.classList.toggle('hidden');
        if (!this.panelEl.classList.contains('hidden')) {
          this.renderToolsList();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.panelEl.classList.add('hidden');
      });
    }

    // Tab Navigation
    const tabs = this.panelEl.querySelectorAll('.hud-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabId = tab.getAttribute('data-tab');
        this.panelEl.querySelectorAll('.hud-view').forEach(view => {
          view.classList.remove('active');
        });
        const activeView = document.getElementById(`view-${tabId}`);
        if (activeView) activeView.classList.add('active');
      });
    });

    // Clear Logs
    const clearLogBtn = document.getElementById('btn-clear-telemetry');
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        if (this.logStreamEl) this.logStreamEl.innerHTML = '';
      });
    }

    // Listen to WebMCP Telemetry Events
    webmcp.on('tool-registered', () => {
      this.renderToolsList();
    });

    webmcp.on('telemetry-log', (entry) => {
      this.appendLogEntry(entry);
    });

    webmcp.on('tool-finished', () => {
      this.updateTelemetryStats();
      this.renderToolsList();
    });

    // Tool Test Modal Actions
    const closeTestModalBtn = document.getElementById('btn-close-tool-test');
    const cancelTestModalBtn = document.getElementById('btn-cancel-tool-test');
    const runTestBtn = document.getElementById('btn-run-tool-test');

    if (closeTestModalBtn) closeTestModalBtn.addEventListener('click', () => this.hideTestModal());
    if (cancelTestModalBtn) cancelTestModalBtn.addEventListener('click', () => this.hideTestModal());
    if (runTestBtn) runTestBtn.addEventListener('click', () => this.executeModalTest());
  }

  renderToolsList() {
    const tools = webmcp.listTools();
    if (this.hudToolCountEl) this.hudToolCountEl.textContent = tools.length;
    if (this.hudTabCountEl) this.hudTabCountEl.textContent = tools.length;
    if (!this.toolsContainer) return;

    this.toolsContainer.innerHTML = '';

    tools.forEach(tool => {
      const item = document.createElement('div');
      item.className = 'tool-accordion-item';

      const header = document.createElement('div');
      header.className = 'tool-accordion-header';
      header.innerHTML = `
        <div class="tool-name-tag">${tool.name}</div>
        <div class="tool-badge-group">
          ${tool.readOnlyHint ? '<span class="hint-pill">ReadOnly</span>' : (tool.destructiveHint ? '<span class="hint-pill" style="background:rgba(239,68,68,0.15);color:#ef4444;border-color:rgba(239,68,68,0.3)">Destructive</span>' : '<span class="hint-pill" style="background:rgba(0,240,255,0.15);color:#00f0ff;border-color:rgba(0,240,255,0.3)">Mutating</span>')}
          ${tool.isDeclarative ? '<span class="badge-tag">Declarative Form</span>' : ''}
          <span style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-muted)">${tool.callCount || 0} calls</span>
          <svg class="chevron-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      `;

      const body = document.createElement('div');
      body.className = 'tool-accordion-body';
      body.innerHTML = `
        <div class="tool-desc-text">${tool.description}</div>
        <div class="schema-box-title">JSON Input Schema:</div>
        <pre class="tool-schema-pre"><code>${JSON.stringify(tool.inputSchema, null, 2)}</code></pre>
        <div class="tool-actions-bar">
          <button class="btn btn-xs btn-cyan" data-run-tool="${tool.name}">
            🧪 Test Tool Execution
          </button>
        </div>
      `;

      header.addEventListener('click', () => {
        item.classList.toggle('open');
      });

      const testBtn = body.querySelector(`[data-run-tool="${tool.name}"]`);
      if (testBtn) {
        testBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openTestModal(tool);
        });
      }

      item.appendChild(header);
      item.appendChild(body);
      this.toolsContainer.appendChild(item);
    });
  }

  openTestModal(tool) {
    this.currentTestingTool = tool;
    const modalTitle = document.getElementById('test-modal-tool-name');
    const modalDesc = document.getElementById('test-modal-tool-desc');
    const payloadTextarea = document.getElementById('tool-test-payload');
    const resultBox = document.getElementById('tool-test-result-box');

    if (modalTitle) modalTitle.textContent = `Test: ${tool.name}`;
    if (modalDesc) modalDesc.textContent = tool.description;
    if (resultBox) resultBox.classList.add('hidden');

    // Generate sample payload based on inputSchema
    const samplePayload = {};
    if (tool.inputSchema && tool.inputSchema.properties) {
      for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
        if (prop.type === 'string') samplePayload[key] = prop.enum ? prop.enum[0] : (key === 'label' ? 'Sample Service' : 'service');
        else if (prop.type === 'number') samplePayload[key] = key.includes('rps') ? 5000 : 50;
        else if (prop.type === 'boolean') samplePayload[key] = true;
        else if (prop.type === 'array') samplePayload[key] = [];
      }
    }

    if (payloadTextarea) {
      payloadTextarea.value = JSON.stringify(samplePayload, null, 2);
    }

    if (this.testModal) this.testModal.classList.remove('hidden');
  }

  hideTestModal() {
    if (this.testModal) this.testModal.classList.add('hidden');
    this.currentTestingTool = null;
  }

  async executeModalTest() {
    if (!this.currentTestingTool) return;
    const payloadTextarea = document.getElementById('tool-test-payload');
    const resultBox = document.getElementById('tool-test-result-box');
    const resultJson = document.getElementById('tool-test-result-json');

    try {
      const parsed = JSON.parse(payloadTextarea.value || '{}');
      const res = await webmcp.executeTool(this.currentTestingTool.name, parsed);

      if (resultBox && resultJson) {
        resultJson.textContent = JSON.stringify(res, null, 2);
        resultBox.classList.remove('hidden');
      }
    } catch (err) {
      if (resultBox && resultJson) {
        resultJson.textContent = `Error: ${err.message}`;
        resultBox.classList.remove('hidden');
      }
    }
  }

  appendLogEntry(entry) {
    if (!this.logStreamEl) return;
    const div = document.createElement('div');
    div.className = `log-entry ${entry.level}`;
    div.textContent = `[${entry.timestamp}] ${entry.message}`;
    this.logStreamEl.appendChild(div);
    this.logStreamEl.scrollTop = this.logStreamEl.scrollHeight;
  }

  updateTelemetryStats() {
    const stats = webmcp.getStats();
    if (this.totalCallsEl) this.totalCallsEl.textContent = stats.totalCalls;
    if (this.avgLatencyEl) this.avgLatencyEl.textContent = `${stats.avgLatency}ms`;
  }
}
