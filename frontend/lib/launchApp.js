export default function tryOpenApp(appProtocol, fallbackUrl, timeout = 2000) {
  return new Promise((resolve) => {
    if (!appProtocol) {
      window.open(fallbackUrl, "_blank");
      return resolve({ launched: false, url: fallbackUrl });
    }

    let didLaunch = false;
    const start = Date.now();

    // Visibility change is the most reliable heuristic for the app having opened
    function onVisibilityChange() {
      if (document.hidden) {
        didLaunch = true;
        cleanup();
        return resolve({ launched: true, url: appProtocol });
      }
    }

    function cleanup() {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(timer);
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    // Try to open the protocol. Use different strategies depending on platform.
    try {
      const ua = navigator.userAgent || "";
      const isIOS = /iP(ad|hone|od)/i.test(ua);

      if (isIOS) {
        // For iOS Safari, setting window.location is the common approach
        window.location = appProtocol;
      } else {
        // For most desktop and Android browsers, an iframe navigation or window.open works
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = appProtocol;
        document.body.appendChild(iframe);
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (e) {}
        }, timeout + 500);
      }
    } catch (e) {
      // If anything throws, immediately fallback
      cleanup();
      window.open(fallbackUrl, "_blank");
      return resolve({ launched: false, url: fallbackUrl, error: e });
    }

    const timer = setTimeout(() => {
      if (!didLaunch) {
        cleanup();
        // Fallback: open the web URL in a new tab
        window.open(fallbackUrl, "_blank");
        return resolve({ launched: false, url: fallbackUrl });
      }
    }, timeout);
  });
}
