// OpenTelemetry arranca antes de cargar http, express y pg: por eso el
// servidor se importa recién después.
import './instrumentation.js'

await import('./server.js')
