/**
 * Security & Reliability Audit Engine
 * Performs graph topology analysis on architecture nodes and connections.
 */

export class SecurityScanner {
  static audit(nodes, connections) {
    return this.scan(nodes, connections);
  }

  static scan(nodes, connections) {
    const findings = [];
    let score = 100;

    if (!nodes || nodes.length === 0) {
      return {
        score: 100,
        criticalCount: 0,
        warningCount: 0,
        infoCount: 0,
        findings: [{
          id: 'info-empty',
          severity: 'info',
          title: 'Canvas is Empty',
          description: 'No active nodes detected to evaluate.',
          remediation: 'Add components or load an architecture template to begin.'
        }]
      };
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inboundMap = new Map();
    const outboundMap = new Map();

    nodes.forEach(n => {
      inboundMap.set(n.id, []);
      outboundMap.set(n.id, []);
    });

    connections.forEach(c => {
      if (inboundMap.has(c.to)) inboundMap.get(c.to).push(c);
      if (outboundMap.has(c.from)) outboundMap.get(c.from).push(c);
    });

    // 1. Check for Public Database Exposure (Direct link from CDN/Gateway to Database without microservice or auth)
    nodes.filter(n => n.type === 'database').forEach(db => {
      const inbounds = inboundMap.get(db.id) || [];
      const hasDirectPublic = inbounds.some(c => {
        const sourceNode = nodeMap.get(c.from);
        return sourceNode && (sourceNode.type === 'cdn' || sourceNode.type === 'gateway');
      });

      if (hasDirectPublic) {
        score -= 25;
        findings.push({
          id: `sec-db-public-${db.id}`,
          nodeId: db.id,
          severity: 'critical',
          title: `Direct Public Exposure: ${db.label}`,
          description: `The database "${db.label}" is directly linked to an edge gateway without an intermediate application/microservice layer or VPC isolation.`,
          remediation: 'Place an authenticated microservice or private subnetwork between the gateway and database.'
        });
      }
    });

    // 2. Check for Missing Auth Provider at Gateway
    const gateways = nodes.filter(n => n.type === 'gateway');
    const authNodes = nodes.filter(n => n.type === 'auth');
    if (gateways.length > 0 && authNodes.length === 0) {
      score -= 20;
      findings.push({
        id: 'sec-no-auth-gw',
        severity: 'critical',
        title: 'Missing Central Authentication & IAM Gateway',
        description: 'API Gateways are accepting requests without an IAM/OAuth2 authentication provider connected.',
        remediation: 'Add an Auth0/IAM Provider or Vault HSM node and connect it to your API Gateway.'
      });
    }

    // 3. Check for AI Model / LLM without Rate Limiter or Semantic Cache
    const aiModels = nodes.filter(n => n.type === 'ai_model');
    const caches = nodes.filter(n => n.type === 'cache');
    if (aiModels.length > 0 && caches.length === 0) {
      score -= 15;
      findings.push({
        id: 'sec-ai-no-cache',
        severity: 'warning',
        title: 'Uncached AI Model Invocations (Cost & DoS Risk)',
        description: 'AI LLM models are invoked without a Semantic Cache (e.g. Redis), leading to high token costs and latency spikes.',
        remediation: 'Attach a Redis Semantic Cache before LLM inference to cache repeated queries.'
      });
    }

    // 4. Check for Single Point of Failure (SPOF) on high-throughput database without Read Replica or Cache
    nodes.filter(n => n.type === 'database').forEach(db => {
      const inbounds = inboundMap.get(db.id) || [];
      if (inbounds.length > 2 && caches.length === 0) {
        score -= 10;
        findings.push({
          id: `spof-db-${db.id}`,
          nodeId: db.id,
          severity: 'warning',
          title: `Potential Database Bottleneck: ${db.label}`,
          description: `Multiple services write directly to "${db.label}" without an asynchronous queue (Kafka) or read cache.`,
          remediation: 'Add a Redis cache layer for read queries or a Kafka event queue for write buffering.'
        });
      }
    });

    // 5. Insecure protocol check
    connections.forEach(c => {
      if (c.protocol && (c.protocol.toUpperCase() === 'HTTP' || c.protocol.toUpperCase() === 'PLAINTEXT')) {
        score -= 10;
        findings.push({
          id: `sec-insecure-proto-${c.id}`,
          severity: 'warning',
          title: `Unencrypted Protocol: Connection ${c.from} → ${c.to}`,
          description: `Connection uses unencrypted ${c.protocol}. Vulnerable to man-in-the-middle packet sniffing.`,
          remediation: 'Upgrade connection protocol to HTTPS, TLS 1.3, or mTLS.'
        });
      }
    });

    // Score clamp
    score = Math.max(10, Math.min(100, score));

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const warningCount = findings.filter(f => f.severity === 'warning').length;
    const infoCount = findings.filter(f => f.severity === 'info').length;

    return {
      score,
      criticalCount,
      warningCount,
      infoCount,
      findings
    };
  }
}
