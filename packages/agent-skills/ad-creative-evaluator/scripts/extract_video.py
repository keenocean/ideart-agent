#!/usr/bin/env python3
"""
Extract key frames from a video file for ad creative evaluation.

Usage:
    python extract_video.py input_video.mp4 --output-dir frames/ --num-frames 8

Requirements:
    pip install opencv-python Pillow
"""

import argparse
import os
import sys

try:
    import cv2
    from PIL import Image
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install opencv-python Pillow")
    sys.exit(1)


def extract_frames(video_path, output_dir, num_frames=8):
    """Extract evenly-spaced key frames from a video.

    Always includes first frame (hook) and last frame (CTA).
    Remaining frames are evenly distributed across the video duration.
    """
    if not os.path.exists(video_path):
        print(f"Error: Video file not found: {video_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Could not open video: {video_path}")
        sys.exit(1)

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration = total_frames / fps if fps > 0 else 0

    print(f"Video: {video_path}")
    print(f"Duration: {duration:.1f}s | Frames: {total_frames} | FPS: {fps:.1f}")
    print(f"Extracting {num_frames} key frames...")

    if num_frames >= total_frames:
        frame_indices = list(range(total_frames))
    else:
        frame_indices = [
            int(i * (total_frames - 1) / (num_frames - 1))
            for i in range(num_frames)
        ]

    extracted = []
    for idx, frame_num in enumerate(frame_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if not ret:
            print(f"  Warning: Could not read frame {frame_num}")
            continue

        timestamp = frame_num / fps if fps > 0 else 0
        filename = f"frame_{idx:02d}_t{timestamp:.1f}s.jpg"
        filepath = os.path.join(output_dir, filename)

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame_rgb)
        img.save(filepath, quality=95)

        extracted.append({
            "index": idx,
            "frame_num": frame_num,
            "timestamp": timestamp,
            "filepath": filepath,
        })
        print(f"  [{idx+1}/{num_frames}] {filename} (t={timestamp:.1f}s)")

    cap.release()

    print(f"\nExtracted {len(extracted)} frames to {output_dir}/")
    print(f"\nFrame map for evaluation:")
    print(f"  Frame 0 (t=0.0s) → HOOK / First impression")
    if len(extracted) > 2:
        mid = len(extracted) // 2
        print(f"  Frame {mid} (t={extracted[mid]['timestamp']:.1f}s) → BODY / Mid-point")
    print(f"  Frame {len(extracted)-1} (t={extracted[-1]['timestamp']:.1f}s) → CTA / Closing")

    return extracted


def main():
    parser = argparse.ArgumentParser(
        description="Extract key frames from a video for ad evaluation"
    )
    parser.add_argument("video", help="Path to video file")
    parser.add_argument(
        "--output-dir", "-o", default="frames",
        help="Output directory for frames (default: frames/)"
    )
    parser.add_argument(
        "--num-frames", "-n", type=int, default=8,
        help="Number of frames to extract (default: 8)"
    )

    args = parser.parse_args()
    extract_frames(args.video, args.output_dir, args.num_frames)


if __name__ == "__main__":
    main()
