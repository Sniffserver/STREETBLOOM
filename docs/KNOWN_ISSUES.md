# Streetbloom Known Issues & Technical Debt

## Monitored Edge Cases & Solutions

1. **Vite Preview HMR WebSocket Disconnects in Iframe**:
   - *Status*: Resolved via `InertWebSocket` class shim injected in `index.html`. Intercepts WebSocket HMR reconnect loops cleanly without throwing unhandled exceptions.

2. **Indoor / High Urban Canyon GPS Drift**:
   - *Status*: Handled by `GPSSmoother` filtering positions with accuracy worse than 40m and applying exponential moving average smoothing to lat/lon jitter.

3. **High-Speed Transit (Bicycle/Bus)**:
   - *Status*: Handled by `MovementAnalyzer` speed checks (>12 m/s). Excessive speed suspends street traversal progression to maintain real-world walking integrity.

4. **MapLibre WebGL Context Loss on Tab Backgrounding**:
   - *Status*: Handled via event listener re-sync on tab refocus; MapLibre instances safely destroy markers on unmount.
