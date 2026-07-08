import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2, ExternalLink, SatelliteDish } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
  callsign: string;
}

// Extend Window interface for YouTube API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    Vimeo: any;
  }
}

// The IFrame API loads once per page, but this component mounts once per
// VIDEO stage visit — including revisits via back-navigation. The old
// pattern (inject the script and overwrite onYouTubeIframeAPIReady on every
// mount) works exactly once and gets flaky on remount. A singleton promise
// makes every mount await the same load, whether it's the first or fifth.
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    });
  }
  return ytApiPromise;
}

export function VideoPlayer({ videoUrl, onComplete, callsign }: VideoPlayerProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const vimeoPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  // Footage links rot (videos get deleted, privated, or embed-disabled).
  // A dead link must never trap the mission: we detect failure and offer
  // an external watch + a way to log it and continue.
  const [unavailable, setUnavailable] = useState(false);
  // Bumped by "Reload Footage" — re-runs the embed for transient failures
  // (the common case when returning to a stage) without a full page reload.
  const [attempt, setAttempt] = useState(0);
  const loadedRef = useRef(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const markLoaded = () => {
    loadedRef.current = true;
    setIsLoading(false);
  };

  const markUnavailable = () => {
    loadedRef.current = true;
    setIsLoading(false);
    setUnavailable(true);
  };

  // Extract video ID and platform
  const getVideoInfo = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be')
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : new URLSearchParams(url.split('?')[1]).get('v');
      return { platform: 'youtube', id: videoId };
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return { platform: 'vimeo', id: videoId };
    }
    return { platform: 'native', id: url };
  };

  const videoInfo = getVideoInfo(videoUrl);

  // Mark as complete and notify
  const markComplete = () => {
    if (!hasCompleted) {
      setHasCompleted(true);
      onComplete();
      toast({
        title: "Footage Reviewed",
        description: `Operator ${callsign}, footage analysis complete.`,
      });
    }
  };

  // YouTube Player Integration — remount-safe: awaits the singleton API
  // loader, guards against init-after-unmount, and always tears down both
  // the player and the progress interval.
  useEffect(() => {
    if (videoInfo.platform !== 'youtube' || !videoInfo.id) return;
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      try {
        youtubePlayerRef.current = new YT.Player(`youtube-player-${videoInfo.id}`, {
          videoId: videoInfo.id,
          events: {
            onReady: () => markLoaded(),
            // 100 = not found; 101/150 = embedding disabled; 2/5 = bad id/player
            onError: () => markUnavailable(),
            onStateChange: (event: any) => {
              if (event.data === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startYouTubeProgressTracking();
              } else if (event.data === YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
            },
          },
        });
      } catch (error) {
        console.error('[FIELD FOOTAGE] Player init failed:', error);
        markUnavailable();
      }
    });

    return () => {
      cancelled = true;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      try {
        youtubePlayerRef.current?.destroy();
      } catch {
        // A player torn down mid-initialization can throw; the next mount
        // builds a fresh one either way.
      }
      youtubePlayerRef.current = null;
    };
  }, [videoInfo.platform, videoInfo.id, attempt]);

  // Failure watchdog: a malformed URL fails immediately; a player that never
  // reaches ready within 15s (dead video, blocked embed, API script failure)
  // is declared unavailable so the operator is never stuck on "Loading...".
  useEffect(() => {
    if (videoInfo.platform === 'youtube' && !videoInfo.id) {
      markUnavailable();
      return;
    }
    const watchdog = setTimeout(() => {
      if (!loadedRef.current) markUnavailable();
    }, 15000);
    return () => clearTimeout(watchdog);
  }, [videoInfo.platform, videoInfo.id, attempt]);

  const retryEmbed = () => {
    loadedRef.current = false;
    setUnavailable(false);
    setIsLoading(true);
    setProgress(0);
    setAttempt((a) => a + 1);
  };

  const startYouTubeProgressTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (youtubePlayerRef.current) {
        const currentTime = youtubePlayerRef.current.getCurrentTime();
        const duration = youtubePlayerRef.current.getDuration();
        if (duration > 0) {
          const currentProgress = (currentTime / duration) * 100;
          setProgress(currentProgress);

          if (currentProgress >= 95 && !hasCompleted) {
            markComplete();
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        }
      }
    }, 1000);
  };

  // Vimeo Player Integration
  useEffect(() => {
    if (videoInfo.platform === 'vimeo' && videoInfo.id && iframeRef.current) {
      // Load Vimeo Player API
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      script.onload = () => {
        if (window.Vimeo && iframeRef.current) {
          vimeoPlayerRef.current = new window.Vimeo.Player(iframeRef.current);
          
          vimeoPlayerRef.current.on('loaded', () => {
            markLoaded();
          });
          vimeoPlayerRef.current.on('error', () => {
            markUnavailable();
          });

          vimeoPlayerRef.current.on('play', () => {
            setIsPlaying(true);
          });

          vimeoPlayerRef.current.on('pause', () => {
            setIsPlaying(false);
          });

          vimeoPlayerRef.current.on('timeupdate', (data: any) => {
            const currentProgress = (data.percent * 100);
            setProgress(currentProgress);
            
            if (currentProgress >= 95 && !hasCompleted) {
              markComplete();
            }
          });
        }
      };
      document.body.appendChild(script);

      return () => {
        vimeoPlayerRef.current?.destroy();
      };
    }
  }, [videoInfo.platform, videoInfo.id]);

  // Native Video Integration
  useEffect(() => {
    if (videoRef.current && videoInfo.platform === 'native') {
      const video = videoRef.current;
      
      const handleLoadedData = () => markLoaded();
      const handleError = () => markUnavailable();
      const handleTimeUpdate = () => {
        const currentProgress = (video.currentTime / video.duration) * 100;
        setProgress(currentProgress);
        
        if (currentProgress >= 95 && !hasCompleted) {
          markComplete();
        }
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
      };
    }
  }, [hasCompleted, videoInfo.platform]);

  const handleReplay = () => {
    if (videoInfo.platform === 'native' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else if (videoInfo.platform === 'youtube' && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(0);
      youtubePlayerRef.current.playVideo();
    } else if (videoInfo.platform === 'vimeo' && vimeoPlayerRef.current) {
      vimeoPlayerRef.current.setCurrentTime(0);
      vimeoPlayerRef.current.play();
    }
    setProgress(0);
  };

  return (
    <Card className="p-4 sm:p-6 bg-neuro-dark border-neuro-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-neuro-orange font-mono">
            FIELD FOOTAGE ACTIVATION
          </div>
          {hasCompleted && (
            <div className="flex items-center gap-2 text-xs text-neuro-orange">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Footage Reviewed</span>
            </div>
          )}
        </div>
        
        {unavailable ? (
          <div className="rounded-lg border border-neuro-border bg-black/40 p-6 space-y-4">
            <div className="flex items-center gap-2 text-neuro-orange font-mono text-sm">
              <SatelliteDish className="h-4 w-4" />
              ARCHIVE LINK DEGRADED
            </div>
            <p className="text-sm text-muted-foreground">
              The field footage at this coordinate did not resolve. Relay
              interference is usually temporary — reload the feed first. If
              the archive has truly moved or restricted it, take the direct
              feed or log the outage and proceed. The mission does not stall
              for a broken relay; Echelon's briefing above carries what the
              footage was selected to show.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={retryEmbed}
                variant="outline"
                size="sm"
                className="border-neuro-border text-neuro-cyan hover:bg-neuro-cyan/10"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reload Footage
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-neuro-border text-neuro-cyan hover:bg-neuro-cyan/10"
              >
                <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Try Direct Feed
                </a>
              </Button>
              {!hasCompleted && (
                <Button
                  onClick={markComplete}
                  size="sm"
                  className="bg-neuro-orange/20 text-neuro-orange border border-neuro-orange/50 hover:bg-neuro-orange/30"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Log Outage & Continue Mission
                </Button>
              )}
            </div>
          </div>
        ) : (
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-neuro-cyan animate-pulse">Loading footage...</div>
            </div>
          )}

          {videoInfo.platform === 'youtube' && videoInfo.id && (
            <div
              key={`${videoInfo.id}-${attempt}`}
              id={`youtube-player-${videoInfo.id}`}
              className="w-full h-full"
            />
          )}
          
          {videoInfo.platform === 'vimeo' && videoInfo.id && (
            <iframe
              ref={iframeRef}
              className="w-full h-full"
              src={`https://player.vimeo.com/video/${videoInfo.id}`}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          )}
          
          {videoInfo.platform === 'native' && (
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              preload="metadata"
            >
              <source src={videoUrl} />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
        )}

        {/* Progress Bar - Show for all platforms */}
        {!unavailable && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mission Footage: {Math.round(progress)}%</span>
            {progress >= 95 && (
              <span className="text-neuro-orange font-mono">
                ANALYSIS COMPLETE
              </span>
            )}
          </div>
          <div className="h-2 bg-neuro-border/30 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress >= 95 ? 'bg-neuro-orange' : 'bg-neuro-cyan'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
        )}

        {hasCompleted && !unavailable && (
          <Button
            onClick={handleReplay}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto border-neuro-border text-neuro-cyan hover:bg-neuro-cyan/10"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Replay Footage
          </Button>
        )}
      </div>
    </Card>
  );
}
