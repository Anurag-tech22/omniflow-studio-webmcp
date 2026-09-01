/**
 * FinOps Real-Time Cloud Cost Estimator Engine
 * Calculates estimated monthly cloud expenditure based on industry AWS/GCP/NVIDIA pricing.
 */

export class CostEngine {
  static PRICING = {
    gateway: { baseCost: 18.0, name: 'AWS API Gateway / Cloudflare Edge', unit: 'per million req' },
    service: { baseCost: 48.0, name: 'AWS ECS Fargate (2 vCPU, 4GB)', unit: 'per task/mo' },
    serverless: { baseCost: 12.0, name: 'AWS Lambda / Cloudflare Workers', unit: 'per 10M executions' },
    ai_model: { baseCost: 280.0, name: 'Claude 3.7 / GPT-4o Inference API', unit: 'per 50M tokens' },
    gpu_cluster: { baseCost: 1850.0, name: 'NVIDIA 8x H100 Tensor Core Cluster', unit: 'per instance/mo' },
    database: { baseCost: 165.0, name: 'Amazon Aurora Multi-AZ PostgreSQL (db.r6g.xlarge)', unit: 'per mo' },
    vector_db: { baseCost: 120.0, name: 'Managed Milvus / Pinecone Pod (Enterprise)', unit: 'per mo' },
    cache: { baseCost: 65.0, name: 'AWS ElastiCache Redis (cache.r6g.large Multi-AZ)', unit: 'per mo' },
    queue: { baseCost: 110.0, name: 'Amazon MSK (Managed Kafka 3-Broker Cluster)', unit: 'per mo' },
    blob_store: { baseCost: 23.0, name: 'Amazon S3 Standard (1 TB + Transfer)', unit: 'per mo' },
    auth: { baseCost: 35.0, name: 'Auth0 / Okta Enterprise Identity Pool', unit: 'per 5k MAU' },
    third_party: { baseCost: 15.0, name: 'Stripe API / Webhook Infrastructure', unit: 'per 10k events' },
    cdn: { baseCost: 20.0, name: 'Cloudflare Enterprise CDN & WAF Tier', unit: 'per mo' }
  };

  static calculate(nodes) {
    if (!nodes || nodes.length === 0) {
      return {
        monthlyTotal: 0,
        hourlyTotal: 0,
        breakdown: [],
        savingsPotential: 0
      };
    }

    let monthlyTotal = 0;
    const breakdown = [];

    nodes.forEach(node => {
      const pricing = this.PRICING[node.type] || this.PRICING.service;
      const replicas = node.replicas || 1;
      const nodeCost = pricing.baseCost * replicas;
      monthlyTotal += nodeCost;

      breakdown.push({
        nodeId: node.id,
        label: node.label,
        type: node.type,
        resourceName: pricing.name,
        replicas,
        monthlyCost: nodeCost,
        unit: pricing.unit
      });
    });

    const hourlyTotal = Number((monthlyTotal / 730).toFixed(2));
    const savingsPotential = Math.round(monthlyTotal * 0.38); // 38% average savings through caching/spot

    return {
      monthlyTotal: Math.round(monthlyTotal),
      hourlyTotal,
      savingsPotential,
      breakdown
    };
  }
}
