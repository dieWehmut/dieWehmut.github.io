package stdlib

import (
	"io"
	"os"
	"sync"
)

var virtualFS = struct {
	sync.Mutex
	files map[string][]byte
}{
	files: map[string][]byte{},
}

type VirtualFile struct {
	name   string
	offset int
	closed bool
}

func OsReadFile(name string) ([]byte, error) {
	virtualFS.Lock()
	defer virtualFS.Unlock()

	data := virtualFS.files[name]
	return append([]byte(nil), data...), nil
}

func OsWriteFile(name string, data []byte, _ os.FileMode) error {
	virtualFS.Lock()
	defer virtualFS.Unlock()

	virtualFS.files[name] = append([]byte(nil), data...)
	return nil
}

func OsCreate(name string) (*VirtualFile, error) {
	virtualFS.Lock()
	virtualFS.files[name] = []byte{}
	virtualFS.Unlock()

	return &VirtualFile{name: name}, nil
}

func OsOpen(name string) (*VirtualFile, error) {
	virtualFS.Lock()
	if _, ok := virtualFS.files[name]; !ok {
		virtualFS.files[name] = []byte{}
	}
	virtualFS.Unlock()

	return &VirtualFile{name: name}, nil
}

func OsOpenFile(name string, flag int, perm os.FileMode) (*VirtualFile, error) {
	if flag&os.O_TRUNC != 0 || flag&os.O_CREATE != 0 || flag&os.O_WRONLY != 0 || flag&os.O_RDWR != 0 {
		return OsCreate(name)
	}
	return OsOpen(name)
}

func (f *VirtualFile) Close() error {
	f.closed = true
	return nil
}

func (f *VirtualFile) Name() string {
	return f.name
}

func (f *VirtualFile) Read(p []byte) (int, error) {
	if f.closed {
		return 0, os.ErrClosed
	}

	virtualFS.Lock()
	data := append([]byte(nil), virtualFS.files[f.name]...)
	virtualFS.Unlock()

	if f.offset >= len(data) {
		return 0, io.EOF
	}

	n := copy(p, data[f.offset:])
	f.offset += n
	return n, nil
}

func (f *VirtualFile) Write(p []byte) (int, error) {
	if f.closed {
		return 0, os.ErrClosed
	}

	virtualFS.Lock()
	defer virtualFS.Unlock()

	current := virtualFS.files[f.name]
	end := f.offset + len(p)
	if end > len(current) {
		next := make([]byte, end)
		copy(next, current)
		current = next
	}
	copy(current[f.offset:end], p)
	virtualFS.files[f.name] = current
	f.offset = end
	return len(p), nil
}

func (f *VirtualFile) WriteString(s string) (int, error) {
	return f.Write([]byte(s))
}
