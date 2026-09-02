/**
 * World-Class Enterprise Architecture Templates & Blueprints
 * Designed with best practices from OpenAI, Google Cloud, NVIDIA, and AWS.
 */

export const ARCHITECTURE_TEMPLATES = {
  'nvidia-gpu-ai': {
    id: 'nvidia-gpu-ai',
    name: 'NVIDIA H100 GPU AI Training & LLM Cluster',
    description: 'Enterprise generative AI cluster featuring 8x NVIDIA H100 SXM5 GPUs, vLLM distributed inference, Ray orchestrator, and semantic caching.',
    nodes: [
      { id: 'gw-ai', label: 'Cloudflare AI Gateway', type: 'cdn', x: 60, y: 260, status: 'healthy', cpu: 18, memory: 32, replicas: 2 },
      { id: 'ingress-ai', label: 'FastAPI High-Speed Ingress', type: 'gateway', x: 330, y: 260, status: 'healthy', cpu: 38, memory: 46, replicas: 3 },
      { id: 'auth-ai', label: 'OAuth2 / mTLS Tokenizer', type: 'auth', x: 330, y: 80, status: 'healthy', cpu: 12, memory: 20, replicas: 2 },
      { id: 'cache-sem', label: 'Redis Semantic Cache', type: 'cache', x: 610, y: 80, status: 'healthy', cpu: 25, memory: 55, replicas: 2 },
      { id: 'ray-orch', label: 'Ray Cluster Head Node', type: 'service', x: 610, y: 260, status: 'healthy', cpu: 52, memory: 65, replicas: 1 },
      { id: 'vllm-node', label: 'vLLM PagedAttention Workers', type: 'service', x: 890, y: 130, status: 'healthy', cpu: 78, memory: 85, replicas: 4 },
      { id: 'gpu-h100', label: 'NVIDIA 8x H100 80GB SXM5', type: 'gpu_cluster', x: 890, y: 360, status: 'healthy', cpu: 92, memory: 94, replicas: 2 },
      { id: 'vdb-1', label: 'Milvus Distributed Vector DB', type: 'vector_db', x: 1170, y: 130, status: 'healthy', cpu: 45, memory: 72, replicas: 3 },
      { id: 's3-ckpt', label: 'AWS S3 Checkpoint Storage', type: 'blob_store', x: 1170, y: 360, status: 'healthy', cpu: 15, memory: 22, replicas: 1 }
    ],
    connections: [
      { id: 'a1', from: 'gw-ai', to: 'ingress-ai', protocol: 'HTTP/3 Quic', latency: '4ms', throughput: '18.5k req/s' },
      { id: 'a2', from: 'ingress-ai', to: 'auth-ai', protocol: 'mTLS JWT', latency: '1ms', throughput: '14.2k req/s' },
      { id: 'a3', from: 'ingress-ai', to: 'cache-sem', protocol: 'Redis TCP', latency: '1ms', throughput: '12.0k req/s' },
      { id: 'a4', from: 'ingress-ai', to: 'ray-orch', protocol: 'gRPC Stream', latency: '2ms', throughput: '8.4k req/s' },
      { id: 'a5', from: 'ray-orch', to: 'vllm-node', protocol: 'ZeroMQ IPC', latency: '0.8ms', throughput: '6.2k req/s' },
      { id: 'a6', from: 'vllm-node', to: 'gpu-h100', protocol: 'NVLink 900 GB/s', latency: '0.1ms', throughput: '42.0k tok/s' },
      { id: 'a7', from: 'ray-orch', to: 'vdb-1', protocol: 'HNSW ANN', latency: '12ms', throughput: '2.4k req/s' },
      { id: 'a8', from: 'gpu-h100', to: 's3-ckpt', protocol: 'S3 Multi-part', latency: '28ms', throughput: '8.5 GB/s' }
    ]
  },

  'agent-swarm': {
    id: 'agent-swarm',
    name: 'Autonomous Multi-Agent RAG Swarm',
    description: 'Collaborative agentic swarm architecture with memory persistence, tool sandbox runner, and LLM reasoning mesh.',
    nodes: [
      { id: 'edge-gw', label: 'Agent WebMCP Ingress Gateway', type: 'gateway', x: 60, y: 260, status: 'healthy', cpu: 28, memory: 35, replicas: 2 },
      { id: 'swarm-lead', label: 'Swarm Orchestrator (LangGraph)', type: 'service', x: 330, y: 260, status: 'healthy', cpu: 65, memory: 72, replicas: 2 },
      { id: 'llm-reasoner', label: 'Claude 3.7 / GPT-4o Reasoner', type: 'ai_model', x: 610, y: 130, status: 'healthy', cpu: 85, memory: 90, replicas: 4 },
      { id: 'tool-sandbox', label: 'Isolated Code Execution Sandbox', type: 'serverless', x: 610, y: 360, status: 'healthy', cpu: 40, memory: 60, replicas: 6 },
      { id: 'agent-mem', label: 'Redis Ephemeral Session Cache', type: 'cache', x: 890, y: 130, status: 'healthy', cpu: 30, memory: 50, replicas: 2 },
      { id: 'vector-mem', label: 'Pinecone Long-Term Vector DB', type: 'vector_db', x: 890, y: 360, status: 'healthy', cpu: 42, memory: 68, replicas: 2 },
      { id: 'audit-db', label: 'PostgreSQL Trajectory DB', type: 'database', x: 1170, y: 260, status: 'healthy', cpu: 35, memory: 48, replicas: 2 }
    ],
    connections: [
      { id: 's1', from: 'edge-gw', to: 'swarm-lead', protocol: 'WebSockets', latency: '2ms', throughput: '4.8k msg/s' },
      { id: 's2', from: 'swarm-lead', to: 'llm-reasoner', protocol: 'SSE Stream', latency: '8ms', throughput: '1.2k req/s' },
      { id: 's3', from: 'swarm-lead', to: 'tool-sandbox', protocol: 'gRPC Pipe', latency: '5ms', throughput: '850 exec/s' },
      { id: 's4', from: 'swarm-lead', to: 'agent-mem', protocol: 'Redis Hash', latency: '1ms', throughput: '8.5k req/s' },
      { id: 's5', from: 'llm-reasoner', to: 'vector-mem', protocol: 'Vector ANN', latency: '14ms', throughput: '920 req/s' },
      { id: 's6', from: 'swarm-lead', to: 'audit-db', protocol: 'Async Batch', latency: '6ms', throughput: '1.2k log/s' }
    ]
  },

  ecommerce: {
    id: 'ecommerce',
    name: 'Enterprise Cloud Microservices',
    description: 'High-availability global e-commerce with multi-region CDN, Kafka queuing, and Stripe payment processing.',
    nodes: [
      { id: 'cdn-1', label: 'Cloudflare Global Edge CDN', type: 'cdn', x: 60, y: 260, status: 'healthy', cpu: 14, memory: 28, replicas: 3 },
      { id: 'gw-1', label: 'Kong Enterprise Gateway', type: 'gateway', x: 330, y: 260, status: 'healthy', cpu: 32, memory: 45, replicas: 3 },
      { id: 'auth-1', label: 'Auth0 / Okta IAM', type: 'auth', x: 330, y: 90, status: 'healthy', cpu: 18, memory: 22, replicas: 2 },
      { id: 'srv-order', label: 'Order Processing Service', type: 'service', x: 610, y: 160, status: 'healthy', cpu: 48, memory: 62, replicas: 4 },
      { id: 'srv-catalog', label: 'Catalog Service', type: 'service', x: 610, y: 360, status: 'healthy', cpu: 28, memory: 52, replicas: 3 },
      { id: 'cache-1', label: 'Redis ElastiCache Cluster', type: 'cache', x: 890, y: 360, status: 'healthy', cpu: 42, memory: 78, replicas: 3 },
      { id: 'queue-1', label: 'Amazon MSK (Kafka) Bus', type: 'queue', x: 890, y: 160, status: 'healthy', cpu: 38, memory: 55, replicas: 3 },
      { id: 'db-pg', label: 'Aurora PostgreSQL Multi-AZ', type: 'database', x: 1170, y: 160, status: 'healthy', cpu: 52, memory: 68, replicas: 2 },
      { id: 'pay-1', label: 'Stripe Payment Gateway', type: 'third_party', x: 1170, y: 340, status: 'healthy', cpu: 15, memory: 20, replicas: 1 }
    ],
    connections: [
      { id: 'c1', from: 'cdn-1', to: 'gw-1', protocol: 'HTTPS TLS 1.3', latency: '12ms', throughput: '12.4k req/s' },
      { id: 'c2', from: 'gw-1', to: 'auth-1', protocol: 'gRPC OAuth2', latency: '4ms', throughput: '8.2k req/s' },
      { id: 'c3', from: 'gw-1', to: 'srv-order', protocol: 'gRPC Internal', latency: '2ms', throughput: '4.8k req/s' },
      { id: 'c4', from: 'gw-1', to: 'srv-catalog', protocol: 'gRPC Internal', latency: '3ms', throughput: '7.6k req/s' },
      { id: 'c5', from: 'srv-catalog', to: 'cache-1', protocol: 'Redis TCP', latency: '1ms', throughput: '15.2k req/s' },
      { id: 'c6', from: 'srv-order', to: 'queue-1', protocol: 'Kafka Pub', latency: '5ms', throughput: '3.4k msg/s' },
      { id: 'c7', from: 'queue-1', to: 'db-pg', protocol: 'Postgres SQL', latency: '8ms', throughput: '2.1k w/s' },
      { id: 'c8', from: 'srv-order', to: 'pay-1', protocol: 'REST Webhook', latency: '85ms', throughput: '620 req/s' }
    ]
  },

  fintech: {
    id: 'fintech',
    name: 'FinTech Zero-Trust Payment Hub',
    description: 'Mission-critical financial infrastructure with HSM encryption, double-entry ledger, and real-time fraud ML detection.',
    nodes: [
      { id: 'cdn-fin', label: 'Cloudflare DDoS Shield & WAF', type: 'cdn', x: 60, y: 260, status: 'healthy', cpu: 18, memory: 30, replicas: 2 },
      { id: 'gw-fin', label: 'mTLS Banking Gateway', type: 'gateway', x: 330, y: 260, status: 'healthy', cpu: 44, memory: 52, replicas: 3 },
      { id: 'srv-fraud', label: 'Real-Time Fraud ML Model', type: 'ai_model', x: 610, y: 120, status: 'healthy', cpu: 82, memory: 88, replicas: 4 },
      { id: 'srv-trans', label: 'Transaction Router Core', type: 'service', x: 610, y: 360, status: 'healthy', cpu: 65, memory: 70, replicas: 4 },
      { id: 'queue-fin', label: 'Kafka Distributed Log', type: 'queue', x: 890, y: 360, status: 'healthy', cpu: 45, memory: 60, replicas: 3 },
      { id: 'auth-vault', label: 'HashiCorp Vault HSM', type: 'auth', x: 890, y: 120, status: 'healthy', cpu: 25, memory: 35, replicas: 2 },
      { id: 'db-ledger', label: 'Immutable SQL Ledger DB', type: 'database', x: 1170, y: 360, status: 'healthy', cpu: 58, memory: 75, replicas: 2 }
    ],
    connections: [
      { id: 'f1', from: 'cdn-fin', to: 'gw-fin', protocol: 'mTLS 1.3', latency: '15ms', throughput: '5.2k req/s' },
      { id: 'f2', from: 'gw-fin', to: 'srv-fraud', protocol: 'gRPC Scoring', latency: '18ms', throughput: '4.8k req/s' },
      { id: 'f3', from: 'gw-fin', to: 'srv-trans', protocol: 'Internal RPC', latency: '3ms', throughput: '4.7k req/s' },
      { id: 'f4', from: 'srv-trans', to: 'auth-vault', protocol: 'PKI Tokenize', latency: '6ms', throughput: '4.6k req/s' },
      { id: 'f5', from: 'srv-trans', to: 'queue-fin', protocol: 'Kafka Exact', latency: '4ms', throughput: '4.6k msg/s' },
      { id: 'f6', from: 'queue-fin', to: 'db-ledger', protocol: 'ACID Commit', latency: '14ms', throughput: '4.6k tx/s' }
    ]
  }
};
