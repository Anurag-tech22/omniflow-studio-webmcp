/**
 * Declarative WebMCP Forms Handler
 */

import { webmcp } from '../webmcp/webmcp-core.js';

export class DeclarativeFormsManager {
  constructor(canvasEngine) {
    this.canvas = canvasEngine;
    this.initForms();
  }

  initForms() {
    // 1. Declarative Quick Add Form
    const addNodeForm = document.getElementById('declarative-add-node-form');
    if (addNodeForm) {
      addNodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(addNodeForm);
        const label = formData.get('label') || 'New Component';
        const type = formData.get('type') || 'service';

        this.canvas.addNode({
          label,
          type,
          x: Math.floor(120 + Math.random() * 300),
          y: Math.floor(100 + Math.random() * 250)
        });

        this.canvas.playSfx(480, 'triangle', 0.08);
        addNodeForm.reset();
      });
    }

    // 2. Declarative Quick Optimize Form
    const optForm = document.getElementById('declarative-optimize-form');
    if (optForm) {
      optForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(optForm);
        const goal = formData.get('goal') || 'latency';

        await webmcp.executeTool('optimize_architecture', { goal });
      });
    }
  }
}
