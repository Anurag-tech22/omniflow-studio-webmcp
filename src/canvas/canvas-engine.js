/**
 * High-Performance Interactive Architecture Canvas Engine (World-Class Edition)
 * Apple/Linear/OpenAI Glassmorphism with Live Sparkline Telemetry & GPU Clusters.
 */

import { TrafficSimulator } from './traffic-simulator.js';

export class CanvasEngine {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d');

    // Canvas State
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    this.draggingNode = null;
    this.isPanning = false;
    this.dragOffset = { x: 0, y: 0 };
    this.panStart = { x: 0, y: 0 };

    // Node Sparkline history
    this.sparklineHistory = new Map(); // nodeId -> array of last 10 cpu values
    this.frameCounter = 0;

    // Viewport Transform
    this.transform = {
      x: 60,
      y: 40,
      scale: 1.0,
      minScale: 0.3,
      maxScale: 2.5
    };

    // Connection Drag State
    this.mouseWorldPos = { x: 0, y: 0 };

    // Traffic Simulator
    this.simulator = new TrafficSimulator(this);

    // Audio SFX synthesis
    this.soundEnabled = true;
    this.audioCtx = null;

    // Node Selection Callback
    this.onNodeSelectedCallback = null;

    // Node Type Configuration
    this.typeConfig = {
      gateway: { label: 'API Gateway', color: '#00f0ff', icon: '🌐', bg: '#082f49', badge: 'Ingress' },
      service: { label: 'Microservice', color: '#a855f7', icon: '⚙️', bg: '#3b0764', badge: 'ECS Fargate' },
      serverless: { label: 'Serverless Func', color: '#f59e0b', icon: '⚡', bg: '#451a03', badge: 'Workers' },
      ai_model: { label: 'Claude / GPT-4o', color: '#ec4899', icon: '🧠', bg: '#500724', badge: 'Inference' },
      gpu_cluster: { label: 'NVIDIA H100 8x', color: '#76b900', icon: '🟢', bg: '#143004', badge: 'SXM5 Tensor' },
      database: { label: 'Aurora PostgreSQL', color: '#3b82f6', icon: '🗄️', bg: '#172554', badge: 'Multi-AZ DB' },
      vector_db: { label: 'Milvus / Pinecone', color: '#6366f1', icon: '📐', bg: '#1e1b4b', badge: 'Vector ANN' },
      cache: { label: 'Redis ElastiCache', color: '#ef4444', icon: '⚡', bg: '#450a0a', badge: 'Cluster' },
      queue: { label: 'Kafka / MSK Bus', color: '#f59e0b', icon: '📬', bg: '#451a03', badge: 'Streaming' },
      blob_store: { label: 'Amazon S3 Bucket', color: '#14b8a6', icon: '📦', bg: '#042f2e', badge: 'Storage' },
      auth: { label: 'Auth0 / Okta IAM', color: '#10b981', icon: '🛡️', bg: '#022c22', badge: 'Security' },
      third_party: { label: 'Stripe Webhook', color: '#a855f7', icon: '💳', bg: '#3b0764', badge: 'External' },
      cdn: { label: 'Cloudflare CDN', color: '#00f0ff', icon: '🌍', bg: '#082f49', badge: 'Edge WAF' }
    };

