/**
 * High-Performance Interactive HTML5 Vector Canvas Engine (Enterprise Edition)
 * Supports 60 FPS spatial rendering, pan/zoom, interactive port-to-port visual wiring,
 * multi-step Undo/Redo history stack, synthesizer audio feedback, and WebMCP telemetry.
 */

import { TrafficSimulator } from './traffic-simulator.js';

export class CanvasEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    // Core Graph State
    this.nodes = [];
    this.connections = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    this.hoveredPort = null; // 'in' | 'out' | null

    // Undo / Redo History Stack
    this.historyStack = [];
    this.redoStack = [];

    // Interactive Port Drag-to-Connect Wiring
    this.isConnecting = false;
    this.connectingSourceNode = null;
    this.connectingTargetPos = null;

    // Viewport & Pan/Zoom Transform
    this.transform = {
      x: 40,
      y: 30,
      scale: 1.0,
      minScale: 0.35,
      maxScale: 2.5
    };
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.draggingNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.mouseWorldPos = { x: 0, y: 0 };

    // Subsystems
    this.simulator = new TrafficSimulator(this);
    this.soundEnabled = true;
    this.audioCtx = null;
    this.sparklineHistory = new Map();
    this.frameCounter = 0;

    // Component Styles & Metadata
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

  // --- History & Undo/Redo ---

  pushHistory() {
    this.historyStack.push({
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections))
    });
    if (this.historyStack.length > 30) this.historyStack.shift();
    this.redoStack = [];
    this.updateUndoRedoUI();
  }

  undo() {
    if (this.historyStack.length === 0) return false;
    this.redoStack.push({
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections))
    });
    const prev = this.historyStack.pop();
    this.nodes = prev.nodes;
    this.connections = prev.connections;
    this.selectNode(null);
    this.updateStats();
    this.updateUndoRedoUI();
    this.playSfx(420, 'sine', 0.08);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    this.historyStack.push({
      nodes: JSON.parse(JSON.stringify(this.nodes)),
      connections: JSON.parse(JSON.stringify(this.connections))
    });
    const next = this.redoStack.pop();
    this.nodes = next.nodes;
    this.connections = next.connections;
    this.selectNode(null);
    this.updateStats();
    this.updateUndoRedoUI();
    this.playSfx(560, 'sine', 0.08);
    return true;
  }

  updateUndoRedoUI() {
    const undoBtn = document.getElementById('btn-canvas-undo');
    const redoBtn = document.getElementById('btn-canvas-redo');
    if (undoBtn) undoBtn.style.opacity = this.historyStack.length > 0 ? '1' : '0.4';
    if (redoBtn) redoBtn.style.opacity = this.redoStack.length > 0 ? '1' : '0.4';
  }

  // --- Event Handling ---

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

        this.pushHistory();
        const node = this.addNode({
          label: this.typeConfig[nodeType]?.label || 'New Service',
          type: nodeType,
          x: Math.round(worldPos.x - 105),
          y: Math.round(worldPos.y - 41)
        });
        this.selectNode(node);
        this.playSfx(440, 'sine', 0.08);
      }
    });

    // Keyboard Shortcuts (Undo, Redo, Delete, Escape)
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedNode) {
        this.pushHistory();
        this.deleteNode(this.selectedNode.id);
        this.selectNode(null);
        this.playSfx(220, 'sawtooth', 0.1);
      } else if (e.key === 'Escape') {
        this.selectNode(null);
        if (this.isConnecting) {
          this.isConnecting = false;
          this.connectingSourceNode = null;
          this.connectingTargetPos = null;
        }
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

  findOutputPortAt(wx, wy) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      const portX = node.x + (node.width || 210);
      const portY = node.y + (node.height || 82) / 2;
      const dist = Math.hypot(wx - portX, wy - portY);
      if (dist <= 16) {
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

    // 1. Check if user clicked on Output Port for Visual Wiring
    const portNode = this.findOutputPortAt(worldPos.x, worldPos.y);
    if (portNode) {
      this.isConnecting = true;
      this.connectingSourceNode = portNode;
      this.connectingTargetPos = { x: worldPos.x, y: worldPos.y };
      this.playSfx(720, 'sine', 0.05);
      return;
    }

    // 2. Check if clicked on a Node for Dragging / Selection
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

    if (this.isConnecting) {
      this.connectingTargetPos = { x: this.mouseWorldPos.x, y: this.mouseWorldPos.y };
      this.canvas.style.cursor = 'crosshair';
      return;
    }

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

    const portNode = this.findOutputPortAt(this.mouseWorldPos.x, this.mouseWorldPos.y);
    if (portNode) {
      this.canvas.style.cursor = 'pointer';
      this.hoveredPort = portNode.id;
      return;
    } else {
      this.hoveredPort = null;
    }

    this.hoveredNode = this.findNodeAt(this.mouseWorldPos.x, this.mouseWorldPos.y);
    this.canvas.style.cursor = this.hoveredNode ? 'grab' : (this.isPanning ? 'grabbing' : 'default');
  }

  onMouseUp() {
    if (this.isConnecting && this.connectingSourceNode) {
      const targetNode = this.findNodeAt(this.mouseWorldPos.x, this.mouseWorldPos.y);
      if (targetNode && targetNode.id !== this.connectingSourceNode.id) {
        this.pushHistory();
        this.connectNodes(this.connectingSourceNode.id, targetNode.id);
        this.playSfx(880, 'sine', 0.12);
      }
      this.isConnecting = false;
      this.connectingSourceNode = null;
      this.connectingTargetPos = null;
    }

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
    this.pushHistory();
    const id = data.id || `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNode = {
      id,
      label: data.label || 'New Service',
      type: data.type || 'service',
      x: data.x || 100,
      y: data.y || 100,
      width: 236,
      height: 84,
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
    this.pushHistory();
    if (this.selectedNode && this.selectedNode.id === id) {
      this.selectedNode = null;
    }
    if (this.hoveredNode && this.hoveredNode.id === id) {
      this.hoveredNode = null;
    }
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

    this.pushHistory();
    const conn = {
      id: options.id || `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      from: fromId,
      to: toId,
      protocol: options.protocol || 'gRPC Internal',
      latency: options.latency || `${Math.floor(2 + Math.random() * 10)}ms`,
      throughput: options.throughput || `${(Math.random() * 8 + 2).toFixed(1)}k req/s`
    };

    this.connections.push(conn);
    this.updateStats();
    return conn;
  }

  disconnectNodes(fromId, toId) {
    this.pushHistory();
    this.connections = this.connections.filter(c => !(c.from === fromId && c.to === toId));
    this.updateStats();
  }

  loadTopology(nodes, connections) {
    this.pushHistory();
    this.nodes = nodes.map(n => ({
      width: 236,
      height: 84,
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

  pushHistory() {
    const snapshot = JSON.stringify({
      nodes: this.nodes.map(n => ({ ...n })),
      connections: this.connections.map(c => ({ ...c }))
    });
    this.historyStack.push(snapshot);
    if (this.historyStack.length > 30) {
      this.historyStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (this.historyStack.length === 0) return false;
    const current = JSON.stringify({
      nodes: this.nodes.map(n => ({ ...n })),
      connections: this.connections.map(c => ({ ...c }))
    });
    this.redoStack.push(current);
    const previous = JSON.parse(this.historyStack.pop());
    this.nodes = previous.nodes || [];
    this.connections = previous.connections || [];
    this.selectNode(null);
    this.updateStats();
    this.checkEmptyState();
    this.playSfx(400, 'sine', 0.08);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    const current = JSON.stringify({
      nodes: this.nodes.map(n => ({ ...n })),
      connections: this.connections.map(c => ({ ...c }))
    });
    this.historyStack.push(current);
    const next = JSON.parse(this.redoStack.pop());
    this.nodes = next.nodes || [];
    this.connections = next.connections || [];
    this.selectNode(null);
    this.updateStats();
    this.checkEmptyState();
    this.playSfx(550, 'sine', 0.08);
    return true;
  }

  clearCanvas() {
    this.pushHistory();
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
    const scale = Math.min(1.0, Math.max(0.55, Math.min(scaleX, scaleY)));

    this.transform.scale = scale;
    this.transform.x = (this.logicalWidth - (maxX + minX) * scale) / 2;
    this.transform.y = (this.logicalHeight - (maxY + minY) * scale) / 2;

    const indicator = document.getElementById('zoom-indicator');
    if (indicator) indicator.textContent = `${Math.round(scale * 100)}%`;
  }

  zoomIn() {
    this.transform.scale = Math.min(this.transform.maxScale, this.transform.scale * 1.2);
    const indicator = document.getElementById('zoom-indicator');
    if (indicator) indicator.textContent = `${Math.round(this.transform.scale * 100)}%`;
  }

  zoomOut() {
    this.transform.scale = Math.max(this.transform.minScale, this.transform.scale / 1.2);
    const indicator = document.getElementById('zoom-indicator');
    if (indicator) indicator.textContent = `${Math.round(this.transform.scale * 100)}%`;
  }

  exportState() {
    return {
      nodes: this.nodes.map(n => ({ ...n })),
      connections: this.connections.map(c => ({ ...c }))
    };
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

  exportAsJson() {
    const payload = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      nodes: this.nodes,
      connections: this.connections
    }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omniflow-architecture-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  importFromJson(jsonStr) {
    const data = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    if (!data || !Array.isArray(data.nodes)) {
      throw new Error('Invalid architecture JSON format: expected nodes array.');
    }
    this.loadTopology(data.nodes, data.connections || []);
    this.autoFitView();
    return { success: true, nodesLoaded: data.nodes.length, linksLoaded: (data.connections || []).length };
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

    // Live Real-Time Cluster Health SLA Computation
    const healthyCount = this.nodes.filter(n => n.status !== 'warning').length;
    const healthPercent = this.nodes.length > 0 ? Math.round((healthyCount / this.nodes.length) * 100) : 100;
    const healthEl = document.getElementById('stat-health-score');
    if (healthEl) {
      healthEl.textContent = `${healthPercent}%`;
      healthEl.className = `stat-value ${healthPercent < 70 ? 'text-red' : (healthPercent < 90 ? 'text-amber' : 'text-emerald')}`;
    }
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

    // Interactive Dragging Wire (when dragging from a port)
    if (this.isConnecting && this.connectingSourceNode && this.connectingTargetPos) {
      this.drawActiveConnectionDrag(ctx, this.connectingSourceNode, this.connectingTargetPos);
    }

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

  drawActiveConnectionDrag(ctx, fromNode, targetPos) {
    const x1 = fromNode.x + fromNode.width;
    const y1 = fromNode.y + fromNode.height / 2;
    const x2 = targetPos.x;
    const y2 = targetPos.y;

    const dx = Math.max(40, (x2 - x1) * 0.45);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Target Glowing Endpoint Ring
    ctx.beginPath();
    ctx.arc(x2, y2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.restore();
  }

  drawNode(ctx, node) {
    const isSelected = this.selectedNode === node;
    const isHovered = this.hoveredNode === node;
    const isPortHovered = this.hoveredPort === node.id;
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
    ctx.font = '600 11.5px "Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const maxLen = 28;
    const labelText = node.label.length > maxLen ? `${node.label.substring(0, maxLen - 2)}...` : node.label;
    ctx.fillText(labelText, node.x + 48, node.y + 13);

    // Pill Badge (e.g. "ECS Fargate", "SXM5 Tensor")
    ctx.font = '600 8.5px "JetBrains Mono", monospace';
    const badgeText = cfg.badge;
    const badgeWidth = ctx.measureText(badgeText).width + 8;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    this.roundRect(ctx, node.x + 48, node.y + 32, badgeWidth, 14, 3);
    ctx.fill();

    ctx.fillStyle = cfg.color;
    ctx.fillText(badgeText, node.x + 52, node.y + 34);

    // Replicas Chip (e.g. "3x")
    if (node.replicas > 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      this.roundRect(ctx, node.x + 48 + badgeWidth + 4, node.y + 32, 22, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${node.replicas}x`, node.x + 48 + badgeWidth + 7, node.y + 34);
    }

    // Mini Live Sparkline Waveform
    const hist = this.sparklineHistory.get(node.id) || [node.cpu];
    const sparkX = node.x + 48;
    const sparkY = node.y + 66;
    const sparkW = 96;
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
    ctx.fillText(`CPU ${node.cpu}%`, node.x + 158, node.y + 56);
    ctx.fillText(`MEM ${node.memory}%`, node.x + 158, node.y + 68);

    // Status Dot (Top Right)
    ctx.beginPath();
    ctx.arc(node.x + node.width - 12, node.y + 16, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = node.status === 'warning' ? '#ef4444' : '#10b981';
    ctx.fill();

    // --- Interactive Port Anchors ---
    // Left Input Port Anchor
    ctx.beginPath();
    ctx.arc(node.x, node.y + node.height / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // Right Output Port Anchor (Interactive Wire Drag Target)
    const outPortRadius = isPortHovered ? 7 : 5;
    ctx.beginPath();
    ctx.arc(node.x + node.width, node.y + node.height / 2, outPortRadius, 0, Math.PI * 2);
    ctx.fillStyle = isPortHovered ? '#00f0ff' : '#0f172a';
    ctx.strokeStyle = isPortHovered ? '#ffffff' : '#00f0ff';
    ctx.lineWidth = isPortHovered ? 2 : 1.5;
    if (isPortHovered) {
      ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';
      ctx.shadowBlur = 8;
    }
    ctx.fill();
    ctx.stroke();

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
