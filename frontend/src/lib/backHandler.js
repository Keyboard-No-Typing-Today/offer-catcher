let currentHandler = null;

export function pushBackHandler(handler) {
  currentHandler = handler;
  return () => {
    if (currentHandler === handler) currentHandler = null;
  };
}

export function handleBack() {
  if (typeof currentHandler !== 'function') return false;
  currentHandler();
  return true;
}
