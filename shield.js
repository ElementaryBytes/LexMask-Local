/* 🛡️ TYPINGMIND SECURE SHIELD v6.1 (Sanitized Input & Focus-Lock Copy) */
(function() {
    const oldContainer = document.getElementById('shield-container');
    if (oldContainer) oldContainer.remove();

    console.log("🛡️ Shield v6.1 Online: Input Sanitization Active.");
    
    const STORAGE_KEY = "legal_shield_map";
    const PRIVATE_LIST_KEY = "shield_private_blacklist";

    let map = new Map(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    
    const privateKeywords = localStorage.getItem(PRIVATE_LIST_KEY) || "";
    const privateRule = privateKeywords ? {
        name: "Private Blacklist",
        regex: new RegExp(`\\b(${privateKeywords})\\b`, 'gi'),
        prefix: "Entity" 
    } : null;

    const corporateSuffixes = [
        "Inc\\.?", "Corp\\.?", "Ltd\\.?", "LLC", "L\\.L\\.C\\.?", 
        "GmbH", "AG", "KG", "SE", "S\\.A\\.?", "S\\.A\\.S\\.?", "S\\.r\\.l\\.?", 
        "B\\.V\\.?", "N\\.V\\.?", "Pty\\sLtd", "Co\\.?", "Company", "K\\.K\\.?", "G\\.K\\.?"
    ].join("|");

    const RULES = [
        ...(privateRule ? [privateRule] : []),
        {
            name: "Corporate Entity",
            regex: new RegExp(`\\b([A-Z][a-zA-Z0-9&']+(?:\\s+[A-Z][a-zA-Z0-9&']+)*\\s+(?:${corporateSuffixes}))`, 'gi'),
            prefix: "Company"
        },
        { name: "Email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, prefix: "Email" },
        { name: "Credit Card", regex: /\b(?:\d[ -]*?){13,16}\b/g, prefix: "Card" },
        { name: "SSN/ID", regex: /\b(?:\d{3}[-.]?){2}\d{4}\b/g, prefix: "ID" },
        { name: "Proper Nouns", regex: /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\b/g, prefix: "Client" }
    ];

    function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...map])); }

    function getAlias(text, prefix) {
        const key = text.trim(); 
        if (!map.has(key)) {
            let count = 0;
            map.forEach((val) => { if(val.includes(`[${prefix}_`)) count++; });
            let alias = `[${prefix}_${count + 1}]`; 
            map.set(key, alias);
            map.set(alias, key);
            save();
        }
        return map.get(key);
    }

    function maskText(text) {
        let newText = text;
        let masked = false;
        RULES.forEach(rule => {
            newText = newText.replace(rule.regex, function(match) {
                masked = true;
                return getAlias(match, rule.prefix);
            });
        });
        return { text: newText, wasMasked: masked };
    }

    function unmaskText(text) {
        let cleanText = text;
        cleanText = cleanText.replace(/ 🔒/g, ""); // Remove artifacts
        const aliasPattern = /\[(Client|Company|Entity|Email|Card|ID)_\d+\]/g;
        cleanText = cleanText.replace(aliasPattern, (match) => {
            if (map.has(match)) return map.get(match);
            return match; 
        });
        return cleanText;
    }

    function handleSend(textarea) {
        // 1. SANITIZE: Remove any "Reader View" artifacts (locks/real names) before processing
        // This ensures we mask the RAW text, not the visual text
        let rawValue = textarea.value.replace(/ 🔒/g, "");
        
        let result = maskText(rawValue);
        
        if (result.wasMasked) {
            let setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            setter.call(textarea, result.text);
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            
            textarea.style.transition = "background 0.2s";
            textarea.style.backgroundColor = "#d4edda";
            setTimeout(() => { 
                let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
                if (send) send.click();
                textarea.style.backgroundColor = "";
            }, 200);
        } else {
            let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
            if (send) send.click();
        }
    }

    function initUI() {
        if (document.getElementById('shield-container')) return;

        let container = document.createElement('div');
        container.id = 'shield-container';
        container.style.cssText = `
            position: fixed; bottom: 80px; right: 20px; 
            display: flex; gap: 4px; z-index: 9999; 
            opacity: 0.3; transition: opacity 0.2s; 
            font-family: sans-serif;
            background: rgba(0,0,0,0.5); padding: 4px; border-radius: 8px;
        `;
        container.onmouseenter = () => container.style.opacity = "1";
        container.onmouseleave = () => container.style.opacity = "0.3";

        // Shield Button (Click to Send)
        let btn = document.createElement('div');
        btn.innerHTML = `🛡️`;
        btn.title = "Shield Active";
        btn.style.cssText = `cursor: pointer; padding: 5px; font-size: 16px;`;
        
        // Use mousedown to prevent focus loss issues
        btn.onmousedown = (e) => {
            e.preventDefault();
            let textarea = document.querySelector('textarea');
            if (textarea) handleSend(textarea);
        };

        // Ghost Copy Button
        let copyBtn = document.createElement('div');
        copyBtn.innerHTML = `📋`;
        copyBtn.title = "Copy Selection (Unmasked)";
        copyBtn.style.cssText = `cursor: pointer; padding: 5px; font-size: 16px; border-left: 1px solid #555;`;
        
        // Notification
        let notif = document.createElement('div');
        notif.style.cssText = `position: absolute; bottom: 40px; right: 0; background: #222; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; opacity: 0; pointer-events: none; transition: opacity 0.2s; white-space: nowrap;`;
        container.appendChild(notif);

        // MOUSE DOWN EVENT: Grabs selection BEFORE click clears it
        copyBtn.onmousedown = async (e) => {
            e.preventDefault();
            
            // 1. Grab Highlighted Text IMMEDIATELY
            let textToProcess = window.getSelection().toString();
            
            if (!textToProcess) {
                // If no selection, check input box
                let textarea = document.querySelector('textarea');
                if (textarea && textarea.value) textToProcess = textarea.value;
            }

            // Fallback: Last AI message
            if (!textToProcess) {
                let messages = document.querySelectorAll('[data-element-id="ai-message"]');
                if (messages.length > 0) textToProcess = messages[messages.length - 1].innerText;
            }

            if (textToProcess) {
                let clean = unmaskText(textToProcess);
                try {
                    await navigator.clipboard.writeText(clean);
                    copyBtn.innerHTML = "✅";
                    notif.innerText = `Copied Unmasked`;
                    notif.style.opacity = "1";
                    setTimeout(() => notif.style.opacity = "0", 2000);
                } catch (err) { copyBtn.innerHTML = "❌"; }
            } else {
                copyBtn.innerHTML = "⚠️"; 
            }
            setTimeout(() => { copyBtn.innerHTML = "📋"; }, 1000);
        };

        // Reader View
        setInterval(() => {
            let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                let txt = node.nodeValue;
                if (txt && txt.includes("[") && txt.includes("]") && !txt.includes("🔒")) {
                    map.forEach((real, alias) => {
                        if (alias.startsWith("[") && txt.includes(alias)) {
                            // Only unmask inside message bubbles or input, not in system areas
                            if (node.parentElement && node.parentElement.tagName !== 'SCRIPT' && node.parentElement.tagName !== 'STYLE') {
                                node.nodeValue = txt.split(alias).join(`${real} 🔒`);
                            }
                        }
                    });
                }
            }
        }, 500);

        container.appendChild(btn);
        container.appendChild(copyBtn);
        document.body.appendChild(container);
    }
    
    setTimeout(initUI, 1000);
})();
