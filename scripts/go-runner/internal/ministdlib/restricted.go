package stdlib

import (
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
)

var errRestricted = errors.New("restricted")
var runnerLogOutput io.Writer = os.Stderr

type runnerExit struct {
	Code int
}

func (e runnerExit) Error() string {
	return "os.Exit(" + strconv.Itoa(e.Code) + ")"
}

func IsRunnerExit(value interface{}) (int, bool) {
	switch exit := value.(type) {
	case runnerExit:
		return exit.Code, true
	case *runnerExit:
		return exit.Code, true
	default:
		return 0, false
	}
}

func SetRunnerLogOutput(output io.Writer) {
	if output == nil {
		runnerLogOutput = os.Stderr
		return
	}
	runnerLogOutput = output
}

// osExit invokes panic instead of exit.
func osExit(code int) { panic(runnerExit{Code: code}) }

func OsExit(code int) { osExit(code) }

// osFindProcess returns os.FindProcess, except for self process.
func osFindProcess(pid int) (*os.Process, error) {
	if pid == os.Getpid() {
		return nil, errRestricted
	}
	return os.FindProcess(pid)
}

// The following functions stop the interpreted program without exiting the WASM runner.
func logFatal(v ...interface{}) {
	logger := log.New(runnerLogOutput, "", log.LstdFlags)
	logger.Print(v...)
	osExit(1)
}
func logFatalf(f string, v ...interface{}) {
	logger := log.New(runnerLogOutput, "", log.LstdFlags)
	logger.Printf(f, v...)
	osExit(1)
}
func logFatalln(v ...interface{}) {
	logger := log.New(runnerLogOutput, "", log.LstdFlags)
	logger.Println(v...)
	osExit(1)
}

func LogFatal(v ...interface{})            { logFatal(v...) }
func LogFatalf(f string, v ...interface{}) { logFatalf(f, v...) }
func LogFatalln(v ...interface{})          { logFatalln(v...) }

type logLogger struct {
	l *log.Logger
}

// logNew Returns a wrapped logger.
func logNew(out io.Writer, prefix string, flag int) *logLogger {
	return &logLogger{log.New(out, prefix, flag)}
}

// The following methods stop the interpreted program without exiting the WASM runner.
func (l *logLogger) Fatal(v ...interface{}) {
	l.l.Print(v...)
	osExit(1)
}
func (l *logLogger) Fatalf(f string, v ...interface{}) {
	l.l.Printf(f, v...)
	osExit(1)
}
func (l *logLogger) Fatalln(v ...interface{}) {
	l.l.Println(v...)
	osExit(1)
}

func LogFatalMessage(v ...interface{}) {
	_, _ = fmt.Fprint(runnerLogOutput, v...)
}

// The following methods just forward to wrapped logger.
func (l *logLogger) Flags() int                        { return l.l.Flags() }
func (l *logLogger) Output(d int, s string) error      { return l.l.Output(d, s) }
func (l *logLogger) Panic(v ...interface{})            { l.l.Panic(v...) }
func (l *logLogger) Panicf(f string, v ...interface{}) { l.l.Panicf(f, v...) }
func (l *logLogger) Panicln(v ...interface{})          { l.l.Panicln(v...) }
func (l *logLogger) Prefix() string                    { return l.l.Prefix() }
func (l *logLogger) Print(v ...interface{})            { l.l.Print(v...) }
func (l *logLogger) Printf(f string, v ...interface{}) { l.l.Printf(f, v...) }
func (l *logLogger) Println(v ...interface{})          { l.l.Println(v...) }
func (l *logLogger) SetFlags(flag int)                 { l.l.SetFlags(flag) }
func (l *logLogger) SetOutput(w io.Writer)             { l.l.SetOutput(w) }
func (l *logLogger) Writer() io.Writer                 { return l.l.Writer() }
