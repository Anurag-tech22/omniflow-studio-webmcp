/**
 * Autonomous Self-Healing Auto-Pilot Engine
 * Continuously evaluates system health, autoscale bottlenecks, mitigates DDOS spikes,
 * and maintains 99.999% SLA without manual intervention.
 */

import { webmcp } from '../webmcp/webmcp-core.js';

export class AutoPilotEngine {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.isActive = false;
    this.intervalId = null;
    this.actionLog = [];
    this.autoScaleEventsCount = 0;
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.canvas.playSfx(620, 'sine', 0.15);

    webmcp.appendLog('info', 'Autonomous Self-Healing Auto-Pilot ENGAGED. Monitoring cluster SLA...');
    this.updateStatusBadge();

    this.intervalId = setInterval(() => {
      this.evaluateAndHeal();
    }, 2500);
  }

  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    webmcp.appendLog('warn', 'Autonomous Auto-Pilot DISENGAGED. Switched to manual operator mode.');
    this.updateStatusBadge();
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
    return this.isActive;
  }

  evaluateAndHeal() {
    if (!this.isActive || this.canvas.nodes.length === 0) return;

    let actionsTaken = [];

    // 1. High CPU / Bottleneck Auto-Scaling
    this.canvas.nodes.forEach(node => {
      if (node.cpu > 80 || node.status === 'warning') {
        const oldReps = node.replicas || 1;
        if (oldReps < 8) {
          node.replicas = oldReps + 1;
          node.cpu = Math.max(35, Math.floor(node.cpu * 0.65));
          node.status = 'healthy';
          this.autoScaleEventsCount++;

          const msg = `⚡ AutoPilot: Scaled '${node.label}' from ${oldReps}x to ${node.replicas}x replicas (CPU normalized to ${node.cpu}%).`;
          actionsTaken.push(msg);
          webmcp.appendLog('success', msg);
          this.canvas.playSfx(780, 'sine', 0.06);
        }
      }

      // Memory leak recovery
      if (node.memory > 90) {
        node.memory = Math.floor(45 + Math.random() * 15);
        node.status = 'healthy';
        const msg = `💚 AutoPilot: Defragmented memory on '${node.label}' (RAM reduced to ${node.memory}%).`;
        actionsTaken.push(msg);
        webmcp.appendLog('success', msg);
      }
    });

    // 2. High Traffic Protection (Ensure Gateway or CDN has adequate capacity)
    if (this.canvas.simulator.isRunning && this.canvas.simulator.trafficRps > 20000) {
      const gateways = this.canvas.nodes.filter(n => n.type === 'gateway' || n.type === 'cdn');
      gateways.forEach(gw => {
        if (gw.replicas < 4) {
          gw.replicas = 4;
          gw.cpu = 30;
          actionsTaken.push(`🛡️ AutoPilot: Boosted Ingress '${gw.label}' to 4x edge workers for 50k RPS burst.`);
        }
      });
    }

    if (actionsTaken.length > 0) {
      this.canvas.updateStats();
      this.showAutoPilotToast(actionsTaken[0]);
    }
  }

  showAutoPilotToast(message) {
    const banner = document.getElementById('agent-activity-banner');
    const titleEl = document.getElementById('banner-tool-name');
    const subEl = document.getElementById('banner-tool-detail');

    if (banner && titleEl && subEl) {
      titleEl.textContent = '🤖 Autonomous Auto-Pilot Active';
      subEl.textContent = message;
      banner.classList.remove('hidden');

      setTimeout(() => {
        banner.classList.add('hidden');
      }, 3500);
    }
  }

  updateStatusBadge() {
    const badge = document.getElementById('canvas-status-badge');
    const text = document.getElementById('canvas-status-text');
    const toggleBtn = document.getElementById('btn-autopilot-toggle');

    if (badge && text) {
      if (this.isActive) {
        badge.classList.add('active-autopilot');
        text.textContent = 'Auto-Pilot: Self-Healing 24/7';
      } else {
        badge.classList.remove('active-autopilot');
        text.textContent = 'Visual Port Wiring & AI Active';
      }
    }

    if (toggleBtn) {
      toggleBtn.classList.toggle('active', this.isActive);
      toggleBtn.title = this.isActive ? 'Auto-Pilot is ENGAGED (Click to disable)' : 'Enable Autonomous Self-Healing Auto-Pilot';
    }
  }
}
