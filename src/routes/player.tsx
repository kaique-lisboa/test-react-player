import { useState, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import ReactPlayer from "react-player";

export const Route = createFileRoute("/player")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ReactPlayerDebugger />;
}

interface LogEntry {
  timestamp: string;
  event: string;
  data: string;
}

interface PlayerState {
  duration: number;
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

function useLocalStorageState<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Ignore write errors
    }
    setState(value);
  };

  return [state, setValue];
}

const ReactPlayerDebugger = () => {
  const playerRef = useRef<ReactPlayer>(null);
  const [isPlaying, setIsPlaying] = useLocalStorageState<boolean>(
    "isPlaying",
    true
  );
  const [volume, setVolume] = useLocalStorageState<number>("volume", 0.5);
  const [hiddenVideo, setHiddenVideo] = useLocalStorageState<boolean>(
    "hiddenVideo",
    false
  );
  const [muted, setMuted] = useLocalStorageState<boolean>("muted", false);
  const [url, setUrl] = useState<string>(
    "https://www.youtube.com/watch?v=8Pa9x9fZBtY"
  );
  const [callbackLogs, setCallbackLogs] = useState<LogEntry[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>({
    duration: 0,
    played: 0,
    playedSeconds: 0,
    loaded: 0,
    loadedSeconds: 0,
  });

  const testBatchPauseAndPlay = useCallback(() => {
    setIsPlaying(false);
    setTimeout(() => {
      setIsPlaying(true);
    }, 500);
  }, []);

  const urls = [
    "https://www.youtube.com/watch?v=8Pa9x9fZBtY",
    "https://www.youtube.com/watch?v=sjkrrmBnpGE",
    "https://soundcloud.com/miami-nights-1984/accelerated",
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  ];

  const addLog = useCallback(
    (event: string, data: Record<string, unknown> = {}) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry: LogEntry = {
        timestamp,
        event,
        data: JSON.stringify(data),
      };
      setCallbackLogs((prev) => [logEntry, ...prev].slice(0, 50));
    },
    []
  );

  const handlePlay = () => {
    addLog("onPlay");
  };

  const handlePause = () => {
    addLog("onPause");
  };

  const handleReady = () => {
    addLog("onReady", { player: "ready" });
  };

  const handleStart = () => {
    addLog("onStart");
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      addLog("onStart - getCurrentTime", { currentTime });
    }
  };

  const handleProgress = (progress: ProgressState) => {
    setPlayerState({
      duration: progress.loaded,
      played: progress.played,
      playedSeconds: progress.playedSeconds,
      loaded: progress.loaded,
      loadedSeconds: progress.loadedSeconds,
    });
    addLog("onProgress", {
      playedSeconds: progress.playedSeconds.toFixed(2),
      played: (progress.played * 100).toFixed(2) + "%",
    });
  };

  const handleDuration = (duration: number) => {
    addLog("onDuration", { duration });
  };

  const handleError = (error: unknown) => {
    addLog("onError", { error: String(error) });
  };

  const handleEnded = () => {
    addLog("onEnded");
    setIsPlaying(false);
  };

  const handleSeek = (seconds: number) => {
    addLog("onSeek", { seconds });
  };

  const seekTo = (seconds: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(seconds);
      addLog("Manual seekTo", { seconds });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>ReactPlayer Debugger</h1>

      {/* URL Control */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h3>URL Control</h3>
        <select
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        >
          {urls.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "100%", marginTop: "10px", padding: "8px" }}
          placeholder="Or enter custom URL"
        />
      </div>

      {/* Player Controls */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h3>Player Controls</h3>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              checked={isPlaying}
              onChange={(e) => setIsPlaying(e.target.checked)}
            />
            Playing: {isPlaying ? "YES" : "NO"}
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
            />
            Muted: {muted ? "YES" : "NO"}
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Volume: {(volume * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              checked={hiddenVideo}
              onChange={(e) => setHiddenVideo(e.target.checked)}
            />
            Hidden Video: {hiddenVideo ? "YES" : "NO"}
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <button
            className="px-2 py-1 border bg-blue-100"
            onClick={testBatchPauseAndPlay}
          >
            Test Batch Pause and Play
          </button>
          <button
            className="px-2 py-1 border bg-blue-100"
            onClick={() => seekTo(0)}
          >
            Seek to Start
          </button>
          <button
            className="px-2 py-1 border bg-blue-100"
            onClick={() => seekTo(30)}
          >
            Seek to 30s
          </button>
          <button
            className="px-2 py-1 border bg-blue-100"
            onClick={() => seekTo(60)}
          >
            Seek to 60s
          </button>
          <button
            className="px-2 py-1 border bg-blue-100"
            onClick={() => {
              if (playerRef.current) {
                const duration = playerRef.current.getDuration();
                seekTo(duration / 2);
              }
            }}
          >
            Seek to Middle
          </button>
        </div>
      </div>

      {/* Player */}
      <div
        style={{
          display: hiddenVideo ? "none" : "block",
          background: "black",
          padding: "20px",
          borderRadius: "5px",
          marginBottom: "20px",
        }}
      >
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={isPlaying}
          volume={volume}
          muted={muted}
          controls={false}
          width="100%"
          height="360px"
          onReady={handleReady}
          onStart={handleStart}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={handleError}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onSeek={handleSeek}
          progressInterval={1000}
        />
      </div>

      {/* Player State */}
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "5px",
        }}
      >
        <h3>Player State</h3>
        <div>Duration: {playerState.duration}s</div>
        <div>Played: {(playerState.played * 100).toFixed(2)}%</div>
        <div>Played Seconds: {playerState.playedSeconds.toFixed(2)}s</div>
        <div>Loaded: {(playerState.loaded * 100).toFixed(2)}%</div>
        <div>Loaded Seconds: {playerState.loadedSeconds.toFixed(2)}s</div>
      </div>

      {/* Callback Logs */}
      <div
        style={{ padding: "15px", background: "#f5f5f5", borderRadius: "5px" }}
      >
        <h3>Callback Logs</h3>
        <button onClick={() => setCallbackLogs([])}>Clear Logs</button>
        <div
          style={{
            maxHeight: "300px",
            overflow: "auto",
            marginTop: "10px",
            background: "white",
            padding: "10px",
            borderRadius: "5px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          {callbackLogs.length === 0 ? (
            <div>No logs yet...</div>
          ) : (
            callbackLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: "5px",
                  borderBottom: "1px solid #eee",
                  marginBottom: "5px",
                }}
              >
                <span style={{ color: "#666" }}>{log.timestamp}</span>
                <span style={{ color: "#007bff", marginLeft: "10px" }}>
                  {log.event}
                </span>
                {log.data !== "{}" && (
                  <span style={{ color: "#28a745", marginLeft: "10px" }}>
                    {log.data}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReactPlayerDebugger;
