/**
 * Curated Architecture Templates & Blueprints
 */

export const ARCHITECTURE_TEMPLATES = {
  ecommerce: {
    id: 'ecommerce',
    name: 'Enterprise E-Commerce Microservices',
    description: 'High-availability microservice architecture with caching, queuing, and secure payment processing.',
    nodes: [
      { id: 'cdn-1', label: 'Cloudflare CDN', type: 'cdn', x: 80, y: 220, status: 'healthy', cpu: 14, memory: 28 },
      { id: 'gw-1', label: 'Kong API Gateway', type: 'gateway', x: 260, y: 220, status: 'healthy', cpu: 32, memory: 45 },
      { id: 'auth-1', label: 'Auth0 IAM Provider', type: 'auth', x: 260, y: 70, status: 'healthy', cpu: 18, memory: 22 },
      { id: 'srv-order', label: 'Order Processing Service', type: 'service', x: 480, y: 150, status: 'healthy', cpu: 48, memory: 62 },
      { id: 'srv-catalog', label: 'Catalog Service', type: 'service', x: 480, y: 310, status: 'healthy', cpu: 28, memory: 52 },
      { id: 'cache-1', label: 'Redis Cluster (Cache)', type: 'cache', x: 700, y: 310, status: 'healthy', cpu: 42, memory: 78 },
      { id: 'queue-1', label: 'Kafka Event Bus', type: 'queue', x: 700, y: 150, status: 'healthy', cpu: 38, memory: 55 },
      { id: 'db-pg', label: 'PostgreSQL (Orders DB)', type: 'database', x: 920, y: 150, status: 'healthy', cpu: 52, memory: 68 },
      { id: 'pay-1', label: 'Stripe Payment Gateway', type: 'third_party', x: 920, y: 280, status: 'healthy', cpu: 15, memory: 20 }
    ],
    connections: [
      { id: 'c1', from: 'cdn-1', to: 'gw-1', protocol: 'HTTPS', latency: '12ms', throughput: '12.4k req/s' },
      { id: 'c2', from: 'gw-1', to: 'auth-1', protocol: 'gRPC/OAuth2', latency: '4ms', throughput: '8.2k req/s' },
      { id: 'c3', from: 'gw-1', to: 'srv-order', protocol: 'gRPC', latency: '2ms', throughput: '4.8k req/s' },
      { id: 'c4', from: 'gw-1', to: 'srv-catalog', protocol: 'gRPC', latency: '3ms', throughput: '7.6k req/s' },
      { id: 'c5', from: 'srv-catalog', to: 'cache-1', protocol: 'Redis TCP', latency: '1ms', throughput: '15.2k req/s' },
      { id: 'c6', from: 'srv-order', to: 'queue-1', protocol: 'Kafka Pub', latency: '5ms', throughput: '3.4k msg/s' },
      { id: 'c7', from: 'queue-1', to: 'db-pg', protocol: 'PostgreSQL', latency: '8ms', throughput: '2.1k w/s' },
      { id: 'c8', from: 'srv-order', to: 'pay-1', protocol: 'REST Webhook', latency: '85ms', throughput: '620 req/s' }
    ]
  },

  'rag-pipeline': {
    id: 'rag-pipeline',
    name: 'AI RAG & LLM Engine Pipeline',
    description: 'Modern generative AI inference pipeline with semantic caching, vector retrieval, and fast embeddings.',
    nodes: [
      { id: 'gw-ai', label: 'FastAPI AI Gateway', type: 'gateway', x: 120, y: 220, status: 'healthy', cpu: 35, memory: 40 },
      { id: 'auth-ai', label: 'API Key Rate Limiter', type: 'auth', x: 120, y: 70, status: 'healthy', cpu: 12, memory: 18 },
      { id: 'srv-embed', label: 'Embedding Service (BGE-M3)', type: 'service', x: 360, y: 140, status: 'healthy', cpu: 75, memory: 82 },
      { id: 'cache-sem', label: 'Redis Semantic Cache', type: 'cache', x: 360, y: 310, status: 'healthy', cpu: 22, memory: 48 },
      { id: 'vdb-1', label: 'Milvus Vector DB', type: 'vector_db', x: 620, y: 140, status: 'healthy', cpu: 62, memory: 86 },
      { id: 'llm-1', label: 'LLM Orchestrator (Claude 3.7)', type: 'ai_model', x: 620, y: 310, status: 'healthy', cpu: 88, memory: 92 },
      { id: 's3-docs', label: 'S3 Document Store', type: 'blob_store', x: 880, y: 140, status: 'healthy', cpu: 10, memory: 15 },
      { id: 'db-logs', label: 'Prompt & Evaluation DB', type: 'database', x: 880, y: 310, status: 'healthy', cpu: 30, memory: 42 }
    ],
    connections: [
      { id: 'r1', from: 'gw-ai', to: 'auth-ai', protocol: 'JWT/mTLS', latency: '1ms', throughput: '1.8k req/s' },
      { id: 'r2', from: 'gw-ai', to: 'cache-sem', protocol: 'Redis Hash', latency: '2ms', throughput: '1.6k req/s' },
      { id: 'r3', from: 'gw-ai', to: 'srv-embed', protocol: 'gRPC Streaming', latency: '15ms', throughput: '950 req/s' },
      { id: 'r4', from: 'srv-embed', to: 'vdb-1', protocol: 'ANN HNSW Search', latency: '22ms', throughput: '920 req/s' },
      { id: 'r5', from: 'vdb-1', to: 's3-docs', protocol: 'S3 GetObject', latency: '45ms', throughput: '420 req/s' },
      { id: 'r6', from: 'vdb-1', to: 'llm-1', protocol: 'Context Injection', latency: '8ms', throughput: '680 req/s' },
      { id: 'r7', from: 'llm-1', to: 'db-logs', protocol: 'Async Telemetry', latency: '12ms', throughput: '680 log/s' }
    ]
  },

  fintech: {
    id: 'fintech',
    name: 'FinTech Payment & Settlement Hub',
    description: 'Zero-trust financial architecture with HSM encryption, double-entry ledger, and Kafka streaming.',
    nodes: [
      { id: 'cdn-fin', label: 'DDoS Shield / WAF', type: 'cdn', x: 80, y: 220, status: 'healthy', cpu: 18, memory: 30 },
      { id: 'gw-fin', label: 'mTLS Banking Gateway', type: 'gateway', x: 260, y: 220, status: 'healthy', cpu: 44, memory: 52 },
      { id: 'srv-fraud', label: 'Real-Time Fraud ML Model', type: 'ai_model', x: 480, y: 110, status: 'healthy', cpu: 82, memory: 88 },
      { id: 'srv-trans', label: 'Transaction Router', type: 'service', x: 480, y: 280, status: 'healthy', cpu: 65, memory: 70 },
      { id: 'queue-fin', label: 'Kafka Distributed Log', type: 'queue', x: 700, y: 280, status: 'healthy', cpu: 45, memory: 60 },
      { id: 'auth-vault', label: 'HashiCorp Vault HSM', type: 'auth', x: 700, y: 110, status: 'healthy', cpu: 25, memory: 35 },
      { id: 'db-ledger', label: 'Double-Entry SQL Ledger', type: 'database', x: 920, y: 280, status: 'healthy', cpu: 58, memory: 75 }
    ],
    connections: [
      { id: 'f1', from: 'cdn-fin', to: 'gw-fin', protocol: 'TLS 1.3', latency: '15ms', throughput: '5.2k req/s' },
      { id: 'f2', from: 'gw-fin', to: 'srv-fraud', protocol: 'gRPC Scoring', latency: '18ms', throughput: '4.8k req/s' },
      { id: 'f3', from: 'gw-fin', to: 'srv-trans', protocol: 'Internal RPC', latency: '3ms', throughput: '4.7k req/s' },
      { id: 'f4', from: 'srv-trans', to: 'auth-vault', protocol: 'PKI Tokenize', latency: '6ms', throughput: '4.6k req/s' },
      { id: 'f5', from: 'srv-trans', to: 'queue-fin', protocol: 'Kafka Exactly-Once', latency: '4ms', throughput: '4.6k msg/s' },
      { id: 'f6', from: 'queue-fin', to: 'db-ledger', protocol: 'ACID Batch Commit', latency: '14ms', throughput: '4.6k tx/s' }
    ]
  },

  streaming: {
    id: 'streaming',
    name: 'Real-Time Event Streaming & Analytics',
    description: 'Ultra-low latency streaming cluster handling WebSockets, ClickHouse OLAP, and distributed processing.',
    nodes: [
      { id: 'gw-ws', label: 'WebSocket Edge Cluster', type: 'gateway', x: 100, y: 200, status: 'healthy', cpu: 55, memory: 68 },
      { id: 'srv-worker', label: 'Stream Consumer Worker', type: 'serverless', x: 360, y: 200, status: 'healthy', cpu: 65, memory: 75 },
      { id: 'queue-stream', label: 'Kafka Ingestion Pipeline', type: 'queue', x: 600, y: 200, status: 'healthy', cpu: 70, memory: 80 },
      { id: 'db-clickhouse', label: 'ClickHouse Columnar OLAP', type: 'database', x: 860, y: 120, status: 'healthy', cpu: 85, memory: 90 },
      { id: 'cache-realtime', label: 'Redis Pub/Sub & Counters', type: 'cache', x: 860, y: 290, status: 'healthy', cpu: 45, memory: 65 }
    ],
    connections: [
      { id: 's1', from: 'gw-ws', to: 'srv-worker', protocol: 'WS Frame Pipe', latency: '2ms', throughput: '45.0k msg/s' },
      { id: 's2', from: 'srv-worker', to: 'queue-stream', protocol: 'High-Throughput Batch', latency: '4ms', throughput: '45.0k msg/s' },
      { id: 's3', from: 'queue-stream', to: 'db-clickhouse', protocol: 'Vectorized Bulk Insert', latency: '10ms', throughput: '40.0k row/s' },
      { id: 's4', from: 'queue-stream', to: 'cache-realtime', protocol: 'Redis Pipeline', latency: '3ms', throughput: '15.0k ops/s' }
    ]
  }
};
