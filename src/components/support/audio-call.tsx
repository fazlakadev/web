"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { io, type Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import type { types as mt } from "mediasoup-client";
import {
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
} from "lucide-react";
import { api, getAccessToken } from "@/lib/api";
import { callSounds as sounds } from "@/lib/call-sounds";
import { consumePendingJoin } from "@/lib/call-popup";
import { Button } from "@/components/ui/button";

interface CallConfig {
  enabled: boolean;
  signalingUrl: string;
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
}

interface ProducerInfo {
  producerId: string;
  participantId: string;
  name: string;
  role: "user" | "admin";
}

interface PeerInfo {
  id: string;
  name: string;
  role: "user" | "admin";
}

type CallState = "idle" | "connecting" | "waiting" | "active" | "reconnecting" | "error";

interface AckResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  code?: string;
}

function emitAck(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<AckResult> {
  return new Promise((resolve) => {
    socket.timeout(10_000).emit(
      event,
      payload,
      (err: unknown, res: AckResult | null | undefined) => {
        if (err) resolve({ ok: false, error: String(err) });
        else resolve(res ?? { ok: false, error: "no response" });
      },
    );
  });
}

interface AudioCallProps {
  ticketId: string;
  role: "user" | "admin";
  onActivity?: () => void;
  ringing?: boolean;
  onAnswer?: () => void;
  onDecline?: () => void;
}

export function AudioCall({
  ticketId,
  role,
  onActivity,
  ringing = false,
  onAnswer,
  onDecline,
}: AudioCallProps) {
  const t = useTranslations();
  const socketRef = useRef<Socket | null>(null);
  const deviceRef = useRef<Device | null>(null);
  const sendTransportRef = useRef<mt.Transport | null>(null);
  const recvTransportRef = useRef<mt.Transport | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const producerIdsRef = useRef<Set<string>>(new Set());
  const startedRef = useRef<number>(0);
  const stateRef = useRef<CallState>("idle");
  const peerIdsRef = useRef<Set<string>>(new Set());
  const leavingRef = useRef(false);
  const configRef = useRef<CallConfig | null>(null);

  const [state, setState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);
  const [, setProducers] = useState<ProducerInfo[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const autoJoinRef = useRef(false);

  const stopTransports = useCallback(() => {
    for (const audio of audioElsRef.current.values()) {
      audio.pause();
      audio.srcObject = null;
    }
    audioElsRef.current.clear();
    remoteStreamsRef.current.clear();
    for (const track of localStreamRef.current?.getTracks() ?? []) {
      track.stop();
    }
    localStreamRef.current = null;
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    deviceRef.current = null;
    producerIdsRef.current.clear();
    setMuted(false);
    setPeers([]);
    setProducers([]);
  }, []);

  const teardown = useCallback(() => {
    stopTransports();
    const socket = socketRef.current;
    if (socket) {
      socket.disconnect();
      socketRef.current = null;
    }
    (window as unknown as { __callSocket?: Socket }).__callSocket = undefined;
    leavingRef.current = false;
    peerIdsRef.current = new Set();
    startedRef.current = 0;
    sounds.stopRing();
    setState("idle");
    setErrorKey(null);
    setElapsed(0);
  }, [stopTransports]);

  const leaveCall = useCallback(async () => {
    leavingRef.current = true;
    sounds.chime(false);
    const socket = socketRef.current;
    if (socket) {
      await emitAck(socket, "calls:leave", { ticketId }).catch(() => null);
    }
    teardown();
    onActivity?.();
  }, [ticketId, teardown, onActivity]);

  const consumeProducer = useCallback(
    async (socket: Socket, info: ProducerInfo) => {
      const recvTransport = recvTransportRef.current;
      if (!recvTransport || producerIdsRef.current.has(info.producerId)) return;
      const res = await emitAck(socket, "calls:consume", {
        ticketId,
        transportId: recvTransport.id,
        producerId: info.producerId,
        rtpCapabilities: deviceRef.current?.rtpCapabilities,
      });
      if (!res.ok) return;
      const { id, producerId, kind, rtpParameters } = (res.data ?? {}) as {
        id: string;
        producerId: string;
        kind: mt.MediaKind;
        rtpParameters: mt.RtpParameters;
      };
      const consumer = await recvTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
      });
      const stream = new MediaStream([consumer.track]);
      remoteStreamsRef.current.set(producerId, stream);
      producerIdsRef.current.add(producerId);
      try {
        await consumer.resume();
      } catch {
        /* ignore */
      }
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      audioElsRef.current.set(producerId, audio);
      audio.play().catch(() => null);
    },
    [ticketId],
  );

  const clearRemote = useCallback(() => {
    for (const audio of audioElsRef.current.values()) {
      audio.pause();
      audio.srcObject = null;
    }
    audioElsRef.current.clear();
    remoteStreamsRef.current.clear();
    producerIdsRef.current.clear();
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    sendTransportRef.current = null;
    recvTransportRef.current = null;
    setProducers([]);
  }, []);

  const buildTransports = useCallback(
    async (
      socket: Socket,
      device: Device,
      config: CallConfig,
    ): Promise<{ send: mt.Transport; recv: mt.Transport } | null> => {
      try {
        const sendInfo = await emitAck(socket, "calls:createTransport", {
          ticketId,
          direction: "send",
        });
        const recvInfo = await emitAck(socket, "calls:createTransport", {
          ticketId,
          direction: "recv",
        });
        if (!sendInfo.ok || !recvInfo.ok) return null;

        const sendTransport = device.createSendTransport({
          id: sendInfo.data?.id as string,
          iceParameters: sendInfo.data?.iceParameters as mt.IceParameters,
          iceCandidates: sendInfo.data?.iceCandidates as mt.IceCandidate[],
          dtlsParameters: sendInfo.data?.dtlsParameters as mt.DtlsParameters,
          iceServers: config.iceServers,
        });
        sendTransportRef.current = sendTransport;
        sendTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          emitAck(socket, "calls:connectTransport", {
            ticketId,
            transportId: sendTransport.id,
            dtlsParameters,
          }).then((res) => (res.ok ? callback() : errback(new Error(res.error))));
        });
        sendTransport.on("produce", async ({ kind, rtpParameters }, callback, errback) => {
          const res = await emitAck(socket, "calls:produce", {
            ticketId,
            transportId: sendTransport.id,
            kind,
            rtpParameters,
          });
          if (res.ok) callback({ id: res.data?.id as string });
          else errback(new Error(res.error));
        });

        const recvTransport = device.createRecvTransport({
          id: recvInfo.data?.id as string,
          iceParameters: recvInfo.data?.iceParameters as mt.IceParameters,
          iceCandidates: recvInfo.data?.iceCandidates as mt.IceCandidate[],
          dtlsParameters: recvInfo.data?.dtlsParameters as mt.DtlsParameters,
          iceServers: config.iceServers,
        });
        recvTransportRef.current = recvTransport;
        recvTransport.on("connect", ({ dtlsParameters }, callback, errback) => {
          emitAck(socket, "calls:connectTransport", {
            ticketId,
            transportId: recvTransport.id,
            dtlsParameters,
          }).then((res) => (res.ok ? callback() : errback(new Error(res.error))));
        });

        return { send: sendTransport, recv: recvTransport };
      } catch {
        return null;
      }
    },
    [ticketId],
  );

  const produceLocal = useCallback(async (socket: Socket, sendTransport: mt.Transport) => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return false;
    try {
      const produced = await sendTransport.produce({
        track,
        encodings: [{ maxBitrate: 128_000 }],
      });
      producerIdsRef.current.add(produced.id);
      return true;
    } catch {
      return false;
    }
  }, []);

  const rejoin = useCallback(
    async (socket: Socket, config: CallConfig) => {
      const device = deviceRef.current;
      if (!device) return false;
      try {
        clearRemote();
        const joined = await emitAck(socket, "calls:joinRoom", { ticketId });
        if (!joined.ok) return false;

        const transports = await buildTransports(socket, device, config);
        if (!transports) return false;

        for (const info of (joined.data?.existingProducers ?? []) as ProducerInfo[]) {
          consumeProducer(socket, info);
        }

        await produceLocal(socket, transports.send);

        const peers = (joined.data?.peers ?? []) as PeerInfo[];
        peerIdsRef.current = new Set(peers.map((p) => p.id));
        setPeers(peers);
        setErrorKey(null);
        if (peers.length > 0) {
          sounds.stopRing();
          startedRef.current = Date.now();
          setElapsed(0);
          setState("active");
        } else {
          sounds.startRing();
          setState("waiting");
        }
        onActivity?.();
        return true;
      } catch {
        return false;
      }
    },
    [ticketId, clearRemote, buildTransports, consumeProducer, produceLocal, onActivity],
  );

  const goActive = useCallback(() => {
    sounds.stopRing();
    sounds.chime(true);
    startedRef.current = Date.now();
    setElapsed(0);
    setState("active");
  }, []);

  const startCall = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorKey("calls.unsupported");
      setState("error");
      return;
    }
    setState("connecting");
    setErrorKey(null);

    let config: CallConfig;
    try {
      const res = await api.get<CallConfig>("/calls/config");
      config = res.data;
      if (!config.enabled) throw new Error("disabled");
    } catch {
      setErrorKey("calls.startFailed");
      setState("error");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setErrorKey("calls.startFailed");
      setState("error");
      return;
    }

    const socket = io(config.signalingUrl, {
      auth: { token, role },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 12,
      reconnectionDelay: 700,
      reconnectionDelayMax: 3000,
    });
    socketRef.current = socket;
    (window as unknown as { __callSocket?: Socket }).__callSocket = socket;
    configRef.current = config;

    try {
      await new Promise<void>((resolve, reject) => {
        socket.on("connect", () => resolve());
        socket.on("connect_error", (err) =>
          reject(new Error(err.message || "connect_error")),
        );
      });
    } catch {
      setErrorKey("calls.connectFailed");
      setState("error");
      socket.close();
      socketRef.current = null;
      return;
    }

    const joined = await emitAck(socket, "calls:joinRoom", { ticketId });
    if (!joined.ok) {
      setErrorKey("calls.startFailed");
      setState("error");
      socket.close();
      socketRef.current = null;
      return;
    }

    const initialPeers: PeerInfo[] = (joined.data?.peers ?? []) as PeerInfo[];
    peerIdsRef.current = new Set(initialPeers.map((p) => p.id));
    setPeers(initialPeers);
    onActivity?.();

    // Peer lifecycle
    socket.on("calls:peerJoined", (p: PeerInfo) => {
      peerIdsRef.current.add(p.id);
      setPeers((prev) =>
        prev.some((x) => x.id === p.id) ? prev : [...prev, p],
      );
      if (
        stateRef.current === "waiting" ||
        stateRef.current === "reconnecting"
      ) {
        goActive();
      }
      onActivity?.();
    });
    socket.on("calls:peerLeft", (p: PeerInfo) => {
      peerIdsRef.current.delete(p.id);
      setPeers((prev) => prev.filter((x) => x.id !== p.id));
      if (stateRef.current === "active" && peerIdsRef.current.size === 0) {
        startedRef.current = 0;
        setElapsed(0);
        sounds.startRing();
        setState("waiting");
      }
      onActivity?.();
    });

    // Auto-leave while ringing if the caller gives up
    socket.on("calls:ringStopped", () => {
      if (stateRef.current === "waiting") {
        sounds.stopRing();
      }
      onActivity?.();
    });

    socket.on("disconnect", () => {
      if (leavingRef.current) {
        onActivity?.();
        return;
      }
      sounds.stopRing();
      if (stateRef.current !== "idle") {
        setState("reconnecting");
      }
      onActivity?.();
    });

    socket.io.on("reconnect", async () => {
      const cfg = configRef.current;
      if (!cfg) return;
      const ok = await rejoin(socket, cfg);
      if (!ok) {
        setErrorKey("calls.connectFailed");
        setState("error");
      }
    });

    socket.io.on("reconnect_failed", () => {
      sounds.stopRing();
      setErrorKey("calls.disconnected");
      setState("error");
      onActivity?.();
    });

    try {
      const device = new Device();
      deviceRef.current = device;
      await device.load({
        routerRtpCapabilities: joined.data?.routerRtpCapabilities as mt.RtpCapabilities,
      });
      if (!device.canProduce("audio")) throw new Error("cannot produce");

      // Mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch {
        setErrorKey("calls.micDenied");
        setState("error");
        socket.close();
        socketRef.current = null;
        return;
      }
      localStreamRef.current = stream;
      const monitor = new Audio();
      monitor.srcObject = stream;
      monitor.muted = true;
      monitor.autoplay = true;
      monitor.play().catch(() => null);

      const transports = await buildTransports(socket, device, config);
      if (!transports) {
        setErrorKey("calls.startFailed");
        setState("error");
        socket.close();
        socketRef.current = null;
        return;
      }

      // Subscribe to existing producers
      const existing: ProducerInfo[] = (joined.data?.existingProducers ?? []) as ProducerInfo[];
      for (const info of existing) {
        consumeProducer(socket, info);
      }

      socket.on("calls:newProducer", (info: ProducerInfo) => {
        setProducers((prev) =>
          prev.some((x) => x.producerId === info.producerId)
            ? prev
            : [...prev, info],
        );
        consumeProducer(socket, info);
        onActivity?.();
      });
      socket.on("calls:producerClosed", (info: { producerId: string }) => {
        remoteStreamsRef.current.get(info.producerId)?.getTracks().forEach((tr) => tr.stop());
        remoteStreamsRef.current.delete(info.producerId);
        producerIdsRef.current.delete(info.producerId);
        audioElsRef.current.get(info.producerId)?.pause();
        audioElsRef.current.delete(info.producerId);
        setProducers((prev) =>
          prev.filter((x) => x.producerId !== info.producerId),
        );
      });

      // Produce local audio
      await produceLocal(socket, transports.send);

      if (peerIdsRef.current.size > 0) {
        startedRef.current = Date.now();
        setState("active");
      } else {
        sounds.startRing();
        setState("waiting");
      }
    } catch (err) {
      console.error("[AudioCall]", err);
      setErrorKey("calls.startFailed");
      setState("error");
      socket.close();
      socketRef.current = null;
    }
  };

  // Auto-join when the user clicked a pending call popup.
  useEffect(() => {
    if (role !== "user") return;
    const pending = consumePendingJoin();
    if (pending === ticketId) {
      autoJoinRef.current = true;
      void startCall();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer while active
  useEffect(() => {
    if (state !== "active") return;
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - startedRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  // Ringing overlay: keep the tone looping while ringing
  useEffect(() => {
    if (ringing) {
      sounds.startRing();
    } else {
      sounds.stopRing();
    }
    return () => sounds.stopRing();
  }, [ringing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const socket = socketRef.current;
      if (socket?.connected) {
        emitAck(socket, "calls:leave", { ticketId }).catch(() => null);
      }
      stopTransports();
    };
  }, [ticketId, stopTransports]);

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    const next = !muted;
    track.enabled = !next;
    setMuted(next);
  };

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (ringing && state === "idle") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-6 text-center shadow-2xl">
          <div className="mx-auto flex size-16 animate-pulse items-center justify-center rounded-full bg-primary/15 text-primary">
            <PhoneCall className="size-8" />
          </div>
          <p className="mt-4 text-lg font-bold">{t("calls.incoming")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("calls.incomingSubtitle")}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                sounds.chime(false);
                onDecline?.();
              }}
            >
              <PhoneOff className="size-5" />
              {t("calls.decline")}
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => {
                sounds.chime(true);
                onAnswer?.();
                void startCall();
              }}
            >
              <PhoneCall className="size-5" />
              {t("calls.answer")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "idle") {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t("calls.title")}</p>
            <p className="text-xs text-muted-foreground">
              {t("calls.subtitle")}
            </p>
          </div>
          <Button onClick={startCall}>
            <PhoneCall className="size-4" />
            {t("calls.start")}
          </Button>
        </div>
      </div>
    );
  }

  if (
    state === "connecting" ||
    state === "reconnecting" ||
    state === "error"
  ) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          {state === "error" ? (
            <PhoneCall className="size-5 text-destructive" />
          ) : (
            <Loader2 className="size-5 animate-spin text-primary" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold">
              {state === "connecting"
                ? t("calls.connecting")
                : state === "reconnecting"
                  ? t("calls.reconnecting")
                  : t("calls.failed")}
            </p>
            {errorKey && state === "error" && (
              <p className="text-xs text-muted-foreground">{t(errorKey)}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={state === "error" ? () => setState("idle") : teardown}
          >
            {t("calls.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "waiting") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Loader2 className="size-5 animate-spin" />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("calls.waiting")}</p>
              {peers.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("calls.with")} {peers.map((p) => p.name).join(", ")}
                </p>
              )}
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={leaveCall}>
            <PhoneOff className="size-4" />
            {t("calls.leave")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <PhoneCall className="size-5 animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold">{t("calls.inProgress")}</p>
            <p className="text-xs tabular-nums text-muted-foreground">
              {fmt(elapsed)}
              {peers.length > 0 &&
                ` • ${t("calls.with")} ${peers.map((p) => p.name).join(", ")}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleMute}>
            {muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
            {muted ? t("calls.unmute") : t("calls.mute")}
          </Button>
          <Button variant="destructive" size="sm" onClick={leaveCall}>
            <PhoneOff className="size-4" />
            {t("calls.leave")}
          </Button>
        </div>
      </div>
    </div>
  );
}
