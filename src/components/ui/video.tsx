/**
 * Video Player Component
 *
 * Native HTML5 video player — no third-party React dependency.
 * Supports poster, autoplay, muted, controls, and aspect ratio.
 *
 * Usage:
 * <Video src="https://example.com/video.mp4" poster="https://example.com/thumb.jpg" />
 */

interface VideoProps {
  /** Video resource URL */
  src: string;
  /** Video poster image URL */
  poster?: string;
  /** Custom class name */
  className?: string;
  /** Whether to autoplay, defaults to false */
  autoPlay?: boolean;
  /** Whether to mute, defaults to false */
  muted?: boolean;
  /** Whether to show controls, defaults to true */
  controls?: boolean;
  /** Video aspect ratio, defaults to 'auto' */
  aspectRatio?: 'auto' | '16:9' | '4:3' | string;
}

const ASPECT_CLASSES: Record<string, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  'auto': '',
};

export default function Video({
  src,
  poster,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true,
  aspectRatio = 'auto',
}: VideoProps) {
  const aspectClass = ASPECT_CLASSES[aspectRatio] ?? '';

  return (
    <div className={`min-w-[100px] w-full overflow-hidden rounded ${aspectClass} ${className}`} custom-component="video">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}
