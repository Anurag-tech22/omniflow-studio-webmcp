/**
 * OmniFlow Studio — Main Application Entry & WebMCP Bootstrapper (World-Class Suite)
 */

import { CanvasEngine } from './canvas/canvas-engine.js';
import { registerAllWebMCPTools } from './webmcp/tools.js';
import { HudInspector } from './components/hud-inspector.js';
import { AgentCopilot } from './components/agent-copilot.js';
import { CodeModal } from './components/code-modal.js';
import { AuditPanel } from './components/audit-panel.js';
import { NodeInspector } from './components/node-inspector.js';
import { SwarmConsensus } from './components/swarm-consensus.js';
import { DeclarativeFormsManager } from './components/declarative-forms.js';
import { ARCHITECTURE_TEMPLATES } from './canvas/templates.js';
import { CostEngine } from './canvas/cost-engine.js';
import { webmcp } from './webmcp/webmcp-core.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('[OmniFlow Studio] Bootstrapping world-class WebMCP collaborative workspace...');

  // 1. Initialize Interactive Canvas Engine
  const canvasEl = document.getElementById('architecture-canvas');
  const canvas = new CanvasEngine(canvasEl);

  // 2. Register 24 WebMCP Tools on document.modelContext
  registerAllWebMCPTools(canvas);

  // 3. Initialize UI Components & Drawers
  const hud = new HudInspector(canvas);
  const agent = new AgentCopilot(canvas);
  const codeModal = new CodeModal(canvas);
  const auditPanel = new AuditPanel(canvas, agent);
  const nodeInspector = new NodeInspector(canvas);
  const swarmConsensus = new SwarmConsensus(canvas, agent);
  const declarativeForms = new DeclarativeFormsManager(canvas);

  // 4. Initialize Top Bar Controls

  // Templates Dropdown Menu
  const templatesBtn = document.getElementById('templates-btn');
  const templatesDropdown = document.getElementById('templates-dropdown');

  if (templatesBtn && templatesDropdown) {
    templatesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      templatesDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      templatesDropdown.classList.add('hidden');
    });

    templatesDropdown.querySelectorAll('[data-template]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tplKey = btn.getAttribute('data-template');
        const tpl = ARCHITECTURE_TEMPLATES[tplKey];
        if (tpl) {
          canvas.loadTopology(tpl.nodes, tpl.connections);
          templatesDropdown.classList.add('hidden');
          updateGlobalFinOps();
          SecurityScannerUpdate();
        }
      });
    });

    const clearBtn = document.getElementById('btn-clear-canvas');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        canvas.clearCanvas();
        templatesDropdown.classList.add('hidden');
        updateGlobalFinOps();
        SecurityScannerUpdate();
      });
    }
  }

  // Chaos Lab Dropdown Menu
  const chaosBtn = document.getElementById('btn-chaos-menu-toggle');
  const chaosDropdown = document.getElementById('chaos-dropdown');

  if (chaosBtn && chaosDropdown) {
    chaosBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chaosDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      chaosDropdown.classList.add('hidden');
    });

    document.getElementById('btn-chaos-ddos')?.addEventListener('click', () => {
      webmcp.executeTool('inject_ddos_attack', { rps: 50000 });
      chaosDropdown.classList.add('hidden');
    });

    document.getElementById('btn-chaos-kill')?.addEventListener('click', () => {
      webmcp.executeTool('kill_random_node', {});
      chaosDropdown.classList.add('hidden');
    });

    document.getElementById('btn-chaos-gpu-oom')?.addEventListener('click', () => {
      webmcp.executeTool('simulate_gpu_oom', {});
      chaosDropdown.classList.add('hidden');
    });

    document.getElementById('btn-chaos-heal')?.addEventListener('click', () => {
      webmcp.executeTool('auto_heal_cluster', {});
      chaosDropdown.classList.add('hidden');
    });
  }

  // PNG Export Button
  const exportPngBtn = document.getElementById('btn-export-png');
  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', () => {
      canvas.exportAsPng();
    });
  }

  // Traffic Simulation Toggle
  const simToggleBtn = document.getElementById('btn-simulate-toggle');
  const simBtnText = document.getElementById('simulate-btn-text');
  if (simToggleBtn) {
    simToggleBtn.addEventListener('click', () => {
      if (canvas.simulator.isRunning) {
        canvas.simulator.stop();
        if (simBtnText) simBtnText.textContent = 'Simulate Traffic';
      } else {
        canvas.simulator.start(12500);
        if (simBtnText) simBtnText.textContent = 'Stop Simulation';
      }
    });
  }

  // Sound FX Toggle
  const soundBtn = document.getElementById('btn-toggle-sound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      canvas.soundEnabled = !canvas.soundEnabled;
      soundBtn.style.opacity = canvas.soundEnabled ? '1' : '0.4';
      if (canvas.soundEnabled) {
        canvas.playSfx(500, 'sine', 0.05);
      }
    });
  }

  // Canvas Zoom Toolbar Controls
  const zoomInBtn = document.getElementById('btn-zoom-in');
  const zoomOutBtn = document.getElementById('btn-zoom-out');
  const zoomResetBtn = document.getElementById('btn-zoom-reset');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      canvas.onWheel({
        preventDefault: () => {},
        deltaY: -100,
        clientX: canvas.logicalWidth / 2,
        clientY: canvas.logicalHeight / 2
      });
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      canvas.onWheel({
        preventDefault: () => {},
        deltaY: 100,
        clientX: canvas.logicalWidth / 2,
        clientY: canvas.logicalHeight / 2
      });
    });
  }

  if (zoomResetBtn) {
    zoomResetBtn.addEventListener('click', () => {
      canvas.autoFitView();
    });
  }

  // Palette Drag & Drop Setup
  document.querySelectorAll('.palette-node-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const type = item.getAttribute('data-type');
      e.dataTransfer.setData('text/plain', type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  function updateGlobalFinOps() {
    const stats = CostEngine.calculate(canvas.nodes);
    const costEl = document.getElementById('stat-cloud-cost');
    if (costEl) costEl.textContent = `$${stats.monthlyTotal}/mo`;
  }

  function SecurityScannerUpdate() {
    webmcp.executeTool('run_security_audit', {}).catch(() => {});
  }

  // 5. Initial Boot: Load NVIDIA H100 GPU AI Training Cluster for a jaw-dropping initial render!
  const initialTpl = ARCHITECTURE_TEMPLATES['nvidia-gpu-ai'];
  if (initialTpl) {
    canvas.loadTopology(initialTpl.nodes, initialTpl.connections);
    updateGlobalFinOps();
    SecurityScannerUpdate();
  }

  console.log('[OmniFlow Studio] Ready for world-class human-agent co-creation!');
});
