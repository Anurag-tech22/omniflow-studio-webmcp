/**
 * Infrastructure as Code (IaC) Export Modal Component
 * Synthesizes Terraform HCL, Kubernetes Helm Charts, AWS CloudFormation, Docker Compose, and TypeScript.
 */

import { IaCGenerator } from '../canvas/iac-generator.js';

export class CodeModal {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.modalEl = document.getElementById('iac-modal');
    this.codeContentEl = document.getElementById('iac-code-content');
    this.fileLabelEl = document.getElementById('iac-file-label');
    this.activeLang = 'terraform';

    this.initEvents();
  }

  initEvents() {
    const openBtn = document.getElementById('btn-export-code');
    const closeBtn = document.getElementById('btn-close-iac-modal');
    const copyBtn = document.getElementById('btn-copy-iac');
    const downloadBtn = document.getElementById('btn-download-iac');

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        this.open();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Modal tabs
    if (this.modalEl) {
      const tabs = this.modalEl.querySelectorAll('.tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.activeLang = tab.getAttribute('data-lang');
          this.updateCode();
        });
      });
    }

    // Copy to clipboard
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        if (this.codeContentEl) {
          await navigator.clipboard.writeText(this.codeContentEl.textContent);
          const origText = copyBtn.innerHTML;
          copyBtn.innerHTML = `<span>Copied!</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = origText;
          }, 2000);
        }
      });
    }

    // Download file
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadActiveFile();
      });
    }
  }

  open() {
    if (this.modalEl) {
      this.modalEl.classList.remove('hidden');
      this.updateCode();
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.classList.add('hidden');
    }
  }

  updateCode() {
    const nodes = this.canvas.nodes;
    const connections = this.canvas.connections;

    let code = '';
    let filename = 'main.tf';

    switch (this.activeLang) {
      case 'terraform':
        code = IaCGenerator.generateTerraform(nodes, connections);
        filename = 'main.tf';
        break;
      case 'helm':
        code = IaCGenerator.generateHelmChart(nodes, connections);
        filename = 'values.yaml';
        break;
      case 'cloudformation':
        code = IaCGenerator.generateCloudFormation(nodes, connections);
        filename = 'cloudformation.yaml';
        break;
      case 'docker':
        code = IaCGenerator.generateDockerCompose(nodes, connections);
        filename = 'docker-compose.yml';
        break;
      case 'typescript':
        code = IaCGenerator.generateTypeScript(nodes, connections);
        filename = 'architecture.ts';
        break;
      default:
        code = IaCGenerator.generateTerraform(nodes, connections);
        filename = 'main.tf';
        break;
    }

    if (this.codeContentEl) this.codeContentEl.textContent = code;
    if (this.fileLabelEl) this.fileLabelEl.textContent = filename;
  }

  downloadActiveFile() {
    const code = this.codeContentEl ? this.codeContentEl.textContent : '';
    const filename = this.fileLabelEl ? this.fileLabelEl.textContent : 'architecture.txt';

    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
