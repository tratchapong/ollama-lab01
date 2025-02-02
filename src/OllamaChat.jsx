import React, { useState } from "react";

const OllamaChat = () => {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        setResponse(""); // Clear previous response
        setLoading(true);

        try {
            const res = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "deepseek-r1:7b",  // Change this to the installed model name
                    prompt: input,
                    stream: true
                })
            });
            console.log(res.body)
            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                console.log(chunk)

                // Handle multiple JSON objects per chunk
                chunk.trim().split("\n").forEach((line) => {
                    if (line) {
                        try {
                            const json = JSON.parse(line);
                            setResponse((prev) => prev + json.response);
                        } catch (err) {
                            console.error("Error parsing JSON:", err);
                        }
                    }
                });
            }

        } catch (error) {
            console.error("Error communicating with Ollama:", error);
            setResponse("Error fetching response.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 border rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Ollama Chat</h2>
            <textarea
                className="w-full p-2 border rounded mb-2"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your prompt..."
            />
            <button 
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={handleSend}
                disabled={loading}
            >
                {loading ? "Loading..." : "Send"}
            </button>
            <div className="mt-4 p-2 border rounded bg-gray-100 min-h-[100px]">
                <strong>Response:</strong>
                <p>{response}</p>
            </div>
        </div>
    );
};

export default OllamaChat;
