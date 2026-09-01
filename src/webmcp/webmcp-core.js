/**
 * WebMCP Core Engine & Polyfill Bridge
 * Compliant with W3C Web Machine Learning Community Group's WebMCP Specification
 * and Chrome/ChatGPT In-App Browser modelContext standards.
 */

class WebMCPEngine {
  constructor() {
    this.tools = new Map(); // toolName -> toolDefinition
    this.telemetryLogs = [];
    this.callCount = 0;
    this.totalExecutionTimeMs = 0;
    this.listeners = new Map(); // event -> array of callbacks

    this.initPolyfill();
    this.initDeclarativeForms();
  }

  /**
   * Initializes document.modelContext and navigator.modelContext
   * ensuring progressive enhancement and full standard compliance.
   */
  initPolyfill() {
    const self = this;

    const modelContextApi = {
      /**
       * Register a WebMCP Tool (Imperative API)
       * @param {Object} toolDef
       * @param {string} toolDef.name - Unique tool identifier
       * @param {string} toolDef.description - Purpose of the tool for AI reasoning
       * @param {Object} toolDef.inputSchema - JSON Schema for required/optional arguments
       * @param {Function} toolDef.execute - Async executor function
       * @param {boolean} [toolDef.readOnlyHint] - Security hint if tool does not mutate state
       * @param {boolean} [toolDef.untrustedContentHint] - Security hint for user content
       */
      registerTool: async (toolDef) => {
        return self.registerTool(toolDef);
      },

      /**
       * Unregister a tool
       */
      unregisterTool: async (toolName) => {
        return self.unregisterTool(toolName);
      },

      /**
       * List all registered tools with schemas
       */
      listTools: async () => {
        return self.listTools();
      },

      /**
       * Execute a tool by name with given parameters
       */
      executeTool: async (name, params) => {
        return self.executeTool(name, params);
      }
    };

    // Attach to document.modelContext (Standard specification)
    if (!document.modelContext) {
      document.modelContext = modelContextApi;
      console.log('[WebMCP] Initialized document.modelContext polyfill.');
    } else {
      // If browser has native document.modelContext, wrap or integrate
      console.log('[WebMCP] Native document.modelContext detected in browser runtime.');
    }

    // Attach to navigator.modelContext (Historical / Edge compatibility)
    if (!navigator.modelContext) {
      navigator.modelContext = modelContextApi;
    }

    // Also expose to window.modelContext for easy devtools console testing
    window.modelContext = modelContextApi;
  }

  /**
   * Registers a tool into the WebMCP registry
   */
  registerTool(toolDef) {
    if (!toolDef || !toolDef.name || !toolDef.description || !toolDef.execute) {
      throw new Error('[WebMCP] Tool definition requires name, description, and execute function.');
    }

    const normalizedTool = {
      name: toolDef.name,
      description: toolDef.description,
      inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
      execute: toolDef.execute,
      readOnlyHint: Boolean(toolDef.readOnlyHint),
      untrustedContentHint: Boolean(toolDef.untrustedContentHint),
      registeredAt: Date.now(),
      callCount: 0,
      avgLatencyMs: 0,
      totalLatencyMs: 0,
      isDeclarative: Boolean(toolDef.isDeclarative)
    };

    this.tools.set(toolDef.name, normalizedTool);
    this.logTelemetry(`[Registered Tool] "${toolDef.name}" (${normalizedTool.readOnlyHint ? 'ReadOnly' : 'StateMutating'})`, 'log-tool');
    this.emit('tool-registered', normalizedTool);

    return { success: true, toolName: toolDef.name };
  }

  /**
   * Unregisters a tool
   */
  unregisterTool(toolName) {
    if (this.tools.has(toolName)) {
      this.tools.delete(toolName);
      this.logTelemetry(`[Unregistered Tool] "${toolName}"`, 'log-warn');
      this.emit('tool-unregistered', toolName);
      return true;
    }
    return false;
  }

