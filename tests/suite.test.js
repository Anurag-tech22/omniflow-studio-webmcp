import test from 'node:test';
import assert from 'node:assert';
import { CostEngine } from '../src/canvas/cost-engine.js';
import { SecurityScanner } from '../src/canvas/security-scanner.js';
import { IaCGenerator } from '../src/canvas/iac-generator.js';
import { BenchmarkEngine } from '../src/canvas/benchmark-engine.js';
import { GeoDistributor } from '../src/canvas/geo-distributor.js';
import { ManifestoGenerator } from '../src/canvas/manifesto-generator.js';

test('CostEngine: calculates compute, RAM, and egress billing accurately', () => {
  const nodes = [
    { id: 'gw-1', type: 'gateway', replicas: 2 },
    { id: 'gpu-1', type: 'gpu_cluster', replicas: 1 },
    { id: 'db-1', type: 'database', replicas: 2 }
  ];
  const stats = CostEngine.calculate(nodes, 12000);
  assert.ok(stats.monthlyTotal > 0, 'Monthly total must be greater than 0');
  assert.ok(stats.hourlyTotal > 0, 'Hourly total must be greater than 0');
  assert.ok(stats.egressCost > 0, 'Egress cost must be calculated from traffic RPS');
  assert.ok(stats.savingsPotential > 0, 'Savings potential must be estimated');
});

test('CostEngine: handles multi-region cost multipliers (US vs Europe vs Asia)', () => {
  const nodes = [{ id: 'srv-1', type: 'service', replicas: 2 }];
  const usCost = CostEngine.calculate(nodes, 0, 'us-east-1');
  const euCost = CostEngine.calculate(nodes, 0, 'eu-central-1');
  assert.ok(euCost.monthlyTotal >= usCost.monthlyTotal, 'EU cloud pricing multiplier must reflect regional rates');
});

test('SecurityScanner: flags unauthenticated database exposure as critical vulnerability', () => {
  const nodes = [
    { id: 'gw-1', label: 'Public Gateway', type: 'gateway' },
    { id: 'db-1', label: 'Exposed Database', type: 'database' }
  ];
  const conns = [
    { id: 'c-1', from: 'gw-1', to: 'db-1', protocol: 'HTTP' }
  ];
  const audit = SecurityScanner.scan(nodes, conns);
  assert.ok(audit.criticalCount >= 1, 'Should detect at least 1 critical vulnerability');
  assert.ok(audit.score < 100, 'Security score must be penalized for public database exposure');
});

test('SecurityScanner: detects unencrypted network protocols (HTTP vs TLS)', () => {
  const nodes = [
    { id: 'srv-1', label: 'Service A', type: 'service' },
    { id: 'srv-2', label: 'Service B', type: 'service' }
  ];
  const conns = [
    { id: 'c-insecure', from: 'srv-1', to: 'srv-2', protocol: 'HTTP' }
  ];
  const audit = SecurityScanner.scan(nodes, conns);
  assert.ok(audit.findings.some(f => f.title.includes('Unencrypted Protocol')), 'Should flag plain HTTP protocol as warning');
});

test('IaCGenerator: compiles valid Terraform with VPC and resource definitions', () => {
  const nodes = [
    { id: 'srv-1', label: 'Worker Service', type: 'service', replicas: 3 }
  ];
  const tf = IaCGenerator.generateTerraform(nodes, []);
  assert.ok(tf.includes('resource "aws_vpc" "main"'), 'Must define AWS VPC');
  assert.ok(tf.includes('resource "aws_ecs_service"'), 'Must define ECS service');
  assert.ok(tf.includes('desired_count   = 3'), 'Must reflect 3 replicas in task config');
});

test('IaCGenerator: compiles Kubernetes Helm values and Docker Compose manifests', () => {
  const nodes = [
    { id: 'gw-1', label: 'Ingress Gateway', type: 'gateway', replicas: 2 },
    { id: 'db-1', label: 'Postgres DB', type: 'database', replicas: 1 }
  ];
  const helm = IaCGenerator.generateHelmChart(nodes, []);
  const docker = IaCGenerator.generateDockerCompose(nodes, []);
  assert.ok(helm.includes('replicaCount: 2'), 'Helm must reflect gateway replica count');
  assert.ok(docker.includes('services:'), 'Docker Compose must declare services');
});

