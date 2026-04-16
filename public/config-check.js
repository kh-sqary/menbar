/* 
   Khotba Configuration Checker
   Helpful for debugging why the AI is not connecting.
*/
(function() {
    console.log("%c[Khotba Config Check]", "color: #3498db; font-weight: bold;");
    
    setTimeout(() => {
        if (!window.KhotbaConfig) {
            console.warn("%c[!] KhotbaConfig is NOT found.", "color: #e67e22; font-weight: bold;");
            console.info("Reason: The 'config.js' file might be missing or failed to load.");
            console.info("Solution: Copy 'config.js.example' to 'config.js' locally, OR set up Environment Variables on your hosting platform.");
        } else {
            const keys = Object.keys(window.KhotbaConfig);
            console.log("%c[✓] KhotbaConfig loaded successfully.", "color: #2ecc71;");
            console.log("Available keys:", keys.join(", "));
            
            keys.forEach(key => {
                if (!window.KhotbaConfig[key] || window.KhotbaConfig[key].includes("YOUR_")) {
                    console.warn(`%c[!] Key '${key}' appears to be empty or a placeholder.`, "color: #e67e22;");
                }
            });
        }
    }, 1000); // Check after a delay to ensure loading
})();
