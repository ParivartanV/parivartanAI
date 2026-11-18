/**
 * Universal AI Service for Parivartan Snippet
 * Supports Google Gemini, OpenAI (ChatGPT), Anthropic Claude, Local LLMs (Ollama), and Chrome Built-in AI.
 */

const AIService = {
  // Default configurations
  DEFAULT_MODELS: {
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    claude: 'claude-3-5-haiku-20241022',
    ollama: 'llama3:latest',
    chrome_builtin: 'gemini-nano'
  },

  // Base System Prompts tailored for Personas & Thinking Characters
  SYSTEM_PROMPTS: {
    analyst: `You are an Objective Direct Analyst.
Your core principle is high information density, factual accuracy, and structured clarity.
CRITICAL FORMATTING DIRECTIVE:
1. SUMMARY / ANALYSIS / DATA TASKS:
   - Provide direct, crisp, numbered or bulleted pointers covering Main Issue, Key Findings, Status, and Recommended Next Steps.
   - NEVER format responses as a customer email or message. Never say 'Hello', 'Dear Client', 'Thank you for contacting us', or 'Best regards'.
2. DRAFT REPLY TASKS:
   - Only when explicitly instructed to 'Draft a reply to the customer' should you write an outgoing client message.
3. Eliminate all conversational filler, apologies, and small talk.`,

    support: `You are an expert Technical Support Engineer for cloud hosting and network infrastructure (Psychz Networks).
CRITICAL FORMATTING DIRECTIVE:
1. SUMMARY / ANALYSIS / EXTRACTION / DIAGNOSTIC TASKS:
   - When asked to summarize, diagnose, or extract info: Provide direct, structured technical bullet points.
   - Do NOT write as a letter or email to a client unless explicitly instructed to 'Draft a customer reply'.
   - NEVER output conversational preamble or pleasantries (never start with 'Hello! I would be happy to help...', 'Here is the breakdown of ticket #...', or end with 'Please let me know if you need assistance executing the retry...'). Start directly with the first section heading or bullet point.
2. DRAFT REPLY TASKS:
   - When drafting a reply for a client: Be empathetic, polite, reassuring, technically clear, and action-oriented.
3. For network troubleshooting: Recommend MTR (bidirectional), reverse traceroute, ASN, or LOA when applicable.`,

    ai_engineer: `You are a Principal AI Engineer and Machine Learning Architect.
CRITICAL FORMATTING DIRECTIVE:
1. Analyze problems through computational complexity, token efficiency, algorithmic design, and model architecture.
2. Provide clean, robust code examples, mathematical explanations, and implementation trade-offs when relevant.
3. When summarizing or explaining: Break down technical requirements, data dependencies, and algorithmic bottlenecks into structured pointers. Do not format as a customer email unless requested.`,

    sysadmin: `You are a Senior Linux System Administrator and Network NOC Engineer.
CRITICAL FORMATTING DIRECTIVE:
1. Focus on precise infrastructure telemetry: BGP routing, ASN, RPKI/ROA, MTR packet loss, IPMI, systemd, firewall rules, and kernel parameters.
2. Provide exact bash commands and diagnostic checks.
3. When summarizing: List affected IPs/subnets, hop latency, service status, and exact terminal commands needed. Do NOT format as a customer email unless requested.`,

    doctor: `You are an experienced Clinical Physician and Medical Researcher.
CRITICAL FORMATTING DIRECTIVE:
1. Analyze health data, medical literature, and symptoms with scientific rigor, clinical reasoning, and evidence-based medicine.
2. Structure explanations with Differential Diagnosis, Clinical Findings, Mechanism of Action, and Recommended Follow-up.
3. When summarizing: Present clinical observations and key findings in concise, objective medical bullet points.`,

    marketing: `You are a Chief Marketing Strategist and Growth Copywriter.
CRITICAL FORMATTING DIRECTIVE:
1. Focus on user psychology, brand positioning, compelling value propositions, and conversion hooks.
2. Write crisp, engaging content that highlights benefits over features.
3. When summarizing: Extract audience pain points, unique selling points (USPs), brand voice opportunities, and key performance indicators (KPIs) into bullet points.`,

    sales: `You are an Enterprise B2B Sales Director.
CRITICAL FORMATTING DIRECTIVE:
1. Focus on commercial impact, ROI justification, client pain-point resolution, and sales velocity.
2. Provide effective objection-handling frameworks and persuasive communication strategies.
3. When summarizing: Highlight client budget, urgency, commercial leverage, decision-makers, and closing next steps in structured pointers.`,

    ceo: `You are a visionary Chief Executive Officer (CEO).
CRITICAL FORMATTING DIRECTIVE:
1. Cut through operational weeds and analyze problems from a high-level strategic, financial, and risk-adjusted perspective.
2. Prioritize ROI, competitive advantage, resource allocation, and organizational velocity.
3. Deliver decisive executive directives and concise strategic summaries in prioritized bullet points. Do not format as a customer service reply unless explicitly asked.`,

    concise: `You are a concise, direct business communication assistant.
Make all messages crisp, action-driven, and brief while retaining complete politeness and technical accuracy. Never output customer email greetings unless drafting a reply.`,

    technical: `You are a Tier 3 Network and Systems Engineer.
Focus on exact technical diagnostics (BGP, ASN, RPKI, ROA, MTR, DDOS ACLs, IP prefixes, IPMI, OS lifecycle). Provide clear step-by-step diagnostic procedures.`
  },

  /**
   * Universal Generate function
   * @param {Object} options
   * @param {string} options.prompt - The user instruction or text to process
   * @param {string} [options.action] - One of 'draft_reply', 'improve', 'shorten', 'troubleshoot', 'fix_grammar', 'custom', 'execute_prompt'
   * @param {string} [options.context] - Text from the customer's ticket/email/webpage
   * @param {string} [options.provider] - 'gemini', 'openai', 'claude', 'ollama', 'chrome_builtin'
   * @param {string} [options.apiKey] - Provider API key
   * @param {string} [options.model] - Specific model name
   * @param {string} [options.customEndpoint] - Custom URL for Ollama / internal proxy
   * @param {string} [options.persona] - 'analyst', 'support', 'ai_engineer', 'sysadmin', 'doctor', 'marketing', 'sales', 'ceo'
   * @param {string} [options.personaPrompt] - Custom thinking prompt for custom persona
   */
  async generate(options) {
    const {
      prompt,
      action = 'custom',
      context = '',
      provider = 'gemini',
      apiKey = '',
      model = '',
      customEndpoint = '',
      persona = 'support',
      personaPrompt = '',
      history = []
    } = options;

    const systemPrompt = personaPrompt || this.SYSTEM_PROMPTS[persona] || this.SYSTEM_PROMPTS.support;
    const fullUserPrompt = this.buildPrompt(action, prompt, context);

    switch (provider) {
      case 'chatgpt_web':
        return this.callChatGPTWeb(fullUserPrompt, systemPrompt, history);

      case 'claude_web':
        return this.callClaudeWeb(fullUserPrompt, systemPrompt, history);

      case 'gemini_web':
        return this.callGeminiWeb(fullUserPrompt, systemPrompt, apiKey, history);

      case 'gemini':
        if (!apiKey) return this.generateSmartFallbackReply(action, prompt, context, 'gemini');
        return this.callGemini(fullUserPrompt, systemPrompt, apiKey, model || this.DEFAULT_MODELS.gemini, history);

      case 'openai':
        if (!apiKey && !customEndpoint) return this.generateSmartFallbackReply(action, prompt, context, 'openai');
        return this.callOpenAI(fullUserPrompt, systemPrompt, apiKey, model || this.DEFAULT_MODELS.openai, customEndpoint, history);

      case 'claude':
        if (!apiKey) return this.generateSmartFallbackReply(action, prompt, context, 'claude');
        return this.callClaude(fullUserPrompt, systemPrompt, apiKey, model || this.DEFAULT_MODELS.claude, history);

      case 'ollama':
        return this.callOllama(fullUserPrompt, systemPrompt, customEndpoint || 'http://localhost:11434', model || this.DEFAULT_MODELS.ollama, history);

      case 'chrome_builtin':
        return this.callChromeBuiltin(fullUserPrompt, systemPrompt, history);

      case 'smart_instant':
        return this.generateSmartFallbackReply(action, prompt, context, 'smart_instant');

      default:
        return this.generateSmartFallbackReply(action, prompt, context, provider);
    }
  },

  /**
   * Smart Built-in Fallback Engine for instantaneous responses without API keys
   */
  generateSmartFallbackReply(action, prompt, context, provider) {
    const combinedText = (context + ' ' + prompt).trim();
    const lowerContext = combinedText.toLowerCase();
    let reply = '';

    // Extract core topic from context if available
    let topicSnippet = '';
    if (context) {
      const cleanLines = context
        .replace(/^Page Title:\s*[^\n]+\n/i, '')
        .replace(/^URL:\s*[^\n]+\n/i, '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 15 && !l.startsWith('---'));
      if (cleanLines.length > 0) {
        topicSnippet = cleanLines[0].slice(0, 100);
      }
    }

    switch (action) {
      case 'first_response':
      case 'acknowledge':
        reply = `Hello,\n\nThank you for reaching out to Psychz Support${topicSnippet ? ` regarding "${topicSnippet}"` : ''}.\n\nWe have received your message and our engineering team is actively investigating the matter. We will review the details and update you here as soon as more information is available.\n\nWe appreciate your patience in the meantime.`;
        break;

      case 'bgp_loa':
        reply = `Dear Customer,\n\nThank you for contacting Psychz Support.\n\nTo proceed with your BGP announcement, we kindly request a Letter of Authorization (LOA) containing the following details:\n1. Prefixes to be announced\n2. ASN\n3. ROA/RPKI records pointing to the ASN\n4. Routing Table type (Full table, Default route, etc.)\n\nPlease provide these details at your earliest convenience so our network engineering team can move forward without delay.`;
        break;

      case 'reverse_trace':
      case 'packet_loss':
        reply = `Hello,\n\nThank you for sharing your traceroute/MTR reports.\n\nUpon examination, the packet loss appears to be originating at intermediate transit hops outside our internal network and is not being carried over to the destination host (indicating an ICMP rate-limit or transit false positive).\n\nTo confirm where the issue lies, please provide:\n1. A reverse traceroute / MTR from your source workstation to the server IP\n2. Your source IP address (visible on https://ping.pe or https://ipinfo.io)\n3. Approximate start time and timezone\n\nOnce we receive this information, we will be glad to troubleshoot this incident further.`;
        break;

      case 'ddos_diversion':
        reply = `Hello,\n\nTo safeguard your server against volumetric traffic spikes, we recommend enabling DDoS IP Diversion directly from your client area:\n\nStep-by-step Knowledgebase Guide:\nhttps://www.psychz.net/client/kb/en/how-to-temporarilypermanently-enable-ddos-ip-diversion-for-a-single-ip-address-.html\n\nAdditionally, we advise implementing ACL and firewall drop rules on your server to discard unauthorized incoming connections. Please feel free to reach out if you need assistance configuring mitigation.`;
        break;

      case 'ip_allocation':
        reply = `Hi there,\n\nThank you for contacting us. Additional IP allocations are available for active servers:\n\nIPv4 Allocation Pricing:\n• /30 (2 usable IPs) — $8 / month\n• /29 (5 usable IPs) — $16 / month\n• /28 (13 usable IPs) — $32 / month\n• /27 (29 usable IPs) — $64 / month\n• /26 (61 usable IPs) — $128 / month\n• /25 (125 usable IPs) — $256 / month\n• /24 (253 usable IPs) — $512 / month\n\nIPv6 Allocation:\n• /64 — $25 One-Time Setup Fee\n• /48 — $50 One-Time Setup Fee\n\nNotes:\n- IP allocations require a valid technical justification under ARIN/RIPE policies.\n- Outbound port 25 (SMTP) is blocked by default.\n\nPlease confirm the desired subnet size to proceed.`;
        break;

      case 'deescalate':
        reply = `Dear Customer,\n\nI understand your frustration regarding this situation, and I sincerely apologize for the disruption this has caused to your services.\n\nPlease rest assured that this matter has been escalated directly to our senior infrastructure engineers. We are currently performing in-depth diagnostics to isolate and resolve the root cause.\n\nI will remain assigned to this case and will update you directly as soon as we make progress. Thank you for your continued patience.`;
        break;

      case 'translate':
        reply = `Hello,\n\nHere is the translated and polished version of the message:\n\n${prompt || context}\n\nPlease let us know if you have any questions.`;
        break;

      case 'summarize':
        reply = `**Page Summary & Key Findings:**\n• Main Topic / Issue: ${(topicSnippet || (context ? context.slice(0, 180).replace(/\n/g, ' ') : prompt || 'Core page topic'))}\n• Key Findings: Relevant configurations and telemetry analyzed\n• Current Status: Verified\n• Pending Actions: Review findings and confirm next operational steps`;
        break;

      case 'answer':
        reply = `Hello,\n\nBased on your inquiry${topicSnippet ? ` regarding "${topicSnippet}"` : ''}, we have reviewed the configuration. Everything is currently operating normally within expected parameters.\n\nPlease let us know if you need any further details or diagnostic assistance.`;
        break;

      case 'summarize_internal':
        reply = `[Internal Escalation Note]\n• Customer Concern: ${topicSnippet || (context ? context.slice(0, 160).replace(/\n/g, ' ') : 'Service issue reported')}\n• Current Status: Diagnostic checks initiated\n• Next Steps: Senior Network/Hardware Engineer review requested\n• Priority: High`;
        break;

      case 'shorten':
        if (prompt || context) {
          const src = prompt || context;
          const sentences = src.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
          reply = sentences.slice(0, 2).join(' ') || src;
        } else {
          reply = `We investigated the issue and verified normal operations. Please test and confirm if everything is working on your end.`;
        }
        break;

      case 'improve':
        if (prompt || context) {
          reply = `Hello,\n\nThank you for contacting us.\n\n${(prompt || context).trim()}\n\nPlease let us know if you have any questions or require further assistance.\n\nBest regards,\nSupport Team`;
        } else {
          reply = `Hello,\n\nThank you for reaching out. We have reviewed your request and everything is operating normally. Please let us know if you need any additional assistance.\n\nBest regards,\nSupport Team`;
        }
        break;

      case 'troubleshoot':
        reply = `Hello,\n\nTo troubleshoot this issue effectively, please share the following diagnostic outputs:\n\n1. Outbound & Inbound MTR/Traceroute reports (at least 50 packets):\n   Windows: WinMTR | Linux: mtr -rw <target-ip>\n2. Public Source IP address and affected Destination IP\n3. Port number and protocol (TCP/UDP/ICMP)\n4. Relevant error logs or console screenshots\n\nOnce provided, our network engineers will analyze the flow and take immediate corrective measures.`;
        break;

      case 'fix_grammar':
        const raw = (prompt || context).trim();
        reply = raw.charAt(0).toUpperCase() + raw.slice(1);
        if (!reply.endsWith('.')) reply += '.';
        break;

      case 'draft_reply':
      default:
        // Context-aware auto response
        if (lowerContext.includes('bgp') || lowerContext.includes('loa') || lowerContext.includes('rpki') || lowerContext.includes('asn')) {
          reply = `Dear Customer,\n\nThank you for reaching out regarding BGP announcement.\n\nTo proceed with advertising your prefixes, please provide your Letter of Authorization (LOA), target ASN, and ensure your RPKI ROA records are valid.\n\nPlease reply with these details so our network engineering team can configure the peering session without delay.`;
        } else if (lowerContext.includes('loss') || lowerContext.includes('mtr') || lowerContext.includes('traceroute') || lowerContext.includes('ping') || lowerContext.includes('hop')) {
          reply = `Hello,\n\nThank you for contacting us with your network reports.\n\nWe analyzed the traffic flow and routing paths on our core network. The reported packet drops appear to be isolated to external carrier hops rather than our internal infrastructure.\n\nCould you please provide a reverse MTR from your location to the server IP? This will enable our network operations center to trace the bidirectional path and open a carrier ticket if necessary.`;
        } else if (lowerContext.includes('ddos') || lowerContext.includes('attack') || lowerContext.includes('flood') || lowerContext.includes('mitigat')) {
          reply = `Hello,\n\nWe have reviewed the traffic on your IP prefix. To defend against ongoing volumetric attacks, we recommend enabling IP Diversion via your client portal (under Network -> DDoS Protection).\n\nYou can also configure firewall rules directly on your host to drop unneeded ports. Please reach out if you need help activating the diversion.`;
        } else if (lowerContext.includes('ip') && (lowerContext.includes('new') || lowerContext.includes('order') || lowerContext.includes('buy') || lowerContext.includes('subnet'))) {
          reply = `Hello,\n\nThank you for reaching out regarding additional IP addresses.\n\nWe have /30 to /24 IPv4 subnets available starting at $8/month. Please let us know your required subnet size and intended use case so our team can prepare the allocation invoice.`;
        } else if (lowerContext.includes('reboot') || lowerContext.includes('down') || lowerContext.includes('offline') || lowerContext.includes('ipmi') || lowerContext.includes('kvm')) {
          reply = `Hello,\n\nThank you for contacting technical support.\n\nWe are checking the hardware and network status of your server right now. We have verified IPMI/KVM connectivity and will provide an update within a few minutes regarding its operational state.`;
        } else if (topicSnippet) {
          reply = `Hello,\n\nThank you for contacting us regarding "${topicSnippet}".\n\nWe have reviewed the details provided in your message and our engineering team is actively looking into this. Please allow us a short moment to complete our technical verification, and we will follow up with you right away.\n\n${prompt ? `Note: ${prompt}\n\n` : ''}Best regards,\nSupport Team`;
        } else {
          reply = `Hello,\n\nThank you for reaching out to us.\n\n${prompt ? prompt + '\n\n' : ''}We have reviewed your request and are ready to assist. Please let us know if there are any additional details or logs you can provide so we can ensure everything is resolved to your satisfaction.`;
        }
        break;
    }

    if (provider !== 'smart_instant') {
      reply += `\n\n[💡 Note: Instant offline response. Add your free Google Gemini API key in the AI panel above to enable full live Generative AI.]`;
    }

    return reply;
  },

  /**
   * Build the structured instruction prompt based on action and context
   */
  buildPrompt(action, prompt, context) {
    let instruction = '';

    switch (action) {
      case 'draft_reply':
        instruction = `You are a professional customer support and communication assistant.
You are reading the following customer ticket / webpage context:
==================== CURRENT WEBPAGE CONTENT ====================
${context || '(No webpage context available. Use the guidance below)'}
=================================================================

${prompt ? `Additional Agent Guidance / Note: ${prompt}\n\n` : ''}Instruction:
Draft a complete, polite, empathetic, and technically accurate customer support reply that directly addresses the customer's questions, issues, and details found in the WEBPAGE CONTENT above.

CRITICAL RULES:
1. Base your answer directly on the issues described in the WEBPAGE CONTENT.
2. Directly answer all questions the customer asked.
3. Be professional, clear, and reassuring.
4. Output only the reply ready to be sent to the customer.`;
        break;

      case 'first_response':
      case 'acknowledge':
        instruction = `The customer submitted this ticket / message:
====================
${context || prompt}
====================
Instruction: Draft an immediate polite, professional First Response acknowledgement. State that our engineering team is actively investigating their ticket, reassure them, and set expectations that an update will follow shortly.`;
        break;

      case 'bgp_loa':
        instruction = `The customer inquired or requested BGP IP announcement:
====================
${context || prompt}
====================
Instruction: Draft a clear professional response requesting a Letter of Authorization (LOA), prefixes to be announced, ASN, RPKI/ROA validation, and routing table type.`;
        break;

      case 'reverse_trace':
      case 'packet_loss':
        instruction = `The customer reported packet loss or provided an MTR/traceroute:
====================
${context || prompt}
====================
Instruction: Formulate a response explaining that packet loss appears to be outside our internal core network, and request a reverse MTR from their source host to the server, their public source IP, and timestamps to isolate the routing issue.`;
        break;

      case 'ddos_diversion':
        instruction = `The customer is experiencing DDoS attacks or abnormal volumetric traffic:
====================
${context || prompt}
====================
Instruction: Formulate a response recommending DDoS IP Diversion via the client area with the knowledgebase link (https://www.psychz.net/client/kb/en/how-to-temporarilypermanently-enable-ddos-ip-diversion-for-a-single-ip-address-.html) and suggesting ACL/firewall mitigation rules.`;
        break;

      case 'ip_allocation':
        instruction = `The customer is asking about new IP allocation or subnet pricing:
====================
${context || prompt}
====================
Instruction: Provide the standard IPv4 (/30 to /24) and IPv6 allocation pricing breakdown, along with notes regarding technical justification and port 25 blocking.`;
        break;

      case 'deescalate':
        instruction = `The customer is upset, frustrated, or demanding immediate escalation:
====================
${context || prompt}
====================
Instruction: Compose a deeply empathetic, highly reassuring de-escalation response. Acknowledge their frustration without admitting false blame, state that a senior engineer has taken direct ownership, and outline the immediate investigative steps.`;
        break;

      case 'translate':
        instruction = `Translate or clarify the following text into clear, fluent, professional English (or into the language requested in guidance):\n====================\n${prompt || context}\n====================`;
        break;

      case 'summarize':
        instruction = `You are an analytical assistant reading the following webpage / document / ticket:
==================== PAGE CONTENT ====================
${context || prompt}
======================================================
Instruction: Provide a clear, concise summary in direct, objective bullet points covering:
• Main Topic / Issue: Core problem or subject
• Key Findings & Important Information: Critical details, telemetry, logs, or error codes
• Current Status / Conclusion: Present state of the system or matter
• Pending Actions: Concrete next steps or follow-ups

CRITICAL FORMATTING DIRECTIVE:
Provide direct factual pointers for the user. Do NOT format as an email or reply letter to a customer (never start with 'Hello / Dear Client' or end with 'Best regards' or customer sign-offs).`;
        break;

      case 'answer':
        instruction = `You are an AI assistant reading the current webpage.
==================== PAGE CONTENT ====================
${context || '(No context provided)'}
======================================================

Question / Inquiry:
${prompt || 'Please answer the customer inquiry based directly on the page context.'}

Instruction:
Answer the question accurately using the information in the PAGE CONTENT above. Be specific, clear, and professional.`;
        break;

      case 'summarize_internal':
        instruction = `Read the following customer ticket:
====================
${context || prompt}
====================
Instruction: Summarize this ticket in 3-4 concise bullet points for internal engineering escalation (Customer issue, diagnostics run, action needed, priority).`;
        break;

      case 'make_shorter':
        instruction = `Shorten this text to 2 crisp, clear sentences while preserving all critical meaning:\n---\n${prompt || context}\n---`;
        break;

      case 'make_longer':
        instruction = `Expand this response with complete technical verification steps, command examples, and helpful polite customer guidance:\n---\n${prompt || context}\n---`;
        break;

      case 'improve':
        instruction = `The user wrote this draft message:
---
${prompt || context}
---
Instruction: Rewrite and polish this message to be warm, polite, confident, and professional. Keep all facts intact. Output only the improved message.`;
        break;

      case 'shorten':
        instruction = `The user wrote this message:
---
${prompt || context}
---
Instruction: Shorten and simplify this message. Make it concise and easy to read while keeping all important details. Output only the shortened message.`;
        break;

      case 'diagnose':
      case 'troubleshoot':
      case 'find_solution':
        instruction = `You are an expert technical diagnostics and solutions engineer.
Analyze the following customer ticket / error report:
==================== CURRENT TICKET / PAGE CONTENT ====================
${context || prompt}
======================================================================
${prompt && prompt !== context ? `Specific Problem / Question: ${prompt}\n\n` : ''}Instruction:
Provide a comprehensive, technical root cause analysis and step-by-step solution structured as follows:

1. 🔍 Root Cause Analysis:
Identify exactly what caused the error or failure based on the logs, headers, and descriptions.

2. 🛠️ Step-by-Step Technical Fix:
Provide the exact technical resolution, configuration changes, or shell/CLI commands to fix the issue.

3. 🧪 Verification & Health Check:
Explain how to verify that the fix worked and that the service or network is completely healthy.

4. 💬 Customer Resolution Explanation:
Provide a clear, reassuring, and professional explanation ready to send to the client.`;
        break;

      case 'fix_grammar':
        instruction = `Review and fix all grammar, punctuation, phrasing, and spelling mistakes in the following text. Do not change the meaning:
---
${prompt || context}
---
Output only the corrected text.`;
        break;

      case 'execute_prompt':
        if (prompt) {
          return `${prompt}\n\n[Instruction: Follow the user's instructions above directly. Start directly with the response content without conversational preamble (never say 'Hello! I would be happy to help...' or 'Here is the breakdown'). If asked to summarize, analyze, or diagnose, provide clean, structured bullet points. Do NOT format as an email or reply to a customer unless the prompt explicitly asks to draft a customer reply.]`;
        }
        if (context) {
          return `Please summarize the key findings from this context in objective bullet points:\n\n${context}`;
        }
        return 'Please provide structured analytical assistance.';

      case 'chat':
      case 'custom':
      default:
        if (context && context.trim()) {
          instruction = `[Webpage Context]\n${context.trim()}\n\n${prompt ? prompt.trim() : 'Please review this page and provide helpful assistance.'}`;
        } else {
          instruction = prompt ? prompt.trim() : 'Please provide clear, accurate assistance.';
        }
        break;
    }

    return instruction;
  },

  /**
   * Helper: List all available text-generation models dynamically for a given Gemini API key
   */
  async listGeminiModels(apiKey) {
    if (!apiKey) return { models: [], apiVer: 'v1beta' };
    for (const ver of ['v1beta', 'v1']) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/${ver}/models?key=${encodeURIComponent(apiKey.trim())}`);
        if (res.ok) {
          const data = await res.json();
          const list = (data.models || [])
            .filter(m => {
              if (!m.supportedGenerationMethods || !m.supportedGenerationMethods.includes('generateContent')) {
                return false;
              }
              const name = (m.name || '').toLowerCase();
              // Exclude audio-only / TTS / embeddings / imagen models
              if (name.includes('-tts') || name.includes('embedding') || name.includes('imagen') || name.includes('robotics')) {
                return false;
              }
              return true;
            })
            .map(m => m.name.replace(/^models\//, ''));
          if (list.length > 0) return { models: list, apiVer: ver };
        }
      } catch (err) {}
    }
    return { models: [], apiVer: 'v1beta' };
  },

  /**
   * 1. Google Gemini API with Dynamic Model Discovery
   */
  async callGemini(userPrompt, systemPrompt, apiKey, model, history = []) {
    if (!apiKey) {
      throw new Error('Google Gemini API Key is missing. Please enter your free key in Settings.');
    }

    const cleanKey = apiKey.trim();
    const { models: availableModels, apiVer: detectedVer } = await this.listGeminiModels(cleanKey);

    let candidates = [];
    if (model && model.trim()) {
      const cleanReq = model.trim().replace(/^models\//, '');
      if (!cleanReq.includes('-tts')) {
        candidates.push(cleanReq);
      }
    }
    if (availableModels.length > 0) {
      const flashModels = availableModels.filter(m => m.includes('flash') && !m.includes('-tts'));
      const otherModels = availableModels.filter(m => !m.includes('flash') && !m.includes('-tts'));
      candidates = [...candidates, ...flashModels, ...otherModels];
    } else {
      candidates = [...candidates, 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
    }

    const uniqueCandidates = [...new Set(candidates)];
    let lastError = null;

    const versionsToTry = detectedVer ? [detectedVer, (detectedVer === 'v1beta' ? 'v1' : 'v1beta')] : ['v1beta', 'v1'];

    for (const m of uniqueCandidates) {
      for (const apiVer of versionsToTry) {
        const endpoint = `https://generativelanguage.googleapis.com/${apiVer}/models/${m}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        try {
          const contents = [];
          if (Array.isArray(history) && history.length > 0) {
            for (const h of history) {
              if (!h.text || !h.text.trim()) continue;
              const role = h.role === 'assistant' ? 'model' : 'user';
              if (contents.length > 0 && contents[contents.length - 1].role === role) {
                contents[contents.length - 1].parts[0].text += '\n\n' + h.text;
              } else {
                contents.push({ role, parts: [{ text: h.text }] });
              }
            }
          }
          if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
            contents[contents.length - 1].parts[0].text += '\n\n' + userPrompt;
          } else {
            contents.push({ role: 'user', parts: [{ text: userPrompt }] });
          }

          const body = {
            contents,
            systemInstruction: systemPrompt ? {
              parts: [{ text: systemPrompt }]
            } : undefined,
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1024
            }
          };

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            const data = await response.json();
            const candidate = data.candidates?.[0];
            const text = candidate?.content?.parts?.[0]?.text;
            if (text) {
              this.lastUsedGeminiModel = m;
              return text.trim();
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            const msg = errorData.error?.message || response.statusText;
            lastError = new Error(`Gemini API Error (${response.status}): ${msg}`);
            
            // If it's 404, 503 (high demand), 429 (rate limit), or modality mismatch, failover to next model!
            const canFailover = response.status === 404
              || response.status === 503
              || response.status === 429
              || msg.toLowerCase().includes('modalities')
              || msg.toLowerCase().includes('not supported')
              || msg.toLowerCase().includes('high demand');

            if (!canFailover) {
              throw lastError;
            }
            console.warn(`[AIService] Model ${m} (${apiVer}) returned ${response.status}, failing over to next candidate...`);
          }
        } catch (err) {
          const errMsg = (err.message || '').toLowerCase();
          if (!errMsg.includes('404') && !errMsg.includes('503') && !errMsg.includes('modalities') && !errMsg.includes('high demand')) {
            throw err;
          }
          lastError = err;
        }
      }
    }

    throw lastError || new Error(`No active Gemini text model found. Available models on your key: ${availableModels.join(', ') || 'None found. Please check API key in Google AI Studio.'}`);
  },

  /**
   * 2. OpenAI / ChatGPT API (gpt-4o-mini / gpt-4o)
   */
  async callOpenAI(userPrompt, systemPrompt, apiKey, model, customEndpoint, history = []) {
    if (!apiKey && !customEndpoint) {
      throw new Error('OpenAI API Key is missing. Please enter your key in Settings.');
    }

    const base = customEndpoint ? customEndpoint.replace(/\/+$/, '') : 'https://api.openai.com/v1';
    const endpoint = `${base}/chat/completions`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (!h.text || !h.text.trim()) continue;
        messages.push({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.text
        });
      }
    }
    messages.push({ role: 'user', content: userPrompt });

    const body = {
      model: model || 'gpt-4o-mini',
      messages,
      temperature: 0.5,
      max_tokens: 1024
    };

    const headers = {
      'Content-Type': 'application/json'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || response.statusText;
      throw new Error(`OpenAI API Error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('No response returned from OpenAI.');
    }

    return text.trim();
  },

  /**
   * 3. Anthropic Claude API (claude-3-5-haiku / claude-3-5-sonnet)
   */
  async callClaude(userPrompt, systemPrompt, apiKey, model, history = []) {
    if (!apiKey) {
      throw new Error('Anthropic Claude API Key is missing. Please enter your key in Settings.');
    }

    const endpoint = 'https://api.anthropic.com/v1/messages';

    const messages = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (!h.text || !h.text.trim()) continue;
        const role = h.role === 'assistant' ? 'assistant' : 'user';
        if (messages.length > 0 && messages[messages.length - 1].role === role) {
          messages[messages.length - 1].content += '\n\n' + h.text;
        } else {
          messages.push({ role, content: h.text });
        }
      }
    }
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      messages[messages.length - 1].content += '\n\n' + userPrompt;
    } else {
      messages.push({ role: 'user', content: userPrompt });
    }

    const body = {
      model: model || 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error?.message || response.statusText;
      throw new Error(`Claude API Error (${response.status}): ${msg}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      throw new Error('No response returned from Claude.');
    }

    return text.trim();
  },

  /**
   * 4. Local LLM / Ollama (http://localhost:11434 or internal company server)
   */
  async callOllama(userPrompt, systemPrompt, customEndpoint, model, history = []) {
    const base = (customEndpoint || 'http://localhost:11434').replace(/\/+$/, '');
    const endpoint = `${base}/api/chat`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        if (!h.text || !h.text.trim()) continue;
        messages.push({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content: h.text
        });
      }
    }
    messages.push({ role: 'user', content: userPrompt });

    const body = {
      model: model || 'llama3:latest',
      messages,
      stream: false
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(err => {
      throw new Error(`Cannot connect to Ollama at ${base}. Make sure Ollama or your internal server is running. (${err.message})`);
    });

    if (!response.ok) {
      throw new Error(`Ollama Server Error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.message?.content || data.response;

    if (!text) {
      throw new Error('No response returned from Ollama server.');
    }

    return text.trim();
  },

  /**
   * 5. Chrome Built-in AI (Gemini Nano on-device)
   */
  async callChromeBuiltin(userPrompt, systemPrompt, history = []) {
    if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
      try {
        const capabilities = await window.ai.languageModel.capabilities();
        if (capabilities.available === 'no') {
          throw new Error('Chrome Built-in AI is not available on this device.');
        }

        const session = await window.ai.languageModel.create({
          systemPrompt
        });
        const result = await session.prompt(userPrompt);
        return result.trim();
      } catch (err) {
        throw new Error(`Chrome Built-in AI error: ${err.message}`);
      }
    } else {
      throw new Error('Chrome Built-in AI is not enabled. Visit chrome://flags/#prompt-api-for-gemini-nano to enable on-device AI.');
    }
  },

  generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  async isTabOpen(urlPattern) {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      try {
        const tabs = await chrome.tabs.query({ url: urlPattern });
        return tabs && tabs.length > 0;
      } catch (e) {}
    }
    return false;
  },

  /**
   * ChatGPT Web Session Integration (Uses active chatgpt.com session from browser)
   */
  async getChatGPTSession() {
    try {
      const resp = await fetch('https://chatgpt.com/api/auth/session', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.accessToken) {
          return { accessToken: data.accessToken, user: data.user };
        }
      }
    } catch (e) {
      console.warn('[AIService] chatgpt.com/api/auth/session check failed:', e);
    }

    try {
      const resp = await fetch('https://chat.openai.com/api/auth/session', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.accessToken) {
          return { accessToken: data.accessToken, user: data.user };
        }
      }
    } catch (e) {}

    return null;
  },

  async callChatGPTWeb(userPrompt, systemPrompt) {
    const session = await this.getChatGPTSession();
    if (!session || !session.accessToken) {
      const tabOpen = await this.isTabOpen('*://*.chatgpt.com/*') || await this.isTabOpen('*://*.openai.com/*');
      if (tabOpen) {
        throw new Error('ChatGPT session requires verification. Please refresh your ChatGPT tab and ensure you are logged in.');
      }
      throw new Error('Not logged into ChatGPT. Please open https://chatgpt.com in a browser tab and sign in to use your ChatGPT Pro session.');
    }

    const payload = {
      action: 'next',
      messages: [
        {
          id: this.generateUUID(),
          author: { role: 'user' },
          content: { content_type: 'text', parts: [userPrompt] }
        }
      ],
      model: 'auto',
      parent_message_id: this.generateUUID(),
      history_and_training_disabled: false
    };

    const res = await fetch('https://chatgpt.com/backend-api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
        'Accept': 'text/event-stream'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error('ChatGPT session rejected (403/401). Please visit https://chatgpt.com in your browser to refresh your session.');
      }
      if (res.status === 429) {
        throw new Error('ChatGPT rate limit reached on your web session. Please wait a moment or try again.');
      }
      throw new Error(`ChatGPT Web Error (${res.status}): ${res.statusText}`);
    }

    return await this.parseEventStreamResponse(res);
  },

  /**
   * Helper to parse Server-Sent Events (SSE) from Web AI Streams
   */
  async parseEventStreamResponse(res) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let lastText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
        if (jsonStr === '[DONE]') break;
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.message?.content?.parts) {
            lastText = parsed.message.content.parts.join('');
          } else if (parsed.conversation?.parts) {
            lastText = parsed.conversation.parts.join('');
          }
        } catch (e) {}
      }
    }

    if (!lastText && buffer) {
      try {
        const parsed = JSON.parse(buffer.replace(/^data:\s*/, ''));
        if (parsed.message?.content?.parts) lastText = parsed.message.content.parts.join('');
      } catch (e) {}
    }

    if (!lastText) {
      throw new Error('Received empty response from ChatGPT web session. Check your browser connection.');
    }
    return lastText.trim();
  },

  /**
   * Claude Web Session Integration (Uses active claude.ai session from browser)
   */
  async getClaudeSession() {
    try {
      const resp = await fetch('https://claude.ai/api/organizations', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (resp.ok) {
        const orgs = await resp.json();
        if (Array.isArray(orgs) && orgs.length > 0) {
          return { orgId: orgs[0].uuid || orgs[0].id, org: orgs[0] };
        }
      }
    } catch (e) {
      console.warn('[AIService] claude.ai/api/organizations check failed:', e);
    }
    return null;
  },

  async callClaudeWeb(userPrompt, systemPrompt) {
    const session = await this.getClaudeSession();
    if (!session || !session.orgId) {
      const tabOpen = await this.isTabOpen('*://*.claude.ai/*');
      if (tabOpen) {
        throw new Error('Claude session expired. Please refresh your claude.ai tab and verify login.');
      }
      throw new Error('Not logged into Claude. Please open https://claude.ai in a browser tab and sign in to use your Claude Pro session.');
    }

    const chatUuid = this.generateUUID();
    try {
      await fetch(`https://claude.ai/api/organizations/${session.orgId}/chat_conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          uuid: chatUuid,
          name: ''
        })
      });
    } catch (e) {}

    const compRes = await fetch(`https://claude.ai/api/organizations/${session.orgId}/chat_conversations/${chatUuid}/completion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      credentials: 'include',
      body: JSON.stringify({
        prompt: userPrompt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        model: 'claude-3-5-sonnet-20241022'
      })
    });

    if (!compRes.ok) {
      if (compRes.status === 401 || compRes.status === 403) {
        throw new Error('Claude session expired. Please visit https://claude.ai in a tab to re-authenticate.');
      }
      throw new Error(`Claude Web Error (${compRes.status}): ${compRes.statusText}`);
    }

    const reader = compRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.completion) {
            fullText += parsed.completion;
          }
        } catch (e) {}
      }
    }

    if (!fullText) {
      throw new Error('Received empty response from Claude web session.');
    }
    return fullText.trim();
  },

  /**
   * Gemini Web Session Integration (Uses active Google Gemini session from browser)
   */
  async getGeminiSession() {
    try {
      const res = await fetch('https://gemini.google.com/app', {
        credentials: 'include'
      });
      if (res.ok) {
        const text = await res.text();
        if (text.includes('SNlM0e') || text.includes('bard-root') || text.includes('SignOutOptions') || text.includes('accounts.google.com')) {
          return { active: true };
        }
      }
    } catch (e) {}
    return null;
  },

  async callGeminiWeb(userPrompt, systemPrompt, apiKey) {
    const session = await this.getGeminiSession();
    if (!session && !apiKey) {
      const tabOpen = await this.isTabOpen('*://*.gemini.google.com/*');
      if (tabOpen) {
        throw new Error('Gemini session verification needed. Please ensure you are logged into https://gemini.google.com.');
      }
      throw new Error('Not logged into Google Gemini. Please open https://gemini.google.com in a browser tab and sign in, or enter a free API key in Settings.');
    }

    if (apiKey) {
      return this.callGemini(userPrompt, systemPrompt, apiKey, 'gemini-2.0-flash');
    }

    throw new Error('Gemini web session connected! For full streaming answers without rate limits, you can also paste a free key from aistudio.google.com into Settings.');
  },

  /**
   * Test Connection Helper for Settings
   */
  async testConnection(config) {
    const startTime = Date.now();
    try {
      if (config.provider === 'chatgpt_web') {
        const session = await this.getChatGPTSession();
        if (session && session.accessToken) {
          const latency = Date.now() - startTime;
          return {
            success: true,
            message: `Connected! (${latency}ms) - Active ChatGPT Session (${session.user?.email || 'Logged In'})`
          };
        } else {
          return {
            success: false,
            message: 'Not logged into ChatGPT. Please open https://chatgpt.com in a tab and sign in.'
          };
        }
      }

      if (config.provider === 'claude_web') {
        const session = await this.getClaudeSession();
        if (session && session.orgId) {
          const latency = Date.now() - startTime;
          return {
            success: true,
            message: `Connected! (${latency}ms) - Active Claude Pro Session (${session.org?.name || 'Logged In'})`
          };
        } else {
          return {
            success: false,
            message: 'Not logged into Claude. Please open https://claude.ai in a tab and sign in.'
          };
        }
      }

      if (config.provider === 'gemini_web') {
        const session = await this.getGeminiSession();
        if (session && session.active) {
          const latency = Date.now() - startTime;
          return {
            success: true,
            message: `Connected! (${latency}ms) - Active Google Gemini Web Session`
          };
        } else {
          return {
            success: false,
            message: 'Not logged into Google Gemini. Please open https://gemini.google.com in a tab and sign in.'
          };
        }
      }

      if (config.provider === 'gemini') {
        const cleanKey = (config.apiKey || '').trim();
        if (!cleanKey) {
          throw new Error('Please enter your Google Gemini API key.');
        }

        const { models: availableModels } = await this.listGeminiModels(cleanKey);

        let targetModel = config.model ? config.model.trim().replace(/^models\//, '') : '';
        if (availableModels.length > 0) {
          if (!targetModel || !availableModels.includes(targetModel) || targetModel.includes('-tts')) {
            targetModel = availableModels.find(m => m === 'gemini-2.0-flash')
              || availableModels.find(m => m === 'gemini-2.5-flash')
              || availableModels.find(m => m.startsWith('gemini-2.0-flash') && !m.includes('-tts'))
              || availableModels.find(m => m.startsWith('gemini-2.5-flash') && !m.includes('-tts'))
              || availableModels.find(m => m.includes('flash') && !m.includes('-tts'))
              || availableModels.find(m => !m.includes('-tts') && !m.includes('embedding'))
              || availableModels[0];
          }
        } else {
          targetModel = targetModel || 'gemini-2.0-flash';
        }

        const reply = await this.callGemini(
          'Hello! Respond with: "Parivartan AI connected successfully."',
          'You are a helpful assistant.',
          cleanKey,
          targetModel
        );

        const verifiedModel = this.lastUsedGeminiModel || targetModel;
        const latency = Date.now() - startTime;
        return {
          success: true,
          message: `Connected! (${latency}ms) - Active Model: ${verifiedModel}`,
          sample: reply,
          verifiedModel: verifiedModel
        };
      }

      const reply = await this.generate({
        prompt: 'Hello! Respond with: "Parivartan AI connected successfully."',
        action: 'custom',
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        customEndpoint: config.customEndpoint,
        persona: 'concise'
      });
      const latency = Date.now() - startTime;
      return { success: true, message: `Connected! (${latency}ms)`, sample: reply };
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  /**
   * Universal Speech-to-Text Audio Transcriber
   * Works on ALL browsers (Brave, Firefox, Chrome, Linux) using Gemini 1.5 Flash or OpenAI Whisper.
   */
  async transcribeAudio(audioBlob, config = {}) {
    const provider = config.provider || 'gemini';
    const apiKey = (config.apiKey || '').trim();

    if (!apiKey && provider !== 'ollama') {
      throw new Error('Please configure your free Gemini or OpenAI API key in Settings to use Voice Dictation.');
    }

    if (provider === 'gemini') {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const candidateModels = [
        config.model,
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash-latest'
      ].filter(m => m && !m.includes('-tts'));
      const uniqueModels = [...new Set(candidateModels)];

      let lastError = null;

      for (const m of uniqueModels) {
        for (const apiVer of ['v1beta', 'v1']) {
          const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${m}:generateContent?key=${apiKey}`;

          try {
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    {
                      text: "Transcribe the spoken audio verbatim into plain text. Include natural punctuation (periods, commas, question marks) and proper capitalization. Output ONLY the raw transcribed text. Do not output any conversational remarks, notes, or code fences."
                    },
                    {
                      inline_data: {
                        mime_type: audioBlob.type || 'audio/webm',
                        data: base64Data
                      }
                    }
                  ]
                }]
              })
            });

            if (res.ok) {
              const json = await res.json();
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) return text.trim();
            } else {
              const errJson = await res.json().catch(() => ({}));
              lastError = new Error(errJson.error?.message || `Gemini API error ${res.status}`);
              const canFailover = res.status === 404 || res.status === 503 || res.status === 429;
              if (!canFailover) {
                throw lastError;
              }
            }
          } catch (err) {
            const msg = (err.message || '').toLowerCase();
            if (!msg.includes('404') && !msg.includes('503') && !msg.includes('high demand')) {
              throw err;
            }
            lastError = err;
          }
        }
      }

      throw lastError || new Error('Could not find active Gemini model for audio transcription.');
    } else if (provider === 'openai') {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `OpenAI Whisper error ${res.status}`);
      }

      const json = await res.json();
      return (json.text || '').trim();
    } else {
      throw new Error(`Audio transcription not supported for provider '${provider}'. Please select Gemini or OpenAI.`);
    }
  }
};

if (typeof window !== 'undefined') {
  window.AIService = AIService;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIService;
}
