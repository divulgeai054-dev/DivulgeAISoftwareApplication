import traceback
import model

try:
    m = model.load_model()
    print('loaded', type(m), hasattr(m, '__call__'))
except Exception:
    traceback.print_exc()
