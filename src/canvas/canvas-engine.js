/**
 * High-Performance Interactive Architecture Canvas Engine
 * 60 FPS HTML5 Canvas with Pan/Zoom, Drag & Drop, Physics, and Particle Visuals.
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

    // Viewport Transform
    this.transform = {
      x: 60,
      y: 40,
      scale: 1.0,
      minScale: 0.3,
      maxScale: 2.5
    };

    // Connection Drag State
    this.connectingFromNode = null;
    this.mouseWorldPos = { x: 0, y: 0 };

    // Traffic Simulator
    this.simulator = new TrafficSimulator(this);

    // Audio SFX synthesis
    this.soundEnabled = true;
    this.audioCtx = null;

    // Node Type Configuration
    this.typeConfig = {
      gateway: { label: 'API Gateway', color: '#00f0ff', icon: '🌐', bg: '#082f49' },
      service: { label: 'Microservice', color: '#a855f7', icon: '⚙️', bg: '#3b0764' },
      serverless: { label: 'Serverless Func', color: '#f59e0b', icon: '⚡', bg: '#451a03' },
      ai_model: { label: 'LLM / AI Model', color: '#ec4899', icon: '🧠', bg: '#500724' },
      database: { label: 'PostgreSQL DB', color: '#3b82f6', icon: '🗄️', bg: '#172554' },
      vector_db: { label: 'Vector DB', color: '#6366f1', icon: '📐', bg: '#1e1b4b' },
      cache: { label: 'Redis Cache', color: '#ef4444', icon: '⚡', bg: '#450a0a' },
      queue: { label: 'Kafka Queue', color: '#f59e0b', icon: '📬', bg: '#451a03' },
      blob_store: { label: 'Object S3', color: '#14b8a6', icon: '📦', bg: '#042f2e' },
      auth: { label: 'Auth0 / IAM', color: '#10b981', icon: '🛡️', bg: '#022c22' },
      third_party: { label: 'Stripe Webhook', color: '#a855f7', icon: '💳', bg: '#3b0764' },
      cdn: { label: 'Cloudflare CDN', color: '#00f0ff', icon: '🌍', bg: '#082f49' }
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

        this.addNode({
          label: this.typeConfig[nodeType]?.label || 'New Service',
          type: nodeType,
          x: Math.round(worldPos.x - 90),
          y: Math.round(worldPos.y - 35)
        });
        this.playSfx(440, 'sine', 0.08);
      }
    });

    // Keyboard controls (Delete, Space+Pan)
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
        // Don't delete if user is typing in an input
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        this.deleteNode(this.selectedNode.id);
        this.selectedNode = null;
        this.playSfx(220, 'sawtooth', 0.1);
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
        wx <= node.x + (node.width || 180) &&
        wy >= node.y &&
        wy <= node.y + (node.height || 70)
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

    // Right click or Space + Click -> Pan
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      this.isPanning = true;
      this.panStart = { x: sx - this.transform.x, y: sy - this.transform.y };
      return;
    }

    const clickedNode = this.findNodeAt(worldPos.x, worldPos.y);
    if (clickedNode) {
      this.selectedNode = clickedNode;
      this.draggingNode = clickedNode;
      this.dragOffset = {
        x: worldPos.x - clickedNode.x,
        y: worldPos.y - clickedNode.y
      };
      this.playSfx(580, 'triangle', 0.04);
    } else {
      this.selectedNode = null;
      this.isPanning = true;
      this.panStart = { x: sx - this.transform.x, y: sy - this.transform.y };
    }
    this.updateStats();
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

    // Zoom centered on cursor
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
      width: 190,
      height: 72,
      status: data.status || 'healthy',
      cpu: data.cpu || Math.floor(20 + Math.random() * 35),
      memory: data.memory || Math.floor(30 + Math.random() * 40),
      hasWarning: false,
      metadata: data.metadata || {}
    };

    this.nodes.push(newNode);
    this.updateStats();
    this.checkEmptyState();
    return newNode;
  }

  deleteNode(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
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
      latency: options.latency || `${Math.floor(2 + Math.random() * 15)}ms`,
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
      width: 190,
      height: 72,
      ...n
    }));
    this.connections = [...connections];
    this.autoFitView();
    this.updateStats();
    this.checkEmptyState();
    this.playSfx(520, 'sine', 0.12);
  }

  clearCanvas() {
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
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

    const graphWidth = maxX - minX + 120;
    const graphHeight = maxY - minY + 120;
    const scaleX = this.logicalWidth / graphWidth;
    const scaleY = this.logicalHeight / graphHeight;
    const scale = Math.min(1.1, Math.max(0.6, Math.min(scaleX, scaleY)));

    this.transform.scale = scale;
    this.transform.x = (this.logicalWidth - (maxX + minX) * scale) / 2;
    this.transform.y = (this.logicalHeight - (maxY + minY) * scale) / 2;

    const indicator = document.getElementById('zoom-indicator');
    if (indicator) indicator.textContent = `${Math.round(scale * 100)}%`;
  }

  applyAutoLayout(type = 'hierarchical') {
    if (this.nodes.length === 0) return;

    // Hierarchical layout based on node types
    const orderRank = {
      cdn: 0,
      gateway: 1,
      auth: 1.5,
      service: 2,
      serverless: 2,
      ai_model: 2.5,
      cache: 3,
      queue: 3,
      vector_db: 3.5,
      database: 4,
      blob_store: 4,
      third_party: 4
    };

    // Group nodes by tier
    const tiers = {};
    this.nodes.forEach(n => {
      const rank = orderRank[n.type] ?? 2;
      if (!tiers[rank]) tiers[rank] = [];
      tiers[rank].push(n);
    });

    const sortedRanks = Object.keys(tiers).sort((a, b) => Number(a) - Number(b));
    let startX = 80;
    const colSpacing = 240;

    sortedRanks.forEach(rank => {
      const colNodes = tiers[rank];
      const rowSpacing = 110;
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
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  // --- Render Loop ---

  startRenderLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      this.simulator.update(deltaTime);
      this.draw();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Draw Grid
    this.drawGrid();

    ctx.save();
    // Apply Pan and Zoom
    ctx.translate(this.transform.x, this.transform.y);
    ctx.scale(this.transform.scale, this.transform.scale);

    const nodeMap = new Map(this.nodes.map(n => [n.id, n]));

    // Draw Connections
    this.drawConnections(ctx, nodeMap);

    // Draw Traffic Particles
    this.simulator.render(ctx, nodeMap);

    // Draw Nodes
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
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

      // Draw Curved Bezier Line
      const dx = Math.max(40, (x2 - x1) * 0.45);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);

      // Line Style
      const isGrpc = conn.protocol.includes('gRPC');
      const isKafka = conn.protocol.includes('Kafka');
      ctx.strokeStyle = isGrpc ? 'rgba(0, 240, 255, 0.45)' : (isKafka ? 'rgba(245, 158, 11, 0.45)' : 'rgba(168, 85, 247, 0.45)');
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Protocol Badge in Center
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      ctx.save();
      ctx.font = '9px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(conn.protocol).width;
      const badgeW = textWidth + 10;
      const badgeH = 16;

      ctx.fillStyle = 'rgba(13, 17, 26, 0.85)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      this.roundRect(ctx, midX - badgeW / 2, midY - badgeH / 2, badgeW, badgeH, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
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

    // Glow effect if selected or warning
    if (node.status === 'warning') {
      ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
      ctx.shadowBlur = 16;
    } else if (isSelected) {
      ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
      ctx.shadowBlur = 14;
    } else if (isHovered) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
      ctx.shadowBlur = 8;
    }

    // Node Background Box
    ctx.fillStyle = 'rgba(16, 22, 34, 0.9)';
    ctx.strokeStyle = node.status === 'warning' ? '#ef4444' : (isSelected ? '#00f0ff' : (isHovered ? 'rgba(255,255,255,0.3)' : 'rgba(255, 255, 255, 0.1)'));
    ctx.lineWidth = isSelected ? 2 : 1;
    this.roundRect(ctx, node.x, node.y, node.width, node.height, 8);
    ctx.fill();
    ctx.stroke();

    // Type Color Indicator Stripe
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, 4, node.height, [8, 0, 0, 8]);
    ctx.fill();

    // Icon Circle
    ctx.fillStyle = cfg.bg;
    ctx.beginPath();
    ctx.arc(node.x + 24, node.y + 24, 14, 0, Math.PI * 2);
    ctx.fill();

    // Icon Emoji
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.icon, node.x + 24, node.y + 24);

    // Label
    ctx.font = '600 11.5px "Inter", sans-serif';
    ctx.fillStyle = '#f3f4f6';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const labelText = node.label.length > 20 ? `${node.label.substring(0, 18)}...` : node.label;
    ctx.fillText(labelText, node.x + 46, node.y + 14);

    // Type Subtitle
    ctx.font = '9.5px "Inter", sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(cfg.label, node.x + 46, node.y + 30);

    // Mini CPU & Memory telemetry bar
    const barX = node.x + 46;
    const barY = node.y + 48;
    const barW = 120;
    const barH = 5;

    // CPU Bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.roundRect(ctx, barX, barY, barW, barH, 2);
    ctx.fill();

    // CPU Fill
    const cpuFillW = Math.max(4, (node.cpu / 100) * barW);
    ctx.fillStyle = node.cpu > 80 ? '#ef4444' : (node.cpu > 50 ? '#f59e0b' : '#10b981');
    this.roundRect(ctx, barX, barY, cpuFillW, barH, 2);
    ctx.fill();

    // Small Text Metrics
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`CPU: ${node.cpu}%`, node.x + 46, node.y + 56);
    ctx.fillText(`MEM: ${node.memory}%`, node.x + 105, node.y + 56);

    // Status Dot (Top Right)
    ctx.beginPath();
    ctx.arc(node.x + node.width - 12, node.y + 14, 4, 0, Math.PI * 2);
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
