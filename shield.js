/* 🛡️ TYPINGMIND SECURE SHIELD v5.1 (Auto-Fetch & Decode) */
(function() {
    console.log("🛡️ Shield v5.1 Online: Auto-Fetch Enabled.");
    
    const STORAGE_KEY = "legal_shield_map";
    const PRIVATE_LIST_KEY = "shield_private_blacklist";

    // Initialize Memory
    let map = new Map(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    
    /* ⚙️ RULE CONFIGURATION */
    const privateKeywords = localStorage.getItem(PRIVATE_LIST_KEY) || "";
    const privateRule = privateKeywords ? {
        name: "Private Blacklist",
        regex: new RegExp(`\\b(${privateKeywords})\\b`, 'gi'),
        prefix: "Entity" 
    } : null;

    const corporateSuffixes = [
        "Inc", "Inc\\.", "Corp", "Corp\\.", "Ltd", "Ltd\\.", "LLC", "L\\.L\\.C\\.", 
        "GmbH", "AG", "KG", "SE", "S\\.A\\.", "S\\.A\\.S\\.", "S\\.r\\.l\\.", "S\\.p\\.A\\.", 
        "B\\.V\\.", "N\\.V\\.", "Pty\\sLtd", "Pty\\.", "Co\\.", "Company", "K\\.K\\.", "G\\.K\\."
    ].join("|");

    const RULES = [
        ...(privateRule ? [privateRule] : []),
        {
            name: "Corporate Entity",
            regex: new RegExp(`\\b([A-Z][a-zA-Z0-9&']+(?:\\s+[A-Z][a-zA-Z0-9&']+)*\\s+(?:${corporateSuffixes}))\\b`, 'g'),
            prefix: "Company"
        },
        { name: "Email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, prefix: "Email" },
        { name: "Credit Card", regex: /\b(?:\d[ -]*?){13,16}\b/g, prefix: "Card" },
        { name: "SSN/ID", regex: /\b(?:\d{3}[-.]?){2}\d{4}\b/g, prefix: "ID" },
        { name: "Proper Nouns", regex: /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\b/g, prefix: "Client" }
    ];

    function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify([...map])); }

    function getAlias(text, prefix) {
        if (!map.has(text)) {
            let count = 0;
            map.forEach((val) => { if(val.includes(`[${prefix}_`)) count++; });
            let alias = `[${prefix}_${count + 1}]`; 
            map.set(text, alias);
            map.set(alias, text);
            save();
        }
        return map.get(text);
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

    // The Logic to Restore Original Text
    function unmaskText(text) {
        let cleanText = text;
        map.forEach((realValue, alias) => {
            if (alias.startsWith("[")) {
                // Global replace of alias -> real value
                cleanText = cleanText.split(alias).join(realValue);
            }
        });
        // Remove local lock emojis
        cleanText = cleanText.replace(/ 🔒/g, "");
        return cleanText;
    }

    function handleSend(textarea, mainBtn) {
        let result = maskText(textarea.value);
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
            }, 300); 
        } else {
            let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
            if (send) send.click();
        }
    }

    /* --- UI: COMPACT GHOST DOCK --- */
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

        // 1. Shield Button (Force Send)
        let btn = document.createElement('div');
        btn.innerHTML = `🛡️`;
        btn.title = "Shield Active";
        btn.style.cssText = `cursor: pointer; padding: 5px; font-size: 16px; transition: transform 0.1s;`;
        btn.onclick = (e) => {
            e.preventDefault();
            btn.style.transform = "scale(0.9)";
            setTimeout(()=>btn.style.transform = "scale(1)", 100);
            let textarea = document.querySelector('textarea');
            if (textarea) handleSend(textarea);
        };

        // 2. Ghost Copy Button (Smart Fetch)
        let copyBtn = document.createElement('div');
        copyBtn.innerHTML = `📋`;
        copyBtn.title = "Copy Original (Selection OR Last AI Response)";
        copyBtn.style.cssText = `cursor: pointer; padding: 5px; font-size: 16px; border-left: 1px solid #555; transition: transform 0.1s;`;
        
        copyBtn.onclick = async (e) => {
            e.preventDefault();
            copyBtn.style.transform = "scale(0.9)";
            
            // Logic: Selection > Last AI Message > Input Box
            let textToProcess = "";
            let selection = window.getSelection().toString();

            if (selection) {
                // User highlighted specific text
                textToProcess = selection;
            } else {
                // Auto-Fetch: Find the last AI message bubble
                let messages = document.querySelectorAll('[data-element-id="ai-message"]');
                if (messages.length > 0) {
                    textToProcess = messages[messages.length - 1].innerText;
                } else {
                    // Fallback to input box
                    let textarea = document.querySelector('textarea');
                    if (textarea) textToProcess = textarea.value;
                }
            }

            if (textToProcess) {
                let clean = unmaskText(textToProcess);
                try {
                    await navigator.clipboard.writeText(clean);
                    copyBtn.innerHTML = "✅"; 
                } catch (err) {
                    copyBtn.innerHTML = "❌";
                }
            }
            setTimeout(() => { copyBtn.innerHTML = "📋"; copyBtn.style.transform = "scale(1)"; }, 1500);
        };

        // Local Unmasking (Reader View)
        setInterval(() => {
            let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while (node = walker.nextNode()) {
                let txt = node.nodeValue;
                if (txt && txt.includes("[") && txt.includes("]")) {
                    map.forEach((real, alias) => {
                        if (alias.startsWith("[") && txt.includes(alias) && !txt.includes("🔒")) {
                            if(txt.indexOf(alias) !== -1) {
                                node.nodeValue = txt.split(alias).join(`${real} 🔒`);
                            }
                        }
                    });
                }
            }
        }, 800);

        container.appendChild(btn);
        container.appendChild(copyBtn);
        document.body.appendChild(container);
    }
    
    setTimeout(initUI, 2000);
})();
