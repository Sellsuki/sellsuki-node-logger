import pino, { Logger, LoggerOptions, Level } from "pino"
import path from "path"

export enum LogLevel {
  INFO = "info",
  ERROR = "error",
  WARN = "warn",
  DEBUG = "debug",
}
export interface SellsukiNodeLoggerOptions {
  appName: string
  version: string
  level?: Level
}

export interface TracerLog {
  tracing_id: string
  span_id: string
  request_id: string
}
export interface EventLog {
  entity: string
  action: string
  result: string
  reference_id: string
  data: string
}

class SellsukiNodeLogger {
  private logger: Logger
  private appName: string
  private version: string

  private logLevels: Record<LogLevel, Level> = {
    [LogLevel.INFO]: "info",
    [LogLevel.ERROR]: "error",
    [LogLevel.WARN]: "warn",
    [LogLevel.DEBUG]: "debug",
  }

  constructor(options: SellsukiNodeLoggerOptions) {
    const defaultOptions: LoggerOptions = {
      level: "info",
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: false,
      base: null,
    }
    const loggerOptions: LoggerOptions = { ...defaultOptions, ...options }
    this.logger = pino(loggerOptions)
    this.appName = options.appName
    this.version = options.version
  }

  private getLogLevel(logType: LogLevel): Level {
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

  public logEvent(
    logType: LogLevel,
    message: string,
    event: EventLog,
    tracer?: TracerLog
  ): void {
    const callerLocation = this.getCallerLocation()
    const timestamp = new Date().toISOString()
    const level = this.getLogLevel(logType)
    this.logger[level]({
      level,
      alert: 0,
      timestamp,
      app_name: this.appName,
      version: this.version,
      caller: callerLocation,
      message,
      log_type: "event",
      data: {
        tracing: tracer
          ? tracer
          : {
              tracing_id: "",
              span_id: "",
              request_id: "",
            },
        event,
      },
    })
  }
}

export default SellsukiNodeLogger
