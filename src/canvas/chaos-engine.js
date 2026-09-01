/**
 * Chaos Engineering & Resilience Engine
 * Simulates real-world distributed systems failures: DDoS attacks, Node outages, and GPU OOM.
 */

export class ChaosEngine {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.isChaosActive = false;
    this.attackType = null;
    this.killedNodeBackup = null;
  }

  /**
   * Simulates a 50,000 RPS DDoS / Traffic Flood Attack
   */
  injectDDoSAttack(targetRps = 50000) {
    this.isChaosActive = true;
    this.attackType = 'ddos';

    // Find Gateway or CDN
    const gateways = this.canvas.nodes.filter(n => n.type === 'gateway' || n.type === 'cdn');
    gateways.forEach(gw => {
      gw.cpu = 98;
      gw.memory = 94;
      gw.status = 'warning';
    });

    // Start massive particle traffic simulation
    this.canvas.simulator.start(targetRps);
    this.canvas.playSfx(180, 'sawtooth', 0.3);

    return {
      status: 'attack_active',
      type: 'DDoS Traffic Flood',
      simulatedRps: targetRps,
      affectedNodes: gateways.map(g => g.label),
      recommendation: 'Attach Cloudflare Edge WAF or auto-scale API Gateway replicas to 6x.'
    };
  }

  /**
   * Chaos Monkey: Kills a random microservice to test failover & queue buffering
   */
  killRandomNode() {
    const services = this.canvas.nodes.filter(n => n.type === 'service' || n.type === 'serverless' || n.type === 'database');
    if (services.length === 0) return { error: 'No killable services found.' };

    const target = services[Math.floor(Math.random() * services.length)];
    target.status = 'warning';
    target.cpu = 0;
    target.memory = 0;
    target.originalLabel = target.label;
    target.label = `[FAILED] ${target.label}`;

    this.killedNodeBackup = target;
    this.canvas.playSfx(140, 'sawtooth', 0.25);

    return {
      status: 'node_terminated',
      killedNodeId: target.id,
      killedNodeName: target.originalLabel,
      impact: 'Upstream services buffering traffic in Kafka queue; failover required.'
    };
  }

  /**
   * Simulates GPU Out-Of-Memory (OOM) on NVIDIA H100 nodes
   */
  simulateGpuOOM() {
    const gpus = this.canvas.nodes.filter(n => n.type === 'gpu_cluster' || n.type === 'ai_model');
    if (gpus.length === 0) return { error: 'No GPU or AI Model nodes on canvas.' };

    gpus.forEach(g => {
      g.memory = 100;
      g.status = 'warning';
      g.label = `[GPU OOM] ${g.label}`;
    });

    this.canvas.playSfx(200, 'square', 0.3);

    return {
      status: 'gpu_oom_triggered',
      affectedClusters: gpus.map(g => g.id),
      remediation: 'Enable vLLM PagedAttention chunked prefill and split tensor parallelism across 8x H100 GPUs.'
    };
  }

  /**
   * Auto-Heals the entire cluster: restarts failed nodes, mitigates DDoS, and scales replicas
   */
  autoHealCluster() {
    this.isChaosActive = false;
    this.attackType = null;

    this.canvas.nodes.forEach(n => {
      n.status = 'healthy';
      if (n.originalLabel) {
        n.label = n.originalLabel;
        delete n.originalLabel;
      }
      n.label = n.label.replace('[FAILED] ', '').replace('[GPU OOM] ', '');
      n.cpu = Math.floor(25 + Math.random() * 30);
      n.memory = Math.floor(35 + Math.random() * 30);
      if (n.type === 'gateway' && n.replicas < 4) n.replicas = 4;
    });

    this.canvas.simulator.start(8500);
    this.canvas.playSfx(880, 'sine', 0.15);

    return {
      status: 'cluster_healed',
      healthScore: '100%',
      activeNodes: this.canvas.nodes.length,
      message: 'All microservices recovered, DDoS traffic mitigated via Cloudflare Edge WAF, and GPU memory defragmented.'
    };
  }
}
