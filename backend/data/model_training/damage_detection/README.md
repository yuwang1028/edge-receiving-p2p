# Carton-damage YOLO — training scaffold

The classical pipeline detects damage with a trained YOLO when weights are present
at `services/edge-runtime/runtime/models/damage_yolo/` (`model.pt` dev,
`model.onnx`/`model.engine` for Jetson). **Until then it uses an OCR-caption
fallback** — there is no off-the-shelf "damaged carton" model, so you must train one.

## What you need
- **~200–500 real dock photos** of deliveries, a mix of clean and damaged.
- Bounding-box labels (YOLO txt format) for the classes in `dataset.yaml`
  (damaged_carton / torn_packaging / wet_package / collapsed_pallet).
  Label with Roboflow, Label Studio, or CVAT.

Layout:
```
images/train/*.jpg   labels/train/*.txt
images/val/*.jpg     labels/val/*.txt
```

## Train (on a dev box with a GPU)
```bash
pip install ultralytics
yolo detect train data=dataset.yaml model=yolov8n.pt epochs=100 imgsz=640
```

## Deploy the weights
```bash
# dev / Mac:
cp runs/detect/train/weights/best.pt \
   ../../../services/edge-runtime/runtime/models/damage_yolo/model.pt

# Jetson (TensorRT):
yolo export model=best.pt format=engine device=0   # -> best.engine
cp best.engine ../../../services/edge-runtime/runtime/models/damage_yolo/model.engine
```
The runtime auto-detects the weights (engine > pt > onnx) and switches from the
OCR fallback to real YOLO — no code change.

## Bootstrapping with little data
- Start from `yolov8n.pt` (transfer learning) — works with a few hundred images.
- Augment heavily (rotation, brightness, blur) to simulate dock conditions.
- Consider synthetic damage (crush/tear overlays on clean carton photos) to seed.
