import glob
import os
import torch
import numpy as np

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

MODEL_DIR = os.path.dirname(__file__)

CLASS_NAMES = {

    0: "Background",

    1: "Bone Level",

    2: "Decayed Teeth",

    3: "Healthy Teeth",

    4: "Implant",

    5: "Restoration"

}


def _find_onnx_model():
    candidates = sorted(glob.glob(os.path.join(MODEL_DIR, "*.onnx*")))
    if not candidates:
        return None

    exact_onnx = [c for c in candidates if c.lower().endswith(".onnx")]
    if exact_onnx:
        for candidate in exact_onnx:
            if os.path.basename(candidate).startswith("dental_unet_resnet50"):
                return candidate
        return exact_onnx[0]

    data_candidates = [c for c in candidates if c.lower().endswith(".onnx.data")]
    if data_candidates:
        preferred = next(
            (c for c in data_candidates if os.path.basename(c).startswith("dental_unet_resnet50")),
            data_candidates[0],
        )
        return preferred[:-5]

    return None


def _load_onnx_model(path):
    try:
        import onnxruntime as ort
    except ImportError as exc:
        raise ImportError(
            "onnxruntime is required to load ONNX models. Install it with `pip install onnxruntime`."
        ) from exc

    if not os.path.exists(path):
        raise FileNotFoundError(
            f"ONNX model file not found: {path}. "
            "If this model uses external weight data, ensure the corresponding '.onnx' graph file is present alongside any '.onnx.data' companion file."
        )

    try:
        session = ort.InferenceSession(path, providers=["CPUExecutionProvider"])
    except Exception as exc:
        raise RuntimeError(
            f"Failed to load ONNX model from {path}. "
            "Confirm the model file and any external data companion ('.onnx.data') are intact and in the same directory."
        ) from exc

    input_meta = session.get_inputs()[0]
    input_name = input_meta.name
    input_shape = input_meta.shape
    expected_batch = input_shape[0]
    output_name = session.get_outputs()[0].name

    class OnnxSegmentationModel:
        def __init__(self, session, input_name, output_name, expected_batch):
            self.session = session
            self.input_name = input_name
            self.output_name = output_name
            self.expected_batch = expected_batch

        def to(self, device):
            return self

        def eval(self):
            return self

        def __call__(self, tensor):
            arr = tensor.detach().cpu().numpy() if hasattr(tensor, "detach") else tensor.cpu().numpy()
            original_batch = arr.shape[0]
            if arr.dtype != "float32":
                arr = arr.astype("float32")

            if isinstance(self.expected_batch, int) and self.expected_batch != original_batch:
                if original_batch == 1 and self.expected_batch > 1:
                    arr = np.repeat(arr, self.expected_batch, axis=0)
                else:
                    raise ValueError(
                        f"ONNX model expects batch size {self.expected_batch}, but got {original_batch}."
                    )

            result = self.session.run([self.output_name], {self.input_name: arr})
            output_tensor = torch.from_numpy(result[0])
            if output_tensor.shape[0] != original_batch:
                output_tensor = output_tensor[:original_batch]
            return output_tensor

    return OnnxSegmentationModel(session, input_name, output_name, expected_batch)


def load_model():
    onnx_path = _find_onnx_model()
    if onnx_path is not None:
        print(f"Loading ONNX model from {onnx_path}")
        return _load_onnx_model(onnx_path)

    raise FileNotFoundError(
        "No ONNX segmentation model was found. Place the .onnx file in the model directory."
    )