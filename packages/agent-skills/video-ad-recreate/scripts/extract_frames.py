#!/usr/bin/env python3
"""
Extract key frames from a video ad for reverse engineering analysis.

Usage:
    python extract_frames.py input_video.mp4 --output-dir frames/ --num-frames 12

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


def detect_scene_changes(video_path, threshold=30.0):
    """Detect scene changes based on frame-to-frame difference.

    Returns list of frame numbers where significant visual changes occur.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return []

    scene_changes = [0]  # Always include first frame
    prev_frame = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.resize(gray, (160, 90))  # Downscale for speed

        if prev_frame is not None:
            diff = cv2.absdiff(prev_frame, gray)
            mean_diff = diff.mean()
            if mean_diff > threshold:
                frame_num = int(cap.get(cv2.CAP_PROP_POS_FRAMES)) - 1
                scene_changes.append(frame_num)

        prev_frame = gray

    cap.release()
    return scene_changes


def extract_frames(video_path, output_dir, num_frames=12, detect_scenes=True):
    """Extract key frames from a video for ad analysis.

    Combines evenly-spaced frames with scene-change detection for
    comprehensive coverage of the ad's visual structure.
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

    # Get evenly-spaced frame indices
    even_indices = set()
    for i in range(num_frames):
        idx = int(i * (total_frames - 1) / (num_frames - 1)) if num_frames > 1 else 0
        even_indices.add(idx)

    # Optionally detect scene changes
    scene_indices = set()
    if detect_scenes:
        print("Detecting scene changes...")
        scene_changes = detect_scene_changes(video_path)
        scene_indices = set(scene_changes)
        print(f"  Found {len(scene_changes)} scene changes")

    # Combine and sort all frame indices
    all_indices = sorted(even_indices | scene_indices)

    # Limit to reasonable number
    if len(all_indices) > num_frames * 2:
        # Keep evenly spaced from the combined set
        step = len(all_indices) / num_frames
        all_indices = [all_indices[int(i * step)] for i in range(num_frames)]

    print(f"Extracting {len(all_indices)} frames...")

    extracted = []
    for idx, frame_num in enumerate(all_indices):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if not ret:
            continue

        timestamp = frame_num / fps if fps > 0 else 0
        is_scene_change = frame_num in scene_indices
        label = "scene_change" if is_scene_change else "sample"

        filename = f"frame_{idx:02d}_t{timestamp:.1f}s_{label}.jpg"
        filepath = os.path.join(output_dir, filename)

        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame_rgb)
        img.save(filepath, quality=95)

        extracted.append({
            "index": idx,
            "frame_num": frame_num,
            "timestamp": timestamp,
            "filepath": filepath,
            "is_scene_change": is_scene_change,
        })
        marker = " [SCENE CHANGE]" if is_scene_change else ""
        print(f"  [{idx+1}/{len(all_indices)}] {filename}{marker}")

    cap.release()

    # Print analysis summary
    print(f"\nExtracted {len(extracted)} frames to {output_dir}/")
    print(f"\nAd Structure Map:")
    print(f"  Duration: {duration:.1f}s")
    print(f"  Scene changes detected: {len(scene_indices)}")
    print(f"  Estimated cuts: {max(0, len(scene_indices) - 1)}")
    if len(scene_indices) > 1:
        avg_scene = duration / len(scene_indices)
        print(f"  Average scene length: {avg_scene:.1f}s")
    print(f"\n  Frame 0 (t=0.0s) → HOOK / First Frame")
    for e in extracted:
        if e["is_scene_change"] and e["timestamp"] > 0:
            print(f"  Frame {e['index']} (t={e['timestamp']:.1f}s) → SCENE CHANGE")
    print(f"  Frame {extracted[-1]['index']} (t={extracted[-1]['timestamp']:.1f}s) → CTA / Final Frame")

    return extracted


def main():
    parser = argparse.ArgumentParser(
        description="Extract key frames from a video ad for reverse engineering"
    )
    parser.add_argument("video", help="Path to video file")
    parser.add_argument(
        "--output-dir", "-o", default="frames",
        help="Output directory for frames (default: frames/)"
    )
    parser.add_argument(
        "--num-frames", "-n", type=int, default=12,
        help="Target number of frames to extract (default: 12)"
    )
    parser.add_argument(
        "--no-scene-detect", action="store_true",
        help="Disable scene change detection (use evenly-spaced only)"
    )

    args = parser.parse_args()
    extract_frames(
        args.video,
        args.output_dir,
        args.num_frames,
        detect_scenes=not args.no_scene_detect,
    )


if __name__ == "__main__":
    main()