  /**
   * Returns list of tools formatted for AI agents (JSON Schema compliant)
   */
  listTools() {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
      readOnlyHint: t.readOnlyHint,
      untrustedContentHint: t.untrustedContentHint,
      isDeclarative: t.isDeclarative,
      callCount: t.callCount,
      avgLatencyMs: t.avgLatencyMs
    }));
  }

  /**
   * Executes a tool with telemetry and event dispatching
   */
  async executeTool(name, params = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      const errMsg = `WebMCP tool "${name}" is not registered.`;
      this.logTelemetry(`[Error] ${errMsg}`, 'log-error');
      throw new Error(errMsg);
    }

    const startTime = performance.now();
    this.emit('tool-calling', { name, params });

    try {
      // Validate or sanitize input if needed
      const result = await tool.execute(params);
      const duration = Math.round(performance.now() - startTime);

      // Update telemetry
      this.callCount++;
      tool.callCount++;
      tool.totalLatencyMs += duration;
      tool.avgLatencyMs = Math.round(tool.totalLatencyMs / tool.callCount);
      this.totalExecutionTimeMs += duration;

      this.logTelemetry(`[Executed] "${name}" in ${duration}ms → Result: ${JSON.stringify(result).substring(0, 80)}...`, 'log-success');
      this.emit('tool-finished', { name, params, result, duration, success: true });

      return result;
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      this.logTelemetry(`[Execution Failed] "${name}" (${duration}ms): ${err.message}`, 'log-error');
      this.emit('tool-finished', { name, params, error: err.message, duration, success: false });
      throw err;
    }
  }

  /**
   * Scans DOM for declarative WebMCP forms with `toolname` attribute
   */
  initDeclarativeForms() {
    // Run after DOM is loaded
    const scan = () => {
      const declarativeForms = document.querySelectorAll('form[toolname]');
      declarativeForms.forEach(form => {
        const toolName = form.getAttribute('toolname');
        const toolDesc = form.getAttribute('tooldescription') || `Submit form ${toolName}`;

        if (!toolName) return;

        // Build inputSchema by inspecting inputs
        const properties = {};
        const required = [];

        form.querySelectorAll('input, select, textarea').forEach(input => {
          const fieldName = input.getAttribute('name');
          if (!fieldName) return;

          const fieldDesc = input.getAttribute('toolparamdescription') || input.getAttribute('placeholder') || fieldName;
          properties[fieldName] = {
            type: 'string',
            description: fieldDesc
          };

          if (input.hasAttribute('required')) {
            required.push(fieldName);
          }
        });

        const inputSchema = {
          type: 'object',
          properties,
          required
        };

        // Register declarative tool
        this.registerTool({
          name: toolName,
          description: `[Declarative Form Tool] ${toolDesc}`,
          inputSchema,
          isDeclarative: true,
          execute: async (input) => {
            // Fill form inputs
            for (const [key, val] of Object.entries(input)) {
              const el = form.querySelector(`[name="${key}"]`);
              if (el) {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
            // Trigger submit event
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            return {
              status: 'submitted',
              form: toolName,
              values: input
            };
          }
        });
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', scan);
    } else {
      scan();
    }
  }

  /**
   * Event system
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try { cb(data); } catch (e) { console.error(e); }
      });
    }

    // Also dispatch custom browser DOM event
    window.dispatchEvent(new CustomEvent(`webmcp:${event}`, { detail: data }));
  }

  /**
   * Telemetry logger
   */
  logTelemetry(message, level = 'log-info') {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      level
    };
    this.telemetryLogs.push(entry);
    this.emit('telemetry-log', entry);
  }

  getStats() {
    return {
      totalRegistered: this.tools.size,
      totalCalls: this.callCount,
      avgLatency: this.callCount > 0 ? Math.round(this.totalExecutionTimeMs / this.callCount) : 0,
      logs: this.telemetryLogs
    };
  }
}

// Global Singleton Instance
export const webmcp = new WebMCPEngine();
