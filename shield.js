/* 🛡️ TYPINGMIND SECURE SHIELD v2 (Aggressive Unmasking) */
(function() {
    console.log("🛡️ Shield v2 Loading...");
    
    const STORAGE_KEY = "legal_shield_map";
    // Load memory or start empty
    let map = new Map(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    
    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...map]));
    }

    function getAlias(name) {
        if (!map.has(name)) {
            let alias = `[Client_${map.size + 1}]`;
            map.set(name, alias);
            map.set(alias, name);
            save();
        }
        return map.get(name);
    }

    /* --- THE RED BUTTON --- */
    function createButton() {
        if (document.getElementById('secure-send-btn')) return;
        
        let btn = document.createElement('button');
        btn.id = 'secure-send-btn';
        btn.innerHTML = `🔒 SECURE SEND (${map.size / 2} protected)`; // Shows count
        
        btn.style.cssText = `
            position: fixed; top: 80px; right: 20px; z-index: 2147483647; 
            background: #cc0000; color: white; border: 3px solid white; 
            padding: 12px 20px; border-radius: 30px; font-weight: bold; 
            font-family: sans-serif; box-shadow: 0 5px 15px rgba(0,0,0,0.5); 
            cursor: pointer; transition: transform 0.1s;
        `;
        
        btn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            let textarea = document.querySelector('textarea');
            if (!textarea) return alert("Please click inside the chat box first.");
            
            let text = textarea.value;
            // Detect Names (Capitalized Words)
            let regex = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\b/g;
            let masked = false;
            
            text = text.replace(regex, function(match) {
                masked = true;
                return getAlias(match);
            });
            
            if (masked) {
                // Flash and Send
                let setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                setter.call(textarea, text);
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                
                btn.innerHTML = "⏳ MASKING...";
                textarea.style.backgroundColor = "#ccffcc";
                
                setTimeout(() => {
                    let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
                    if (send) send.click();
                    btn.innerHTML = `🔒 SECURE SEND (${map.size / 2} protected)`;
                    textarea.style.backgroundColor = "";
                }, 500);
            } else {
                let send = document.querySelector('button[aria-label="Send message"]') || document.querySelector('button[data-element-id="send-button"]');
                if (send) send.click();
            }
        };
        
        document.body.appendChild(btn);
    }

    /* --- THE AGGRESSIVE UNMASKER --- */
    function unmaskAll() {
        // Create button if missing
        createButton();

        // Scan the ENTIRE page for aliases like [Client_1]
        let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while (node = walker.nextNode()) {
            let txt = node.nodeValue;
            // Only process if it contains our tag
            if (txt && txt.indexOf("[Client_") !== -1) {
                map.forEach((real, alias) => {
                    if (alias.startsWith("[Client") && txt.includes(alias)) {
                        // Swap it back to Real Name with Lock Icon
                        // Using split/join handles special characters safely
                        node.nodeValue = txt.split(alias).join(`${real} 🔒`);
                    }
                });
            }
        }
    }

    // Run unmasker aggressively (every 0.5s)
    setInterval(unmaskAll, 500);
})();
