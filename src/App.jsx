import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";

const allModels = ["deepseek-r1:1.5b", "deepseek-r1:7b","deepseek-r1:8b", "llava:7b", "wizardlm2:latest"];

const toBase64 = (file) => {
  return new Promise((rs, rj) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => rs(reader.result.split(",")[1]);
    reader.onerror = () => rj(error);
  });
};

function App() {
  const [prompt, setPrompt] = useState("");
  const [selModel, setSelModel] = useState('deepseek-r1:7b')
  const [selFile, setSelFile] = useState(null);
  const [resp, setResp] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const divRef = useRef(null);

  // const sendPrompt = async () => {
  //   const response = await axios.post(
  //     "http://localhost:11434/api/generate",
  //     {
  //       model: "deepseek-r1:1.5b",
  //       prompt: prompt,
  //       stream: true,
  //     },
  //     {
  //       responseType: "stream",
  //     }
  //   );
  //   response?.data?.on("data", (chunk) => {
  //     const text = chunk.toString();
  //     console.log("Chunk:", text);
  //   });
  //   response?.data?.on("end", () => {
  //     console.log("Stream ended.");
  //   });
  // };

  useEffect(() => {
    if (divRef.current) {
      // console.log(divRef.current.scrollHeight)
      // document.body.scrollTop = divRef.current.scrollHeight
      // window.scrollTo({top: divRef.current.scrollHeight})
      divRef.current.scrollTo({ top: divRef.current.scrollHeight });
    }
  }, [resp]);

  useEffect(() => {
    if (selFile) {
      setImgSrc(URL.createObjectURL(selFile));
    }
  }, [selFile]);

  const sendPrompt = async () => {
    if (!prompt.trim() && selModel !== 'llava:7b') return;
    setResp("");
    setLoading(true);
    const Img64 = selFile ? await toBase64(selFile) : "";
    // console.log(Img64)
    const rs = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: selModel,
        prompt: prompt.trim() || "describe this image",
        images: [Img64],
        stream: true,
        keep_alive: 0,
      }),
    });
    if (!rs.body) return alert("no response body");

    const reader = rs.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      chunk
        .trim()
        .split("\n")
        .forEach((el) => {
          if (el) {
            const data = JSON.parse(el);
            console.log(data);
            setResp((prv) => prv + data.response);
          }
        });
    }
    setLoading(false);
  };

  const hdlFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelFile(e.target.files[0]);
    }
  };

  const hdlClear = () => {
    setPrompt("");
    setSelFile(null);
    setResp("");
  };
  const hdlSubmit = (e) => {
    e.preventDefault();
    sendPrompt();
  };
  return (
    <div className="max-w-screen-xl mx-auto flex flex-col gap-3 max-xl:mx-4 h-screen">
      <div className="text-3xl border bg-blue-300 text-slate-600 p-2 flex justify-between">
        <span>Ollama Lab , <span className="text-pink-600"> Active model = {selModel || 'none' }</span></span>
        <select defaultValue="" className="select me-[12%]"
          value={selModel}
          onChange={e=>setSelModel(e.target.value)}
        >
          <option disabled={true} value=''>Select LLM Model</option>
          { allModels.map(el => (
            <option key={el}>{el}</option>
          ))}
        </select>
      </div>
      <form onSubmit={hdlSubmit} className="flex gap-2">
        <input
          placeholder="Type here"
          className="input text-xl flex-1"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        <input
          type="file"
          className="file-input"
          accept="image/*"
          onChange={hdlFileChange}
        />
        <button className="btn btn-primary" disabled={loading}>
          Go
        </button>
        <button className="btn btn-outline" onClick={hdlClear}>
          clear
        </button>
      </form>
      <div className=" p-3 border border-amber-200">
        {selFile && <img src={imgSrc} className="h-100 block mx-auto" />}
      </div>
      <div
        ref={divRef}
        className="p-3 px-5 bg-amber-100 h-[700px] overflow-scroll"
      >
        <ReactMarkdown className="text-slate-500 text-xl leading-9">
          {resp}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default App;
