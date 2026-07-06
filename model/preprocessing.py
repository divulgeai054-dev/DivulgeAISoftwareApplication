import cv2
import numpy as np

# ==========================================
# TARGET IMAGE STATISTICS
# ==========================================

TARGET_BRIGHTNESS_MIN = 112
TARGET_BRIGHTNESS_MAX = 150

TARGET_CONTRAST_MIN = 43
TARGET_CONTRAST_MAX = 68

TARGET_SHARPNESS_MIN = 135
TARGET_SHARPNESS_MAX = 380

# ==========================================
# GAMMA CORRECTION
# ==========================================

def adjust_gamma(image, gamma=1.0):

    inv_gamma = 1.0 / gamma

    table = np.array([
        ((i / 255.0) ** inv_gamma) * 255
        for i in np.arange(256)
    ]).astype("uint8")

    return cv2.LUT(image, table)

# ==========================================
# IMAGE STATISTICS
# ==========================================

def get_statistics(img):

    brightness = np.mean(img)

    contrast = np.std(img)

    sharpness = cv2.Laplacian(
        img,
        cv2.CV_64F
    ).var()

    return brightness, contrast, sharpness

# ==========================================
# PREPROCESSING
# ==========================================

def preprocess_image(image):

    # ======================================
    # CONVERT TO GRAYSCALE
    # ======================================

    if len(image.shape) == 3:

        img = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )

    else:

        img = image.copy()

    original = img.copy()

    # ======================================
    # NORMALIZATION
    # ======================================

    img = cv2.normalize(
        img,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    operations = []

    # ======================================
    # ITERATIVE PROCESSING
    # ======================================

    for _ in range(3):

        brightness, contrast, sharpness = get_statistics(img)

        # ----------------------------------
        # BRIGHTNESS
        # ----------------------------------

        if brightness < TARGET_BRIGHTNESS_MIN:

            img = adjust_gamma(
                img,
                gamma=0.92
            )

            operations.append("Brighten")

        elif brightness > TARGET_BRIGHTNESS_MAX:

            img = adjust_gamma(
                img,
                gamma=1.04
            )

            operations.append("Mild Darken")

        # ----------------------------------
        # CONTRAST
        # ----------------------------------

        brightness, contrast, sharpness = get_statistics(img)

        if contrast < TARGET_CONTRAST_MIN:

            clahe = cv2.createCLAHE(
                clipLimit=1.3,
                tileGridSize=(8,8)
            )

            img = clahe.apply(img)

            operations.append("CLAHE")

        elif contrast > TARGET_CONTRAST_MAX:

            img = cv2.GaussianBlur(
                img,
                (3,3),
                0
            )

            operations.append("Reduce Contrast")

        # ----------------------------------
        # SHARPNESS
        # ----------------------------------

        brightness, contrast, sharpness = get_statistics(img)

        if sharpness < TARGET_SHARPNESS_MIN:

            kernel = np.array([
                [0,-1,0],
                [-1,5.1,-1],
                [0,-1,0]
            ])

            img = cv2.filter2D(
                img,
                -1,
                kernel
            )

            operations.append("Sharpen")

        elif sharpness > TARGET_SHARPNESS_MAX:

            img = cv2.bilateralFilter(
                img,
                d=5,
                sigmaColor=22,
                sigmaSpace=22
            )

            operations.append("Smooth")

    # ======================================
    # FINAL RESIZE
    # ======================================

    processed = cv2.resize(
        img,
        (512,512),
        interpolation=cv2.INTER_AREA
    )

    # ======================================
    # FINAL STATS
    # ======================================

    final_brightness, final_contrast, final_sharpness = get_statistics(
        processed
    )

    stats = {

        "brightness": round(final_brightness, 2),

        "contrast": round(final_contrast, 2),

        "sharpness": round(final_sharpness, 2),

        "operations": list(set(operations))

    }

    return original, processed, stats