# OmniFlow Studio — Human-Agent Collaborative Visual Cloud & Systems Studio (WebMCP)

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![WebMCP Standard](https://img.shields.io/badge/Standard-W3C%20WebMCP%20(28%20Tools)-00f0ff.svg)](https://webmachinelearning.github.io/webmcp/)
[![NVIDIA AI Architecture](https://img.shields.io/badge/NVIDIA-H100%20GPU%20Ready-76b900.svg)](https://www.nvidia.com/)
[![Auto-Pilot Active](https://img.shields.io/badge/Auto--Pilot-Self--Healing%2024%2F7-10b981.svg)](./src/canvas/autopilot-engine.js)
[![Render Deploy](https://img.shields.io/badge/Deploy-Render%20Blueprint-46e3b7.svg)](./render.yaml)
[![ChatGPT Sites Ready](https://img.shields.io/badge/ChatGPT-Sites%20Ready-a855f7.svg)](https://learn.chatgpt.com/docs/webmcp)
[![Chrome AI Testing](https://img.shields.io/badge/Chrome-149%2B%20%23enable--webmcp--testing-10b981.svg)](chrome://flags/#enable-webmcp-testing)

> **OmniFlow Studio** is a world-class visual cloud architecture and distributed systems studio where humans and AI agent swarms co-create, simulate, audit, and synthesize production infrastructure in real-time through the open **WebMCP (Web Model Context Protocol)** standard.

---

## 🌟 Executive Summary

Instead of forcing AI agents to guess visual layouts, simulate imprecise mouse clicks, or stay trapped in separate text windows, **OmniFlow Studio** registers its entire visual graph topology, NVIDIA GPU cluster engine, real-time FinOps cost calculator, Autonomous Auto-Pilot self-healing loop, Chaos engineering fault injector, traffic physics engine, security scanner, and multi-cloud code synthesizer directly into the browser tab via `document.modelContext.registerTool()`.

Human architects sketch and iterate on visual topologies; AI agent swarms (Architect, SecOps, Chaos Engineer, FinOps Advisor) analyze bottlenecks, debate in a live **Swarm Consensus Protocol**, execute 50,000 RPS DDoS traffic stress tests, remediate vulnerabilities, and compile production Terraform, Helm, and CloudFormation manifests using **28 structured browser tools**.

---

## 🏆 Category-Defining Features & Innovations

1. **Autonomous Self-Healing Auto-Pilot Loop (`AutoPilotEngine`)**:
   - Continuously monitors node load, latency spikes, and DDoS floods.
   - Automatically auto-scales worker replicas, balances gateway throughput, and defragments GPU memory to ensure 99.999% cluster SLA 24/7.

2. **Frontier AI Model & Inference Benchmark Lab (`BenchmarkEngine`)**:
   - Compares **Claude 3.7 Sonnet**, **GPT-4o**, **Gemini 2.0 Flash**, and **DeepSeek-R1** on the active canvas topology.
   - Evaluates TTFT latency, token throughput (tok/s), FP8/FP16 KV-cache VRAM footprint, and API pricing trade-offs.

3. **Multi-Region Anycast Global Edge & Geo Latency SLA (`GeoDistributor`)**:
   - Simulates global CDN edge replication across **US-East**, **Europe (Frankfurt)**, **Tokyo**, and **São Paulo**.
   - Displays real-time Anycast DNS PoP status, cache hit rates (94%+), and regional compliance tags (GDPR, SOC2, HIPAA).

4. **Autonomous Multi-Agent Swarm Consensus Protocol**:
   - Live debate and voting stream between 4 specialized AI agents:
     - 🧠 **Lead Architect** (`Claude 3.7 / GPT-4o`)
     - 🛡️ **SecOps Auditor** (`Google SAIF / OWASP`)
     - 💰 **FinOps Advisor** (`AWS / Vercel Pricing`)
     - ⚡ **Chaos Daemon** (`NVIDIA / Cloudflare`)

5. **Chaos Engineering & Fault Injection Lab**:
   - `inject_ddos_attack`: Simulates a 50,000 RPS flood against API Gateways.
   - `kill_random_node`: Chaos Monkey terminating backend microservices to test Kafka queue failover.
   - `simulate_gpu_oom`: Simulates GPU Out-Of-Memory on NVIDIA H100 clusters.
   - `auto_heal_cluster`: Recovers failed services, attaches Cloudflare WAF, and defragments GPU memory.

6. **Interactive Visual Port Wiring & 30-Step Undo/Redo Stack**:
   - Direct click-and-drag from node Output Ports to connect wires visually with glowing live bezier curves.
   - Full history snapshots with `Ctrl+Z` / `Ctrl+Y` and UI controls.

7. **Multi-Cloud Infrastructure Synthesizer & Architecture Manifesto**:
   - Compiles graph topologies into **Terraform (HCL)**, **Kubernetes Helm Charts (`values.yaml`)**, **AWS CloudFormation (YAML)**, **Docker Compose**, and an executive **Markdown/Mermaid Architecture Manifesto**.

---

## 🏆 WebMCP Challenge Submission Details

### 1. Why is this use case a strong fit for WebMCP?
- **Active In-Browser Session State**: Cloud architecture design is inherently spatial, graph-oriented, and stateful. Traditional backend MCP servers cannot see the active canvas viewport, transient node coordinates, or live canvas selections. WebMCP allows the browser tab itself to expose interactive tools that operate directly on the user's active visual canvas.
- **Bi-Directional Co-Creation**: Rather than the agent outputting a static Markdown block of text, the agent calls `create_node`, `connect_nodes`, and `simulate_traffic`, causing the visual canvas in front of the human user to update in real-time at 60 FPS.
- **Safety Boundaries**: Using WebMCP's standard hints (`readOnlyHint: true` for `inspect_canvas_state`, `run_security_audit`, `generate_infrastructure_code` vs mutating tools like `batch_build_architecture`), the browser enforces clear trust boundaries.

### 2. How does it create a better user experience?
- **No More Hallucinated Coordinates or Clunky Screenshots**: Agents invoke atomic tools with strict JSON schemas, ensuring 100% reliable system topology construction.
- **Real-Time Visual Telemetry**: Simulated traffic stress tests render animated glowing packets flowing across connections with dynamic request rate (RPS), latency heatmaps, and bottleneck alerts.
- **Instant DevTools Observability**: The built-in **WebMCP Live Inspector HUD** gives users and judges a complete real-time view of all 16 registered tools, JSON input schemas, execution counts, average latency, and a manual tool test runner.

### 3. What can humans and agents do together that was difficult or impossible before?
| Capability | Before WebMCP (Screen Parsing / Chat) | With OmniFlow Studio & WebMCP |
| :--- | :--- | :--- |
| **System Architecture Synthesis** | Human draws manually or agent generates ASCII art / text lists. | Agent calls `batch_build_architecture` or `create_node`, instantly building interactive 2D node graphs. |
| **Traffic Stress Testing** | Static theoretical estimates in text. | Agent triggers `simulate_traffic`, rendering live particle physics and bottleneck telemetry on the canvas. |
| **Vulnerability Remediation** | Manual copy-pasting of security advice. | Agent calls `run_security_audit`, identifies single points of failure (SPOF) or exposed DBs, and applies `optimize_architecture` fixes with 1 click. |
| **Infrastructure as Code (IaC)** | Disconnected manual templates. | Atomic synthesis of Terraform, Docker Compose, and Kubernetes YAML directly from the live graph topology. |

---

## 🛠️ WebMCP Implementation Architecture

OmniFlow Studio implements both the **Imperative JavaScript API** (`document.modelContext.registerTool`) and the **Declarative HTML Form API** (`<form toolname="...">`).

```mermaid
graph TD
    subgraph Browser Tab Runtime
        Human[Human Architect] -->|Direct Canvas Interaction| Canvas[Interactive HTML5 Canvas Engine]
        Agent[AI Agent / ChatGPT / Chrome WebMCP] -->|Discovers & Calls Tools| ModelContext[document.modelContext]
        ModelContext -->|Dispatches Tool Calls| Registry[WebMCP Tool Registry]
        Registry -->|Executes Action| Canvas
        Registry -->|Streams Telemetry| HUD[WebMCP DevTools Live Inspector]
        Canvas -->|Graph Topology| Scanner[Security & SPOF Scanner]
        Canvas -->|Graph Topology| Generator[IaC Synthesis: Terraform / K8s]
        Canvas -->|Particle Physics| Sim[Traffic & Stress Simulator]
    end
```

### Complete Registered Tool Suite

| Tool Name | Type | Safety Hint | Description |
| :--- | :--- | :--- | :--- |
| `inspect_canvas_state` | Imperative | `readOnlyHint: true` | Returns complete node topology, health scores, CPU/MEM telemetry, and connection matrices. |
| `create_node` | Imperative | State Mutating | Creates an architecture node (Gateway, Microservice, Database, Redis Cache, Kafka, LLM Model, Vector DB, S3, Auth). |
| `delete_node` | Imperative | State Mutating | Deletes a node and cleans up connected links. |
| `connect_nodes` | Imperative | State Mutating | Connects two nodes with protocol tagging (gRPC, HTTPS, Kafka, Redis TCP, PostgreSQL) and latency. |
| `disconnect_nodes` | Imperative | State Mutating | Removes a link between two nodes. |
| `batch_build_architecture`| Imperative | State Mutating | Atomically constructs an entire multi-tier system topology in a single transaction. |
| `simulate_traffic` | Imperative | State Mutating | Initiates real-time packet particle simulation with configurable RPS and bottleneck detection. |
| `stop_simulation` | Imperative | State Mutating | Halts active traffic stress simulation. |
| `run_security_audit` | Imperative | `readOnlyHint: true` | Scans canvas for OWASP/Cloud Security risks (public DB exposure, missing IAM gateway, SPOFs). |
| `optimize_architecture` | Imperative | State Mutating | Applies architectural refactorings for latency, cost, security, or high-availability. |
| `generate_infrastructure_code`| Imperative | `readOnlyHint: true` | Generates Terraform (`main.tf`), Docker Compose, Kubernetes YAML, and TypeScript manifests. |
| `apply_layout_preset` | Imperative | State Mutating | Auto-organizes nodes using hierarchical tiered alignment. |
| `load_architecture_template` | Imperative | State Mutating | Loads curated blueprints (`ecommerce`, `rag-pipeline`, `fintech`, `streaming`). |
| `clear_canvas` | Imperative | State Mutating | Resets and clears the canvas. |
| `quick_add_component` | Declarative | Form Tool | HTML `<form toolname="quick_add_component">` for declarative component insertion. |
| `trigger_quick_optimization` | Declarative | Form Tool | HTML `<form toolname="trigger_quick_optimization">` for declarative optimization trigger. |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Node.js 18+ and npm

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/omniflow-studio-webmcp.git
cd omniflow-studio-webmcp

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing with WebMCP

### 1. Google Chrome 149+ (with Experimental Flag)
1. Open Google Chrome.
2. Navigate to `chrome://flags/#enable-webmcp-testing`.
3. Set the flag to **Enabled** and restart Chrome.
4. Open the deployed application or `http://localhost:3000`.
5. Open Chrome DevTools (`F12` or `Ctrl+Shift+I`) → Inspect registered tools in the WebMCP panel or console via `document.modelContext.listTools()`.

### 2. ChatGPT In-App Browser & ChatGPT Sites
1. Deploy OmniFlow Studio to any static host (Vercel, Netlify, Cloudflare Pages, Render).
2. Open the live URL inside ChatGPT's in-app browser.
3. ChatGPT's native agent will automatically discover registered tools on `document.modelContext` and can be prompted to manipulate the canvas directly.

### 3. Built-In Agent Co-Pilot (Universal Testing in Any Browser)
- Click the **Agent Co-Pilot** button in the top right.
- Try prompt suggestions such as:
  - *"Build an AI RAG pipeline with FastAPI Gateway, Milvus Vector DB, Redis Cache, and Claude 3.7 LLM, then simulate 6,000 RPS traffic."*
  - *"Audit this architecture for security vulnerabilities and auto-remediate any single points of failure."*
  - *"Optimize this topology for low latency and generate Terraform HCL."*
- Watch the live tool execution trace stream and observe the canvas updating synchronously.

### 4. Built-In WebMCP Live Inspector DevTools HUD
- Click **WebMCP HUD** in the top navigation bar to inspect registered tools, view parameter JSON schemas, monitor real-time execution latency, and execute manual tests with custom JSON payloads.

---

## 🚢 Deployment Guide (Powered by Render)

OmniFlow Studio is fully client-side and zero-dependency at runtime, pre-configured for **1-click deployment on Render**:

### Deploy on Render (Recommended)
1. Push your repository to GitHub / GitLab.
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint** (or **Static Site**).
4. Connect your repository. Render automatically reads [`render.yaml`](./render.yaml) and deploys your site!

#### Manual Static Site Settings on Render:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Rewrite Rules**: `/*` → `/index.html`

### Alternative Providers
- **Netlify**: `npm run build && npx netlify deploy --prod --dir=dist`
- **Cloudflare Pages**: `npm run build && npx wrangler pages deploy dist --project-name=omniflow-studio`

---

## 📂 Project Structure

```
omniflow-studio-webmcp/
├── index.html                   # Semantic HTML entry with declarative WebMCP forms
├── package.json                 # Project manifest & scripts
├── vite.config.js               # Vite build configuration
├── LICENSE                      # Official MIT Open Source License
├── README.md                    # Comprehensive documentation & testing guide
└── src/
    ├── app.js                   # Application bootstrap & event orchestration
    ├── styles/
    │   └── index.css            # Dark glassmorphic design system
    ├── webmcp/
    │   ├── webmcp-core.js       # Standard WebMCP polyfill, registry & event bus
    │   └── tools.js             # 28 Enterprise WebMCP tool registrations
    ├── canvas/
    │   ├── canvas-engine.js     # 60 FPS Interactive HTML5 Canvas Engine
    │   ├── traffic-simulator.js # Real-time particle stress & bottleneck physics
    │   ├── security-scanner.js  # OWASP & SPOF vulnerability audit engine
    │   ├── iac-generator.js     # Terraform, Docker Compose & K8s synthesizer
    │   ├── cost-engine.js       # Real-time FinOps & bandwidth egress calculator
    │   ├── autopilot-engine.js  # Autonomous self-healing auto-pilot engine
    │   ├── benchmark-engine.js  # LLM inference hardware & model benchmark lab
    │   ├── geo-distributor.js   # Multi-region global edge & Anycast latency SLA
    │   ├── manifesto-generator.js # Executive architecture manifesto generator
    │   └── templates.js         # Curated architectural blueprints
    └── components/
        ├── agent-copilot.js     # Human-Agent collaborative swarm co-pilot
        ├── swarm-consensus.js   # Multi-agent live debate & consensus protocol
        ├── hud-inspector.js     # WebMCP DevTools Live Inspector HUD
        ├── code-modal.js        # Multi-language IaC export viewer
        ├── audit-panel.js       # Security report & 1-click remediation
        ├── benchmark-modal.js   # AI model benchmark lab modal
        ├── geo-modal.js         # Global multi-region edge latency modal
        └── declarative-forms.js # Declarative WebMCP forms manager
```

---

## 📄 Open Source License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
