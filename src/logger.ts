import pino, { Logger, LoggerOptions, Level } from "pino"
import path from "path"

interface SellsukiNodeLoggerOptions {
  appName: string
  version: string
  level?: Level
}

class SellsukiNodeLogger {
  private logger: Logger
  private appName: string
  private version: string

  private logLevels: Record<string, Level> = {
    info: "info",
    error: "error",
    warn: "warn",
    debug: "debug",
  }

  constructor(options: SellsukiNodeLoggerOptions) {
    const defaultOptions: LoggerOptions = {
      level: "info",
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: null,
    }
    const loggerOptions: LoggerOptions = { ...defaultOptions, ...options }
    this.logger = pino(loggerOptions)
    this.appName = options.appName
    this.version = options.version
  }

  private getLogLevel(logType: string): Level {
    return this.logLevels[logType] || "info"
  }

  private getCallerLocation(): string | undefined {
    try {
      throw new Error()
    } catch (error: any) {
      const stackLines = error.stack?.split("\n")
      if (stackLines && stackLines.length >= 4) {
        const callerLine = stackLines[3].trim()
        const locationStart = callerLine.lastIndexOf("(")
        const locationEnd = callerLine.lastIndexOf(")")
        if (locationStart !== -1 && locationEnd !== -1) {
          const filePathAndLine = callerLine.substring(
            locationStart + 1,
            locationEnd
          )
          const parts = filePathAndLine.split(":")
          const filePath = parts[0].trim()
          const lineNumber = parts[1].trim()
          const directory = path.dirname(filePath)
          const file = path.basename(filePath)
          return `${directory}/${file}:${lineNumber}`
        }
      }
    }
    return undefined
  }

  public logEvent(logType: string, message: string, event: EventLog): void {
    const callerLocation = this.getCallerLocation()
    const level = this.getLogLevel(logType)
    this.logger[level]({
      level,
      alert: 0,
      app_name: this.appName,
      version: this.version,
      caller: callerLocation,
      message,
      log_type: "event",
      data: {
        tracing: {
          tracing_id: "",
          span_id: "",
          request_id: "x3sdd-dac13-ccasda",
        },
        event: {
          entity: event.entity,
          action: event.action,
          result: event.result,
          reference_id: event.reference_id,
          data: event.data,
        },
      },
    })
  }
}

export interface EventLog {
  entity: string
  action: string
  result: string
  reference_id: string
  data: string
}

export default SellsukiNodeLogger
