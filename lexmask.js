/* ⚖️ LexMask v6.0 (OFFLINE & UI FORCE)
 * - No external downloads (Fixes loading issues)
 * - Bright RED UI to verify installation
 */

(function() {
    // 1. CLEANUP OLD VERSIONS
    const CONTAINER_ID = 'lexmask-container';
    const old = document.getElementById(CONTAINER_ID);
    if (old) old.remove();

    console.log("🚀 LexMask v6.0 Starting...");

    // 2. SIMPLE MASKING (Regex Only for now)
    function maskText(text) {
        // Simple patterns just to test
        const patterns = [
            { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, sub: "[Email]" },
            { regex: /\b(?:\d[ -]*?){13,16}\b/g, sub: "[Card]" }
        ];
        let newText = text;
        let masked = false;
        patterns.forEach(p => {
            if (p.regex.test(newText)) {
                newText = newText.replace(p.regex, p.sub);
                masked = true;
            }
        });
        return { text: newText, wasMasked: masked };
    }

    // 3. FORCE UI CREATION
    function createUI() {
        if (document.getElementById(CONTAINER_ID)) return; // Don't duplicate

        const div = document.createElement('div');
        div.id = CONTAINER_ID;
        // BRIGHT RED STYLE - IMPOSSIBLE TO MISS
        div.style.cssText = `
            position: fixed; 
            bottom: 120px; 
            right: 20px; 
            background-color: #ff0000; 
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 999999;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            cursor: pointer;
            font-family: sans-serif;
        `;
        div.innerHTML = "🛡️ LEXMASK ACTIVE";
        
        div.onclick = () => {
            const ta = document.querySelector('textarea');
            if (ta) {
                const res = maskText(ta.value);
                ta.value = res.text;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                alert("Masking check complete!");
            } else {
                alert("No text box found!");
            }
        };

        document.body.appendChild(div);
        console.log("✅ LexMask UI Injected");
    }

    // 4. RETRY LOOP (Keeps trying every 1 second until it works)
    const interval = setInterval(() => {
        if (!document.getElementById(CONTAINER_ID)) {
            createUI();
        } else {
            // Once it exists, we can stop checking so aggressively
            clearInterval(interval);
        }
    }, 1000);
    
    // Run once immediately
    createUI();
})();
