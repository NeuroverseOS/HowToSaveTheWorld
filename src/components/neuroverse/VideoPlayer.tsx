import React, { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
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

  // YouTube Player Integration
  useEffect(() => {
    if (videoInfo.platform === 'youtube' && videoInfo.id) {
      // Load YouTube IFrame API
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      // Initialize player when API is ready
      window.onYouTubeIframeAPIReady = () => {
        youtubePlayerRef.current = new window.YT.Player(`youtube-player-${videoInfo.id}`, {
          videoId: videoInfo.id,
          events: {
            onReady: () => setIsLoading(false),
            onStateChange: (event: any) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                startYouTubeProgressTracking();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              }
            },
          },
        });
      };

      // If API already loaded
      if (window.YT && window.YT.Player) {
        window.onYouTubeIframeAPIReady();
      }

      return () => {
        youtubePlayerRef.current?.destroy();
      };
    }
  }, [videoInfo.platform, videoInfo.id]);

  const startYouTubeProgressTracking = () => {
    const interval = setInterval(() => {
      if (youtubePlayerRef.current) {
        const currentTime = youtubePlayerRef.current.getCurrentTime();
        const duration = youtubePlayerRef.current.getDuration();
        if (duration > 0) {
          const currentProgress = (currentTime / duration) * 100;
          setProgress(currentProgress);
          
          if (currentProgress >= 95 && !hasCompleted) {
            markComplete();
            clearInterval(interval);
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
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
            setIsLoading(false);
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
      
      const handleLoadedData = () => setIsLoading(false);
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
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
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
        
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-neuro-cyan animate-pulse">Loading footage...</div>
            </div>
          )}

          {videoInfo.platform === 'youtube' && videoInfo.id && (
            <div
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

        {/* Progress Bar - Show for all platforms */}
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

        {hasCompleted && (
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
