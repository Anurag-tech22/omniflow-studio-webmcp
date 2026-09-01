/**
 * Human-Agent Collaborative Co-Pilot Component
 * Simulates autonomous agent tool calling using registered WebMCP tools.
 */

import { webmcp } from '../webmcp/webmcp-core.js';

export class AgentCopilot {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.panelEl = document.getElementById('agent-copilot-panel');
    this.messagesContainer = document.getElementById('agent-messages');
    this.inputForm = document.getElementById('agent-input-form');
    this.inputPrompt = document.getElementById('agent-user-prompt');
    this.bannerEl = document.getElementById('agent-activity-banner');
    this.bannerToolName = document.getElementById('banner-tool-name');
    this.bannerToolDetail = document.getElementById('banner-tool-detail');

    this.initEvents();
  }

  initEvents() {
    // Toggle Button
    const toggleBtn = document.getElementById('btn-toggle-agent');
    const closeBtn = document.getElementById('btn-close-agent');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.panelEl.classList.toggle('hidden');
        if (!this.panelEl.classList.contains('hidden') && this.inputPrompt) {
          this.inputPrompt.focus();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.panelEl.classList.add('hidden');
      });
    }

    // Submit user prompt
    if (this.inputForm) {
      this.inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.inputPrompt.value.trim();
        if (!text) return;
        this.handleUserMessage(text);
        this.inputPrompt.value = '';
      });

      // Shift+Enter newline support
      this.inputPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.inputForm.dispatchEvent(new Event('submit'));
        }
      });
    }

    // Quick Prompt Chips
    document.querySelectorAll('.chip-item').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) {
          this.handleUserMessage(prompt);
        }
      });
    });
  }

  async handleUserMessage(prompt) {
    // Append User Message
    this.appendMessage('user', prompt);

    // Show AI Thinking State
    const aiBubble = this.createAiBubble();
    this.messagesContainer.appendChild(aiBubble);
    this.scrollToBottom();

    // Natural Language Tool Orchestration
    await this.orchestrateAgentActions(prompt, aiBubble);
  }

  async orchestrateAgentActions(prompt, bubbleEl) {
    const contentEl = bubbleEl.querySelector('.bubble-content');
    const lower = prompt.toLowerCase();

    // Helper for tool execution with visual streaming
    const callTool = async (toolName, params, rationale) => {
      this.showActivityBanner(toolName, rationale);

      // Add tool trace card
      const traceCard = document.createElement('div');
      traceCard.className = 'tool-trace-card';
      traceCard.innerHTML = `
        <div class="trace-title">
          <span>🛠️ WebMCP: ${toolName}</span>
          <span class="trace-status-tag">Executing...</span>
        </div>
        <div class="trace-json-preview">${JSON.stringify(params, null, 2)}</div>
      `;
      contentEl.appendChild(traceCard);
      this.scrollToBottom();

      try {
        await new Promise(r => setTimeout(r, 600)); // Smooth visual cadence
        const result = await webmcp.executeTool(toolName, params);

        traceCard.querySelector('.trace-status-tag').textContent = 'Completed (200 OK)';
        traceCard.querySelector('.trace-status-tag').style.background = 'rgba(16, 185, 129, 0.2)';
        traceCard.querySelector('.trace-status-tag').style.color = '#10b981';

        this.hideActivityBanner();
        return result;
      } catch (err) {
        traceCard.querySelector('.trace-status-tag').textContent = 'Failed';
        traceCard.querySelector('.trace-status-tag').style.background = 'rgba(239, 68, 68, 0.2)';
        traceCard.querySelector('.trace-status-tag').style.color = '#ef4444';
        this.hideActivityBanner();
        throw err;
      }
    };

    try {
      if (lower.includes('rag') || lower.includes('ai') || lower.includes('llm') || lower.includes('vector')) {
        contentEl.innerHTML = `<p>🧠 <strong>Reasoning:</strong> To build a high-performance AI RAG architecture, I will load the AI RAG blueprint, simulate high-throughput traffic load (6,000 RPS), and run a security posture audit.</p>`;
        
        await callTool('load_architecture_template', { templateId: 'rag-pipeline' }, 'Loading AI RAG & LLM Engine Blueprint');
        await callTool('simulate_traffic', { rps: 6000 }, 'Starting real-time traffic stress simulation');
        const auditRes = await callTool('run_security_audit', {}, 'Scanning architecture security');

        const summary = document.createElement('div');
        summary.className = 'mt-2';
        summary.innerHTML = `<br/>✅ <strong>Pipeline Assembled:</strong>
        <br/>• FastAPI AI Gateway with rate limiting
        <br/>• Milvus Vector DB + BGE-M3 Embeddings Service
        <br/>• Claude 3.7 LLM Orchestrator + Redis Semantic Cache
        <br/>• Security Health: <strong>${auditRes.score}%</strong> (${auditRes.criticalCount} critical risks)`;
        contentEl.appendChild(summary);

      } else if (lower.includes('security') || lower.includes('audit') || lower.includes('vulnerab') || lower.includes('fix')) {
        contentEl.innerHTML = `<p>🛡️ <strong>Reasoning:</strong> Running security audit, identifying architecture bottlenecks and Single Points of Failure, then applying automated remediation.</p>`;

        const auditBefore = await callTool('run_security_audit', {}, 'Auditing active topology');
        const optRes = await callTool('optimize_architecture', { goal: 'security' }, 'Applying security hardening & auth attachments');
        const auditAfter = await callTool('run_security_audit', {}, 'Verifying post-fix security score');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>🛡️ <strong>Security Remediation Completed:</strong>
        <br/>• Initial Score: ${auditBefore.score}% → <strong>Updated Score: ${auditAfter.score}%</strong>
        <br/>• Applied Fixes: ${optRes.optimizationsApplied.join('<br/>• ')}`;
        contentEl.appendChild(summary);

      } else if (lower.includes('optimize') || lower.includes('latency') || lower.includes('cost') || lower.includes('cache')) {
        contentEl.innerHTML = `<p>⚡ <strong>Reasoning:</strong> Analyzing connection latencies and inserting high-speed Redis caching & asynchronous queues to eliminate database write locks.</p>`;

        const optRes = await callTool('optimize_architecture', { goal: 'latency' }, 'Injecting caching layer and optimizing routes');
        await callTool('simulate_traffic', { rps: 12000 }, 'Benchmarking latency under 12k RPS load');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>⚡ <strong>Optimization Applied:</strong>
        <br/>• ${optRes.optimizationsApplied.join('<br/>• ')}
        <br/>• System throughput increased to <strong>12,000 req/s</strong> with sub-5ms average latency.`;
        contentEl.appendChild(summary);

      } else if (lower.includes('iac') || lower.includes('terraform') || lower.includes('kubernetes') || lower.includes('docker') || lower.includes('manifest')) {
        contentEl.innerHTML = `<p>📄 <strong>Reasoning:</strong> Inspecting live canvas topology and generating production Terraform, Docker Compose, and Kubernetes manifests.</p>`;

        await callTool('inspect_canvas_state', {}, 'Extracting graph topology');
        const iacRes = await callTool('generate_infrastructure_code', { target: 'all' }, 'Synthesizing IaC manifests');

        // Open modal
        document.getElementById('btn-export-code').click();

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>✅ <strong>IaC Manifests Generated:</strong>
        <br/>• Terraform (AWS VPC, ECS Fargate, RDS PostgreSQL, ElastiCache Redis)
        <br/>• Docker Compose (Multi-container local dev environment)
        <br/>• Kubernetes YAML (Deployments, ClusterIP Services, Health Probes)
        <br/>• <em>Opened Export Modal on screen for review and download.</em>`;
        contentEl.appendChild(summary);

      } else if (lower.includes('clear') || lower.includes('reset')) {
        await callTool('clear_canvas', {}, 'Clearing canvas');
        contentEl.innerHTML = `<p>🗑️ Canvas reset. All nodes and connections cleared.</p>`;

      } else {
        // Generic architecture builder
        contentEl.innerHTML = `<p>🏗️ <strong>Reasoning:</strong> Constructing custom cloud architecture based on your specification.</p>`;

        const gw = await callTool('create_node', { label: 'API Gateway (Envoy)', type: 'gateway', x: 120, y: 220 }, 'Creating API Gateway');
        const srv = await callTool('create_node', { label: 'Core Microservice', type: 'service', x: 380, y: 220 }, 'Creating Microservice');
        const db = await callTool('create_node', { label: 'PostgreSQL Database', type: 'database', x: 640, y: 220 }, 'Creating Database');
        const cache = await callTool('create_node', { label: 'Redis Cache', type: 'cache', x: 640, y: 90 }, 'Creating Redis Cache');

        await callTool('connect_nodes', { from: gw.node.id, to: srv.node.id, protocol: 'gRPC' }, 'Connecting Gateway → Service');
        await callTool('connect_nodes', { from: srv.node.id, to: db.node.id, protocol: 'PostgreSQL' }, 'Connecting Service → DB');
        await callTool('connect_nodes', { from: srv.node.id, to: cache.node.id, protocol: 'Redis TCP' }, 'Connecting Service → Cache');
        await callTool('apply_layout_preset', { layout: 'hierarchical' }, 'Aligning nodes');
        await callTool('simulate_traffic', { rps: 5000 }, 'Starting traffic simulation');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>✨ <strong>Architecture Built:</strong> Created 4-tier microservice architecture with Envoy Gateway, Core Service, Redis Cache, and Postgres Database. Simulated 5,000 RPS traffic.`;
        contentEl.appendChild(summary);
      }
    } catch (err) {
      contentEl.innerHTML += `<div class="text-danger mt-2">❌ Error executing agent flow: ${err.message}</div>`;
    }

    this.scrollToBottom();
  }

  showActivityBanner(toolName, detail) {
    if (!this.bannerEl) return;
    this.bannerToolName.textContent = `Agent calling WebMCP: ${toolName}`;
    this.bannerToolDetail.textContent = detail || 'Executing in browser tab...';
    this.bannerEl.classList.remove('hidden');
  }

  hideActivityBanner() {
    if (this.bannerEl) this.bannerEl.classList.add('hidden');
  }

  appendMessage(sender, text) {
    const bubble = document.createElement('div');
    bubble.className = `agent-bubble ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;
    bubble.innerHTML = `
      <div class="bubble-header">
        <span class="${sender === 'user' ? 'badge-user' : 'badge-ai'}">${sender === 'user' ? 'You' : 'WebMCP AI'}</span>
        <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="bubble-content">${text}</div>
    `;
    this.messagesContainer.appendChild(bubble);
    this.scrollToBottom();
  }

  createAiBubble() {
    const bubble = document.createElement('div');
    bubble.className = 'agent-bubble ai-msg';
    bubble.innerHTML = `
      <div class="bubble-header">
        <span class="badge-ai">WebMCP AI</span>
        <span class="timestamp">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="bubble-content">
        <div class="pulse-indicator" style="display:inline-block;margin-right:6px;"></div> Reasoning with WebMCP tools...
      </div>
    `;
    return bubble;
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
}
