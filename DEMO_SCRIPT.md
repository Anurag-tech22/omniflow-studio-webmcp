# OmniFlow Studio — 3-Minute Demo Video Script & Storyboard

This script is structured to deliver a crisp, high-impact video demonstration (< 3 minutes) with clear narration and audio for the WebMCP Challenge submission.

---

## 🎬 Video Overview
- **Total Duration**: 2 minutes 45 seconds
- **Key Themes**: WebMCP standard, Human-Agent Co-Creation, Live Visual Canvas, Real-Time Stress Physics, Security Hardening, IaC Generation.

---

## ⏱️ Scene Breakdown & Narration

### [0:00 - 0:30] Introduction: The Problem & WebMCP Vision
- **Visual**: Show browser tab opening OmniFlow Studio. Dark glassmorphic canvas with glowing nodes and subtle ambient grid.
- **Voiceover**:
  > *"Welcome to OmniFlow Studio, a next-generation visual systems architecture studio where humans and AI agents collaborate seamlessly using the open WebMCP standard.*
  >
  > *Until now, AI agents interacting with web applications had to scrape HTML or guess coordinates through screenshot OCR. WebMCP changes everything by allowing web pages to expose structured tools directly to the browser tab via `document.modelContext`."*

---

### [0:30 - 1:15] Demonstrating WebMCP Tool Discovery & Imperative Registration
- **Visual**: Click on the **WebMCP HUD** button in the top navigation. The DevTools Inspector opens showing 16 registered tools, JSON input schemas, and telemetry logs.
- **Voiceover**:
  > *"Right here in our WebMCP DevTools HUD, you can see 16 tools registered on `document.modelContext`. Notice how each tool specifies parameter schemas, execution handlers, and safety hints—like `readOnlyHint` for non-destructive state queries versus mutating tools for canvas operations.*
  >
  > *We also support declarative HTML forms using the standard `toolname` attributes in the left sidebar."*

---

### [1:15 - 2:00] Human-Agent Co-Creation in Action
- **Visual**: Open the **Agent Co-Pilot** panel on the right. Click the chip: *"Build AI RAG Pipeline"*.
- **Visual Animation**: The agent trace card streams tool executions:
  1. `load_architecture_template` → populates FastAPI AI Gateway, Embeddings Service, Milvus Vector DB, Claude 3.7 LLM, and Redis Cache.
  2. `simulate_traffic` → real-time glowing particles flow across links, with throughput jumping to 6.3k req/s.
  3. `run_security_audit` → scans topology and returns security health score.
- **Voiceover**:
  > *"Let’s ask our AI Co-Pilot to build an AI RAG pipeline and stress-test it. Watch how the agent discovers our registered WebMCP tools and calls them in sequence.*
  >
  > *In milliseconds, the canvas updates at 60 frames per second. Real-time traffic particles flow through our microservices, and our simulation physics engine calculates dynamic latency and CPU load across every service."*

---

### [2:00 - 2:30] Security Audit, Optimization & 1-Click Auto-Remediation
- **Visual**: Click **Audit** in the top bar to show vulnerability cards. Click *"Ask Agent to Auto-Remediate Vulnerabilities"*. Watch the agent invoke `optimize_architecture`, automatically attaching an Auth0 IAM provider to the gateway and inserting a Redis cache layer before the database.
- **Voiceover**:
  > *"Next, the agent runs our security audit tool. It identifies a potential database bottleneck and an unprotected gateway. With one click, the agent calls `optimize_architecture`, hardening our security posture to 100% and eliminating single points of failure."*

---

### [2:30 - 2:45] Exporting Production Infrastructure as Code & Conclusion
- **Visual**: Click **Export IaC**. Switch tabs across Terraform (HCL), Docker Compose, and Kubernetes YAML.
- **Voiceover**:
  > *"Finally, we call `generate_infrastructure_code` to synthesize production Terraform, Docker Compose, and Kubernetes manifests directly from our visual graph.*
  >
  > *OmniFlow Studio demonstrates the true potential of the agent-native web: rich, interactive human-agent co-creation powered by WebMCP. Thank you!"*

---

## 🎯 Recording Tips
1. Record at 1080p 60fps (1920x1080) for ultra-crisp typography and particle animations.
2. Enable sound effects in the top right to capture the subtle synthesizer tones during tool execution.
3. Upload to YouTube as Public or Unlisted, and paste the URL in the Devpost submission form.
