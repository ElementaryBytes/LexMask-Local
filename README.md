# ⚖️ LexMask Local

**A client-side privacy shield for TypingMind.**

LexMask Local is a lightweight JavaScript extension that automatically redacts Personally Identifiable Information (PII) from your prompts *before* they are sent to AI providers (OpenAI, Anthropic, etc.).

It runs 100% in your browser. No proxies, no external servers, and no data leaks.

## 🚀 Features

* **🛡️ Client-Side Redaction:** Sensitive data is masked locally (e.g., `John Doe` → `[Client_1]`) before the request leaves your computer.
* **🧠 Hybrid Engine:** Uses **Compromise.js** (NLP) for smart entity detection and Regex for strict patterns (Emails, IDs, Cards).
* **📋 Precision Decryption:** One-click copy button to restore original names when copying AI responses.
* **⚡ Zero Latency:** No server round-trips required.

## 🛠️ Installation in TypingMind

1.  Open **TypingMind** settings.
2.  Navigate to **Extension** > **Web Extension**.
3.  Create a new extension and paste the code from `lexmask.js`.
4.  Save and refresh. You will see the 🛡️ Shield icon in the bottom right.

## 💡 How it Works

1.  **Type:** "Draft a contract for John Smith regarding the merger with Acme Corp."
2.  **Click Shield (🛡️):** The script intercepts the text.
3.  **AI Receives:** "Draft a contract for [Client_1] regarding the merger with [Company_1]."
4.  **AI Responds:** "Here is the contract for [Client_1]..."
5.  **You See:** "Here is the contract for John Smith 🔒..." (Auto-decoded locally).

## 🔒 Privacy Note

This tool is designed to assist with data minimization. It runs entirely on the client side using your browser's local storage to map aliases. 
* No data is sent to the developers of LexMask.
* Persistence is handled via `localStorage` on your device.

## 📄 License

MIT License. Free for personal and professional use.

