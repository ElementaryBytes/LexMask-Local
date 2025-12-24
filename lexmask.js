/* ⚖️ LexMask v5.0 (DEBUG MODE)
 * - pops up an alert to PROVE it is loading
 */

(function() {
    // 1. THE LOUD CHECK
    alert("✅ LexMask is successfully loaded! Check the bottom right corner.");

    // 2. SETUP
    const OLD_CONTAINER_ID = 'lexmask-container';
    if (document.getElementById(OLD_CONTAINER_ID)) document.getElementById(OLD_CONTAINER_ID).remove();

    const STORAGE_KEY_SECRETS = "lexmask_secrets";
    let privateSecrets = (localStorage.getItem(STORAGE_KEY_SECRETS) || "").split(',').map(s => s.trim()).filter(s => s);

    function createUI() {
        let container = document.createElement('div');
        container.id = OLD_CONTAINER_ID;
        // High Contrast Styling to make it impossible to miss
        container.style.cssText = `
            position: fixed; bottom: 100px; right: 20px; 
            display: flex; gap: 10px; z-index: 2147483647; 
            background: red; padding: 10px; border-radius: 12px; 
            border: 2px solid white; color: white; font-weight: bold;
        `;

        let btn = document.createElement('div');
        btn.innerHTML = "⚙️ SETTINGS";
        btn.style.cursor = "pointer";
        btn.onclick = () => {
            const current = localStorage.getItem(STORAGE_KEY_SECRETS) || "";
            const result = prompt("Enter secret words (comma separated):", current);
            if (result !== null) {
                localStorage.setItem(STORAGE_KEY_SECRETS, result);
                alert("Saved!");
            }
        };

        container.appendChild(btn);
        document.body.appendChild(container);
    }

    // Try to draw immediately AND after 2 seconds
    createUI();
    setTimeout(createUI, 2000);
})();
