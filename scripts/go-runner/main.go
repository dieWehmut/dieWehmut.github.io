package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
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
			result.Status = "runtime_error"
			result.Message = fmt.Sprint(recovered)
		}
	}()

	var stdout cappedBuffer
	var stderr cappedBuffer
	stdout.limit = maxOutputBytes
	stderr.limit = maxOutputBytes

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

	if _, err := runner.Eval(source); err != nil {
		result.Status = classifyEvalError(err, stderr.String())
		result.Message = err.Error()
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
