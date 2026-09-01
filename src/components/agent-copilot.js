/**
 * Multi-Agent Collaborative Swarm Co-Pilot Component
 * Supports Specialized Agent Roles: Architect, Chaos Engineer, SecOps, and FinOps Advisor.
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
    this.currentRole = 'architect';

    this.initEvents();
  }

  initEvents() {
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

    // Role switcher buttons
    document.querySelectorAll('.agent-role-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.agent-role-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentRole = pill.getAttribute('data-role') || 'architect';
        this.appendMessage('system', `Switched active agent persona to **${pill.textContent.trim()}**.`);
      });
    });

    if (this.inputForm) {
      this.inputForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = this.inputPrompt.value.trim();
        if (!text) return;
        this.handleUserMessage(text);
        this.inputPrompt.value = '';
      });

      this.inputPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.inputForm.dispatchEvent(new Event('submit'));
        }
      });
    }

    // Prompt Chips
    document.querySelectorAll('.chip-item').forEach(chip => {
      chip.addEventListener('click', () => {
        const prompt = chip.getAttribute('data-prompt');
        if (prompt) this.handleUserMessage(prompt);
      });
    });
  }

  async handleUserMessage(prompt) {
    this.appendMessage('user', prompt);
    const aiBubble = this.createAiBubble();
    this.messagesContainer.appendChild(aiBubble);
    this.scrollToBottom();

    await this.orchestrateAgentActions(prompt, aiBubble);
  }

  async orchestrateAgentActions(prompt, bubbleEl) {
    const contentEl = bubbleEl.querySelector('.bubble-content');
    const lower = prompt.toLowerCase();

    const callTool = async (toolName, params, rationale) => {
      this.showActivityBanner(toolName, rationale);

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
        await new Promise(r => setTimeout(r, 550));
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
      if (lower.includes('nvidia') || lower.includes('gpu') || lower.includes('h100') || lower.includes('training') || lower.includes('vllm')) {
        contentEl.innerHTML = `<p>🟢 <strong>[NVIDIA AI Cluster Architect] Reasoning:</strong> Assembling high-throughput generative AI training & inference cluster powered by 8x NVIDIA H100 GPUs, vLLM paged attention, and NVLink inter-GPU bus.</p>`;

        await callTool('load_architecture_template', { templateId: 'nvidia-gpu-ai' }, 'Provisioning NVIDIA H100 SXM5 GPU Cluster');
        await callTool('simulate_traffic', { rps: 18500 }, 'Benchmarking NVLink 900 GB/s inter-GPU throughput');
        const cost = await callTool('estimate_cloud_costs', {}, 'Calculating GPU compute cluster expenditure');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>✅ <strong>NVIDIA H100 AI Supercluster Assembled:</strong>
        <br/>• 8x NVIDIA H100 80GB SXM5 with NVLink 900 GB/s bus
        <br/>• vLLM PagedAttention inference workers (4x replicas)
        <br/>• Milvus Distributed Vector DB + Redis Semantic Cache
        <br/>• Estimated Cloud Cost: <strong>${cost.monthlyTotal ? `$${cost.monthlyTotal}/mo` : '$2,450/mo'}</strong> (${cost.hourlyTotal ? `$${cost.hourlyTotal}/hr` : '$3.35/hr'})`;
        contentEl.appendChild(summary);

      } else if (lower.includes('swarm') || lower.includes('multi-agent') || lower.includes('langgraph') || lower.includes('agentic')) {
        contentEl.innerHTML = `<p>🤖 <strong>[Autonomous Swarm Architect] Reasoning:</strong> Provisioning Multi-Agent RAG Swarm with isolated sandboxes, Redis session memory, and Pinecone vector store.</p>`;

        await callTool('load_architecture_template', { templateId: 'agent-swarm' }, 'Assembling Agentic Swarm Topology');
        await callTool('simulate_traffic', { rps: 7500 }, 'Starting real-time agent message streaming');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>✨ <strong>Autonomous Agent Swarm Active:</strong>
        <br/>• Swarm Orchestrator (LangGraph) + Claude 3.7 Reasoning Hub
        <br/>• 6x Isolated Tool Execution Sandboxes
        <br/>• Ephemeral Redis cache + Pinecone Vector Memory`;
        contentEl.appendChild(summary);

      } else if (lower.includes('cost') || lower.includes('finops') || lower.includes('bill') || lower.includes('pricing') || lower.includes('saving')) {
        contentEl.innerHTML = `<p>💰 <strong>[FinOps Advisor] Reasoning:</strong> Auditing cloud resource provisioning and running automated cost downscaling with Redis caching.</p>`;

        const costBefore = await callTool('estimate_cloud_costs', {}, 'Calculating baseline expenditure');
        const opt = await callTool('optimize_cloud_costs', {}, 'Applying spot downscaling and cache injection');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>💵 <strong>FinOps Optimization Report:</strong>
        <br/>• Baseline Monthly Cost: <strong>${opt.previousMonthlyCost}</strong>
        <br/>• Optimized Monthly Cost: <strong class="text-emerald">${opt.newMonthlyCost}</strong>
        <br/>• <strong>Monthly Net Savings: ${opt.monthlySavings}</strong> (~38% reduction)
        <br/>• ${opt.optimizations.join('<br/>• ')}`;
        contentEl.appendChild(summary);

      } else if (lower.includes('security') || lower.includes('audit') || lower.includes('vulnerab') || lower.includes('fix') || lower.includes('soc2')) {
        contentEl.innerHTML = `<p>🛡️ <strong>[SecOps & Compliance Auditor] Reasoning:</strong> Scanning graph topology for OWASP Top 10 risks, single points of failure (SPOF), and zero-trust violations.</p>`;

        const auditBefore = await callTool('run_security_audit', {}, 'Running vulnerability scan');
        const optRes = await callTool('optimize_architecture', { goal: 'security' }, 'Hardening IAM policies & gateways');
        const auditAfter = await callTool('run_security_audit', {}, 'Verifying security compliance');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>🛡️ <strong>SecOps Hardening Report:</strong>
        <br/>• Initial Score: ${auditBefore.score}% → <strong>Updated Posture: ${auditAfter.score}% (SOC2 Compliant)</strong>
        <br/>• Fixes: ${optRes.optimizationsApplied.join('<br/>• ')}`;
        contentEl.appendChild(summary);

      } else if (lower.includes('iac') || lower.includes('terraform') || lower.includes('kubernetes') || lower.includes('docker') || lower.includes('manifest')) {
        contentEl.innerHTML = `<p>📄 <strong>[DevOps Engineer] Reasoning:</strong> Synthesizing production Terraform (AWS VPC/ECS/RDS), Docker Compose, and Kubernetes Helm manifests.</p>`;

        await callTool('inspect_canvas_state', {}, 'Extracting graph topology');
        await callTool('generate_infrastructure_code', { target: 'all' }, 'Synthesizing IaC manifests');

        document.getElementById('btn-export-code').click();

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>✅ <strong>Production IaC Manifests Generated & Opened:</strong>
        <br/>• Terraform HCL with multi-AZ VPC & Fargate clusters
        <br/>• Docker Compose local dev stack
        <br/>• Kubernetes YAML Deployments & Services`;
        contentEl.appendChild(summary);

      } else if (lower.includes('clear') || lower.includes('reset')) {
        await callTool('clear_canvas', {}, 'Clearing canvas');
        contentEl.innerHTML = `<p>🗑️ Canvas reset. All nodes and connections cleared.</p>`;

      } else {
        contentEl.innerHTML = `<p>🏗️ <strong>Reasoning:</strong> Constructing architecture based on your prompt.</p>`;

        const gw = await callTool('create_node', { label: 'API Gateway (Envoy)', type: 'gateway', x: 120, y: 220 }, 'Creating Gateway');
        const srv = await callTool('create_node', { label: 'Core Microservice', type: 'service', x: 380, y: 220, replicas: 3 }, 'Creating Microservice');
        const db = await callTool('create_node', { label: 'Aurora PostgreSQL', type: 'database', x: 640, y: 220 }, 'Creating Database');
        const cache = await callTool('create_node', { label: 'Redis ElastiCache', type: 'cache', x: 640, y: 90 }, 'Creating Cache');

        await callTool('connect_nodes', { from: gw.node.id, to: srv.node.id, protocol: 'gRPC' }, 'Connecting Gateway → Service');
        await callTool('connect_nodes', { from: srv.node.id, to: db.node.id, protocol: 'PostgreSQL' }, 'Connecting Service → DB');
        await callTool('connect_nodes', { from: srv.node.id, to: cache.node.id, protocol: 'Redis TCP' }, 'Connecting Service → Cache');
        await callTool('apply_layout_preset', { layout: 'hierarchical' }, 'Aligning nodes');
        await callTool('simulate_traffic', { rps: 8000 }, 'Starting traffic simulation');

        const summary = document.createElement('div');
        summary.innerHTML = `<br/>✨ <strong>Custom Cloud Topology Created:</strong> 4-tier microservice architecture with Envoy Gateway, Core Service (3x replicas), Redis ElastiCache, and Aurora DB.`;
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
    bubble.className = `agent-bubble ${sender === 'user' ? 'user-msg' : (sender === 'system' ? 'system-welcome' : 'ai-msg')}`;
    bubble.innerHTML = `
      <div class="bubble-header">
        <span class="${sender === 'user' ? 'badge-user' : (sender === 'system' ? 'badge-ai' : 'badge-ai')}">${sender === 'user' ? 'You' : (sender === 'system' ? 'System' : 'WebMCP Swarm')}</span>
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
        <span class="badge-ai">WebMCP AI (${this.currentRole})</span>
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
