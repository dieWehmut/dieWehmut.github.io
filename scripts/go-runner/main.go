package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"reflect"
	"strconv"
	"strings"
	"syscall/js"

	"github.com/traefik/yaegi/interp"
	ministdlib "nexus-go-runner/internal/ministdlib"
)

const maxOutputBytes = 64 * 1024

type runResult struct {
	Status  string `json:"status"`
	Stdout  string `json:"stdout"`
	Stderr  string `json:"stderr"`
	Message string `json:"message"`
}

type cappedBuffer struct {
	buffer    bytes.Buffer
	limit     int
	truncated bool
}

func (b *cappedBuffer) Write(p []byte) (int, error) {
	remaining := b.limit - b.buffer.Len()
	if remaining <= 0 {
		b.truncated = true
		return len(p), nil
	}

	if len(p) > remaining {
		b.buffer.Write(p[:remaining])
		b.truncated = true
		return len(p), nil
	}

	return b.buffer.Write(p)
}

func (b *cappedBuffer) String() string {
	return b.buffer.String()
}

func main() {
	done := make(chan struct{})
	js.Global().Set("runYaegiGo", js.FuncOf(runYaegiGo))
	<-done
}

func runYaegiGo(_ js.Value, args []js.Value) any {
	source := ""
	stdin := ""

	if len(args) > 0 {
		source = args[0].String()
	}
	if len(args) > 1 {
		stdin = args[1].String()
	}

	result := execute(source, stdin)
	encoded, err := json.Marshal(result)
	if err != nil {
		return `{"status":"runtime_error","stdout":"","stderr":"","message":"failed to encode run result"}`
	}
	return string(encoded)
}

func execute(source string, stdin string) (result runResult) {
	result = runResult{
		Status: "success",
	}

	defer func() {
		if recovered := recover(); recovered != nil {
			if code, ok := ministdlib.IsRunnerExit(recovered); ok {
				result.Message = fmt.Sprintf("program exited with code %d", code)
				return
			}
			result.Status = "runtime_error"
			result.Message = fmt.Sprint(recovered)
		}
	}()

	var stdout cappedBuffer
	var stderr cappedBuffer
	stdout.limit = maxOutputBytes
	stderr.limit = maxOutputBytes
	ministdlib.SetRunnerLogOutput(&stderr)
	defer ministdlib.SetRunnerLogOutput(nil)

	runner := interp.New(interp.Options{
		Stdin:  strings.NewReader(stdin),
		Stdout: &stdout,
		Stderr: &stderr,
	})
	originalArgs := os.Args
	os.Args = []string{"main"}
	defer func() {
		os.Args = originalArgs
	}()

	if err := runner.Use(allowedSymbols()); err != nil {
		result.Status = "runtime_error"
		result.Message = err.Error()
		return result
	}
	if err := runner.Use(restrictedOverrides()); err != nil {
		result.Status = "runtime_error"
		result.Message = err.Error()
		return result
	}

	if _, err := runner.Eval(source); err != nil {
		result.Message = err.Error()
		if code, ok := parseRunnerExitMessage(result.Message); ok {
			result.Status = "success"
			result.Message = fmt.Sprintf("program exited with code %d", code)
			stderr = removeRunnerExitPanicLine(stderr)
		} else {
			result.Status = classifyEvalError(err, stderr.String())
		}
	}

	result.Stdout = stdout.String()
	result.Stderr = stderr.String()

	if stdout.truncated {
		result.Stdout += "\n[stdout truncated at 64 KB]"
	}
	if stderr.truncated {
		result.Stderr += "\n[stderr truncated at 64 KB]"
	}

	return result
}

func classifyEvalError(err error, stderr string) string {
	message := strings.ToLower(err.Error() + "\n" + stderr)
	if strings.Contains(message, "panic") {
		return "runtime_error"
	}
	return "compile_error"
}

func parseRunnerExitMessage(message string) (int, bool) {
	if !strings.HasPrefix(message, "os.Exit(") || !strings.HasSuffix(message, ")") {
		return 0, false
	}

	code, err := strconv.Atoi(strings.TrimSuffix(strings.TrimPrefix(message, "os.Exit("), ")"))
	if err != nil {
		return 0, false
	}
	return code, true
}

func removeRunnerExitPanicLine(buffer cappedBuffer) cappedBuffer {
	var filtered cappedBuffer
	filtered.limit = buffer.limit
	filtered.truncated = buffer.truncated
	for _, line := range strings.SplitAfter(buffer.String(), "\n") {
		if strings.Contains(line, ": panic: ") {
			continue
		}
		_, _ = filtered.Write([]byte(line))
	}
	return filtered
}

func allowedSymbols() interp.Exports {
	allowedPackages := map[string]bool{
		"bufio/bufio":         true,
		"container/list/list": true,
		"encoding/json/json":  true,
		"errors/errors":       true,
		"fmt/fmt":             true,
		"io/io":               true,
		"log/log":             true,
		"math/math":           true,
		"math/cmplx/cmplx":    true,
		"math/rand/rand":      true,
		"os/os":               true,
		"regexp/regexp":       true,
		"sort/sort":           true,
		"strconv/strconv":     true,
		"strings/strings":     true,
		"sync/sync":           true,
		"time/time":           true,
	}

	exports := interp.Exports{}
	for path, symbols := range ministdlib.Symbols {
		if allowedPackages[path] {
			exports[path] = symbols
		}
	}
	return exports
}

func restrictedOverrides() interp.Exports {
	return interp.Exports{
		"log/log": map[string]reflect.Value{
			"Fatal":   reflect.ValueOf(ministdlib.LogFatal),
			"Fatalf":  reflect.ValueOf(ministdlib.LogFatalf),
			"Fatalln": reflect.ValueOf(ministdlib.LogFatalln),
		},
		"os/os": map[string]reflect.Value{
			"Create":    reflect.ValueOf(ministdlib.OsCreate),
			"Exit":      reflect.ValueOf(ministdlib.OsExit),
			"File":      reflect.ValueOf((*ministdlib.VirtualFile)(nil)),
			"Open":      reflect.ValueOf(ministdlib.OsOpen),
			"OpenFile":  reflect.ValueOf(ministdlib.OsOpenFile),
			"ReadFile":  reflect.ValueOf(ministdlib.OsReadFile),
			"WriteFile": reflect.ValueOf(ministdlib.OsWriteFile),
		},
	}
}
