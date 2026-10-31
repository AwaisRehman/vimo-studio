# Vendored: rapidocr_onnxruntime 1.2.3

Source: https://github.com/RapidAI/RapidOCR (Apache License 2.0, © RapidAI).
Copied unmodified from the PyPI wheel. It is vendored only so that its `opencv-python` dependency is
replaced by `opencv-python-headless` (smaller, and needs no system GUI libraries), which keeps the
backend under Vercel's 500 MB Python function limit. OCR models are PaddleOCR (Apache 2.0).
