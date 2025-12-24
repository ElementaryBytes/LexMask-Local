/* * ⚖️ LexMask Local v1.0
 * Client-Side PII Redaction for TypingMind
 * * Architecture:
 * - Runs 100% in the browser (Data never leaves the device unmasked)
 * - Hybrid Engine: Compromise.js (NLP) + Regex Fallbacks
 * - Zero-Latency: Hooks into the textarea before send
 */

(function() {
    // --- 1. SETUP & UTILS ---
    const OLD_CONTAINER_ID = 'lexmask-container';
    const existingContainer = document.getElementById(OLD_CONTAINER_ID);
    if (existingContainer) existingContainer.remove();

    console.log("⚖️ LexMask Local v1.0 Online: Client-Side Redaction Active.");
    
    const STORAGE_KEY = "lexmask_entity_map"; // Renamed for consistency
    
    // Load Persistence Layer (Memory of who [Client_1] actually is)
    let entityMap = new Map(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));

    function saveToMemory() { 
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...entityMap])); 
    }

    // Smart Alias Generator (e.g., "John Doe" -> "[Client_1]")
    function getAlias(text, prefix) {
        const key = text.trim(); 
        if (!entityMap.has(key)) {
            let count = 0;
            entityMap.forEach((val) => { if(val.includes(`[${prefix}_`)) count++; });
            
            let alias = `[${prefix}_${count + 1}]`; 
            entityMap.set(key, alias);
            entityMap.set(alias, key); // Bi-directional mapping for decryption
            saveToMemory();
        }
        return entityMap.get(key);
    }

    // --- 2. DYNAMIC NLP ENGINE LOADER ---
    // Loads Compromise.js from CDN for lightweight Named Entity Recognition
    let nlpReady = false;
    const script = document.createElement('script');
    script.src = "https://unpkg.com/compromise@latest/builds/compromise.min.js";
    script.onload = () => { 
        console.log("🧠 LexMask NLP Engine Loaded"); 
        nlpReady = true; 
    };
    script.onerror = () => console.warn("⚠️ NLP Failed to Load. Falling back to Regex only.");
    document.head.appendChild(script);

    // --- 3. CORE MASKING ENGINE ---
    function maskText(text) {
        let cleanText = text;
        let masked = false;

        // Phase A: NLP (Smart Detection for Names/Orgs)
        if (nlpReady && window.nlp) {
            const doc = window.nlp(cleanText);
            
            // Mask People
            doc.people().forEach(p => {
                const name = p.text();
                // Safety: Only mask names longer than 2 chars to avoid false positives
                if (name.length > 2) { 
                    const alias = getAlias(name, "Client");
                    // Global replace ensures all instances in the text are caught
                    cleanText = cleanText.replace(new RegExp(`\\b${name}\\b`, 'g'), alias);
                    masked = true;
                }
            });

            // Mask Organizations
            doc.organizations().forEach(o => {
                const org = o.text();
                if (org.length > 2) {
                    const alias = getAlias(org, "Company");
                    cleanText = cleanText.replace(new RegExp(`\\b${org}\\b`, 'g'), alias);
                    masked = true;
                }
            });
        }

        // Phase B: Regex (Pattern Detection for fixed formats)
        // Note: These patterns are standard for generic PII detection
        const STATIC_RULES = [
            { name: "Email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, prefix: "Email" },
            { name: "Credit Card", regex: /\b(?:\d[ -]*?){13,16}\b/g, prefix: "Card" },
            { name: "SSN/ID Format", regex: /\b(?:\d{3}[-.]?){2}\d{4}\b/g, prefix: "ID" }
        ];

        STATIC_RULES.forEach(rule => {
            cleanText = cleanText.replace(rule.regex, function(match) {
                masked = true;
                return getAlias(match, rule.prefix);
            });
        });

        return { text: cleanText, wasMasked: masked };
    }

    // --- 4. UNMASKING & UI LOGIC ---
    function unmaskText(text) {
        let cleanText = text.replace(/ 🔒/g, ""); 
        const aliasPattern = /\[(Client|Company|Entity|Email|Card|ID)_\d+\]/g;
        return cleanText.replace(aliasPattern, (match) => entityMap.has(match) ? entityMap.get(match) : match);
    }

    function handleSend(textarea) {
        let rawValue = textarea.value.replace(/ 🔒/g, "");
        let result = maskText(rawValue);
        
        if (result.wasMasked) {
            // Securely set the new value compatible with React/Frameworks
            let setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            setter.call(textarea, result.text);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Visual confirmation (Green Flash)
            textarea.style.transition = "background 0.2s";
            textarea.style.backgroundColor = "#d4edda"; 
            
            setTimeout(() => { 
                // Auto-click the send button after masking
                let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
                if (send) send.click();
                textarea.style.backgroundColor = "";
            }, 200);
        } else {
            // If no PII found, send immediately
            let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
            if (send) send.click();
        }
    }

    // --- 5. THE HEADS-UP DISPLAY (HUD) ---
    function initUI() {
        if (document.getElementById(OLD_CONTAINER_ID)) return;

        let container = document.createElement('div');
        container.id = OLD_CONTAINER_ID;
        container.style.cssText = `
            position: fixed; bottom: 80px; right: 20px; 
            display: flex; gap: 4px; z-index: 9999; 
            opacity: 0.5; transition: opacity 0.2s; 
            font-family: sans-serif; background: #222; 
            padding: 4px; border-radius: 8px; border: 1px solid #444; color: #fff;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        container.onmouseenter = () => container.style.opacity = "1";
        container.onmouseleave = () => container.style.opacity = "0.5";

        // Shield Button (The Trigger)
        let btn = document.createElement('div');
        btn.innerHTML = `🛡️`;
        btn.title = "Secure Send (Auto-Masks PII)";
        btn.style.cssText = `cursor: pointer; padding: 6px; font-size: 18px; user-select: none;`;
        btn.onmousedown = (e) => {
            e.preventDefault(); 
            let textarea = document.querySelector('textarea');
            if (textarea) handleSend(textarea);
        };

        // Decrypt Copy Button (The Retriever)
        let copyBtn = document.createElement('div');
        copyBtn.innerHTML = `📋`;
        copyBtn.title = "Copy Selection Unmasked";
        copyBtn.style.cssText = `cursor: pointer; padding: 6px; font-size: 18px; border-left: 1px solid #555; user-select: none;`;
        
        copyBtn.onmousedown = async (e) => {
            e.preventDefault();
            let textToProcess = window.getSelection().toString();
            
            // Smart Fallback: If no text selected, grab the last AI response
            if (!textToProcess) {
                 let messages = document.querySelectorAll('[data-element-id="ai-message"]');
                 if (messages.length > 0) textToProcess = messages[messages.length - 1].innerText;
            }

            if (textToProcess) {
                let clean = unmaskText(textToProcess);
                await navigator.clipboard.writeText(clean);
                copyBtn.innerHTML = "✅";
                setTimeout(() => copyBtn.innerHTML = "📋", 1000);
            }
        };

        // Live Reader Overlay (Optional Visual Helper)
        // Scans DOM for aliases and helps user read them by hovering/viewing (Does not change DOM permanent)
        setInterval(() => {
            // Safety check for performance
            if (document.hidden) return; 

            let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                let txt = node.nodeValue;
                if (txt && txt.includes("[") && txt.includes("]") && !txt.includes("🔒")) {
                   // Only process likely aliases to save CPU
                   if (/\[(Client|Company|Entity|Email|Card)_\d+\]/.test(txt)) {
                        entityMap.forEach((real, alias) => {
                            if (txt.includes(alias)) {
                                if (node.parentElement && node.parentElement.closest('[data-element-id]')) {
                                    // Visual only - adds lock icon to show it's being managed
                                    node.nodeValue = txt.split(alias).join(`${real} 🔒`);
                                }
                            }
                        });
                   }
                }
            }
        }, 1000);

        container.appendChild(btn);
        container.appendChild(copyBtn);
        document.body.appendChild(container);
    }
    
    // Initialize after short delay to ensure DOM is ready
    setTimeout(initUI, 1000);
})();

