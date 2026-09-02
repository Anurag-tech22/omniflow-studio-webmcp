/**
 * Real-Time Traffic & Stress Simulator Engine
 * Generates dynamic packet particles and calculates bottleneck telemetry.
 */

export class TrafficSimulator {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.isRunning = false;
    this.targetRps = 8500;
    this.currentRps = 0;
    this.packets = []; // Array of { id, connectionId, progress: 0..1, speed, color, size }
    this.packetIdCounter = 0;
    this.lastSpawnTime = 0;
    this.metricsInterval = null;
  }

  start(rps = 8500) {
    this.targetRps = rps;
    this.isRunning = true;
    this.packets = [];

    // Periodic telemetry fluctuation
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    this.metricsInterval = setInterval(() => {
      if (!this.isRunning) return;
      // Fluctuate RPS around target
      const variance = (Math.random() - 0.5) * 0.15 * this.targetRps;
      this.currentRps = Math.round(this.targetRps + variance);

      // Randomly simulate node load spikes
      if (this.canvas.nodes.length > 0) {
        this.canvas.nodes.forEach(node => {
          const cpuDelta = (Math.random() - 0.45) * 8;
          node.cpu = Math.max(10, Math.min(96, Math.round((node.cpu || 30) + cpuDelta)));
          const memDelta = (Math.random() - 0.45) * 5;
          node.memory = Math.max(20, Math.min(94, Math.round((node.memory || 40) + memDelta)));
          
          // If CPU > 90%, flag warning
          if (node.cpu > 88) {
            node.status = 'warning';
          } else {
            node.status = 'healthy';
          }
        });
      }

      // Update top status bar: RPS & p99 Latency SLA
      const rpsEl = document.getElementById('stat-traffic-rps');
      if (rpsEl) {
        rpsEl.textContent = `${(this.currentRps / 1000).toFixed(1)}k req/s`;
      }

      const p99El = document.getElementById('stat-latency-p99');
      if (p99El) {
        let p99 = Math.round(8 + (this.currentRps / 1000) * 1.8 + Math.random() * 3);
        if (this.currentRps > 30000) p99 = Math.round(75 + Math.random() * 35);
        p99El.textContent = `${p99}ms`;
        p99El.className = `stat-value ${p99 > 50 ? 'text-red' : (p99 > 25 ? 'text-amber' : 'text-purple')}`;
      }
    }, 500);
  }

  stop() {
    this.isRunning = false;
    this.packets = [];
    this.currentRps = 0;
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    const rpsEl = document.getElementById('stat-traffic-rps');
    if (rpsEl) rpsEl.textContent = '0 req/s';
    const p99El = document.getElementById('stat-latency-p99');
    if (p99El) {
      p99El.textContent = '8ms';
      p99El.className = 'stat-value text-purple';
    }

    // Reset nodes to healthy
    this.canvas.nodes.forEach(n => {
      n.status = 'healthy';
    });
  }

  /**
   * Called every animation frame by canvas-engine
   */
  update(deltaTime) {
    if (!this.isRunning || this.canvas.connections.length === 0) return;

    // Spawn new packets
    const now = performance.now();
    const spawnRateMs = Math.max(20, 200000 / (this.targetRps || 5000));

    if (now - this.lastSpawnTime > spawnRateMs) {
      this.lastSpawnTime = now;
      // Pick 1-3 random connections
      const count = Math.min(3, this.canvas.connections.length);
      for (let i = 0; i < count; i++) {
        const randIdx = Math.floor(Math.random() * this.canvas.connections.length);
        const conn = this.canvas.connections[randIdx];
        if (conn) {
          this.packets.push({
            id: ++this.packetIdCounter,
            connectionId: conn.id,
            progress: 0,
            speed: 0.008 + Math.random() * 0.012,
            color: conn.protocol.includes('gRPC') ? '#00f0ff' : conn.protocol.includes('Kafka') ? '#f59e0b' : '#a855f7',
            size: 3 + Math.random() * 2
          });
        }
      }
    }

    // Update existing packet positions
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.progress += p.speed;
      if (p.progress >= 1) {
        this.packets.splice(i, 1);
      }
    }
  }

  /**
   * Render packets along connection curves/lines
   */
  render(ctx, nodeMap) {
    if (!this.isRunning || this.packets.length === 0) return;

    ctx.save();
    this.packets.forEach(p => {
      const conn = this.canvas.connections.find(c => c.id === p.connectionId);
      if (!conn) return;

      const fromNode = nodeMap.get(conn.from);
      const toNode = nodeMap.get(conn.to);
      if (!fromNode || !toNode) return;

      // Calculate node center coordinates
      const x1 = fromNode.x + fromNode.width / 2;
      const y1 = fromNode.y + fromNode.height / 2;
      const x2 = toNode.x + toNode.width / 2;
      const y2 = toNode.y + toNode.height / 2;

      // Interpolated point along line
      const currentX = x1 + (x2 - x1) * p.progress;
      const currentY = y1 + (y2 - y1) * p.progress;

      // Draw glowing particle
      ctx.beginPath();
      ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();

      // Inner bright core
      ctx.beginPath();
      ctx.arc(currentX, currentY, p.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
    ctx.restore();
  }
}
