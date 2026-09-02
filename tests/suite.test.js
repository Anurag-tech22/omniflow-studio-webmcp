import test from 'node:test';
import assert from 'node:assert';
import { CostEngine } from '../src/canvas/cost-engine.js';
import { SecurityScanner } from '../src/canvas/security-scanner.js';
import { IaCGenerator } from '../src/canvas/iac-generator.js';
import { BenchmarkEngine } from '../src/canvas/benchmark-engine.js';
import { GeoDistributor } from '../src/canvas/geo-distributor.js';

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

test('IaCGenerator: compiles valid Terraform with VPC and resource definitions', () => {
  const nodes = [
    { id: 'srv-1', label: 'Worker Service', type: 'service', replicas: 3 }
  ];
  const tf = IaCGenerator.generateTerraform(nodes, []);
  assert.ok(tf.includes('resource "aws_vpc" "main"'), 'Must define AWS VPC');
  assert.ok(tf.includes('resource "aws_ecs_service"'), 'Must define ECS service');
  assert.ok(tf.includes('desired_count   = 3'), 'Must reflect 3 replicas in task config');
});

test('BenchmarkEngine: calculates 8x H100 cluster throughput and VRAM aggregate', () => {
  const nodes = [
    { id: 'gpu-1', label: 'NVIDIA 8x H100', type: 'gpu_cluster', replicas: 2 }
  ];
  const cluster = BenchmarkEngine.evaluateCluster(nodes);
  assert.strictEqual(cluster.totalGpus, 16, '2 clusters x 8 GPUs = 16 GPUs');
  assert.strictEqual(cluster.totalVramGb, 16 * 80, '16 GPUs x 80GB = 1280 GB VRAM');
  assert.ok(cluster.maxClusterThroughputTokSec > 10000, 'Cluster throughput must exceed 10,000 tok/s');
});

test('GeoDistributor: verifies Anycast Edge distribution across 4 global regions', () => {
  const nodes = [{ id: 'gw-1', type: 'gateway' }];
  const geo = GeoDistributor.simulateGlobalRouting(nodes, 25000);
  assert.strictEqual(geo.regions.length, 4, 'Must simulate exactly 4 global continents');
  assert.ok(parseFloat(geo.regions[0].cacheHitRate) >= 90, 'Cache hit ratio must be above 90%');
  assert.strictEqual(geo.totalGlobalPoPs, 356, 'Anycast network must register 356 global PoPs');
});
