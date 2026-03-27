/*
"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

type Props = {
  agentBase: string;
  onClose?: () => void;
};

export default function ShellTerminal({ agentBase, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const abortRef = useRef<AbortController | null>(null);
  const [cwd, setCwd] = useState<string>("");
  const cwdRef = useRef<string>("");
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const envRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      convertEol: true,
      theme: { background: "#1e1e1e" },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    termRef.current = term;
    fitRef.current = fit;
    if (containerRef.current) {
      term.open(containerRef.current);
      fit.fit();
    }
    term.writeln("Agent Shell - enter a command and press Enter");
    term.writeln("Example: ipconfig /all");
    term.write((cwdRef.current ? cwdRef.current + "> " : "$ "));

    const onData = (data: string) => {
      if (data === "\r" || data === "\n") {
        // Enter
        const inputValue = currentInputRef.current?.trim() || "";
        if (inputValue) {
          runCommand(inputValue);
        } else {
          term.write("\r\n" + (cwdRef.current ? cwdRef.current + "> " : "$ "));
        }
      } else if (data === "\u007F") {
        // Backspace
        if ((currentInputRef.current || "").length > 0) {
          setCurrentInput((s) => s.slice(0, -1));
          term.write("\b \b");
        }
      } else if (data) {
        setCurrentInput((s) => s + data);
        term.write(data);
      }
    };

    term.onData(onData);

    const handleResize = () => {
      try { fit.fit(); } catch {}
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, []);

  const currentInputRef = useRef<string>("");
  useEffect(() => {
    currentInputRef.current = currentInput;
  }, [currentInput]);
  useEffect(() => {
    cwdRef.current = cwd;
  }, [cwd]);
  useEffect(() => {
    envRef.current = envVars;
  }, [envVars]);

  const toBackslash = (p: string) => p.replace(/[\/]+/g, "\\");
  const stripQuotes = (s: string) => s.replace(/^\s*["']?(.*?)["']?\s*$/, "$1");
  const joinWindowsPath = (base: string | undefined | null, rel: string): string => {
    const driveMatch = /^([A-Za-z]):/.exec(rel || "");
    if (driveMatch) {
      // Absolute like C:\path or C:
      const after = (rel || "").slice(2);
      const drive = (driveMatch && driveMatch[1]) ? driveMatch[1].toUpperCase() : "C";
      if (!after || after === "\\") return `${drive}:\\`;
      return toBackslash(`${drive}:\\${after.replace(/^\\/, "")}`);
    }
    if ((rel || "").startsWith("\\\\")) return toBackslash(rel || ""); // UNC
    if ((rel || "").startsWith("\\")) {
      // Root of current drive
      const curDrive = /^([A-Za-z]):/.exec(base || "C:\\")?.[1] || "C";
      return toBackslash(`${curDrive.toUpperCase()}:\\${rel.replace(/^\\+/, "")}`);
    }
    // Relative
    const baseSafe = base || "C:\\";
    const baseDrive = /^([A-Za-z]):/.exec(baseSafe)?.[1] || "C";
    const basePath = toBackslash(baseSafe || `${baseDrive.toUpperCase()}:\\`);
    const parts = basePath.replace(/^([A-Za-z]:)\\?/, "").split("\\").filter(Boolean);
    for (const seg of toBackslash(rel || "").split("\\")) {
      if (!seg || seg === ".") continue;
      if (seg === "..") { parts.pop(); continue; }
      parts.push(seg);
    }
    return `${baseDrive.toUpperCase()}:\\${parts.join("\\")}`;
  };

  const runCommand = async (line: string) => {
    if (!termRef.current) return;
    const term = termRef.current;
    setIsBusy(true);
    try {
      // Remove control chars and normalize spaces
      const cleaned = line
        .replace(/[\x00-\x1F\x7F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const tokens = cleaned.split(" ");
      const cmd = tokens[0] || "";
      const rest = tokens.slice(1);
      const args = rest.join(" ").trim();

      // Handle local 'cd' without server call
      if (cmd.toLowerCase() === "cd") {
        const targetRaw = stripQuotes(args);
        if (!targetRaw) {
          term.writeln("\r\n" + (cwdRef.current || "(default)"));
        } else {
          try {
            const next = joinWindowsPath(cwdRef.current, targetRaw);
            setCwd(next);
            term.writeln("\r\ncwd → " + next);
          } catch (e: any) {
            term.writeln("\r\ncd 오류: " + (e?.message || String(e)));
          }
        }
        // prompt
        term.write("\r\n" + (cwdRef.current ? cwdRef.current + "> " : "$ "));
        return;
      }

      // Drive change like `D:`
      const driveMatch = /^([A-Za-z]):$/.exec(cleaned);
      if (driveMatch && driveMatch[1]) {
        const drive = String(driveMatch[1]).toUpperCase();
        const next = `${drive}:\\`;
        setCwd(next);
        term.writeln("\r\ncwd → " + next);
        term.write("\r\n" + (cwdRef.current ? cwdRef.current + "> " : "$ "));
        return;
      }

      // ENV set like: set NAME=VALUE (cmd 스타일)
      const setMatch = /^set\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/i.exec(cleaned);
      if (setMatch) {
        const key: string = String(setMatch[1] || "");
        const val: string = stripQuotes(setMatch[2] ?? "");
        setEnvVars((prev: Record<string, string>) => ({ ...prev, [key]: val }));
        term.writeln(`\r\n${key}=${val}`);
        term.write("\r\n" + (cwdRef.current ? cwdRef.current + "> " : "$ "));
        return;
      }

      // Helpers
      if (cmd.toLowerCase() === "pwd") {
        term.writeln("\r\n" + (cwdRef.current || "(default)"));
        term.write("\r\n" + (cwdRef.current ? cwdRef.current + "> " : "$ "));
        return;
      }
      if (cmd.toLowerCase() === "cls") {
        term.clear();
        term.write(cwdRef.current ? cwdRef.current + "> " : "$ ");
        return;
      }

      // Build a wrapped command to emulate session: cd + set envs + user command
      const prelude: string[] = [];
      if (cwdRef.current) prelude.push(`cd /d "${cwdRef.current}"`);
      const envPairs = envRef.current || {};
      for (const k of Object.keys(envPairs)) {
        const vv = envPairs[k] ?? "";
        prelude.push(`set "${String(k)}=${String(vv)}"`);
      }
      const wrapped = [...prelude, cleaned].join(" && ");
      const body: any = { cmd: "cmd", args: `/d /s /c "${wrapped}"`, timeoutMs: 15000 };
      if (cwdRef.current) body.cwd = cwdRef.current;
      const url = `${agentBase}/v1/shell/exec/stream`;
      term.writeln("\r\n→ POST /v1/shell/exec:stream");
      term.writeln("URL: " + url);
      term.writeln("Raw: " + JSON.stringify({ line }));
      term.writeln("Cleaned: " + JSON.stringify({ cleaned }));
      term.writeln("Request: " + JSON.stringify(body));
      abortRef.current = new AbortController();
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { Accept: "text/event-stream, text/plain, application/x-ndjson, application/json", "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
        signal: abortRef.current.signal,
      });
      console.log("res", res);
      const ct = res.headers.get("content-type") || "";
      term.writeln(`Status: ${res.status} ${res.statusText} | Content-Type: ${ct || "(none)"}`);
      const reader = res.body?.getReader();
      if (!reader || typeof reader.read !== "function") {
        term.writeln("\r\n(스트리밍 미지원: body reader 없음)\r\n");
      } else {
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        const isSse = ct.includes("text/event-stream");
        const findSseSeparator = (buf: string): number => {
          const a = buf.indexOf("\n\n");      // LF LF
          const b = buf.indexOf("\r\n\r\n"); // CRLF CRLF
          const c = buf.indexOf("\r\r");      // CR CR (rare)
          let min = -1;
          for (const v of [a, b, c]) {
            if (v !== -1 && (min === -1 || v < min)) min = v;
          }
          return min;
        };
        let processed = 0;
        const yieldFrame = async () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          if (isSse) {
            // Process SSE frames separated by double newline
            let sepIdx;
            while ((sepIdx = findSseSeparator(buffer)) !== -1) {
              const frame = buffer.slice(0, sepIdx);
              // Advance past the matched separator length
              if (buffer.startsWith("\r\n", sepIdx)) {
                buffer = buffer.slice(sepIdx + 4);
              } else if (buffer.startsWith("\n\n", sepIdx)) {
                buffer = buffer.slice(sepIdx + 2);
              } else {
                buffer = buffer.slice(sepIdx + 2);
              }
              const lines = frame.split(/\r?\n/);
              let eventName = "message";
              let dataParts: string[] = [];
              for (const l of lines) {
                if (l.startsWith("event:")) eventName = l.slice(6).trim();
                if (l.startsWith("data:")) dataParts.push(l.slice(5).trim());
              }
              let dataText = dataParts.join("\n");
              // unescape server's \n → newline
              dataText = dataText.replace(/\\n/g, "\n");
              if (eventName === "stdout") {
                term.writeln(dataText);
              } else if (eventName === "stderr") {
                term.writeln("\x1b[31m" + dataText + "\x1b[0m");
              } else if (eventName === "finish") {
                term.writeln(`\r\n(exit ${dataText})`);
              } else if (eventName === "error") {
                term.writeln("\x1b[31m" + dataText + "\x1b[0m");
              } else {
                term.writeln(dataText);
              }
              processed++;
              if (processed % 20 === 0) {
                term.refresh(0, term.rows - 1);
                await yieldFrame();
              }
            }
          } else {
            // Plain/NDJSON line mode
            let idx;
            while ((idx = buffer.indexOf("\n")) !== -1) {
              const lineOut = buffer.slice(0, idx).replace(/\r$/, "");
              buffer = buffer.slice(idx + 1);
              if (!lineOut) { term.writeln(""); continue; }
              try {
                const obj = JSON.parse(lineOut);
                const out = obj.stdout || obj.output || "";
                const err = obj.stderr || obj.error || "";
                if (out) term.writeln(out);
                if (err) term.writeln("\x1b[31m" + err + "\x1b[0m");
              } catch {
                term.writeln(lineOut);
              }
              processed++;
              if (processed % 20 === 0) {
                term.refresh(0, term.rows - 1);
                await yieldFrame();
              }
            }
          }
        }
        if (buffer && !isSse) term.writeln(buffer);
        const exitHeader = res.headers.get("x-exit-code");
        if (exitHeader) term.writeln(`\r\n(exit ${exitHeader})`);
      }
    } catch (e: any) {
      term.writeln("\r\nERROR: " + (e?.message || String(e)));
    } finally {
      setCurrentInput("");
      setIsBusy(false);
      term.write("\r\n" + (cwdRef.current ? cwdRef.current + "> " : "$ "));
      if (abortRef.current) abortRef.current = null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <button onClick={() => onClose?.()} className="px-3 py-1.5 border rounded-md">닫기</button>
        <button onClick={() => {
          if (termRef.current) {
            termRef.current.clear();
            termRef.current.write("$ ");
          }
        }} className="px-3 py-1.5 border rounded-md" disabled={isBusy}>Clear</button>
        {isBusy && (
          <button onClick={() => abortRef.current?.abort()} className="px-3 py-1.5 border rounded-md">취소</button>
        )}
      </div>
      <div ref={containerRef} className="w-full h-72 border rounded-md overflow-hidden" />
    </div>
  );
}
*/

"use client";

import React from "react";

type Props = {
	agentBase: string;
	onClose?: () => void;
};

export default function ShellTerminal({ onClose }: Props) {
	return (
		<div className="space-y-2">
			<div className="flex gap-2">
				<button onClick={() => onClose?.()} className="px-3 py-1.5 border rounded-md">닫기</button>
			</div>
			<div className="w-full h-72 border rounded-md flex items-center justify-center text-sm text-neutral-500">
				터미널 기능 일시 비활성화됨
			</div>
		</div>
	);
}