    this.initEvents();
    this.resize();
    this.startRenderLoop();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    // Mouse Interactions
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Drag and Drop from Sidebar Palette
    const container = this.canvas.parentElement;
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    container.addEventListener('drop', (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('text/plain');
      if (nodeType) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(screenX, screenY);

        const node = this.addNode({
          label: this.typeConfig[nodeType]?.label || 'New Service',
          type: nodeType,
          x: Math.round(worldPos.x - 100),
          y: Math.round(worldPos.y - 40)
        });
        this.selectNode(node);
        this.playSfx(440, 'sine', 0.08);
      }
    });

    // Keyboard controls (Delete, Escape)
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        this.deleteNode(this.selectedNode.id);
        this.selectNode(null);
        this.playSfx(220, 'sawtooth', 0.1);
      } else if (e.key === 'Escape') {
        this.selectNode(null);
      }
    });
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.logicalWidth = rect.width;
    this.logicalHeight = rect.height;
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.transform.x) / this.transform.scale,
      y: (sy - this.transform.y) / this.transform.scale
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.transform.scale + this.transform.x,
      y: wy * this.transform.scale + this.transform.y
    };
  }

  findNodeAt(wx, wy) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (
        wx >= node.x &&
        wx <= node.x + (node.width || 210) &&
        wy >= node.y &&
        wy <= node.y + (node.height || 82)
      ) {
        return node;
      }
    }
    return null;
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const worldPos = this.screenToWorld(sx, sy);

    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      this.isPanning = true;
      this.panStart = { x: sx - this.transform.x, y: sy - this.transform.y };
      return;
    }

    const clickedNode = this.findNodeAt(worldPos.x, worldPos.y);
    if (clickedNode) {
      this.selectNode(clickedNode);
      this.draggingNode = clickedNode;
      this.dragOffset = {
        x: worldPos.x - clickedNode.x,
        y: worldPos.y - clickedNode.y
      };
      this.playSfx(580, 'triangle', 0.04);
    } else {
      this.selectNode(null);
      this.isPanning = true;
      this.panStart = { x: sx - this.transform.x, y: sy - this.transform.y };
    }
    this.updateStats();
  }

  selectNode(node) {
    this.selectedNode = node;
    if (this.onNodeSelectedCallback) {
      this.onNodeSelectedCallback(node);
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    this.mouseWorldPos = this.screenToWorld(sx, sy);

    if (this.isPanning) {
      this.transform.x = sx - this.panStart.x;
      this.transform.y = sy - this.panStart.y;
      return;
    }

    if (this.draggingNode) {
      this.draggingNode.x = Math.round(this.mouseWorldPos.x - this.dragOffset.x);
      this.draggingNode.y = Math.round(this.mouseWorldPos.y - this.dragOffset.y);
      return;
    }

    this.hoveredNode = this.findNodeAt(this.mouseWorldPos.x, this.mouseWorldPos.y);
    this.canvas.style.cursor = this.hoveredNode ? 'grab' : (this.isPanning ? 'grabbing' : 'crosshair');
  }

  onMouseUp() {
    this.isPanning = false;
    this.draggingNode = null;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const oldScale = this.transform.scale;
    let newScale = e.deltaY < 0 ? oldScale * zoomFactor : oldScale / zoomFactor;
    newScale = Math.max(this.transform.minScale, Math.min(this.transform.maxScale, newScale));

    this.transform.x = mouseX - (mouseX - this.transform.x) * (newScale / oldScale);
    this.transform.y = mouseY - (mouseY - this.transform.y) * (newScale / oldScale);
    this.transform.scale = newScale;

    const indicator = document.getElementById('zoom-indicator');
    if (indicator) indicator.textContent = `${Math.round(newScale * 100)}%`;
  }

  // --- Node & Link Operations ---

  addNode(data) {
    const id = data.id || `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNode = {
      id,
      label: data.label || 'New Service',
      type: data.type || 'service',
      x: data.x || 100,
      y: data.y || 100,
      width: 210,
      height: 82,
      status: data.status || 'healthy',
      cpu: data.cpu || Math.floor(20 + Math.random() * 35),
      memory: data.memory || Math.floor(30 + Math.random() * 40),
      replicas: data.replicas || (data.type === 'service' ? 3 : (data.type === 'gateway' ? 2 : 1)),
      metadata: data.metadata || {}
    };

    this.nodes.push(newNode);
    this.sparklineHistory.set(newNode.id, [newNode.cpu, newNode.cpu, newNode.cpu]);
    this.updateStats();
    this.checkEmptyState();
    return newNode;
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
    this.sparklineHistory.delete(id);
    this.updateStats();
    this.checkEmptyState();
  }

  connectNodes(fromId, toId, options = {}) {
    if (fromId === toId) return null;
    const existing = this.connections.find(c => c.from === fromId && c.to === toId);
    if (existing) return existing;

    const conn = {
      id: options.id || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      from: fromId,
      to: toId,
      protocol: options.protocol || 'gRPC',
      latency: options.latency || `${Math.floor(2 + Math.random() * 12)}ms`,
      throughput: options.throughput || `${(Math.random() * 8 + 1).toFixed(1)}k req/s`
    };

    this.connections.push(conn);
    this.updateStats();
    return conn;
  }

  disconnectNodes(fromId, toId) {
    this.connections = this.connections.filter(c => !(c.from === fromId && c.to === toId));
    this.updateStats();
  }

  loadTopology(nodes, connections) {
    this.nodes = nodes.map(n => ({
      width: 210,
      height: 82,
      replicas: n.replicas || 1,
      ...n
    }));
    this.connections = [...connections];
    this.nodes.forEach(n => {
      this.sparklineHistory.set(n.id, [n.cpu, n.cpu, n.cpu]);
    });
    this.autoFitView();
    this.updateStats();
    this.checkEmptyState();
    this.playSfx(520, 'sine', 0.12);
  }

  clearCanvas() {
    this.nodes = [];
    this.connections = [];
    this.selectNode(null);
    this.simulator.stop();
    this.updateStats();
    this.checkEmptyState();
  }

  autoFitView() {
    if (this.nodes.length === 0) {
      this.transform.x = 60;
      this.transform.y = 40;
      this.transform.scale = 1.0;
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + n.width);
      maxY = Math.max(maxY, n.y + n.height);
    });

    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;
    const scaleX = this.logicalWidth / graphWidth;
    const scaleY = this.logicalHeight / graphHeight;
    const scale = Math.min(1.05, Math.max(0.55, Math.min(scaleX, scaleY)));

    this.transform.scale = scale;
    this.transform.x = (this.logicalWidth - (maxX + minX) * scale) / 2;
    this.transform.y = (this.logicalHeight - (maxY + minY) * scale) / 2;

    const indicator = document.getElementById('zoom-indicator');
    if (indicator) indicator.textContent = `${Math.round(scale * 100)}%`;
  }

  applyAutoLayout(type = 'hierarchical') {
    if (this.nodes.length === 0) return;

    const orderRank = {
      cdn: 0,
      gateway: 1,
      auth: 1.5,
      service: 2,
      serverless: 2,
      ai_model: 2.5,
      cache: 3,
      queue: 3,
      gpu_cluster: 3,
      vector_db: 3.5,
      database: 4,
      blob_store: 4,
      third_party: 4
    };

    const tiers = {};
    this.nodes.forEach(n => {
      const rank = orderRank[n.type] ?? 2;
      if (!tiers[rank]) tiers[rank] = [];
      tiers[rank].push(n);
    });

    const sortedRanks = Object.keys(tiers).sort((a, b) => Number(a) - Number(b));
    let startX = 80;
    const colSpacing = 260;

    sortedRanks.forEach(rank => {
      const colNodes = tiers[rank];
      const rowSpacing = 120;
      const totalHeight = colNodes.length * rowSpacing;
      let startY = Math.max(60, (this.logicalHeight - totalHeight) / 2);

      colNodes.forEach((node, idx) => {
        node.x = startX;
        node.y = startY + idx * rowSpacing;
      });

      startX += colSpacing;
    });

    this.autoFitView();
    this.playSfx(660, 'sine', 0.1);
  }

  exportAsPng() {
    this.selectNode(null);
    this.draw();
    const dataUrl = this.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `omniflow-architecture-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  checkEmptyState() {
    const emptyEl = document.getElementById('canvas-empty-state');
    if (emptyEl) {
      if (this.nodes.length === 0) {
        emptyEl.classList.remove('hidden');
      } else {
        emptyEl.classList.add('hidden');
      }
    }
  }

  updateStats() {
    const nodeCountEl = document.getElementById('stat-node-count');
    const linkCountEl = document.getElementById('stat-link-count');
    if (nodeCountEl) nodeCountEl.textContent = this.nodes.length;
    if (linkCountEl) linkCountEl.textContent = this.connections.length;
  }

  playSfx(freq = 440, type = 'sine', duration = 0.08) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  // --- Render Loop ---

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      this.frameCounter++;

      if (this.frameCounter % 20 === 0) {
        this.nodes.forEach(n => {
          let hist = this.sparklineHistory.get(n.id) || [];
          hist.push(n.cpu || 30);
          if (hist.length > 12) hist.shift();
          this.sparklineHistory.set(n.id, hist);
        });
      }

      this.simulator.update(deltaTime);
      this.draw();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    this.drawGrid();

    ctx.save();
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    this.drawConnections(ctx, nodeMap);
    this.simulator.render(ctx, nodeMap);
    this.nodes.forEach(node => this.drawNode(ctx, node));

    ctx.restore();
  }

  drawGrid() {
    const ctx = this.ctx;
    const scale = this.transform.scale;
    const gridSize = 32 * scale;
    const offsetX = this.transform.x % gridSize;
    const offsetY = this.transform.y % gridSize;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let x = offsetX; x < this.logicalWidth; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.logicalHeight);
    }
    for (let y = offsetY; y < this.logicalHeight; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.logicalWidth, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawConnections(ctx, nodeMap) {
    this.connections.forEach(conn => {
      const fromNode = nodeMap.get(conn.from);
      const toNode = nodeMap.get(conn.to);
      if (!fromNode || !toNode) return;

      const x1 = fromNode.x + fromNode.width;
      const y1 = fromNode.y + fromNode.height / 2;
      const x2 = toNode.x;
      const y2 = toNode.y + toNode.height / 2;

      const dx = Math.max(45, (x2 - x1) * 0.45);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);

      const isNvlink = conn.protocol.includes('NVLink');
      const isGrpc = conn.protocol.includes('gRPC');
      const isKafka = conn.protocol.includes('Kafka');
      
      ctx.strokeStyle = isNvlink ? 'rgba(118, 185, 0, 0.65)' : (isGrpc ? 'rgba(0, 240, 255, 0.5)' : (isKafka ? 'rgba(245, 158, 11, 0.5)' : 'rgba(168, 85, 247, 0.5)'));
      ctx.lineWidth = isNvlink ? 2.5 : 2;
      ctx.stroke();

      // Protocol Badge in Center
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      ctx.save();
      ctx.font = '600 9px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(conn.protocol).width;
      const badgeW = textWidth + 12;
      const badgeH = 18;

      ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
      ctx.strokeStyle = isNvlink ? 'rgba(118, 185, 0, 0.35)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isNvlink ? '#76b900' : '#a1a1aa';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(conn.protocol, midX, midY);
      ctx.restore();
    });
  }

  drawNode(ctx, node) {
    const isSelected = this.selectedNode === node;
    const isHovered = this.hoveredNode === node;
    const cfg = this.typeConfig[node.type] || this.typeConfig.service;

    ctx.save();

    // Glow effect
    if (node.status === 'warning') {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.7)';
      ctx.shadowBlur = 18;
    } else if (isSelected) {
      ctx.shadowColor = cfg.color;
      ctx.shadowBlur = 16;
    } else if (isHovered) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
      ctx.shadowBlur = 10;
    }

    // Node Box Gradient Background (Apple/Linear glass style)
    const grad = ctx.createLinearGradient(node.x, node.y, node.x, node.y + node.height);
    grad.addColorStop(0, 'rgba(22, 28, 44, 0.95)');
    grad.addColorStop(1, 'rgba(12, 16, 26, 0.98)');
    ctx.fillStyle = grad;

    ctx.strokeStyle = node.status === 'warning' ? '#ef4444' : (isSelected ? cfg.color : (isHovered ? 'rgba(255,255,255,0.35)' : 'rgba(255, 255, 255, 0.12)'));
    ctx.lineWidth = isSelected ? 2 : 1;
    this.roundRect(ctx, node.x, node.y, node.width, node.height, 10);
    ctx.fill();
    ctx.stroke();

    // Type Left Accent Line
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, 4, node.height, [10, 0, 0, 10]);
    ctx.fill();

    // Icon Circle
    ctx.fillStyle = cfg.bg;
    ctx.beginPath();
    ctx.arc(node.x + 26, node.y + 26, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Icon Emoji
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.icon, node.x + 26, node.y + 26);

    // Label
    ctx.font = '600 12px "Inter", -apple-system, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const labelText = node.label.length > 19 ? `${node.label.substring(0, 17)}...` : node.label;
    ctx.fillText(labelText, node.x + 50, node.y + 14);

    // Pill Badge (e.g. "ECS Fargate", "SXM5 Tensor")
    ctx.font = '600 8.5px "JetBrains Mono", monospace';
    const badgeText = cfg.badge;
    const badgeWidth = ctx.measureText(badgeText).width + 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    this.roundRect(ctx, node.x + 50, node.y + 32, badgeWidth, 14, 3);
    ctx.fill();

    ctx.fillStyle = cfg.color;
    ctx.fillText(badgeText, node.x + 54, node.y + 34);

    // Replicas Chip (e.g. "3x")
    if (node.replicas > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.roundRect(ctx, node.x + 50 + badgeWidth + 4, node.y + 32, 22, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${node.replicas}x`, node.x + 50 + badgeWidth + 7, node.y + 34);
    }

    // Mini Live Sparkline Waveform
    const hist = this.sparklineHistory.get(node.id) || [node.cpu];
    const sparkX = node.x + 50;
    const sparkY = node.y + 66;
    const sparkW = 85;
    const sparkH = 10;

    ctx.beginPath();
    ctx.strokeStyle = node.cpu > 80 ? '#ef4444' : (node.cpu > 50 ? '#f59e0b' : '#10b981');
    ctx.lineWidth = 1.2;

    hist.forEach((val, i) => {
      const ptX = sparkX + (i / Math.max(1, hist.length - 1)) * sparkW;
      const ptY = sparkY - (val / 100) * sparkH;
      if (i === 0) ctx.moveTo(ptX, ptY);
      else ctx.lineTo(ptX, ptY);
    });
    ctx.stroke();

    // CPU & Memory Labels
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`CPU ${node.cpu}%`, node.x + 145, node.y + 56);
    ctx.fillText(`MEM ${node.memory}%`, node.x + 145, node.y + 68);

    // Status Dot (Top Right)
    ctx.beginPath();
    ctx.arc(node.x + node.width - 14, node.y + 16, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = node.status === 'warning' ? '#ef4444' : '#10b981';
    ctx.fill();

    ctx.restore();
  }

  roundRect(ctx, x, y, width, height, radius) {
    if (ctx.roundRect) {
      ctx.roundRect(x, y, width, height, radius);
    } else {
      ctx.rect(x, y, width, height);
    }
  }
}