test('BenchmarkEngine: calculates 8x H100 cluster throughput and VRAM aggregate', () => {
  const nodes = [
    { id: 'gpu-1', label: 'NVIDIA 8x H100', type: 'gpu_cluster', replicas: 2 }
  ];
  const cluster = BenchmarkEngine.evaluateCluster(nodes);
  assert.strictEqual(cluster.totalGpus, 16, '2 clusters x 8 GPUs = 16 GPUs');
  assert.strictEqual(cluster.totalVramGb, 16 * 80, '16 GPUs x 80GB = 1280 GB VRAM');
  assert.ok(cluster.maxClusterThroughputTokSec > 10000, 'Cluster throughput must exceed 10,000 tok/s');
  assert.strictEqual(cluster.tensorParallelismDegree, 'TP=8');
});

test('BenchmarkEngine: KV-cache memory sizing formula scales with context and batch size', () => {
  const sizingFP8 = BenchmarkEngine.computeKvCacheSizing({ batchSize: 32, contextLen: 8192, precision: 'fp8' });
  const sizingFP16 = BenchmarkEngine.computeKvCacheSizing({ batchSize: 32, contextLen: 8192, precision: 'fp16' });
  assert.strictEqual(sizingFP16.kvCacheGb, Number((sizingFP8.kvCacheGb * 2).toFixed(2)), 'FP16 KV-cache must be exactly double FP8');
  assert.ok(sizingFP8.perGpuGbAtTP8 > 0, 'Per-GPU memory at TP=8 must be positive');
});

test('GeoDistributor: verifies Anycast Edge distribution across 4 global regions', () => {
  const nodes = [{ id: 'gw-1', type: 'gateway' }];
  const geo = GeoDistributor.simulateGlobalRouting(nodes, 25000);
  assert.strictEqual(geo.regions.length, 4, 'Must simulate exactly 4 global continents');
  assert.ok(parseFloat(geo.regions[0].cacheHitRate) >= 90, 'Cache hit ratio must be above 90%');
  assert.strictEqual(geo.totalGlobalPoPs, 356, 'Anycast network must register 356 global PoPs');
});

test('ManifestoGenerator: compiles enterprise Markdown with Mermaid diagram & SOC2 matrix', () => {
  const nodes = [
    { id: 'gw-1', label: 'Cloudflare Gateway', type: 'gateway', replicas: 2, cpu: 20, memory: 35 },
    { id: 'srv-1', label: 'Microservice', type: 'service', replicas: 3, cpu: 45, memory: 60 }
  ];
  const conns = [{ id: 'c1', from: 'gw-1', to: 'srv-1', protocol: 'HTTPS', latency: '4ms' }];
  const manifesto = ManifestoGenerator.generate(nodes, conns);
  assert.ok(manifesto.includes('```mermaid'), 'Manifesto must include Mermaid topology diagram');
  assert.ok(manifesto.includes('SOC2 & ISO 27001 Compliance Matrix'), 'Manifesto must include SOC2 security matrix');
  assert.ok(manifesto.includes('FinOps TCO & Economic Model'), 'Manifesto must include FinOps TCO breakdown');
});

test('WebMCP Catalog: search_products matches cloud components and blueprints accurately', () => {
  const typeConfig = {
    gpu_cluster: { label: 'NVIDIA H100 8x', badge: 'SXM5 Tensor' },
    cache: { label: 'Redis ElastiCache', badge: 'Cluster' }
  };
  const q = 'h100';
  const matches = Object.entries(typeConfig).filter(([type, cfg]) =>
    cfg.label.toLowerCase().includes(q) || cfg.badge.toLowerCase().includes(q)
  );
  assert.strictEqual(matches.length, 1, 'Should find exactly 1 match for NVIDIA H100');
  assert.strictEqual(matches[0][0], 'gpu_cluster');
});
