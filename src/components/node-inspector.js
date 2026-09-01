/**
 * Node Inspector Drawer Component
 * Deep-dive into individual node telemetry, provisioned hardware, replicas, and FinOps costs.
 */

import { CostEngine } from '../canvas/cost-engine.js';
import { webmcp } from '../webmcp/webmcp-core.js';

export class NodeInspector {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.drawerEl = document.getElementById('node-inspector-drawer');
    this.activeNode = null;

    this.initElements();
    this.initEvents();
  }

  initElements() {
    this.titleEl = document.getElementById('inspector-node-title');
    this.typeEl = document.getElementById('inspector-node-type');
    this.statusEl = document.getElementById('inspector-node-status');
    this.costEl = document.getElementById('inspector-node-cost');
    this.cpuSlider = document.getElementById('inspector-cpu-slider');
    this.cpuVal = document.getElementById('inspector-cpu-val');
    this.memSlider = document.getElementById('inspector-mem-slider');
    this.memVal = document.getElementById('inspector-mem-val');
    this.replicasSlider = document.getElementById('inspector-replicas-slider');
    this.replicasVal = document.getElementById('inspector-replicas-val');
    this.regionSelect = document.getElementById('inspector-region-select');
    this.closeBtn = document.getElementById('btn-close-inspector');
    this.deleteBtn = document.getElementById('btn-inspector-delete-node');
  }

  initEvents() {
    this.canvas.onNodeSelectedCallback = (node) => {
      if (node) {
        this.open(node);
      } else {
        this.close();
      }
    };

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.canvas.selectNode(null);
        this.close();
      });
    }

    if (this.deleteBtn) {
      this.deleteBtn.addEventListener('click', () => {
        if (this.activeNode) {
          this.canvas.deleteNode(this.activeNode.id);
          this.canvas.selectNode(null);
          this.close();
        }
      });
    }

    // Sliders
    if (this.cpuSlider) {
      this.cpuSlider.addEventListener('input', (e) => {
        if (!this.activeNode) return;
        this.activeNode.cpu = Number(e.target.value);
        if (this.cpuVal) this.cpuVal.textContent = `${this.activeNode.cpu}%`;
      });
    }

    if (this.memSlider) {
      this.memSlider.addEventListener('input', (e) => {
        if (!this.activeNode) return;
        this.activeNode.memory = Number(e.target.value);
        if (this.memVal) this.memVal.textContent = `${this.activeNode.memory}%`;
      });
    }

    if (this.replicasSlider) {
      this.replicasSlider.addEventListener('input', (e) => {
        if (!this.activeNode) return;
        this.activeNode.replicas = Number(e.target.value);
        if (this.replicasVal) this.replicasVal.textContent = `${this.activeNode.replicas}x`;
        this.updateCost();
        this.updateGlobalFinOps();
      });
    }
  }

  open(node) {
    this.activeNode = node;
    if (!this.drawerEl) return;

    if (this.titleEl) this.titleEl.textContent = node.label;
    if (this.typeEl) this.typeEl.textContent = `${node.type.toUpperCase()} • ${this.canvas.typeConfig[node.type]?.badge || 'Service'}`;
    if (this.statusEl) {
      this.statusEl.textContent = node.status;
      this.statusEl.className = `status-pill ${node.status === 'warning' ? 'bg-red' : 'bg-emerald'}`;
    }

    if (this.cpuSlider) this.cpuSlider.value = node.cpu;
    if (this.cpuVal) this.cpuVal.textContent = `${node.cpu}%`;

    if (this.memSlider) this.memSlider.value = node.memory;
    if (this.memVal) this.memVal.textContent = `${node.memory}%`;

    if (this.replicasSlider) this.replicasSlider.value = node.replicas || 1;
    if (this.replicasVal) this.replicasVal.textContent = `${node.replicas || 1}x`;

    this.updateCost();
    this.drawerEl.classList.remove('hidden');
  }

  close() {
    if (this.drawerEl) this.drawerEl.classList.add('hidden');
    this.activeNode = null;
  }

  updateCost() {
    if (!this.activeNode || !this.costEl) return;
    const pricing = CostEngine.PRICING[this.activeNode.type] || CostEngine.PRICING.service;
    const total = pricing.baseCost * (this.activeNode.replicas || 1);
    this.costEl.textContent = `$${Math.round(total)}/mo`;
  }

  updateGlobalFinOps() {
    const stats = CostEngine.calculate(this.canvas.nodes);
    const costEl = document.getElementById('stat-cloud-cost');
    if (costEl) {
      costEl.textContent = `$${stats.monthlyTotal}/mo`;
    }
  }
}
