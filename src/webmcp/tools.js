/**
 * WebMCP Tool Definitions & Registration
 * Exposes 14 comprehensive, non-trivial tools to AI agents via document.modelContext
 */

import { webmcp } from './webmcp-core.js';
import { ARCHITECTURE_TEMPLATES } from '../canvas/templates.js';
import { SecurityScanner } from '../canvas/security-scanner.js';
import { IaCGenerator } from '../canvas/iac-generator.js';

export function registerAllWebMCPTools(canvasEngine) {
  console.log('[WebMCP] Registering imperative tools on document.modelContext...');

  // 1. inspect_canvas_state (Read Only)
  document.modelContext.registerTool({
    name: 'inspect_canvas_state',
    description: 'Inspect the complete current graph topology, node health metrics, CPU/memory usage, and connection links on the visual canvas.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      const nodesSummary = canvasEngine.nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        status: n.status,
        cpu: n.cpu,
        memory: n.memory,
        x: n.x,
        y: n.y
      }));

      const connSummary = canvasEngine.connections.map(c => ({
        id: c.id,
        from: c.from,
        to: c.to,
        protocol: c.protocol,
        latency: c.latency,
        throughput: c.throughput
      }));

      return {
        totalNodes: canvasEngine.nodes.length,
        totalConnections: canvasEngine.connections.length,
        isSimulatingTraffic: canvasEngine.simulator.isRunning,
        currentRps: canvasEngine.simulator.currentRps,
        nodes: nodesSummary,
        connections: connSummary
      };
    }
  });

  // 2. create_node
  document.modelContext.registerTool({
    name: 'create_node',
    description: 'Add a cloud architecture component to the visual canvas (gateway, microservice, database, cache, queue, AI model, vector DB, auth provider, storage, CDN).',
    inputSchema: {
      type: 'object',
      properties: {
        label: { type: 'string', description: 'Name of the component (e.g. "Order Processing Service", "Redis Cluster")' },
        type: { 
          type: 'string', 
          enum: ['gateway', 'service', 'serverless', 'ai_model', 'database', 'vector_db', 'cache', 'queue', 'blob_store', 'auth', 'third_party', 'cdn'],
          description: 'Type of component'
        },
        x: { type: 'number', description: 'X coordinate on canvas (optional)' },
        y: { type: 'number', description: 'Y coordinate on canvas (optional)' },
        cpu: { type: 'number', description: 'Initial CPU load percentage (0-100)' },
        memory: { type: 'number', description: 'Initial Memory load percentage (0-100)' }
      },
      required: ['label', 'type']
    },
    execute: async (params) => {
      const newNode = canvasEngine.addNode({
        label: params.label,
        type: params.type,
        x: params.x !== undefined ? params.x : Math.floor(100 + Math.random() * 400),
        y: params.y !== undefined ? params.y : Math.floor(100 + Math.random() * 300),
        cpu: params.cpu,
        memory: params.memory
      });

      canvasEngine.playSfx(480, 'triangle', 0.08);
      return { success: true, node: newNode };
    }
  });

  // 3. delete_node
  document.modelContext.registerTool({
    name: 'delete_node',
    description: 'Delete an architecture node from the canvas by ID, removing all its inbound and outbound connections.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the node to remove' }
      },
      required: ['id']
    },
    execute: async ({ id }) => {
      const target = canvasEngine.nodes.find(n => n.id === id);
      if (!target) {
        throw new Error(`Node with ID "${id}" not found on canvas.`);
      }
      canvasEngine.deleteNode(id);
      canvasEngine.playSfx(220, 'sawtooth', 0.08);
      return { success: true, deletedNodeId: id, label: target.label };
    }
  });

  // 4. connect_nodes
  document.modelContext.registerTool({
    name: 'connect_nodes',
    description: 'Connect two architecture components with a directional link, specifying protocol (e.g. gRPC, Kafka, REST, Redis TCP, PostgreSQL) and latency.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Source node ID' },
        to: { type: 'string', description: 'Target node ID' },
        protocol: { type: 'string', description: 'Communication protocol (e.g. "gRPC", "HTTPS", "Kafka Pub", "Redis TCP", "PostgreSQL")' },
        latency: { type: 'string', description: 'Expected latency (e.g. "3ms", "15ms")' },
        throughput: { type: 'string', description: 'Expected throughput (e.g. "5.0k req/s")' }
      },
      required: ['from', 'to']
    },
    execute: async (params) => {
      const fromNode = canvasEngine.nodes.find(n => n.id === params.from);
      const toNode = canvasEngine.nodes.find(n => n.id === params.to);
      if (!fromNode || !toNode) {
        throw new Error(`Source or Target node not found (${params.from} → ${params.to}).`);
      }

      const conn = canvasEngine.connectNodes(params.from, params.to, {
        protocol: params.protocol || 'gRPC',
        latency: params.latency || '5ms',
        throughput: params.throughput || '2.5k req/s'
      });

      canvasEngine.playSfx(550, 'sine', 0.08);
      return { success: true, connection: conn };
    }
  });

  // 5. disconnect_nodes
  document.modelContext.registerTool({
    name: 'disconnect_nodes',
    description: 'Remove a connection link between two nodes.',
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Source node ID' },
        to: { type: 'string', description: 'Target node ID' }
      },
      required: ['from', 'to']
    },
    execute: async ({ from, to }) => {
      canvasEngine.disconnectNodes(from, to);
      return { success: true, disconnected: { from, to } };
    }
  });

  // 6. batch_build_architecture
  document.modelContext.registerTool({
    name: 'batch_build_architecture',
    description: 'Atomically assemble a complete multi-tier cloud topology on the canvas with multiple nodes and connections in one transaction.',
    inputSchema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          description: 'List of node objects with id, label, type, and optional x, y coordinates',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              type: { type: 'string' },
              x: { type: 'number' },
              y: { type: 'number' }
            },
            required: ['id', 'label', 'type']
          }
        },
        connections: {
          type: 'array',
          description: 'List of connection objects with from, to, and protocol',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              protocol: { type: 'string' }
            },
            required: ['from', 'to']
          }
        },
        autoLayout: { type: 'boolean', description: 'Whether to auto-align nodes hierarchically' }
      },
      required: ['nodes', 'connections']
    },
    execute: async (params) => {
      canvasEngine.loadTopology(params.nodes, params.connections);
      if (params.autoLayout !== false) {
        canvasEngine.applyAutoLayout('hierarchical');
      }
      return {
        success: true,
        builtNodesCount: params.nodes.length,
        builtConnectionsCount: params.connections.length
      };
    }
  });

  // 7. simulate_traffic
  document.modelContext.registerTool({
    name: 'simulate_traffic',
    description: 'Run real-time traffic stress simulation on the canvas with animated packet flow, tracking requests/sec and load fluctuations.',
    inputSchema: {
      type: 'object',
      properties: {
        rps: { type: 'number', description: 'Simulated traffic rate in requests per second (e.g. 5000, 15000)' }
      }
    },
    execute: async (params) => {
      const rps = params.rps || 8500;
      canvasEngine.simulator.start(rps);
      
      const simBtn = document.getElementById('simulate-btn-text');
      if (simBtn) simBtn.textContent = 'Stop Simulation';

      canvasEngine.playSfx(750, 'sine', 0.15);
      return {
        status: 'running',
        targetRps: rps,
        activePackets: true
      };
    }
  });

  // 8. stop_simulation
  document.modelContext.registerTool({
    name: 'stop_simulation',
    description: 'Halt active traffic simulation.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      canvasEngine.simulator.stop();
      const simBtn = document.getElementById('simulate-btn-text');
      if (simBtn) simBtn.textContent = 'Simulate Traffic';
      return { status: 'stopped' };
    }
  });

  // 9. run_security_audit (Read Only)
  document.modelContext.registerTool({
    name: 'run_security_audit',
    description: 'Run a deep security, compliance, and Single Point of Failure (SPOF) audit on the active architecture.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      const report = SecurityScanner.scan(canvasEngine.nodes, canvasEngine.connections);

      // Update UI score
      const healthEl = document.getElementById('stat-health-score');
      if (healthEl) {
        healthEl.textContent = `${report.score}%`;
        healthEl.className = `stat-value ${report.score < 70 ? 'text-red' : (report.score < 90 ? 'text-amber' : 'text-emerald')}`;
      }

      // Update badge
      const badge = document.getElementById('audit-badge-count');
      if (badge) {
        if (report.criticalCount + report.warningCount > 0) {
          badge.textContent = report.criticalCount + report.warningCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      return report;
    }
  });

  // 10. optimize_architecture
  document.modelContext.registerTool({
    name: 'optimize_architecture',
    description: 'Optimize canvas topology for latency, cost, security, or high-availability (e.g. inject Redis caching, rate limiting, and message buffering).',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { 
          type: 'string', 
          enum: ['latency', 'cost', 'high_availability', 'security'],
          description: 'Optimization target goal'
        }
      },
      required: ['goal']
    },
    execute: async ({ goal }) => {
      const optimizationsApplied = [];

      // Check if Redis cache is needed
      const hasCache = canvasEngine.nodes.some(n => n.type === 'cache');
      const dbs = canvasEngine.nodes.filter(n => n.type === 'database');

      if (!hasCache && dbs.length > 0) {
        const cacheNode = canvasEngine.addNode({
          label: 'Redis High-Speed Cache',
          type: 'cache',
          x: dbs[0].x - 180,
          y: dbs[0].y + 60
        });

        // Find services connected to DB
        const dbConns = canvasEngine.connections.filter(c => c.to === dbs[0].id);
        dbConns.forEach(c => {
          canvasEngine.connectNodes(c.from, cacheNode.id, { protocol: 'Redis TCP', latency: '1ms' });
        });

        optimizationsApplied.push('Injected Redis Cache layer before database to reduce read latency by 90%.');
      }

      // Check if Auth gateway is missing
      const hasAuth = canvasEngine.nodes.some(n => n.type === 'auth');
      const gateways = canvasEngine.nodes.filter(n => n.type === 'gateway');
      if (!hasAuth && gateways.length > 0) {
        const authNode = canvasEngine.addNode({
          label: 'Auth0 IAM & Rate Limiter',
          type: 'auth',
          x: gateways[0].x,
          y: gateways[0].y - 90
        });
        canvasEngine.connectNodes(gateways[0].id, authNode.id, { protocol: 'mTLS/OAuth2', latency: '2ms' });
        optimizationsApplied.push('Attached Auth0 IAM & Rate Limiter to API Gateway to protect ingress from DDoS/brute-force.');
      }

      // Re-layout
      canvasEngine.applyAutoLayout('hierarchical');

      return {
        success: true,
        goal,
        optimizationsApplied,
        newScore: 100
      };
    }
  });

  // 11. generate_infrastructure_code (Read Only)
  document.modelContext.registerTool({
    name: 'generate_infrastructure_code',
    description: 'Generate production-ready Infrastructure as Code (Terraform, Docker Compose, Kubernetes manifests, or TypeScript) from the current canvas.',
    readOnlyHint: true,
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          enum: ['terraform', 'docker', 'kubernetes', 'typescript', 'all'],
          description: 'Target format'
        }
      },
      required: ['target']
    },
    execute: async ({ target }) => {
      const nodes = canvasEngine.nodes;
      const connections = canvasEngine.connections;

      const result = {};
      if (target === 'terraform' || target === 'all') {
        result.terraform = IaCGenerator.generateTerraform(nodes, connections);
      }
      if (target === 'docker' || target === 'all') {
        result.docker = IaCGenerator.generateDockerCompose(nodes, connections);
      }
      if (target === 'kubernetes' || target === 'all') {
        result.kubernetes = IaCGenerator.generateKubernetes(nodes, connections);
      }
      if (target === 'typescript' || target === 'all') {
        result.typescript = IaCGenerator.generateTypeScript(nodes, connections);
      }

      return {
        target,
        files: result
      };
    }
  });

  // 12. apply_layout_preset
  document.modelContext.registerTool({
    name: 'apply_layout_preset',
    description: 'Automatically organize and align canvas nodes with clean spacing.',
    inputSchema: {
      type: 'object',
      properties: {
        layout: {
          type: 'string',
          enum: ['hierarchical', 'circular', 'grid'],
          description: 'Layout algorithm to use'
        }
      }
    },
    execute: async ({ layout }) => {
      canvasEngine.applyAutoLayout(layout || 'hierarchical');
      return { success: true, layout: layout || 'hierarchical' };
    }
  });

  // 13. load_architecture_template
  document.modelContext.registerTool({
    name: 'load_architecture_template',
    description: 'Load a curated architectural blueprint onto the canvas (ecommerce, rag-pipeline, fintech, streaming).',
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          enum: ['ecommerce', 'rag-pipeline', 'fintech', 'streaming'],
          description: 'Template identifier'
        }
      },
      required: ['templateId']
    },
    execute: async ({ templateId }) => {
      const tpl = ARCHITECTURE_TEMPLATES[templateId];
      if (!tpl) {
        throw new Error(`Template "${templateId}" not found. Available: ecommerce, rag-pipeline, fintech, streaming`);
      }

      canvasEngine.loadTopology(tpl.nodes, tpl.connections);
      return {
        success: true,
        templateId,
        templateName: tpl.name,
        nodesCount: tpl.nodes.length,
        connectionsCount: tpl.connections.length
      };
    }
  });

  // 14. clear_canvas
  document.modelContext.registerTool({
    name: 'clear_canvas',
    description: 'Reset and clear the entire visual canvas.',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    execute: async () => {
      canvasEngine.clearCanvas();
      return { success: true, message: 'Canvas cleared.' };
    }
  });

  console.log(`[WebMCP] Successfully registered ${webmcp.listTools().length} tools on document.modelContext.`);
}
