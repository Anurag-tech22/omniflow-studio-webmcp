/**
 * FinOps Real-Time Cloud Cost Estimator Engine (Enterprise Edition)
 * Computes realistic multi-cloud expenditure including compute instances,
 * dynamic data transfer egress, vector indexing, and Spot/Reserved savings models.
 */

export class CostEngine {
  static REGION_MULTIPLIERS = {
    'us-east-1': 1.0,
    'us-west-2': 1.02,
    'eu-central-1': 1.15,
    'ap-northeast-1': 1.22
  };

  static PRICING = {
    gateway: { baseCost: 18.0, name: 'AWS API Gateway / Cloudflare Edge', unit: 'per million req', spotEligible: false },
    service: { baseCost: 48.0, name: 'AWS ECS Fargate (2 vCPU, 4GB RAM)', unit: 'per task/mo', spotEligible: true, spotDiscount: 0.65 },
    serverless: { baseCost: 12.0, name: 'AWS Lambda / Cloudflare Workers', unit: 'per 10M executions', spotEligible: false },
    ai_model: { baseCost: 280.0, name: 'Claude 3.7 / GPT-4o Inference API', unit: 'per 50M tokens', spotEligible: false },
    gpu_cluster: { baseCost: 1850.0, name: 'NVIDIA 8x H100 Tensor Core Cluster (p5.48xlarge)', unit: 'per instance/mo', spotEligible: true, spotDiscount: 0.60 },
    database: { baseCost: 165.0, name: 'Amazon Aurora Multi-AZ PostgreSQL (db.r6g.xlarge)', unit: 'per mo', spotEligible: false },
    vector_db: { baseCost: 120.0, name: 'Managed Milvus / Pinecone Pod (Enterprise Index)', unit: 'per mo', spotEligible: false },
    cache: { baseCost: 65.0, name: 'AWS ElastiCache Redis (cache.r6g.large Multi-AZ)', unit: 'per mo', spotEligible: false },
    queue: { baseCost: 110.0, name: 'Amazon MSK (Managed Kafka 3-Broker Cluster)', unit: 'per mo', spotEligible: false },
    blob_store: { baseCost: 23.0, name: 'Amazon S3 Standard (1 TB + Transfer)', unit: 'per mo', spotEligible: false },
    auth: { baseCost: 35.0, name: 'Auth0 / Okta Enterprise Identity Pool', unit: 'per 5k MAU', spotEligible: false },
    third_party: { baseCost: 15.0, name: 'Stripe API / Webhook Infrastructure', unit: 'per 10k events', spotEligible: false },
    cdn: { baseCost: 20.0, name: 'Cloudflare Enterprise CDN & WAF Tier', unit: 'per mo', spotEligible: false }
  };

  /**
   * Calculate detailed cloud cost breakdown
   * @param {Array} nodes Architecture nodes
   * @param {number} trafficRps Current traffic load in RPS
   * @param {string} region Target deployment region
   * @param {boolean} spotEnabled Whether Spot optimization is simulated
   */
  static calculate(nodes, trafficRps = 0, region = 'us-east-1', spotEnabled = false) {
    if (!nodes || nodes.length === 0) {
      return {
        monthlyTotal: 0,
        hourlyTotal: 0,
        breakdown: [],
        egressCost: 0,
        region,
        savingsPotential: 0
      };
    }

    const regionMult = this.REGION_MULTIPLIERS[region] || 1.0;
    let computeMonthly = 0;
    const breakdown = [];

    nodes.forEach(node => {
      const pricing = this.PRICING[node.type] || this.PRICING.service;
      const replicas = node.replicas || 1;
      let unitCost = pricing.baseCost * regionMult;

      if (spotEnabled && pricing.spotEligible) {
        unitCost = unitCost * (1 - pricing.spotDiscount);
      }

      const nodeCost = unitCost * replicas;
      computeMonthly += nodeCost;

      breakdown.push({
        nodeId: node.id,
        label: node.label,
        type: node.type,
        resourceName: pricing.name,
        replicas,
        monthlyCost: Math.round(nodeCost),
        unit: pricing.unit,
        spotDiscountApplied: spotEnabled && pricing.spotEligible
      });
    });

    // Dynamic Network Egress: Average 2.5 KB per request * 30 days * $0.08 / GB
    const monthlyGigabytes = (trafficRps * 2.5 * 3600 * 24 * 30) / (1024 * 1024);
    const egressCost = Math.round(monthlyGigabytes * 0.08);

    const monthlyTotal = Math.round(computeMonthly + egressCost);
    const hourlyTotal = Number((monthlyTotal / 730).toFixed(2));
    const savingsPotential = Math.round(monthlyTotal * 0.38);

    return {
      monthlyTotal,
      hourlyTotal,
      computeCost: Math.round(computeMonthly),
      egressCost,
      region,
      savingsPotential,
      breakdown
    };
  }
}
