/**
 * Security & Reliability Audit Modal Component
 */

import { SecurityScanner } from '../canvas/security-scanner.js';

export class AuditPanel {
  constructor(canvasEngine, agentCopilot) {
    this.canvas = canvasEngine;
    this.agent = agentCopilot;
    this.modalEl = document.getElementById('audit-modal');
    this.findingsContainer = document.getElementById('audit-findings-container');
    this.scoreEl = document.getElementById('audit-stat-score');
    this.criticalEl = document.getElementById('audit-stat-critical');
    this.warningsEl = document.getElementById('audit-stat-warnings');

    this.initEvents();
  }

  initEvents() {
    const openBtn = document.getElementById('btn-security-audit');
    const closeBtn = document.getElementById('btn-close-audit-modal');
    const autoFixBtn = document.getElementById('btn-agent-autofix-audit');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.open();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    if (autoFixBtn) {
      autoFixBtn.addEventListener('click', () => {
        this.close();
        if (this.agent) {
          // Open agent panel and execute security remediation
          const agentPanel = document.getElementById('agent-copilot-panel');
          if (agentPanel) agentPanel.classList.remove('hidden');
          this.agent.handleUserMessage('Fix all critical security vulnerabilities and architectural single points of failure in this canvas.');
        }
      });
    }
  }

  open() {
    this.runScanAndRender();
    this.modalEl.classList.remove('hidden');
  }

  close() {
    this.modalEl.classList.add('hidden');
  }

  runScanAndRender() {
    const report = SecurityScanner.scan(this.canvas.nodes, this.canvas.connections);

    if (this.scoreEl) {
      this.scoreEl.textContent = `${report.score}/100`;
      this.scoreEl.className = `stat-num ${report.score < 70 ? 'text-red' : (report.score < 90 ? 'text-amber' : 'text-emerald')}`;
    }

    if (this.criticalEl) this.criticalEl.textContent = report.criticalCount;
    if (this.warningsEl) this.warningsEl.textContent = report.warningCount;

    if (!this.findingsContainer) return;
    this.findingsContainer.innerHTML = '';

    if (report.findings.length === 0) {
      this.findingsContainer.innerHTML = `
        <div class="audit-finding-item info">
          <div class="finding-title-row">
            <span class="finding-title">✨ Zero Vulnerabilities Detected</span>
            <span class="finding-severity info" style="background:rgba(16,185,129,0.2);color:#10b981;">Perfect</span>
          </div>
          <div class="finding-desc">Your architecture follows all OWASP and Cloud Security Well-Architected framework standards.</div>
        </div>
      `;
      return;
    }

    report.findings.forEach(f => {
      const item = document.createElement('div');
      item.className = `audit-finding-item ${f.severity}`;
      item.innerHTML = `
        <div class="finding-title-row">
          <span class="finding-title">${f.title}</span>
          <span class="finding-severity ${f.severity}">${f.severity}</span>
        </div>
        <div class="finding-desc">${f.description}</div>
        <div class="finding-remediation">💡 <strong>Remediation:</strong> ${f.remediation}</div>
      `;
      this.findingsContainer.appendChild(item);
    });
  }
}
